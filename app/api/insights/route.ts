import { NextResponse } from 'next/server';
import { generateInsightsServer } from '@/lib/insights';
import type { StockData } from '@/lib/stockData';
import type { CryptoData } from '@/lib/cryptoData';

export const runtime = 'nodejs';

type InsightsRequestBody = {
  apiKey?: string;
  model?: string;
  type?: 'stock' | 'crypto';
  data?: StockData | CryptoData;
  assetClass?: string;
};

export async function POST(req: Request) {
  let body: InsightsRequestBody;
  try {
    body = (await req.json()) as InsightsRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const type = body?.type;
  const data = body?.data;
  const assetClass = typeof body?.assetClass === 'string' ? body.assetClass.trim() : '';
  const model = typeof body?.model === 'string' ? body.model.trim() : '';

  if (type !== 'stock' && type !== 'crypto') {
    return NextResponse.json({ error: 'Invalid or missing asset type' }, { status: 400 });
  }
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Invalid or missing asset data' }, { status: 400 });
  }
  if (!assetClass) {
    return NextResponse.json({ error: 'Invalid or missing asset class' }, { status: 400 });
  }

  const resolvedKey =
    (typeof body?.apiKey === 'string' ? body.apiKey.trim() : '') ||
    process.env.OPENAI_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!resolvedKey) {
    return NextResponse.json(
      {
        error:
          'No OpenAI API key configured. Set OPENAI_KEY on the server or provide one in the UI.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const insights = await generateInsightsServer(resolvedKey, type, data, assetClass, {
      model: model || undefined,
    });
    return NextResponse.json(insights, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate AI insights';
    // Avoid leaking structured upstream details beyond the human-readable message.
    const status = msg.toLowerCase().includes('api key') ? 401 : 502;
    return NextResponse.json({ error: msg }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

