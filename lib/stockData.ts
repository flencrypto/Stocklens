import yahooFinance from 'yahoo-finance2';

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

export async function fetchStockData(ticker: string): Promise<StockData> {
  const upperTicker = ticker.toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await yahooFinance.quoteSummary(upperTicker, {
    modules: [
      'price',
      'summaryDetail',
      'financialData',
      'defaultKeyStatistics',
      'incomeStatementHistory',
      'assetProfile',
    ],
  });

  const price = result.price;
  const summaryDetail = result.summaryDetail;
  const financialData = result.financialData;
  const keyStats = result.defaultKeyStatistics;
  const assetProfile = result.assetProfile;

  const safeNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const safeStr = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    return String(v);
  };

  const formatDate = (v: unknown): string | null => {
    if (!v) return null;
    try {
      return new Date(v as string | number).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const priceVal = safeNum(price?.regularMarketPrice);
  const prevClose = safeNum(price?.regularMarketPreviousClose);
  const priceChgPct = safeNum(price?.regularMarketChangePercent);
  const priceChg = safeNum(price?.regularMarketChange);

  // Revenue from income statement history
  let revenue: number | null = null;
  let revenueGrowth: number | null = null;
  try {
    const stmts = result.incomeStatementHistory?.incomeStatementHistory;
    if (stmts && stmts.length > 0) {
      revenue = safeNum((stmts[0] as Record<string, unknown>).totalRevenue);
      if (stmts.length > 1) {
        const prevRevenue = safeNum((stmts[1] as Record<string, unknown>).totalRevenue);
        if (revenue && prevRevenue && prevRevenue !== 0) {
          revenueGrowth = (revenue - prevRevenue) / prevRevenue;
        }
      }
    }
  } catch {
    // fallback
  }

  if (!revenue) {
    revenue = safeNum((financialData as Record<string, unknown>)?.totalRevenue);
  }
  if (!revenueGrowth) {
    revenueGrowth = safeNum((financialData as Record<string, unknown>)?.revenueGrowth);
  }

  return {
    ticker: upperTicker,
    name: safeStr(price?.longName || price?.shortName) || upperTicker,
    sector: safeStr((assetProfile as Record<string, unknown>)?.sector) || 'Technology',
    industry: safeStr((assetProfile as Record<string, unknown>)?.industry) || 'Unknown',
    exchange: safeStr(price?.exchangeName) || 'NASDAQ',
    currency: safeStr(price?.currency) || 'USD',
    description: safeStr((assetProfile as Record<string, unknown>)?.longBusinessSummary) || 'Not publicly disclosed',
    price: priceVal,
    previousClose: prevClose,
    priceChange: priceChg,
    priceChangePercent: priceChgPct ? priceChgPct * 100 : null,
    marketCap: safeNum(price?.marketCap),
    enterpriseValue: safeNum((keyStats as Record<string, unknown>)?.enterpriseValue),
    revenue,
    revenueGrowth,
    grossMargin: safeNum((financialData as Record<string, unknown>)?.grossMargins),
    operatingMargin: safeNum((financialData as Record<string, unknown>)?.operatingMargins),
    profitMargin: safeNum((financialData as Record<string, unknown>)?.profitMargins),
    netIncome: safeNum((financialData as Record<string, unknown>)?.netIncomeToCommon),
    ebitda: safeNum((financialData as Record<string, unknown>)?.ebitda),
    cash: safeNum((financialData as Record<string, unknown>)?.totalCash),
    totalDebt: safeNum((financialData as Record<string, unknown>)?.totalDebt),
    debtToEquity: safeNum((financialData as Record<string, unknown>)?.debtToEquity),
    peRatio: safeNum(summaryDetail?.trailingPE),
    psRatio: safeNum((keyStats as Record<string, unknown>)?.priceToSalesTrailing12Months),
    pbRatio: safeNum((keyStats as Record<string, unknown>)?.priceToBook),
    forwardPE: safeNum(summaryDetail?.forwardPE),
    pegRatio: safeNum((keyStats as Record<string, unknown>)?.pegRatio),
    eps: safeNum((keyStats as Record<string, unknown>)?.trailingEps),
    forwardEps: safeNum((keyStats as Record<string, unknown>)?.forwardEps),
    dividendYield: safeNum(summaryDetail?.dividendYield),
    fiftyTwoWeekHigh: safeNum(summaryDetail?.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: safeNum(summaryDetail?.fiftyTwoWeekLow),
    fiftyDayAvg: safeNum(summaryDetail?.fiftyDayAverage),
    twoHundredDayAvg: safeNum(summaryDetail?.twoHundredDayAverage),
    ytdReturn: safeNum((keyStats as Record<string, unknown>)?.ytdReturn),
    beta: safeNum(summaryDetail?.beta),
    sharesOutstanding: safeNum((keyStats as Record<string, unknown>)?.sharesOutstanding),
    floatShares: safeNum((keyStats as Record<string, unknown>)?.floatShares),
    shortRatio: safeNum((keyStats as Record<string, unknown>)?.shortRatio),
    lastEarningsDate: formatDate((keyStats as Record<string, unknown>)?.lastEpsDate || (keyStats as Record<string, unknown>)?.mostRecentQuarter),
    employees: safeNum((assetProfile as Record<string, unknown>)?.fullTimeEmployees),
    founded: null,
    website: safeStr((assetProfile as Record<string, unknown>)?.website),
    country: safeStr((assetProfile as Record<string, unknown>)?.country),
  };
}
