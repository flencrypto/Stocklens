import { NextRequest, NextResponse } from 'next/server';
import { generateIntelligence } from '@/lib/intelligence';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const type = body.type === 'stock' || body.type === 'crypto' ? body.type : null;
    const assetClass = typeof body.assetClass === 'string' ? body.assetClass : '';
    const data = body.data as unknown;
    const requestedProvider = typeof body.provider === 'string' ? body.provider : undefined;
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey : undefined;
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (!type) {
      return NextResponse.json({ error: 'Missing/invalid type' }, { status: 400 });
    }
    if (!assetClass.trim()) {
      return NextResponse.json({ error: 'Missing assetClass' }, { status: 400 });
    }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const resolved = resolveProviderAndKey({ requestedProvider, apiKey });

    const intelligence = await generateIntelligence({
      apiKey: resolved.apiKey,
      provider: resolved.provider,
      type,
      data: data as never,
      assetClass,
      options: { model },
    });

    return NextResponse.json({ intelligence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate insights';
    const status = msg.toLowerCase().includes('missing') || msg.toLowerCase().includes('no ai provider')
      ? 401
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

