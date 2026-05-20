import { NextRequest, NextResponse } from 'next/server';
import { generateIntelligence } from '@/lib/intelligence';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Short-lived in-memory cache and in-flight request deduplication.
//
// These maps live at module scope so they persist across requests on a warm
// Node.js instance.  On serverless platforms each warm instance has its own
// copy, which is acceptable – the main gains are deduplication of concurrent
// requests and avoiding redundant OpenAI calls for the same asset.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const INSIGHTS_TIMEOUT_MS = 45_000; // 45 s (allows for the compliance-retry path)

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const insightsCache = new Map<string, CacheEntry>();
const inFlightInsights = new Map<string, Promise<unknown>>();

/** Remove stale entries to keep memory bounded. */
function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of insightsCache) {
    if (entry.expiresAt <= now) insightsCache.delete(key);
  }
}

/**
 * Stable JSON serialisation of a flat object: sorts keys alphabetically so
 * two logically identical snapshots always produce the same string regardless
 * of insertion order.
 */
function stableStringify(obj: Record<string, unknown>): string {
  const sortedEntries = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(sortedEntries));
}

function buildCacheKey(
  type: string,
  assetClass: string,
  provider: string,
  model: string,
  snapshot: Record<string, unknown>,
): string {
  return `${type}:${assetClass}:${provider}:${model}:${stableStringify(snapshot)}`;
}

// ---------------------------------------------------------------------------
// Provider / key resolution
// ---------------------------------------------------------------------------

type Provider = 'openai' | 'xai';

function pickEnv(...names: string[]): string {
  for (const name of names) {
    const v = process.env[name];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function preferredProvider(): Provider | '' {
  const raw = pickEnv('STOCKLENS_AI_PROVIDER', 'AI_PROVIDER').toLowerCase();
  if (raw === 'openai') return 'openai';
  if (raw === 'xai' || raw === 'grok') return 'xai';
  return '';
}

function resolveProviderAndKey(params: {
  requestedProvider?: string;
  apiKey?: string;
}): { provider: Provider; apiKey: string } {
  const req = (params.requestedProvider || '').toLowerCase();
  const forced: Provider | '' = req === 'openai' ? 'openai' : req === 'xai' ? 'xai' : '';

  const openaiKey =
    params.apiKey?.trim() ||
    pickEnv('OPENAI_API_KEY', 'OPENAI_KEY', 'OPEN_AI_KEY', 'NEXT_PUBLIC_OPENAI_API_KEY');
  const xaiKey =
    params.apiKey?.trim() ||
    // xai_API_KEY matches the mixed-case name as set in the Vercel dashboard; XAI_API_KEY is the canonical form.
    pickEnv('XAI_API_KEY', 'xai_API_KEY', 'XAI_KEY', 'X_AI_API_KEY');

  if (forced === 'openai') {
    if (!openaiKey) throw new Error('Missing OpenAI API key (set OPENAI_API_KEY or OPENAI_KEY)');
    return { provider: 'openai', apiKey: openaiKey };
  }
  if (forced === 'xai') {
    if (!xaiKey) throw new Error('Missing xAI API key (set XAI_API_KEY)');
    return { provider: 'xai', apiKey: xaiKey };
  }

  const pref = preferredProvider();
  if (pref === 'openai' && openaiKey) return { provider: 'openai', apiKey: openaiKey };
  if (pref === 'xai' && xaiKey) return { provider: 'xai', apiKey: xaiKey };

  if (openaiKey) return { provider: 'openai', apiKey: openaiKey };
  if (xaiKey) return { provider: 'xai', apiKey: xaiKey };

  throw new Error('No AI provider key configured (set OPENAI_API_KEY/OPENAI_KEY or XAI_API_KEY)');
}

// ---------------------------------------------------------------------------
// Compact snapshot validation
//
// The client now sends a pre-built compact snapshot (Record<string,unknown>)
// produced by buildAssetSnapshot() in lib/insights.ts.  Values are strings,
// numbers, booleans, or string arrays – no nested objects.
// ---------------------------------------------------------------------------

const MAX_SNAPSHOT_ENTRIES = 80;
const MAX_SNAPSHOT_STRING_LENGTH = 800; // slightly above the 600-char truncation limit
const MAX_SNAPSHOT_ARRAY_LENGTH = 20;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateSnapshot(snapshot: unknown): snapshot is Record<string, unknown> {
  if (!isPlainObject(snapshot)) return false;
  const entries = Object.entries(snapshot);
  if (entries.length === 0 || entries.length > MAX_SNAPSHOT_ENTRIES) return false;

  for (const [, value] of entries) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return false;
      continue;
    }
    if (typeof value === 'string') {
      if (value.length > MAX_SNAPSHOT_STRING_LENGTH) return false;
      continue;
    }
    if (typeof value === 'boolean') continue;
    if (Array.isArray(value)) {
      if (value.length > MAX_SNAPSHOT_ARRAY_LENGTH) return false;
      if (value.some((item) => typeof item !== 'string' || item.length > MAX_SNAPSHOT_STRING_LENGTH))
        return false;
      continue;
    }
    // Reject nested objects – the compact snapshot should not contain them.
    return false;
  }
  return true;
}

/** Extract a compact snapshot from the request body (preferred: `snapshot`; fallback: `data`). */
function extractSnapshot(body: Record<string, unknown>): Record<string, unknown> | null {
  if (isPlainObject(body.snapshot)) return body.snapshot;
  if (isPlainObject(body.data)) return body.data;
  return null;
}

/** Derive a { status, message } pair from a caught error, handling the timeout case. */
function errorResponse(err: unknown): { status: number; msg: string } {
  const isTimeout = err instanceof Error && err.name === 'AbortError';
  const msg = isTimeout
    ? 'AI insight generation timed out. Please try again.'
    : err instanceof Error ? err.message : 'Failed to generate insights';
  const status = isTimeout ? 504
    : msg.toLowerCase().includes('missing') || msg.toLowerCase().includes('no ai provider') ? 401
    : 500;
  return { status, msg };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const type = body.type === 'stock' || body.type === 'crypto' ? body.type : null;
  const assetClass = typeof body.assetClass === 'string' ? body.assetClass.trim() : '';
  // Accept a pre-built compact snapshot (preferred path) or a raw data object
  // (legacy fallback for backwards-compatibility).
  const snapshot = extractSnapshot(body);
  const requestedProvider = typeof body.provider === 'string' ? body.provider : undefined;
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey : undefined;
  const model = typeof body.model === 'string' ? body.model : undefined;

  if (!type) {
    return NextResponse.json({ error: 'Missing/invalid type' }, { status: 400 });
  }
  if (!assetClass) {
    return NextResponse.json({ error: 'Missing assetClass' }, { status: 400 });
  }
  if (!snapshot || !validateSnapshot(snapshot)) {
    return NextResponse.json({ error: 'Missing or invalid asset snapshot' }, { status: 400 });
  }

  let resolved: { provider: Provider; apiKey: string };
  try {
    resolved = resolveProviderAndKey({ requestedProvider, apiKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider key configured';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const resolvedModel = model || (resolved.provider === 'xai' ? 'grok-2-mini' : 'gpt-4o-mini');
  const cacheKey = buildCacheKey(type, assetClass, resolved.provider, resolvedModel, snapshot);

  // --- TTL cache lookup ---
  evictExpired();
  const cached = insightsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ intelligence: cached.value }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // --- In-flight deduplication ---
  const existing = inFlightInsights.get(cacheKey) as Promise<unknown> | undefined;
  if (existing) {
    try {
      const intelligence = await existing;
      return NextResponse.json({ intelligence }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      const { status, msg } = errorResponse(err);
      return NextResponse.json({ error: msg }, { status });
    }
  }

  // --- Start a new generation, register for deduplication ---
  const generatePromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), INSIGHTS_TIMEOUT_MS);
    try {
      const result = await generateIntelligence({
        apiKey: resolved.apiKey,
        provider: resolved.provider,
        type,
        // The snapshot is a compact Record<string,unknown> that satisfies the
        // same structural contract as StockData/CryptoData (just without nulls
        // and with long strings truncated).  The orchestrator re-normalises it
        // via its own buildSnapshot(), which is idempotent for compact input.
        data: snapshot as never,
        assetClass,
        options: { model: resolvedModel, signal: controller.signal },
      });
      // Cache only the IntelligenceResult (not the response envelope).
      insightsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
      return result;
    } finally {
      clearTimeout(timeoutId);
      inFlightInsights.delete(cacheKey);
    }
  })();

  inFlightInsights.set(cacheKey, generatePromise);

  try {
    const intelligence = await generatePromise;
    return NextResponse.json({ intelligence }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const { status, msg } = errorResponse(err);
    return NextResponse.json({ error: msg }, { status });
  }
}

