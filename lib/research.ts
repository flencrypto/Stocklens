import { detectAssetType } from '@/lib/assetDetector';
import { fetchStockData, StockData } from '@/lib/stockData';
import { fetchCryptoData, CryptoData } from '@/lib/cryptoData';

export interface ResearchResult {
  type: 'stock' | 'crypto';
  data: StockData | CryptoData;
  assetClass: string;
}

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
 * Resolves a ticker / symbol / contract address to a ResearchResult.
 * Throws a descriptive Error if the asset cannot be found.
 */
export async function researchAsset(query: string): Promise<ResearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Missing query');
  }

  const assetType = detectAssetType(trimmed);
  const isCrypto = assetType === 'crypto' || assetType === 'contract';

  if (isCrypto) {
    try {
      const data = await fetchCryptoData(trimmed);
      const assetClass = classifyCryptoAsset(data);
      return { type: 'crypto', data, assetClass };
    } catch (cryptoErr) {
      // If crypto fetch fails and it wasn't a contract, try stock as fallback
      if (assetType !== 'contract') {
        try {
          const data = await fetchStockData(trimmed);
          const assetClass = classifyStockAsset(data);
          return { type: 'stock', data, assetClass };
        } catch {
          throw cryptoErr;
        }
      }
      throw cryptoErr;
    }
  } else {
    try {
      const data = await fetchStockData(trimmed);
      const assetClass = classifyStockAsset(data);
      return { type: 'stock', data, assetClass };
    } catch (stockErr) {
      // Try crypto as fallback
      try {
        const data = await fetchCryptoData(trimmed);
        const assetClass = classifyCryptoAsset(data);
        return { type: 'crypto', data, assetClass };
      } catch {
        throw stockErr;
      }
    }
  }
}
