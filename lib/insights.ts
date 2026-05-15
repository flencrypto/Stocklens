import { StockData } from '@/lib/stockData';
import { CryptoData } from '@/lib/cryptoData';

export interface AssetInsights {
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  catalysts: string[];
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_INSIGHTS_MODEL = 'gpt-4o-mini';

function normalizeInsights(parsed: Partial<AssetInsights>): AssetInsights {
  const toStringArray = (v: unknown, max = 5): string[] => {
    if (!Array.isArray(v)) return [];
    return v
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((s) => s.length > 0)
      .slice(0, max);
  };

  const thesis = typeof parsed.thesis === 'string' ? parsed.thesis.trim() : '';
  const bullCase = toStringArray(parsed.bullCase);
  const bearCase = toStringArray(parsed.bearCase);
  const catalysts = toStringArray(parsed.catalysts);

  if (!thesis || bullCase.length === 0 || bearCase.length === 0 || catalysts.length === 0) {
    throw new Error('OpenAI response was missing required insight fields');
  }

  return { thesis, bullCase, bearCase, catalysts };
}

/**
 * Builds a compact, structured snapshot of the asset for the LLM prompt.
 * Only includes non-null fields so the prompt stays focused on real data.
 */
function buildAssetSnapshot(
  type: 'stock' | 'crypto',
  data: StockData | CryptoData,
  assetClass: string,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = { assetType: type, assetClass };
  const entries = Object.entries(data as unknown as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    // Truncate long descriptions to keep prompt small.
    if (typeof value === 'string' && value.length > 600) {
      snapshot[key] = value.slice(0, 600) + '…';
    } else if (Array.isArray(value)) {
      snapshot[key] = value
        .slice(0, 12)
        .map((item) =>
          typeof item === 'string' ? item.trim().slice(0, 80) : String(item).slice(0, 80),
        )
        .filter((item) => item.length > 0);
    } else {
      snapshot[key] = value;
    }
  }
  return snapshot;
}

interface OpenAIChoice {
  message?: { content?: string };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?: { message?: string };
}

/**
 * Server-side OpenAI call used by the API route handler.
 */
export async function generateInsightsServer(
  apiKey: string,
  type: 'stock' | 'crypto',
  data: StockData | CryptoData,
  assetClass: string,
  options?: { model?: string; signal?: AbortSignal },
): Promise<AssetInsights> {
  if (!apiKey || !apiKey.trim()) throw new Error('OpenAI API key is required');

  const snapshot = buildAssetSnapshot(type, data, assetClass);
  const model = options?.model || DEFAULT_INSIGHTS_MODEL;

  const systemPrompt =
    'You are an experienced equity and crypto research analyst. ' +
    'Given a structured snapshot of an asset, produce concise, evidence-based ' +
    'investment insights. Reference the supplied numbers where relevant ' +
    '(e.g. revenue growth, margins, market cap rank, 30d momentum). ' +
    'Avoid generic platitudes and never give personalised financial advice. ' +
    'Respond with strict JSON only — no markdown, no commentary.';

  const userPrompt = [
    'Generate investment insights for the following asset.',
    'Return JSON with this exact shape:',
    '{',
    '  "thesis": string,            // 1-2 sentence investment thesis',
    '  "bullCase": string[],        // exactly 5 short bullet points',
    '  "bearCase": string[],        // exactly 5 short bullet points',
    '  "catalysts": string[]        // exactly 5 short bullet points',
    '}',
    'Each bullet should be a single sentence, ideally referencing a',
    'specific metric from the snapshot when possible.',
    '',
    'Asset snapshot:',
    JSON.stringify(snapshot),
  ].join('\n');

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: options?.signal,
  });

  const json = (await res.json()) as OpenAIResponse;

  if (!res.ok) {
    const msg = json?.error?.message || `OpenAI request failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not contain any content');
  }

  let parsed: Partial<AssetInsights>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  return normalizeInsights(parsed);
}

async function generateInsightsViaApiRoute(
  apiKey: string | undefined,
  type: 'stock' | 'crypto',
  data: StockData | CryptoData,
  assetClass: string,
  options?: { model?: string; signal?: AbortSignal },
): Promise<AssetInsights> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: apiKey?.trim() || '',
      type,
      data,
      assetClass,
    }),
    signal: options?.signal,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = (() => {
      if (payload && typeof payload === 'object') {
        const error = (payload as Record<string, unknown>).error;
        if (typeof error === 'string' && error.trim()) return error;
      }
      return `Insight request failed (HTTP ${res.status})`;
    })();
    throw new Error(msg);
  }

  return normalizeInsights(payload as Partial<AssetInsights>);
}

/**
 * Generates investment insights (thesis, bull case, bear case, catalysts)
 * for a given asset.
 *
 * In the browser, this calls the app's `/api/insights` endpoint (to avoid
 * CORS-blocked direct calls to `api.openai.com`). On the server, it calls
 * OpenAI directly.
 */
export async function generateInsights(
  apiKey: string | undefined,
  type: 'stock' | 'crypto',
  data: StockData | CryptoData,
  assetClass: string,
  options?: { model?: string; signal?: AbortSignal },
): Promise<AssetInsights> {
  if (typeof window !== 'undefined') {
    return generateInsightsViaApiRoute(apiKey, type, data, assetClass, options);
  }

  const resolvedKey =
    apiKey?.trim() || process.env.OPENAI_KEY;
  if (!resolvedKey) {
    throw new Error('No OpenAI API key configured. Provide a key to enable AI insights.');
  }
  return generateInsightsServer(resolvedKey, type, data, assetClass, options);
}
