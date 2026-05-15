export interface StockData {
  ticker: string;
  name: string;
  quoteType: string | null;
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
// public CORS-enabled relay.
//
// Public CORS proxies are unreliable individually (any one of them can be
// down, rate-limited, or temporarily 5xx-ing on a given day), so we keep
// a small ordered list of proxies and fall through to the next on failure.
// Once we find one that works in the current session we remember its index
// so subsequent calls go to the known-good proxy first.
type ProxyBuilder = (yahooUrl: string) => string;
const CORS_PROXIES: ProxyBuilder[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

let preferredProxyIndex = 0;

type ProxyFailure = { proxy: string; status?: number; message: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  if (typeof AbortController === 'undefined') {
    return await fetch(url, init);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err);
}

async function readBodySnippet(res: Response, maxChars = 200): Promise<string> {
  try {
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (text.length < maxChars) {
        const { value, done } = await withTimeout(
          reader.read(),
          4_000,
          'Timed out reading response body',
        );
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      try {
        await reader.cancel();
      } catch {
        // ignore stream cancellation failures
      }
      return text.slice(0, maxChars).trim();
    }

    const text = await withTimeout(
      res.text(),
      4_000,
      'Timed out reading response body',
    );
    return text.slice(0, maxChars).trim();
  } catch {
    return '';
  }
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await withTimeout(
    res.text(),
    8_000,
    'Timed out reading response body',
  );
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('Non-JSON response from proxy') as Error & {
      bodySnippet?: string;
    };
    err.bodySnippet = text.slice(0, 200).trim();
    throw err;
  }
}

async function fetchYahooJson(yahooUrl: string): Promise<unknown> {
  const order: number[] = [];
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    order.push((preferredProxyIndex + i) % CORS_PROXIES.length);
  }

  const failures: ProxyFailure[] = [];
  for (const idx of order) {
    const proxiedUrl = CORS_PROXIES[idx](yahooUrl);

    let proxyHost = `proxy#${idx + 1}`;
    try {
      proxyHost = new URL(proxiedUrl).host || proxyHost;
    } catch {
      // ignore URL parsing failures
    }

    // Proxies can be temporarily rate-limited or 5xx; retry quickly with a
    // small exponential backoff before falling through to the next proxy.
    const maxAttemptsPerProxy = 2;
    for (let attempt = 0; attempt < maxAttemptsPerProxy; attempt++) {
      const backoffMs =
        250 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
      try {
        const res = await fetchWithTimeout(
          proxiedUrl,
          { headers: { Accept: 'application/json' } },
          12_000,
        );

        if (!res.ok) {
          // 404 from the upstream is a real "not found" signal we want to
          // surface immediately rather than retrying through other proxies,
          // because every proxy will return the same 404.
          if (res.status === 404) {
            const err = new Error(`HTTP 404`) as Error & { status: number };
            err.status = 404;
            throw err;
          }

          const snippet = await readBodySnippet(res);
          const msg =
            snippet || (res.status ? `HTTP ${res.status}` : 'Request failed');

          if (
            isRetryableStatus(res.status) &&
            attempt < maxAttemptsPerProxy - 1
          ) {
            await sleep(backoffMs);
            continue;
          }

          failures.push({ proxy: proxyHost, status: res.status, message: msg });
          break;
        }

        try {
          const data = await parseJsonResponse(res);
          preferredProxyIndex = idx;
          return data;
        } catch (parseErr) {
          const bodySnippet = (parseErr as { bodySnippet?: string } | null)
            ?.bodySnippet;
          const msg = bodySnippet || errorMessage(parseErr);
          const looksRateLimited =
            typeof msg === 'string' &&
            msg.toLowerCase().includes('too many requests');

          if (
            looksRateLimited &&
            attempt < maxAttemptsPerProxy - 1
          ) {
            await sleep(backoffMs);
            continue;
          }

          failures.push({
            proxy: proxyHost,
            status: looksRateLimited ? 429 : undefined,
            message: msg,
          });
          break;
        }
      } catch (err) {
        // If we already classified this as an upstream 404, propagate it.
        if ((err as { status?: number } | null)?.status === 404) throw err;

        const msg = errorMessage(err);
        const name = (err as { name?: string } | null)?.name || '';
        const isTimeout = name === 'AbortError';
        const looksNetwork =
          typeof msg === 'string' &&
          (msg.toLowerCase().includes('failed to fetch') ||
            msg.toLowerCase().includes('network'));

        if (
          attempt < maxAttemptsPerProxy - 1 &&
          (isTimeout || looksNetwork)
        ) {
          await sleep(backoffMs);
          continue;
        }

        failures.push({
          proxy: proxyHost,
          message: isTimeout ? 'Timeout' : msg || 'Request failed',
        });
        break;
      }
    }
  }

  const err = new Error('All CORS proxies failed') as Error & {
    proxyFailures?: ProxyFailure[];
    status?: number;
  };
  err.proxyFailures = failures;
  for (let i = failures.length - 1; i >= 0; i--) {
    const status = failures[i]?.status;
    if (typeof status === 'number') {
      err.status = status;
      break;
    }
  }
  throw err;
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
  } catch (err) {
    const failures = (err as { proxyFailures?: ProxyFailure[] } | null)
      ?.proxyFailures;
    const anyRateLimited = failures?.some((f) => f.status === 429);
    const any5xx = failures?.some(
      (f) => typeof f.status === 'number' && f.status >= 500 && f.status <= 599,
    );
    const hint = anyRateLimited
      ? ' (try again shortly)'
      : any5xx
        ? ' (temporary outage — try again)'
        : '';
    throw new Error(
      `Failed to search stocks for: ${trimmed}${hint}`,
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
    const failures = (err as { proxyFailures?: ProxyFailure[] } | null)
      ?.proxyFailures;

    if (status !== 404 && failures?.length) {
      const anyRateLimited = failures.some((f) => f.status === 429);
      const any5xx = failures.some(
        (f) => typeof f.status === 'number' && f.status >= 500 && f.status <= 599,
      );
      const hint = anyRateLimited
        ? 'rate limited by Yahoo proxy (try again shortly)'
        : any5xx
          ? 'temporary Yahoo proxy outage (try again)'
          : 'Yahoo proxy unavailable (try again)';
      throw new Error(`Failed to fetch data for ticker: ${upperTicker} (${hint})`);
    }

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
    quoteType:
      (typeof meta.instrumentType === 'string' && meta.instrumentType) || null,
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
