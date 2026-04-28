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
const YF_MODULES = [
  'price',
  'summaryDetail',
  'financialData',
  'defaultKeyStatistics',
  'incomeStatementHistory',
  'assetProfile',
].join(',');

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

  const url =
    `${YF_BASE}/v1/finance/search?q=${encodeURIComponent(trimmed)}` +
    `&quotesCount=${limit}&newsCount=0&listsCount=0`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Failed to search stocks for: ${trimmed}`);
  }

  const json = await res.json();
  const quotes: Array<Record<string, unknown>> = json?.quotes ?? [];

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

export async function fetchStockData(ticker: string): Promise<StockData> {
  const upperTicker = ticker.toUpperCase();
  const url = `${YF_BASE}/v10/finance/quoteSummary/${encodeURIComponent(upperTicker)}?modules=${YF_MODULES}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `No results found for ticker: ${upperTicker}`
        : `Failed to fetch data for ticker: ${upperTicker}`
    );
  }

  const json = await res.json();

  const yfError = json?.quoteSummary?.error;
  if (yfError) {
    const desc: string = yfError.description || '';
    const lower = desc.toLowerCase();
    throw new Error(
      lower.includes('no results') || lower.includes('not found')
        ? `No results found for ticker: ${upperTicker}`
        : desc || `Invalid ticker: ${upperTicker}`
    );
  }

  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    throw new Error(`No results found for ticker: ${upperTicker}`);
  }

  const price = result.price ?? {};
  const summaryDetail = result.summaryDetail ?? {};
  const financialData = result.financialData ?? {};
  const keyStats = result.defaultKeyStatistics ?? {};
  const assetProfile = result.assetProfile ?? {};

  // The Yahoo Finance v10 API wraps numeric values in { raw, fmt } objects.
  const safeNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'object' && v !== null && 'raw' in v) {
      v = (v as { raw: unknown }).raw;
    }
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  // String fields are returned as plain strings; date/numeric fields as { raw, fmt }.
  const safeStr = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v === '' ? null : v;
    if (typeof v === 'object' && v !== null && 'fmt' in v) {
      const fmt = (v as { fmt: unknown }).fmt;
      return fmt ? String(fmt) : null;
    }
    return null;
  };

  // Date fields come as { raw: epochSeconds, fmt: 'YYYY-MM-DD' }.
  const formatDate = (v: unknown): string | null => {
    if (!v) return null;
    let epoch: number | null = null;
    if (typeof v === 'object' && v !== null && 'raw' in v) {
      epoch = Number((v as { raw: unknown }).raw);
    } else {
      const n = Number(v);
      if (!isNaN(n)) epoch = n;
    }
    if (epoch !== null) {
      try {
        return new Date(epoch * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch {
        return null;
      }
    }
    return null;
  };

  const priceVal = safeNum(price.regularMarketPrice);
  const prevClose = safeNum(price.regularMarketPreviousClose);
  const priceChgPct = safeNum(price.regularMarketChangePercent);
  const priceChg = safeNum(price.regularMarketChange);

  // Revenue from income statement history
  let revenue: number | null = null;
  let revenueGrowth: number | null = null;
  try {
    const stmts = result.incomeStatementHistory?.incomeStatementHistory;
    if (stmts && stmts.length > 0) {
      revenue = safeNum(stmts[0].totalRevenue);
      if (stmts.length > 1) {
        const prevRevenue = safeNum(stmts[1].totalRevenue);
        if (revenue != null && prevRevenue != null && prevRevenue !== 0) {
          revenueGrowth = (revenue - prevRevenue) / prevRevenue;
        }
      }
    }
  } catch {
    // fallback
  }

  if (revenue == null) revenue = safeNum(financialData.totalRevenue);
  if (revenueGrowth == null) revenueGrowth = safeNum(financialData.revenueGrowth);

  return {
    ticker: upperTicker,
    name: safeStr(price.longName ?? price.shortName) || upperTicker,
    sector: safeStr(assetProfile.sector) || 'Technology',
    industry: safeStr(assetProfile.industry) || 'Unknown',
    exchange: safeStr(price.exchangeName) || 'NASDAQ',
    currency: safeStr(price.currency) || 'USD',
    description: safeStr(assetProfile.longBusinessSummary) || 'Not publicly disclosed',
    price: priceVal,
    previousClose: prevClose,
    priceChange: priceChg,
    priceChangePercent: priceChgPct != null ? priceChgPct * 100 : null,
    marketCap: safeNum(price.marketCap),
    enterpriseValue: safeNum(keyStats.enterpriseValue),
    revenue,
    revenueGrowth,
    grossMargin: safeNum(financialData.grossMargins),
    operatingMargin: safeNum(financialData.operatingMargins),
    profitMargin: safeNum(financialData.profitMargins),
    netIncome: safeNum(financialData.netIncomeToCommon),
    ebitda: safeNum(financialData.ebitda),
    cash: safeNum(financialData.totalCash),
    totalDebt: safeNum(financialData.totalDebt),
    debtToEquity: safeNum(financialData.debtToEquity),
    peRatio: safeNum(summaryDetail.trailingPE),
    psRatio: safeNum(keyStats.priceToSalesTrailing12Months),
    pbRatio: safeNum(keyStats.priceToBook),
    forwardPE: safeNum(summaryDetail.forwardPE),
    pegRatio: safeNum(keyStats.pegRatio),
    eps: safeNum(keyStats.trailingEps),
    forwardEps: safeNum(keyStats.forwardEps),
    dividendYield: safeNum(summaryDetail.dividendYield),
    fiftyTwoWeekHigh: safeNum(summaryDetail.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: safeNum(summaryDetail.fiftyTwoWeekLow),
    fiftyDayAvg: safeNum(summaryDetail.fiftyDayAverage),
    twoHundredDayAvg: safeNum(summaryDetail.twoHundredDayAverage),
    ytdReturn: safeNum(keyStats.ytdReturn),
    beta: safeNum(summaryDetail.beta),
    sharesOutstanding: safeNum(keyStats.sharesOutstanding),
    floatShares: safeNum(keyStats.floatShares),
    shortRatio: safeNum(keyStats.shortRatio),
    lastEarningsDate: formatDate(keyStats.lastEpsDate ?? keyStats.mostRecentQuarter),
    employees: safeNum(assetProfile.fullTimeEmployees),
    founded: null,
    website: safeStr(assetProfile.website),
    country: safeStr(assetProfile.country),
  };
}
