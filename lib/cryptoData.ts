import axios from 'axios';

export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number | null;
  marketCap: number | null;
  fdv: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  athPrice: number | null;
  athChangePercentage: number | null;
  athDate: string | null;
  atlPrice: number | null;
  atlChangePercentage: number | null;
  priceChangePercentage24h: number | null;
  priceChangePercentage7d: number | null;
  priceChangePercentage30d: number | null;
  volume24h: number | null;
  marketCapRank: number | null;
  exchangeListings: number | null;
  contractAddress: string | null;
  chain: string | null;
  description: string | null;
  categories: string[];
  homepage: string | null;
  twitter: string | null;
  telegram: string | null;
  github: string | null;
  launchDate: string | null;
  liquidityScore: number | null;
  communityScore: number | null;
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const HEADERS = {
  Accept: 'application/json',
};

async function fetchCoinDetail(id: string): Promise<CryptoData> {
  const url = `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=false`;
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

  const md = data.market_data || {};
  const links = data.links || {};

  const safeNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const safeStr = (v: unknown): string | null => {
    if (v === null || v === undefined || v === '') return null;
    return String(v);
  };

  const tickers = data.tickers || [];
  const exchangeListings = tickers.length;

  // Contract address
  let contractAddress: string | null = null;
  let chain: string | null = null;
  const platforms = data.platforms || {};
  if (platforms.ethereum) {
    contractAddress = platforms.ethereum;
    chain = 'Ethereum';
  } else if (platforms['binance-smart-chain']) {
    contractAddress = platforms['binance-smart-chain'];
    chain = 'BSC';
  } else if (platforms.solana) {
    contractAddress = platforms.solana;
    chain = 'Solana';
  } else {
    const keys = Object.keys(platforms);
    if (keys.length > 0) {
      chain = keys[0];
      contractAddress = platforms[keys[0]];
    }
  }

  const homepage = Array.isArray(links.homepage) ? links.homepage[0] || null : null;
  const twitter = links.twitter_screen_name ? `https://twitter.com/${links.twitter_screen_name}` : null;
  const telegram = links.telegram_channel_identifier
    ? `https://t.me/${links.telegram_channel_identifier}`
    : null;
  const githubRepos = links.repos_url?.github || [];
  const github = githubRepos.length > 0 ? githubRepos[0] : null;

  const description = data.description?.en
    ? String(data.description.en)
        // Remove all HTML tags (including script, style, etc.)
        .replace(/<[^>]*>/g, ' ')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500)
    : null;

  return {
    id: data.id,
    name: data.name,
    symbol: (data.symbol || '').toUpperCase(),
    currentPrice: safeNum(md.current_price?.usd),
    marketCap: safeNum(md.market_cap?.usd),
    fdv: safeNum(md.fully_diluted_valuation?.usd),
    circulatingSupply: safeNum(md.circulating_supply),
    totalSupply: safeNum(md.total_supply),
    maxSupply: safeNum(md.max_supply),
    athPrice: safeNum(md.ath?.usd),
    athChangePercentage: safeNum(md.ath_change_percentage?.usd),
    athDate: md.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
    atlPrice: safeNum(md.atl?.usd),
    atlChangePercentage: safeNum(md.atl_change_percentage?.usd),
    priceChangePercentage24h: safeNum(md.price_change_percentage_24h),
    priceChangePercentage7d: safeNum(md.price_change_percentage_7d),
    priceChangePercentage30d: safeNum(md.price_change_percentage_30d),
    volume24h: safeNum(md.total_volume?.usd),
    marketCapRank: safeNum(data.market_cap_rank),
    exchangeListings,
    contractAddress: safeStr(contractAddress),
    chain: safeStr(chain),
    description,
    categories: data.categories || [],
    homepage: safeStr(homepage),
    twitter,
    telegram: safeStr(telegram),
    github: safeStr(github),
    launchDate: null,
    liquidityScore: safeNum(data.liquidity_score),
    communityScore: safeNum(data.community_score),
  };
}

export async function fetchCryptoData(query: string): Promise<CryptoData> {
  // Contract address - validate it's a proper Ethereum address (0x + 40 hex chars)
  if (query.startsWith('0x')) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(query)) {
      throw new Error('Invalid Ethereum contract address format');
    }
    const safeAddress = query.toLowerCase();
    const url = `${COINGECKO_BASE}/coins/ethereum/contract/${safeAddress}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    return fetchCoinDetail(data.id);
  }

  // Search by symbol/name
  const searchUrl = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
  const { data: searchData } = await axios.get(searchUrl, { headers: HEADERS, timeout: 15000 });

  const coins: Array<{ id: string; symbol: string; name: string; market_cap_rank: number | null }> =
    searchData.coins || [];

  if (coins.length === 0) {
    throw new Error(`No crypto found for: ${query}`);
  }

  // Find best match: exact symbol match first, then highest market cap rank
  const upper = query.toUpperCase();
  let best = coins.find((c) => c.symbol.toUpperCase() === upper);
  if (!best) {
    // find by name match
    best = coins.find((c) => c.name.toLowerCase() === query.toLowerCase());
  }
  if (!best) {
    // Pick the one with lowest (best) market cap rank
    const ranked = coins
      .filter((c) => c.market_cap_rank !== null)
      .sort((a, b) => (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999));
    best = ranked[0] || coins[0];
  }

  return fetchCoinDetail(best.id);
}
