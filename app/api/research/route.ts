import { NextRequest, NextResponse } from 'next/server';
import { detectAssetType } from '@/lib/assetDetector';
import { fetchStockData, StockData } from '@/lib/stockData';
import { fetchCryptoData, CryptoData } from '@/lib/cryptoData';

function classifyStockAsset(data: StockData): string {
  const sector = (data.sector || '').toLowerCase();
  const industry = (data.industry || '').toLowerCase();
  const name = (data.name || '').toLowerCase();

  if (
    name.includes('nvidia') ||
    name.includes('ai chip') ||
    industry.includes('semiconductor') && (name.includes('gpu') || name.includes('ai'))
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim() === '') {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 });
  }

  const query = q.trim();
  const assetType = detectAssetType(query);

  // 'contract' is treated as crypto
  const isCrypto = assetType === 'crypto' || assetType === 'contract';

  try {
    if (isCrypto) {
      try {
        const data = await fetchCryptoData(query);
        const assetClass = classifyCryptoAsset(data);
        return NextResponse.json({ type: 'crypto', data, assetClass });
      } catch (cryptoErr) {
        // If crypto fetch fails and it wasn't a contract, try stock
        if (assetType !== 'contract') {
          try {
            const data = await fetchStockData(query);
            const assetClass = classifyStockAsset(data);
            return NextResponse.json({ type: 'stock', data, assetClass });
          } catch {
            throw cryptoErr;
          }
        }
        throw cryptoErr;
      }
    } else {
      try {
        const data = await fetchStockData(query);
        const assetClass = classifyStockAsset(data);
        return NextResponse.json({ type: 'stock', data, assetClass });
      } catch (stockErr) {
        // Try crypto as fallback
        try {
          const data = await fetchCryptoData(query);
          const assetClass = classifyCryptoAsset(data);
          return NextResponse.json({ type: 'crypto', data, assetClass });
        } catch {
          throw stockErr;
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const lower = message.toLowerCase();
    // Map client/input errors to appropriate HTTP status codes
    const status =
      lower.includes('not found') || lower.includes('no results') || lower.includes('invalid ticker')
        ? 404
        : lower.includes('invalid') || lower.includes('bad request') || lower.includes('contract address')
        ? 400
        : 500;
    return NextResponse.json(
      { error: `Failed to fetch data for "${query}": ${message}` },
      { status }
    );
  }
}
