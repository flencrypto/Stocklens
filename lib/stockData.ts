export interface StockData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  description: string;
  price: number | null;
  previousClose: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  revenue: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  netIncome: number | null;
  ebitda: number | null;
  cash: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  peRatio: number | null;
  psRatio: number | null;
  pbRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  eps: number | null;
  forwardEps: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAvg: number | null;
  twoHundredDayAvg: number | null;
  ytdReturn: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  shortRatio: number | null;
  lastEarningsDate: string | null;
  employees: number | null;
  founded: string | null;
  website: string | null;
  country: string | null;
}

const YF_BASE = 'https://query1.finance.yahoo.com';

// Yahoo Finance APIs do not send CORS headers, and the v10 `quoteSummary`
// endpoint additionally requires a "crumb" cookie/auth token that cannot
// be obtained from the browser. Because Stocklens is deployed as a static
// site (GitHub Pages, `next build` -> `./out`), we have no backend of our
// own to proxy through, so we route Yahoo Finance requests through a
// public CORS-enabled relay. allorigins.win returns the upstream body
// untouched and sets `Access-Control-Allow-Origin` correctly.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function proxiedYahooUrl(yahooUrl: string): string {
  return `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;
}

async function fetchYahooJson(yahooUrl: string): Promise<unknown> {
  const res = await fetch(proxiedYahooUrl(yahooUrl), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

/**
 * Search Yahoo Finance for stocks/equities/funds matching the query. Returns
 * up to `limit` candidates including newly listed / IPO equities. Throws on
 * network errors; returns an empty array when no matches are found.
 */
export async function searchStocks(
  query: string,
  limit = 10,
): Promise<StockSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const yahooUrl =
    `${YF_BASE}/v1/finance/search?q=${encodeURIComponent(trimmed)}` +
    `&quotesCount=${limit}&newsCount=0&listsCount=0`;

  let json: Record<string, unknown>;
  try {
    json = (await fetchYahooJson(yahooUrl)) as Record<string, unknown>;
  } catch {
    throw new Error(`Failed to search stocks for: ${trimmed}`);
  }
  const quotes: Array<Record<string, unknown>> =
    (json?.quotes as Array<Record<string, unknown>>) ?? [];

  // Equity-like quote types we want to surface (stocks, ETFs, funds, indices).
  // Pre-IPO and newly listed names show up here as soon as Yahoo indexes them.
  // CRYPTOCURRENCY is filtered out separately just below.
  const allowed = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX']);

  const results: StockSearchResult[] = [];
  for (const q of quotes) {
    const symbol = typeof q.symbol === 'string' ? q.symbol : '';
    if (!symbol) continue;
    const quoteType = typeof q.quoteType === 'string' ? q.quoteType : '';
    // Exclude crypto from the stock search results explicitly.
    if (quoteType === 'CRYPTOCURRENCY') continue;
    // If quoteType is provided and not in the allowed list, skip.
    if (quoteType && !allowed.has(quoteType)) continue;

    const name =
      (typeof q.longname === 'string' && q.longname) ||
      (typeof q.shortname === 'string' && q.shortname) ||
      symbol;
    const exchange =
      (typeof q.exchDisp === 'string' && q.exchDisp) ||
      (typeof q.exchange === 'string' && q.exchange) ||
      '';
    const type =
      (typeof q.typeDisp === 'string' && q.typeDisp) ||
      quoteType ||
      'Equity';

    results.push({ symbol, name: String(name), exchange, type });
  }

  return results;
}

interface YahooChartMeta {
  currency?: string;
  symbol?: string;
  exchangeName?: string;
  fullExchangeName?: string;
  instrumentType?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  longName?: string;
  shortName?: string;
}

interface YahooChartError {
  code?: string;
  description?: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{ meta?: YahooChartMeta }> | null;
    error?: YahooChartError | null;
  };
}

export async function fetchStockData(ticker: string): Promise<StockData> {
  const upperTicker = ticker.toUpperCase();
  // Yahoo's v10 /quoteSummary endpoint requires a "crumb" cookie/auth token
  // that browsers cannot obtain (and it's blocked by CORS anyway). The v8
  // /chart endpoint is unauthenticated and proxiable, so we use it for the
  // basic price/exchange/52-week metadata and leave the deeper financial
  // fields as null (the UI already handles missing values gracefully).
  const yahooUrl = `${YF_BASE}/v8/finance/chart/${encodeURIComponent(upperTicker)}?interval=1d&range=1d`;

  let json: YahooChartResponse;
  try {
    json = (await fetchYahooJson(yahooUrl)) as YahooChartResponse;
  } catch (err) {
    const status = (err as { status?: number } | null)?.status;
    throw new Error(
      status === 404
        ? `No results found for ticker: ${upperTicker}`
        : `Failed to fetch data for ticker: ${upperTicker}`,
    );
  }

  const yfError = json?.chart?.error;
  if (yfError) {
    const desc: string = yfError.description || '';
    const lower = desc.toLowerCase();
    throw new Error(
      lower.includes('no results') || lower.includes('not found')
        ? `No results found for ticker: ${upperTicker}`
        : desc || `Invalid ticker: ${upperTicker}`,
    );
  }

  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) {
    throw new Error(`No results found for ticker: ${upperTicker}`);
  }

  const safeNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const priceVal = safeNum(meta.regularMarketPrice);
  const prevClose = safeNum(meta.previousClose ?? meta.chartPreviousClose);
  let priceChg: number | null = null;
  let priceChgPct: number | null = null;
  if (priceVal != null && prevClose != null && prevClose !== 0) {
    priceChg = priceVal - prevClose;
    priceChgPct = (priceChg / prevClose) * 100;
  }

  const name =
    (typeof meta.longName === 'string' && meta.longName) ||
    (typeof meta.shortName === 'string' && meta.shortName) ||
    upperTicker;
  const exchange =
    (typeof meta.fullExchangeName === 'string' && meta.fullExchangeName) ||
    (typeof meta.exchangeName === 'string' && meta.exchangeName) ||
    '';
  const currency =
    (typeof meta.currency === 'string' && meta.currency) || 'USD';

  // Most fundamental/financial fields require Yahoo's authenticated
  // quoteSummary endpoint. They're left null (or marked as unknown for
  // non-nullable string fields) here; the UI renders sensible fallbacks
  // for missing values and `classifyStockAsset` falls through to a
  // generic "Public Equity" label when sector/industry are unknown.
  return {
    ticker: upperTicker,
    name,
    sector: 'Unknown',
    industry: 'Unknown',
    exchange,
    currency,
    description: 'Description unavailable',
    price: priceVal,
    previousClose: prevClose,
    priceChange: priceChg,
    priceChangePercent: priceChgPct,
    marketCap: null,
    enterpriseValue: null,
    revenue: null,
    revenueGrowth: null,
    grossMargin: null,
    operatingMargin: null,
    profitMargin: null,
    netIncome: null,
    ebitda: null,
    cash: null,
    totalDebt: null,
    debtToEquity: null,
    peRatio: null,
    psRatio: null,
    pbRatio: null,
    forwardPE: null,
    pegRatio: null,
    eps: null,
    forwardEps: null,
    dividendYield: null,
    fiftyTwoWeekHigh: safeNum(meta.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: safeNum(meta.fiftyTwoWeekLow),
    fiftyDayAvg: null,
    twoHundredDayAvg: null,
    ytdReturn: null,
    beta: null,
    sharesOutstanding: null,
    floatShares: null,
    shortRatio: null,
    lastEarningsDate: null,
    employees: null,
    founded: null,
    website: null,
    country: null,
  };
}
