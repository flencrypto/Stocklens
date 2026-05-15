import { NextResponse } from 'next/server';
import { DEFAULT_INSIGHTS_MODEL, generateInsightsServer } from '@/lib/insights';
import type { StockData } from '@/lib/stockData';
import type { CryptoData } from '@/lib/cryptoData';

export const runtime = 'nodejs';

type InsightsRequestBody = {
  apiKey?: string;
  type?: 'stock' | 'crypto';
  data?: StockData | CryptoData;
  assetClass?: string;
};

const STOCK_REQUIRED_KEYS = ['ticker', 'name', 'description'] as const;
const CRYPTO_REQUIRED_KEYS = ['id', 'name', 'symbol'] as const;

const STOCK_ALLOWED_KEYS = new Set<string>([
  'ticker',
  'name',
  'sector',
  'industry',
  'exchange',
  'currency',
  'description',
  'price',
  'previousClose',
  'priceChange',
  'priceChangePercent',
  'marketCap',
  'enterpriseValue',
  'revenue',
  'revenueGrowth',
  'grossMargin',
  'operatingMargin',
  'profitMargin',
  'netIncome',
  'ebitda',
  'cash',
  'totalDebt',
  'debtToEquity',
  'peRatio',
  'psRatio',
  'pbRatio',
  'forwardPE',
  'pegRatio',
  'eps',
  'forwardEps',
  'dividendYield',
  'fiftyTwoWeekHigh',
  'fiftyTwoWeekLow',
  'fiftyDayAvg',
  'twoHundredDayAvg',
  'ytdReturn',
  'beta',
  'sharesOutstanding',
  'floatShares',
  'shortRatio',
  'lastEarningsDate',
  'employees',
  'founded',
  'website',
  'country',
]);

const CRYPTO_ALLOWED_KEYS = new Set<string>([
  'id',
  'name',
  'symbol',
  'currentPrice',
  'marketCap',
  'fdv',
  'circulatingSupply',
  'totalSupply',
  'maxSupply',
  'athPrice',
  'athChangePercentage',
  'athDate',
  'atlPrice',
  'atlChangePercentage',
  'priceChangePercentage24h',
  'priceChangePercentage7d',
  'priceChangePercentage30d',
  'volume24h',
  'marketCapRank',
  'exchangeListings',
  'contractAddress',
  'chain',
  'description',
  'categories',
  'homepage',
  'twitter',
  'telegram',
  'github',
  'launchDate',
  'liquidityScore',
  'communityScore',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isShortString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validatePayload(
  type: 'stock' | 'crypto',
  data: unknown,
): data is StockData | CryptoData {
  if (!isPlainObject(data)) return false;

  const entries = Object.entries(data);
  if (entries.length === 0 || entries.length > 64) return false;

  const allowedKeys = type === 'stock' ? STOCK_ALLOWED_KEYS : CRYPTO_ALLOWED_KEYS;
  const requiredKeys = type === 'stock' ? STOCK_REQUIRED_KEYS : CRYPTO_REQUIRED_KEYS;

  for (const key of requiredKeys) {
    if (!isShortString(data[key], 1200)) return false;
  }

  for (const [key, value] of entries) {
    if (!allowedKeys.has(key)) return false;
    if (value === null) continue;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return false;
      continue;
    }
    if (typeof value === 'string') {
      if (value.length > 1200) return false;
      continue;
    }
    if (key === 'categories' && Array.isArray(value)) {
      if (
        value.length > 12 ||
        value.some((item) => typeof item !== 'string' || item.trim().length === 0 || item.length > 80)
      ) {
        return false;
      }
      continue;
    }
    return false;
  }

  return true;
}

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
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

  if (type !== 'stock' && type !== 'crypto') {
    return NextResponse.json({ error: 'Invalid or missing asset type' }, { status: 400 });
  }
  if (!validatePayload(type, data)) {
    return NextResponse.json({ error: 'Invalid or missing asset data' }, { status: 400 });
  }
  if (!assetClass || assetClass.length > 120) {
    return NextResponse.json({ error: 'Invalid or missing asset class' }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'OpenAI API key is required for browser-generated AI insights.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const insights = await generateInsightsServer(apiKey, type, data, assetClass, {
      model: DEFAULT_INSIGHTS_MODEL,
    });
    return NextResponse.json(insights, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate AI insights';
    // Avoid leaking structured upstream details beyond the human-readable message.
    const status = msg.toLowerCase().includes('api key') ? 401 : 502;
    return NextResponse.json({ error: msg }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
