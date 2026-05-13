import { detectAssetType } from '@/lib/assetDetector';
import {
  fetchStockData,
  searchStocks,
  StockData,
  StockSearchResult,
} from '@/lib/stockData';
import {
  fetchCryptoData,
  fetchCryptoDataById,
  searchCryptos,
  CryptoData,
  CryptoSearchResult,
} from '@/lib/cryptoData';
import { generateInsights, AssetInsights } from '@/lib/insights';

export type SearchMode = 'stock' | 'crypto';

export interface ResearchResult {
  type: 'stock' | 'crypto';
  data: StockData | CryptoData;
  assetClass: string;
  insights?: AssetInsights;
  insightsError?: string;
}

export interface ResearchOptions {
  openaiApiKey?: string;
  /**
   * Restrict the lookup to a specific market. When omitted the asset type
   * is auto-detected (legacy behaviour).
   */
  mode?: SearchMode;
}

interface BaseCandidate {
  symbol: string;
  name: string;
  market: string;
}

export type SearchCandidate =
  | (BaseCandidate & { type: 'stock'; quoteType: string })
  | (BaseCandidate & { type: 'crypto'; id: string; marketCapRank: number | null });

function classifyStockAsset(data: StockData): string {
  const sector = (data.sector || '').toLowerCase();
  const industry = (data.industry || '').toLowerCase();
  const name = (data.name || '').toLowerCase();

  if (
    name.includes('nvidia') ||
    (industry.includes('semiconductor') && (name.includes('gpu') || name.includes('ai')))
  ) {
    return 'AI Infrastructure Stock';
  }
  if (industry.includes('semiconductor') || sector.includes('semiconductor')) {
    return 'Semiconductor Equity';
  }
  if (
    industry.includes('cloud') ||
    industry.includes('saas') ||
    industry.includes('software-infrastructure') ||
    industry.includes('application software')
  ) {
    return 'SaaS Equity / Cloud';
  }
  if (sector.includes('technology') || industry.includes('technology')) {
    return 'Technology Equity';
  }
  if (sector.includes('financial') || industry.includes('bank') || industry.includes('fintech')) {
    return 'Financial Services';
  }
  if (sector.includes('healthcare') || sector.includes('biotechnology')) {
    return 'Healthcare / Biotech';
  }
  if (sector.includes('energy')) {
    return 'Energy Equity';
  }
  if (sector.includes('consumer')) {
    return 'Consumer Equity';
  }
  return 'Public Equity';
}

function classifyCryptoAsset(data: CryptoData): string {
  const categories = (data.categories || []).map((c) => c.toLowerCase());
  const name = (data.name || '').toLowerCase();
  const symbol = (data.symbol || '').toLowerCase();

  const has = (keyword: string) =>
    categories.some((c) => c.includes(keyword)) ||
    name.includes(keyword) ||
    symbol.includes(keyword);

  if (has('meme') || has('dog') || has('pepe') || has('shib') || has('floki')) {
    return 'Meme / High-Risk Token';
  }
  if (has('layer 1') || has('layer1') || has('smart contract platform')) {
    return 'Layer 1';
  }
  if (has('layer 2') || has('layer2') || has('rollup') || has('scaling')) {
    return 'Layer 2 / Scaling';
  }
  if (has('defi') || has('decentralized finance') || has('dex') || has('lending')) {
    return 'DeFi Protocol';
  }
  if (has('ai') || has('artificial intelligence') || has('machine learning')) {
    return 'AI / DePIN Crypto';
  }
  if (has('nft') || has('gaming') || has('metaverse')) {
    return 'NFT / Gaming Token';
  }
  if (has('stablecoin') || has('stable')) {
    return 'Stablecoin';
  }
  if (has('exchange') || has('cex') || has('centralized exchange')) {
    return 'Exchange Token';
  }
  if (has('privacy') || has('zero knowledge') || has('zk')) {
    return 'Privacy / ZK Crypto';
  }
  if (has('oracle')) {
    return 'Oracle Network';
  }
  if (has('infrastructure') || has('interoperability') || has('cross-chain')) {
    return 'Crypto Infrastructure';
  }
  return 'Crypto Asset';
}

/**
 * Search the requested market for candidates matching the user's query.
 *
 * - In `stock` mode this hits Yahoo Finance's search API and returns
 *   equities/ETFs/funds across all exchanges (including newly listed names).
 * - In `crypto` mode this hits CoinGecko's search API and only returns coins.
 *   A 0x-prefixed Ethereum contract address is treated as a single direct
 *   crypto match.
 *
 * Throws if the upstream search fails or returns zero results.
 */
export async function searchAssetCandidates(
  query: string,
  mode: SearchMode,
): Promise<SearchCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error('Missing query');

  if (mode === 'crypto') {
    // Ethereum contract address: resolve directly, treat as a single match.
    if (trimmed.startsWith('0x') && /^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      const data = await fetchCryptoData(trimmed);
      return [
        {
          type: 'crypto',
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          market: data.chain ? `${data.chain} contract` : 'CoinGecko',
          marketCapRank: data.marketCapRank,
        },
      ];
    }

    const coins = await searchCryptos(trimmed);
    if (coins.length === 0) {
      throw new Error(`No crypto found for: ${trimmed}`);
    }
    return coins.map((c: CryptoSearchResult) => ({
      type: 'crypto' as const,
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      market: c.marketCapRank ? `CoinGecko · Rank #${c.marketCapRank}` : 'CoinGecko',
      marketCapRank: c.marketCapRank,
    }));
  }

  // Stock mode
  const quotes = await searchStocks(trimmed);
  if (quotes.length === 0) {
    throw new Error(`No stocks found for: ${trimmed}`);
  }
  return quotes.map((q: StockSearchResult) => ({
    type: 'stock' as const,
    symbol: q.symbol,
    name: q.name,
    market: q.exchange || 'Stock Market',
    quoteType: q.type,
  }));
}

async function enrichWithInsights(
  result: ResearchResult,
  options: ResearchOptions,
): Promise<ResearchResult> {
  try {
    result.insights = await generateInsights(
      options.openaiApiKey,
      result.type,
      result.data,
      result.assetClass,
    );
  } catch (err) {
    result.insightsError = err instanceof Error ? err.message : 'Failed to generate AI insights';
  }
  return result;
}

/**
 * Fetch the full ResearchResult for a candidate previously returned from
 * `searchAssetCandidates`. This is the path used after the user disambiguates
 * between multiple search hits.
 */
export async function researchByCandidate(
  candidate: SearchCandidate,
  options: ResearchOptions = {},
): Promise<ResearchResult> {
  if (candidate.type === 'stock') {
    const data = await fetchStockData(candidate.symbol);
    const result: ResearchResult = {
      type: 'stock',
      data,
      assetClass: classifyStockAsset(data),
    };
    return enrichWithInsights(result, options);
  }

  const data = await fetchCryptoDataById(candidate.id);
  const result: ResearchResult = {
    type: 'crypto',
    data,
    assetClass: classifyCryptoAsset(data),
  };
  return enrichWithInsights(result, options);
}

/**
 * Resolves a ticker / symbol / contract address to a ResearchResult.
 * Throws a descriptive Error if the asset cannot be found.
 *
 * When `options.mode` is provided the lookup is constrained to that market
 * (no cross-market fallback). When omitted, the legacy auto-detect behaviour
 * is used.
 */
export async function researchAsset(
  query: string,
  options: ResearchOptions = {},
): Promise<ResearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Missing query');
  }

  let result: ResearchResult;

  if (options.mode === 'stock') {
    const data = await fetchStockData(trimmed);
    result = { type: 'stock', data, assetClass: classifyStockAsset(data) };
  } else if (options.mode === 'crypto') {
    const data = await fetchCryptoData(trimmed);
    result = { type: 'crypto', data, assetClass: classifyCryptoAsset(data) };
  } else {
    const assetType = detectAssetType(trimmed);
    const isCrypto = assetType === 'crypto' || assetType === 'contract';

    if (isCrypto) {
      try {
        const data = await fetchCryptoData(trimmed);
        result = { type: 'crypto', data, assetClass: classifyCryptoAsset(data) };
      } catch (cryptoErr) {
        if (assetType !== 'contract') {
          try {
            const data = await fetchStockData(trimmed);
            result = { type: 'stock', data, assetClass: classifyStockAsset(data) };
          } catch {
            throw cryptoErr;
          }
        } else {
          throw cryptoErr;
        }
      }
    } else {
      try {
        const data = await fetchStockData(trimmed);
        result = { type: 'stock', data, assetClass: classifyStockAsset(data) };
      } catch (stockErr) {
        try {
          const data = await fetchCryptoData(trimmed);
          result = { type: 'crypto', data, assetClass: classifyCryptoAsset(data) };
        } catch {
          throw stockErr;
        }
      }
    }
  }

  return enrichWithInsights(result, options);
}
