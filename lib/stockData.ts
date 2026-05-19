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

export type StockDataErrorKind = 'not_found' | 'transient' | 'invalid';

export class StockDataError extends Error {
  kind: StockDataErrorKind;
  status?: number;

  constructor(kind: StockDataErrorKind, message: string, options: { status?: number } = {}) {
    super(message);
    this.name = 'StockDataError';
    this.kind = kind;
    if (typeof options.status === 'number') {
      this.status = options.status;
    }
  }
}

export function getStockDataErrorKind(err: unknown): StockDataErrorKind | null {
  if (err instanceof StockDataError) return err.kind;
  const kind = (err as { kind?: unknown } | null)?.kind;
  if (kind === 'not_found' || kind === 'transient' || kind === 'invalid') return kind;
  return null;
}

// Yahoo Finance APIs do not send CORS headers in browsers. We first try an
// optional first-party proxy endpoint (`/api/yahoo`) when available (local
// stocklens backend or configured hosted backend), and only then fall back to
// public CORS relays as a last resort.
type ProxyBuilder = (yahooUrl: string) => string;
const CORS_PROXIES: ProxyBuilder[] = [
  // Jina AI "reader" proxy. Returns plaintext that includes "Markdown Content:"
  // followed by the upstream body (JSON for Yahoo endpoints we use).
  (u) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
];

let preferredProxyIndex = 0;
let hasWarnedInvalidApiBase = false;
const proxyCooldownUntil = new Map<number, number>();

function nowMs(): number {
  return Date.now();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromPossiblyWrappedText(text: string): unknown {
  const trimmed = text.trim();

  // Most proxies either return raw JSON or `text/plain` with JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // `r.jina.ai` reader format: "... Markdown Content: <json>"
  const marker = 'Markdown Content:';
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex !== -1) {
    const candidate = trimmed.slice(markerIndex + marker.length).trim();
    const extracted = extractFirstJsonValue(candidate);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        // continue
      }
    }
  }

  // Best-effort: try to parse the first JSON object/array found in the body.
  const extracted = extractFirstJsonValue(trimmed);
  if (extracted) {
    try {
      return JSON.parse(extracted);
    } catch {
      // continue
    }
  }

  const err = new Error('Upstream proxy returned a non-JSON response') as Error & { code?: string };
  err.code = 'invalid_json';
  throw err;
}

function extractFirstJsonValue(text: string): string | null {
  const firstObject = text.indexOf('{');
  const firstArray = text.indexOf('[');
  const start =
    firstObject === -1
      ? firstArray
      : firstArray === -1
        ? firstObject
        : Math.min(firstObject, firstArray);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (depth === 0 && i >= start) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function isInvalidJsonError(err: unknown): boolean {
  if (err instanceof SyntaxError) return true;
  return (err as { code?: unknown } | null)?.code === 'invalid_json';
}

function hasAbortSignalTimeout(): boolean {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function';
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  if (hasAbortSignalTimeout()) {
    return fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isTimeoutOrAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  const name = typeof err.name === 'string' ? err.name.toLowerCase() : '';
  if (name === 'aborterror' || name === 'timeouterror') return true;

  const code = (err as { code?: string } | null)?.code;
  return typeof code === 'string' && code.toLowerCase().includes('timeout');
}

function normalizeBaseUrl(base: string): string {
  return base.replace(/\/+$/, '');
}

function normalizeConfiguredBackendBase(base: string): string | null {
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return normalizeBaseUrl(parsed.origin);
  } catch {
    return null;
  }
}

function getBackendProxyBases(): string[] {
  const bases: string[] = [];
  const envBase = process.env.NEXT_PUBLIC_STOCKLENS_API_BASE?.trim();
  if (envBase) {
    const normalized = normalizeConfiguredBackendBase(envBase);
    if (normalized) {
      bases.push(normalized);
    } else if (!hasWarnedInvalidApiBase && process.env.NODE_ENV !== 'production') {
      hasWarnedInvalidApiBase = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[stocklens] Ignoring NEXT_PUBLIC_STOCKLENS_API_BASE because it is not a valid absolute http(s) URL:',
        envBase,
      );
    }
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      bases.push('http://127.0.0.1:3001', 'http://localhost:3001');
    }
  }

  return Array.from(new Set(bases));
}

function buildTargets(
  yahooUrl: string,
  backendPath: string | null,
): Array<{ label: string; url: string; isPublicProxy: boolean; proxyIndex: number | null }> {
  const targets: Array<{ label: string; url: string; isPublicProxy: boolean; proxyIndex: number | null }> = [];

  if (backendPath) {
    for (const base of getBackendProxyBases()) {
      targets.push({
        label: `backend(${base})`,
        url: `${base}${backendPath}`,
        isPublicProxy: false,
        proxyIndex: null,
      });
    }
  }

  const order: number[] = [];
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    order.push((preferredProxyIndex + i) % CORS_PROXIES.length);
  }
  const activeOrder = order.filter((idx) => (proxyCooldownUntil.get(idx) ?? 0) <= nowMs());
  const finalOrder = activeOrder.length > 0 ? activeOrder : order;

  for (const idx of finalOrder) {
    targets.push({
      label: `proxy(${idx})`,
      url: CORS_PROXIES[idx](yahooUrl),
      isPublicProxy: true,
      proxyIndex: idx,
    });
  }

  return targets;
}

async function fetchYahooJson(
  yahooUrl: string,
  backendPath: string | null,
  maxRetries = 2,
): Promise<unknown> {
  let lastStatus: number | undefined;
  let lastError: unknown;
  const errors: string[] = [];
  let public404Count = 0;

  const targets = buildTargets(yahooUrl, backendPath);

  for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
    const target = targets[targetIndex];
    const targetRetries = target.isPublicProxy ? maxRetries : 1;

    // Retry each proxy up to maxRetries times for transient failures
    for (let attempt = 0; attempt <= targetRetries; attempt++) {
      try {
        const res = await fetchWithTimeout(target.url, 10000);
        if (!res.ok) {
          lastStatus = res.status;
          const errorMsg = `HTTP ${res.status}`;
          if (attempt === 0) {
            errors.push(`${target.label}: ${errorMsg}`);
          }
          // 404 from the first-party backend is authoritative (real not-found).
          // Public proxies occasionally fabricate 404s, so we only treat 404 as
          // definitive once we've observed it from multiple independent proxies.
          if (res.status === 404) {
            const err404 = new Error(`HTTP 404`) as Error & { status: number };
            err404.status = 404;

            if (!target.isPublicProxy) {
              throw err404;
            }

            public404Count++;
            if (public404Count >= 2) {
              throw err404;
            }

            break; // Try next target quickly before deciding it's a real 404
          }
          // For 5xx errors or 429 (rate limit), retry with backoff
          if (
            res.status >= 500 ||
            res.status === 429 ||
            res.status === 522 ||
            res.status === 524
          ) {
            if (target.isPublicProxy && target.proxyIndex != null) {
              proxyCooldownUntil.set(target.proxyIndex, nowMs() + 15_000);
            }
            if (attempt < targetRetries) {
              await sleep(Math.min(1000 * Math.pow(2, attempt), 3000));
              continue;
            }
          }
          break; // Non-retryable error, try next target
        }
        const text = await res.text();
        const data = parseJsonFromPossiblyWrappedText(text);
        if (target.isPublicProxy && target.proxyIndex != null) {
          preferredProxyIndex = target.proxyIndex;
          proxyCooldownUntil.delete(target.proxyIndex);
        }
        return data;
      } catch (err) {
        lastError = err;
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (attempt === 0) {
          errors.push(`${target.label}: ${errorMsg}`);
        }
        // Retry on network errors (timeouts, connection refused, etc.)
        if (
          attempt < targetRetries &&
          (isTimeoutOrAbortError(err) || (target.isPublicProxy && isInvalidJsonError(err)))
        ) {
          await sleep(Math.min(1000 * Math.pow(2, attempt), 3000));
          continue;
        }
        break; // Non-retryable error or max retries reached, try next target
      }
    }
  }

  const err = new Error(
    lastStatus
      ? `HTTP ${lastStatus} (all stock data providers failed)`
      : `Stock data providers unavailable: ${errors.join('; ')}`,
  ) as Error & { status?: number };
  if (lastStatus) err.status = lastStatus;
  if (lastError && !lastStatus) {
    (err as Error & { cause?: unknown }).cause = lastError;
  }
  throw err;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

const SEARCH_STOCKS_CACHE_TTL_MS = 30_000;
const searchStocksCache = new Map<
  string,
  { expiresAt: number; results: StockSearchResult[] }
>();

function looksLikeTicker(value: string): boolean {
  if (value.length > 16) return false;
  return /^\^?[A-Za-z0-9]{1,10}([.-][A-Za-z0-9]{1,6})?$/.test(value);
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

  const cacheKey = `${trimmed.toUpperCase()}|${limit}`;
  const cached = searchStocksCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs()) {
    return cached.results;
  }

  const yahooUrl =
    `${YF_BASE}/v1/finance/search?q=${encodeURIComponent(trimmed)}` +
    `&quotesCount=${limit}&newsCount=0&listsCount=0`;
  const backendPath =
    `/api/yahoo?endpoint=search&q=${encodeURIComponent(trimmed)}` +
    `&quotesCount=${encodeURIComponent(String(limit))}`;

  let json: Record<string, unknown>;
  try {
    json = (await fetchYahooJson(yahooUrl, backendPath)) as Record<string, unknown>;
  } catch {
    if (cached && cached.expiresAt > nowMs()) {
      return cached.results;
    }
    // If the upstream search is temporarily unavailable but the user entered
    // something ticker-like, return a best-effort direct candidate so the
    // subsequent chart lookup can still proceed.
    if (looksLikeTicker(trimmed)) {
      const symbol = trimmed.toUpperCase();
      return [{ symbol, name: symbol, exchange: '', type: 'Symbol' }];
    }
    throw new Error(
      'Live stock search is temporarily unavailable. Please retry in a few seconds, or run `npm run stocklens:server` for the local Stocklens backend and a more reliable stock feed.',
    );
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

  searchStocksCache.set(cacheKey, {
    expiresAt: nowMs() + SEARCH_STOCKS_CACHE_TTL_MS,
    results,
  });
  if (searchStocksCache.size > 200) searchStocksCache.clear();

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
  const backendPath = `/api/yahoo?endpoint=chart&symbol=${encodeURIComponent(upperTicker)}`;

  let json: YahooChartResponse;
  try {
    json = (await fetchYahooJson(yahooUrl, backendPath)) as YahooChartResponse;
  } catch (err) {
    const status = (err as { status?: number } | null)?.status;
    if (status === 404) {
      throw new StockDataError('not_found', `No results found for ticker: ${upperTicker}`, { status });
    }
    throw new StockDataError(
      'transient',
      `Live stock quote for ${upperTicker} is temporarily unavailable.`,
      { status },
    );
  }

  const yfError = json?.chart?.error;
  if (yfError) {
    const desc: string = yfError.description || '';
    const lower = desc.toLowerCase();
    if (lower.includes('no results') || lower.includes('not found') || lower.includes('no data found')) {
      throw new StockDataError('not_found', `No results found for ticker: ${upperTicker}`);
    }
    if (desc) {
      throw new StockDataError('invalid', desc);
    }
    throw new StockDataError('invalid', `Invalid ticker: ${upperTicker}`);
  }

  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) {
    throw new StockDataError('not_found', `No results found for ticker: ${upperTicker}`);
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
