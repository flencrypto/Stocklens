'use client';

import React from 'react';
import ScoreRing from './ScoreRing';
import { StockData } from '@/lib/stockData';
import { CryptoData } from '@/lib/cryptoData';

interface InfographicPage2Props {
  type: 'stock' | 'crypto';
  data: StockData | CryptoData;
  assetClass: string;
}

function fmtLarge(n: number | null | undefined, prefix = '$'): string {
  if (n === null || n === undefined) return 'N/A';
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

function fmtPctDirect(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// Calculate investment score
function calcScore(type: string, data: StockData | CryptoData): number {
  let score = 5.0;

  if (type === 'stock') {
    const d = data as StockData;
    if (d.revenueGrowth) {
      if (d.revenueGrowth > 0.3) score += 1.0;
      else if (d.revenueGrowth > 0.15) score += 0.5;
      else if (d.revenueGrowth < 0) score -= 1.0;
    }
    if (d.grossMargin) {
      if (d.grossMargin > 0.6) score += 0.8;
      else if (d.grossMargin > 0.4) score += 0.4;
      else if (d.grossMargin < 0.2) score -= 0.4;
    }
    if (d.operatingMargin) {
      if (d.operatingMargin > 0.2) score += 0.5;
      else if (d.operatingMargin < 0) score -= 0.8;
    }
    if (d.peRatio) {
      if (d.peRatio > 80) score -= 0.8;
      else if (d.peRatio > 50) score -= 0.4;
      else if (d.peRatio < 25) score += 0.4;
    }
    if (d.debtToEquity) {
      if (d.debtToEquity > 200) score -= 0.5;
      else if (d.debtToEquity < 50) score += 0.3;
    }
    if (d.beta) {
      if (d.beta > 2) score -= 0.3;
    }
  } else {
    const d = data as CryptoData;
    if (d.marketCapRank) {
      if (d.marketCapRank <= 10) score += 1.2;
      else if (d.marketCapRank <= 50) score += 0.6;
      else if (d.marketCapRank > 200) score -= 0.5;
    }
    if (d.priceChangePercentage30d) {
      if (d.priceChangePercentage30d > 50) score += 0.8;
      else if (d.priceChangePercentage30d > 20) score += 0.4;
      else if (d.priceChangePercentage30d < -40) score -= 0.8;
      else if (d.priceChangePercentage30d < -20) score -= 0.4;
    }
    if (d.fdv && d.marketCap) {
      const ratio = d.fdv / d.marketCap;
      if (ratio > 10) score -= 0.8;
      else if (ratio < 2) score += 0.4;
    }
    if (d.volume24h && d.marketCap) {
      const volRatio = d.volume24h / d.marketCap;
      if (volRatio > 0.1) score += 0.4;
      else if (volRatio < 0.01) score -= 0.3;
    }
    if (d.athChangePercentage) {
      if (d.athChangePercentage > -20) score += 0.5;
      else if (d.athChangePercentage < -80) score -= 0.4;
    }
  }

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

// Generate score breakdown
function generateScoreBreakdown(type: string, data: StockData | CryptoData) {
  if (type === 'stock') {
    const d = data as StockData;
    return [
      {
        category: 'Growth',
        score: d.revenueGrowth
          ? d.revenueGrowth > 0.3 ? 9 : d.revenueGrowth > 0.15 ? 7 : d.revenueGrowth > 0 ? 5 : 3
          : 5,
        weight: '25%',
      },
      {
        category: 'Profitability',
        score: d.grossMargin
          ? d.grossMargin > 0.6 ? 9 : d.grossMargin > 0.4 ? 7 : d.grossMargin > 0.2 ? 5 : 3
          : 5,
        weight: '25%',
      },
      {
        category: 'Valuation',
        score: d.peRatio
          ? d.peRatio < 20 ? 9 : d.peRatio < 35 ? 7 : d.peRatio < 60 ? 5 : 3
          : 5,
        weight: '20%',
      },
      {
        category: 'Balance Sheet',
        score: d.debtToEquity
          ? d.debtToEquity < 50 ? 9 : d.debtToEquity < 100 ? 7 : d.debtToEquity < 200 ? 5 : 3
          : 5,
        weight: '15%',
      },
      {
        category: 'Momentum',
        score: d.priceChangePercent
          ? d.priceChangePercent > 5 ? 8 : d.priceChangePercent > 0 ? 6 : 4
          : 5,
        weight: '15%',
      },
    ];
  } else {
    const d = data as CryptoData;
    return [
      {
        category: 'Market Position',
        score: d.marketCapRank
          ? d.marketCapRank <= 10 ? 9 : d.marketCapRank <= 50 ? 7 : d.marketCapRank <= 100 ? 5 : 3
          : 5,
        weight: '25%',
      },
      {
        category: 'Momentum (30d)',
        score: d.priceChangePercentage30d
          ? d.priceChangePercentage30d > 50 ? 9 : d.priceChangePercentage30d > 20 ? 7 : d.priceChangePercentage30d > 0 ? 5 : 3
          : 5,
        weight: '20%',
      },
      {
        category: 'Tokenomics',
        score: d.fdv && d.marketCap
          ? d.fdv / d.marketCap < 2 ? 9 : d.fdv / d.marketCap < 5 ? 7 : d.fdv / d.marketCap < 10 ? 5 : 3
          : 5,
        weight: '20%',
      },
      {
        category: 'Liquidity',
        score: d.volume24h && d.marketCap
          ? (d.volume24h / d.marketCap) > 0.1 ? 9 : (d.volume24h / d.marketCap) > 0.05 ? 7 : 5
          : 5,
        weight: '20%',
      },
      {
        category: 'ATH Distance',
        score: d.athChangePercentage
          ? d.athChangePercentage > -20 ? 8 : d.athChangePercentage > -50 ? 6 : 4
          : 5,
        weight: '15%',
      },
    ];
  }
}

// Generate product features
function generateProductFeatures(type: string, data: StockData | CryptoData, assetClass: string) {
  if (type === 'stock') {
    const d = data as StockData;
    const sector = d.sector || 'Technology';
    const isAI = assetClass.includes('AI') || assetClass.includes('Semiconductor');
    const isSaaS = assetClass.includes('SaaS') || assetClass.includes('Cloud');
    return [
      { icon: '🏗️', title: 'Core Business', desc: d.industry || `${sector} Products & Services` },
      { icon: '🌍', title: 'Geography', desc: d.country ? `HQ: ${d.country}` : 'Global Operations' },
      { icon: '👥', title: 'Scale', desc: d.employees ? `${(d.employees / 1000).toFixed(0)}K+ employees` : 'Enterprise Scale' },
      { icon: isAI ? '🤖' : isSaaS ? '☁️' : '📦', title: isAI ? 'AI/ML Edge' : isSaaS ? 'Cloud Platform' : 'Product Suite', desc: isAI ? 'Accelerated computing & AI infrastructure' : isSaaS ? 'Scalable SaaS & cloud services' : 'Diversified product portfolio' },
      { icon: '💻', title: 'Exchange', desc: `Listed: ${d.exchange || 'NASDAQ'} • ${d.currency || 'USD'}` },
      { icon: '📋', title: 'Last Earnings', desc: d.lastEarningsDate ? `Reported: ${d.lastEarningsDate}` : 'Quarterly Reporting' },
    ];
  } else {
    const d = data as CryptoData;
    const isL1 = assetClass.includes('Layer 1') || d.categories?.some(c => c.toLowerCase().includes('layer 1'));
    const isDeFi = assetClass.includes('DeFi') || d.categories?.some(c => c.toLowerCase().includes('defi'));
    return [
      { icon: '🔗', title: 'Protocol Type', desc: d.categories?.[0] || 'Blockchain Protocol' },
      { icon: '⛓️', title: 'Network', desc: d.chain ? `${d.chain} Chain` : 'Native Network' },
      { icon: isL1 ? '🏛️' : isDeFi ? '💱' : '🔧', title: isL1 ? 'Consensus' : isDeFi ? 'AMM/DeFi' : 'Utility', desc: isL1 ? 'Smart contract platform' : isDeFi ? 'Decentralized finance layer' : 'Token utility & governance' },
      { icon: '🌐', title: 'Ecosystem', desc: d.categories?.slice(0, 2).join(', ') || 'Multi-chain ecosystem' },
      { icon: '📊', title: 'Exchanges', desc: d.exchangeListings ? `Listed on ${d.exchangeListings}+ venues` : 'Multi-exchange listing' },
      { icon: '📱', title: 'Community', desc: d.twitter ? 'Active Twitter/X presence' : d.telegram ? 'Active Telegram community' : 'Growing community' },
    ];
  }
}

// Generate competitors
function generateCompetitors(type: string, data: StockData | CryptoData, assetClass: string) {
  if (type === 'stock') {
    const d = data as StockData;
    const ticker = d.ticker;
    const isAI = assetClass.includes('AI') || assetClass.includes('Semiconductor');
    const isSaaS = assetClass.includes('SaaS') || assetClass.includes('Cloud');
    const isFinance = assetClass.includes('Financial');
    void isFinance; // used for future categorization

    if (isAI || assetClass.includes('Semiconductor')) {
      const base = [
        { name: ticker, mcap: fmtLarge(d.marketCap), pe: d.peRatio ? `${d.peRatio.toFixed(0)}x` : 'N/A', note: '◀ This asset', isTarget: true },
        { name: 'AMD', mcap: '~$200B', pe: '~50x', note: 'GPU Competitor', isTarget: false },
        { name: 'INTC', mcap: '~$90B', pe: '~30x', note: 'Legacy Chips', isTarget: false },
        { name: 'AVGO', mcap: '~$800B', pe: '~35x', note: 'Custom AI Silicon', isTarget: false },
        { name: 'QCOM', mcap: '~$160B', pe: '~20x', note: 'Mobile/Edge AI', isTarget: false },
      ];
      return base.filter(b => b.name !== ticker || b.isTarget).slice(0, 5);
    }
    if (isSaaS) {
      return [
        { name: ticker, mcap: fmtLarge(d.marketCap), pe: d.peRatio ? `${d.peRatio.toFixed(0)}x` : 'N/A', note: '◀ This asset', isTarget: true },
        { name: 'MSFT', mcap: '~$3T', pe: '~35x', note: 'Cloud Leader', isTarget: false },
        { name: 'CRM', mcap: '~$280B', pe: '~40x', note: 'CRM/SaaS', isTarget: false },
        { name: 'NOW', mcap: '~$200B', pe: '~60x', note: 'IT SaaS', isTarget: false },
        { name: 'SNOW', mcap: '~$40B', pe: 'N/M', note: 'Data Cloud', isTarget: false },
      ];
    }
    return [
      { name: ticker, mcap: fmtLarge(d.marketCap), pe: d.peRatio ? `${d.peRatio.toFixed(0)}x` : 'N/A', note: '◀ This asset', isTarget: true },
      { name: 'Peer 1', mcap: 'Comparable', pe: 'Market Avg', note: 'Direct Peer', isTarget: false },
      { name: 'Peer 2', mcap: 'Larger', pe: 'Premium', note: 'Market Leader', isTarget: false },
      { name: 'Peer 3', mcap: 'Smaller', pe: 'Discount', note: 'Emerging', isTarget: false },
      { name: 'Index', mcap: 'Benchmark', pe: 'Sector Avg', note: 'ETF Proxy', isTarget: false },
    ];
  } else {
    const d = data as CryptoData;
    const symbol = d.symbol;
    const isL1 = assetClass.includes('Layer 1');
    const isDeFi = assetClass.includes('DeFi');
    const isMeme = assetClass.includes('Meme');

    if (isL1) {
      return [
        { name: symbol, mcap: fmtLarge(d.marketCap), pe: `#${d.marketCapRank || 'N/A'}`, note: '◀ This asset', isTarget: true },
        { name: 'ETH', mcap: '~$400B', pe: '#2', note: 'Smart Contract L1', isTarget: false },
        { name: 'SOL', mcap: '~$80B', pe: '#5', note: 'High-Speed L1', isTarget: false },
        { name: 'BNB', mcap: '~$90B', pe: '#4', note: 'Exchange L1', isTarget: false },
        { name: 'AVAX', mcap: '~$15B', pe: '#~20', note: 'Multi-Chain L1', isTarget: false },
      ];
    }
    if (isDeFi) {
      return [
        { name: symbol, mcap: fmtLarge(d.marketCap), pe: `#${d.marketCapRank || 'N/A'}`, note: '◀ This asset', isTarget: true },
        { name: 'UNI', mcap: '~$5B', pe: '#~25', note: 'DEX Leader', isTarget: false },
        { name: 'AAVE', mcap: '~$3B', pe: '#~30', note: 'Lending Protocol', isTarget: false },
        { name: 'CRV', mcap: '~$0.5B', pe: '#~70', note: 'Stable AMM', isTarget: false },
        { name: 'MKR', mcap: '~$2B', pe: '#~40', note: 'Stablecoin CDP', isTarget: false },
      ];
    }
    if (isMeme) {
      return [
        { name: symbol, mcap: fmtLarge(d.marketCap), pe: `#${d.marketCapRank || 'N/A'}`, note: '◀ This asset', isTarget: true },
        { name: 'DOGE', mcap: '~$30B', pe: '#9', note: 'OG Meme Coin', isTarget: false },
        { name: 'SHIB', mcap: '~$15B', pe: '#~15', note: 'Dog Ecosystem', isTarget: false },
        { name: 'PEPE', mcap: '~$5B', pe: '#~30', note: 'Frog Meme', isTarget: false },
        { name: 'FLOKI', mcap: '~$1B', pe: '#~60', note: 'Utility Meme', isTarget: false },
      ];
    }
    return [
      { name: symbol, mcap: fmtLarge(d.marketCap), pe: `#${d.marketCapRank || 'N/A'}`, note: '◀ This asset', isTarget: true },
      { name: 'BTC', mcap: '~$2T', pe: '#1', note: 'Store of Value', isTarget: false },
      { name: 'ETH', mcap: '~$400B', pe: '#2', note: 'Smart Contracts', isTarget: false },
      { name: 'SOL', mcap: '~$80B', pe: '#5', note: 'High Performance', isTarget: false },
      { name: 'BNB', mcap: '~$90B', pe: '#4', note: 'Exchange Utility', isTarget: false },
    ];
  }
}

// Generate risk cards
function generateRisks(type: string, data: StockData | CryptoData) {
  if (type === 'stock') {
    const d = data as StockData;
    return [
      {
        icon: '📉',
        title: 'Valuation Risk',
        desc: d.peRatio && d.peRatio > 50
          ? `Trading at ${d.peRatio.toFixed(0)}x P/E — any miss could trigger sharp de-rating`
          : 'Premium multiple leaves limited downside buffer vs. peers',
      },
      {
        icon: '🏆',
        title: 'Competition',
        desc: 'Well-capitalized incumbents and VC-backed startups could disrupt market share',
      },
      {
        icon: '🌍',
        title: 'Macro Exposure',
        desc: d.beta && d.beta > 1.5
          ? `Beta of ${d.beta.toFixed(1)}x amplifies losses in risk-off environments`
          : 'Interest rate headwinds and economic slowdown could impact earnings',
      },
      {
        icon: '⚖️',
        title: 'Regulatory',
        desc: 'Antitrust scrutiny, data privacy laws, and export controls pose compliance risk',
      },
      {
        icon: '💸',
        title: 'Execution Risk',
        desc: 'Management must deliver on growth promises; any miss would pressure valuation',
      },
      {
        icon: '🔄',
        title: 'Concentration',
        desc: 'Customer, product, or geographic concentration could amplify downside scenarios',
      },
    ];
  } else {
    const d = data as CryptoData;
    return [
      {
        icon: '⚖️',
        title: 'Regulatory Risk',
        desc: 'SEC, CFTC, or global regulatory action could restrict trading and adoption',
      },
      {
        icon: '🔐',
        title: 'Smart Contract Risk',
        desc: 'Protocol exploits, bridge hacks, or vulnerability disclosures could cause loss of funds',
      },
      {
        icon: '📊',
        title: 'Dilution Risk',
        desc: d.fdv && d.marketCap && d.fdv > d.marketCap * 3
          ? `FDV/MC ratio of ${(d.fdv / d.marketCap).toFixed(1)}x implies heavy future token unlocks`
          : 'Vesting schedules and team unlocks may create sustained selling pressure',
      },
      {
        icon: '🐋',
        title: 'Whale Concentration',
        desc: 'Large holders can significantly impact price; distribution risk remains',
      },
      {
        icon: '🌐',
        title: 'Competition',
        desc: 'Competing protocols with superior tech or better-funded ecosystems could reduce adoption',
      },
      {
        icon: '📉',
        title: 'Market Cycle',
        desc: 'Crypto assets experience 70-90% drawdowns in bear markets; high volatility persists',
      },
    ];
  }
}

// Generate path to value steps
function generatePathToValue(type: string) {
  if (type === 'stock') {
    return [
      { step: '1', title: 'Near-Term', desc: 'Earnings beat & guidance raise rerating', color: '#60a5fa' },
      { step: '2', title: '6 Months', desc: 'New product cycle / customer wins announced', color: '#a855f7' },
      { step: '3', title: '12 Months', desc: 'Revenue growth acceleration validated by results', color: '#4ade80' },
      { step: '4', title: '18 Months', desc: 'Operating leverage drives margin expansion', color: '#facc15' },
      { step: '5', title: '2+ Years', desc: 'Market leadership solidified, multiple expansion', color: '#f97316' },
    ];
  } else {
    return [
      { step: '1', title: 'Near-Term', desc: 'Exchange listings & liquidity deepening', color: '#60a5fa' },
      { step: '2', title: '3 Months', desc: 'Protocol upgrade / mainnet milestone achieved', color: '#a855f7' },
      { step: '3', title: '6 Months', desc: 'DApp ecosystem expansion drives TVL/volume', color: '#4ade80' },
      { step: '4', title: '12 Months', desc: 'Institutional adoption & ETF inclusion catalyst', color: '#facc15' },
      { step: '5', title: 'Long-Term', desc: 'Network effect flywheel drives mass adoption', color: '#f97316' },
    ];
  }
}

export default function InfographicPage2({ type, data, assetClass }: InfographicPage2Props) {
  const isStock = type === 'stock';
  const stockData = isStock ? (data as StockData) : null;
  const cryptoData = !isStock ? (data as CryptoData) : null;

  const ticker = isStock ? stockData!.ticker : cryptoData!.symbol;
  const name = isStock ? stockData!.name : cryptoData!.name;
  const score = calcScore(type, data);
  const scoreBreakdown = generateScoreBreakdown(type, data);
  const features = generateProductFeatures(type, data, assetClass);
  const competitors = generateCompetitors(type, data, assetClass);
  const risks = generateRisks(type, data);
  const pathToValue = generatePathToValue(type);

  // Market opportunity numbers
  const tamEstimate = isStock
    ? stockData?.marketCap
      ? fmtLarge(stockData.marketCap * 5)
      : '$500B+'
    : cryptoData?.marketCap
    ? fmtLarge(cryptoData.marketCap * 10)
    : '$1T+';

  const convictionRating = score >= 8 ? 'HIGH' : score >= 6 ? 'MODERATE' : score >= 4 ? 'LOW' : 'AVOID';
  const convictionColor = score >= 8 ? '#4ade80' : score >= 6 ? '#60a5fa' : score >= 4 ? '#facc15' : '#f87171';

  // Our Take conclusion
  const ourTake = isStock && stockData
    ? `${name} represents a ${convictionRating.toLowerCase()} conviction opportunity in the ${assetClass} space. ${
        score >= 7
          ? `With ${stockData.revenueGrowth ? `${(stockData.revenueGrowth * 100).toFixed(0)}% revenue growth` : 'strong fundamentals'} and ${stockData.grossMargin ? `${(stockData.grossMargin * 100).toFixed(0)}% gross margins` : 'improving margins'}, the company is well-positioned for continued outperformance.`
          : `Investors should monitor key metrics closely before initiating or adding to positions.`
      }`
    : cryptoData
    ? `${name} ($${cryptoData.symbol}) represents a ${convictionRating.toLowerCase()} conviction play in the ${assetClass} category. ${
        score >= 7
          ? `Market cap rank #${cryptoData.marketCapRank || 'N/A'} and ${cryptoData.priceChangePercentage30d ? `${cryptoData.priceChangePercentage30d > 0 ? '+' : ''}${cryptoData.priceChangePercentage30d.toFixed(0)}% 30d momentum` : 'active trading'} suggest growing market interest.`
          : `Risk management is critical given crypto market volatility. Size positions accordingly.`
      }`
    : 'Analysis based on available public data.';

  const idealEntry = isStock && stockData
    ? stockData.fiftyTwoWeekLow && stockData.price
      ? `Around $${(stockData.price * 0.9).toFixed(2)}–$${(stockData.price * 0.95).toFixed(2)} (5–10% pullback from current)`
      : `On pullbacks to key technical support levels; scale in tranches`
    : cryptoData?.currentPrice
    ? `$${(cryptoData.currentPrice * 0.85).toFixed(cryptoData.currentPrice < 1 ? 4 : 2)}–$${(cryptoData.currentPrice * 0.95).toFixed(cryptoData.currentPrice < 1 ? 4 : 2)} range (accumulate on weakness)`
    : 'Scale in on pullbacks; dollar-cost average into position';

  const invalidation = isStock && stockData
    ? `Two consecutive revenue growth misses, or gross margin compression below ${stockData.grossMargin ? `${((stockData.grossMargin - 0.1) * 100).toFixed(0)}%` : '30%'}`
    : cryptoData
    ? `Loss of key protocol metrics, major security exploit, or sustained 60%+ drawdown from entry`
    : 'Break of key support with deteriorating fundamentals';

  return (
    <div
      className="flex flex-col bg-[#080C14] text-slate-100"
      style={{ width: 540, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* HEADER */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background: 'linear-gradient(135deg, #0D1422 0%, #111827 100%)',
          borderBottom: '1px solid #1E2D47',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mb-1">
              STOCKLENS — PAGE 2
            </div>
            <div className="text-base font-black text-slate-100">
              Product, Market & Risk Assessment
            </div>
            <div className="text-sm text-blue-400 font-semibold">{name}</div>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-center"
            style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
          >
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Ticker</div>
            <div className="text-lg font-black text-purple-400">{ticker}</div>
            <div className="text-[9px] text-slate-500">{assetClass}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-4">
        {/* PRODUCT / ECOSYSTEM */}
        <div>
          <div className="section-header">Product & Ecosystem</div>
          <div className="grid grid-cols-3 gap-1.5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="rounded-lg p-2"
                style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
              >
                <div className="text-base mb-1">{feat.icon}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                  {feat.title}
                </div>
                <div className="text-[10px] text-slate-300 leading-tight">{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARKET OPPORTUNITY */}
        <div>
          <div className="section-header">Market Opportunity</div>
          <div
            className="rounded-lg p-3"
            style={{
              background: 'linear-gradient(135deg, #0a1628, #0D1422)',
              border: '1px solid #1E2D47',
            }}
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Est. TAM</div>
                <div className="text-base font-black text-blue-400">{tamEstimate}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                  {isStock ? 'Revenue Growth' : '30d Price Chg'}
                </div>
                <div
                  className={`text-base font-black ${
                    isStock
                      ? stockData?.revenueGrowth && stockData.revenueGrowth > 0
                        ? 'text-green-400'
                        : 'text-slate-400'
                      : cryptoData?.priceChangePercentage30d && cryptoData.priceChangePercentage30d > 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {isStock
                    ? stockData?.revenueGrowth
                      ? `${(stockData.revenueGrowth * 100).toFixed(0)}% YoY`
                      : 'N/A'
                    : fmtPctDirect(cryptoData?.priceChangePercentage30d)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                  {isStock ? 'Market Cap' : 'MC Rank'}
                </div>
                <div className="text-base font-black text-purple-400">
                  {isStock
                    ? fmtLarge(stockData?.marketCap)
                    : `#${cryptoData?.marketCapRank ?? 'N/A'}`}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 leading-relaxed">
              {isStock
                ? `${name} operates in the ${stockData?.sector || 'Technology'} sector, targeting the ${stockData?.industry || 'technology'} market. ${assetClass.includes('AI') ? 'The global AI infrastructure market is expected to grow to $1T+ by 2030, driven by hyperscaler capex and enterprise AI adoption.' : assetClass.includes('SaaS') ? 'Global cloud software spending is projected to exceed $800B by 2028 with 15%+ CAGR.' : 'Industry tailwinds support sustained growth across the medium term.'}`
                : `${name} operates in the ${cryptoData?.categories?.[0] || 'cryptocurrency'} sector. ${assetClass.includes('Layer 1') ? 'The smart contract platform market is competing for developer mindshare and TVL in a winner-take-most dynamic.' : assetClass.includes('DeFi') ? 'DeFi total value locked represents a multi-hundred billion dollar opportunity in decentralized financial services.' : 'The broader digital asset market represents a maturing asset class with growing institutional participation.'}`}
            </div>
          </div>
        </div>

        {/* COMPETITIVE LANDSCAPE */}
        <div>
          <div className="section-header">Competitive Landscape</div>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid #1E2D47' }}
          >
            <div
              className="grid text-[9px] font-bold uppercase tracking-widest text-slate-500 px-3 py-1.5"
              style={{ gridTemplateColumns: '2fr 2fr 1fr 2fr', background: '#0a0f1a' }}
            >
              <span>Name</span>
              <span>Mkt Cap</span>
              <span>P/E or Rank</span>
              <span>Notes</span>
            </div>
            {competitors.map((comp, i) => (
              <div
                key={i}
                className="grid text-[10px] px-3 py-2 items-center"
                style={{
                  gridTemplateColumns: '2fr 2fr 1fr 2fr',
                  background: comp.isTarget ? '#0D2040' : i % 2 === 0 ? '#0D1422' : '#0a0f1a',
                  borderTop: '1px solid #1E2D47',
                }}
              >
                <span
                  className={`font-bold ${comp.isTarget ? 'text-blue-400' : 'text-slate-300'}`}
                >
                  {comp.name}
                </span>
                <span className="text-slate-300">{comp.mcap}</span>
                <span className={`font-semibold ${comp.isTarget ? 'text-purple-400' : 'text-slate-400'}`}>
                  {comp.pe}
                </span>
                <span className={comp.isTarget ? 'text-blue-300 font-semibold' : 'text-slate-500'}>
                  {comp.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KEY RISKS */}
        <div>
          <div className="section-header">Key Risks</div>
          <div className="grid grid-cols-2 gap-1.5">
            {risks.map((risk, i) => (
              <div
                key={i}
                className="rounded-lg p-2.5"
                style={{
                  background: '#0D1422',
                  border: '1px solid #2d1a1a',
                  borderLeft: '3px solid #f87171',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{risk.icon}</span>
                  <span className="text-[10px] font-bold text-red-300">{risk.title}</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">{risk.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* INVESTMENT VIEW SCORE */}
        <div>
          <div className="section-header">Investment View Score</div>
          <div
            className="rounded-lg p-3"
            style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={score} size={100} label="Overall" sublabel="rating" />
                <div
                  className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                  style={{ background: `${convictionColor}20`, color: convictionColor, border: `1px solid ${convictionColor}40` }}
                >
                  {convictionRating} CONVICTION
                </div>
              </div>
              <div className="flex-1">
                {scoreBreakdown.map((item, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-slate-400">{item.category}</span>
                      <span className="text-[9px] font-bold text-slate-300">
                        {item.score}/10 <span className="text-slate-600">({item.weight})</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#1E2D47' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${item.score * 10}%`,
                          background:
                            item.score >= 7
                              ? 'linear-gradient(90deg, #4ade8080, #4ade80)'
                              : item.score >= 5
                              ? 'linear-gradient(90deg, #60a5fa80, #60a5fa)'
                              : 'linear-gradient(90deg, #f8717180, #f87171)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PATH TO VALUE */}
        <div>
          <div className="section-header">Path to Value Creation</div>
          <div className="flex flex-col gap-0">
            {pathToValue.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                    style={{ background: step.color, color: '#080C14' }}
                  >
                    {step.step}
                  </div>
                  {i < pathToValue.length - 1 && (
                    <div className="w-px flex-1 my-0.5" style={{ background: '#1E2D47', minHeight: 16 }} />
                  )}
                </div>
                <div className="pb-3">
                  <span className="text-[10px] font-bold" style={{ color: step.color }}>
                    {step.title}:{' '}
                  </span>
                  <span className="text-[10px] text-slate-300">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OUR TAKE */}
        <div>
          <div className="section-header">Our Take</div>
          <div
            className="rounded-lg p-3"
            style={{
              background: 'linear-gradient(135deg, #0a1628, #0D1422)',
              border: '1px solid #1d4ed8',
            }}
          >
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{ourTake}</p>
            <div className="grid grid-cols-2 gap-2">
              <div
                className="rounded p-2"
                style={{ background: '#0a1a0f', border: '1px solid #166534' }}
              >
                <div className="text-[9px] font-bold text-green-400 uppercase tracking-widest mb-1">
                  ✅ Ideal Entry
                </div>
                <div className="text-[10px] text-slate-300 leading-tight">{idealEntry}</div>
              </div>
              <div
                className="rounded p-2"
                style={{ background: '#1a0a0a', border: '1px solid #991b1b' }}
              >
                <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1">
                  ❌ Invalidation
                </div>
                <div className="text-[10px] text-slate-300 leading-tight">{invalidation}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        className="px-5 py-4 mt-2"
        style={{
          background: 'linear-gradient(135deg, #0D1422 0%, #111827 100%)',
          borderTop: '2px solid #1E2D47',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-black gradient-text">STOCKLENS</div>
          <div className="text-[9px] text-slate-500">Emerging-Tech Investment Intelligence</div>
        </div>
        <div className="text-[9px] text-slate-600 leading-relaxed">
          DISCLAIMER: This two-pager is generated for informational and educational purposes only. It does
          not constitute financial advice, investment recommendations, or an offer to buy or sell any
          security or digital asset. All data sourced from Yahoo Finance and CoinGecko public APIs.
          Stocklens makes no warranty on data accuracy. Always conduct your own due diligence.
          Past performance is not indicative of future results. Invest only what you can afford to lose.
        </div>
      </div>
    </div>
  );
}
