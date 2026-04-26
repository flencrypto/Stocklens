'use client';

import React from 'react';
import DonutChart from './DonutChart';
import { StockData } from '@/lib/stockData';
import { CryptoData } from '@/lib/cryptoData';

interface InfographicPage1Props {
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

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(1)}%`;
}

function fmtPctDirect(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function pctColor(n: number | null | undefined, invert = false): string {
  if (n === null || n === undefined) return 'text-slate-400';
  const positive = n >= 0;
  if (invert) return positive ? 'text-red-400' : 'text-green-400';
  return positive ? 'text-green-400' : 'text-red-400';
}

// Generate dynamic analysis text
function generateThesis(type: string, data: StockData | CryptoData, assetClass: string): string {
  if (type === 'stock') {
    const d = data as StockData;
    const growth = d.revenueGrowth ? `${(d.revenueGrowth * 100).toFixed(0)}% revenue growth` : 'strong fundamentals';
    const margin = d.grossMargin ? ` with ${(d.grossMargin * 100).toFixed(0)}% gross margins` : '';
    return `${d.name} is a ${assetClass} demonstrating ${growth}${margin}, positioned at the intersection of secular tech tailwinds.`;
  } else {
    const d = data as CryptoData;
    const cats = d.categories?.slice(0, 2).join(' & ') || assetClass;
    const rank = d.marketCapRank ? ` (Rank #${d.marketCapRank})` : '';
    const chg = d.priceChangePercentage30d
      ? ` with ${d.priceChangePercentage30d > 0 ? '+' : ''}${d.priceChangePercentage30d.toFixed(0)}% 30d momentum`
      : '';
    return `${d.name}${rank} is a ${cats} asset${chg}, targeting ${d.categories?.[0] || 'emerging market'} adoption.`;
  }
}

function generateBullCase(type: string, data: StockData | CryptoData): string[] {
  if (type === 'stock') {
    const d = data as StockData;
    const points: string[] = [];
    if (d.revenueGrowth && d.revenueGrowth > 0.1)
      points.push(`Strong revenue growth of ${(d.revenueGrowth * 100).toFixed(0)}% YoY signals robust demand`);
    else points.push('Consistent revenue generation with expanding addressable market');
    if (d.grossMargin && d.grossMargin > 0.4)
      points.push(`High gross margins (${(d.grossMargin * 100).toFixed(0)}%) indicate pricing power and competitive moat`);
    else points.push('Improving margin profile as operating leverage kicks in');
    if (d.cash && d.totalDebt && d.cash > d.totalDebt)
      points.push('Net cash position provides financial resilience and M&A optionality');
    else points.push('Management focused on capital efficiency and shareholder returns');
    if (d.forwardPE && d.peRatio && d.forwardPE < d.peRatio)
      points.push('Forward earnings growth expected to compress valuation multiples');
    else points.push('Structural tailwinds in sector driving multiple expansion potential');
    points.push('Institutional adoption accelerating with expanding analyst coverage');
    return points.slice(0, 5);
  } else {
    const d = data as CryptoData;
    const points: string[] = [];
    if (d.priceChangePercentage30d && d.priceChangePercentage30d > 0)
      points.push(`Strong 30-day momentum (+${d.priceChangePercentage30d.toFixed(0)}%) indicates growing market interest`);
    else points.push('Accumulation phase presenting favorable risk/reward entry point');
    if (d.marketCapRank && d.marketCapRank <= 20)
      points.push(`Top-${d.marketCapRank} market cap ranking reflects established ecosystem and liquidity`);
    else points.push('Emerging protocol with significant room for market cap expansion');
    if (d.fdv && d.marketCap && d.fdv < d.marketCap * 3)
      points.push('Low FDV/MC ratio suggests limited supply-side selling pressure');
    else points.push('Token utility expansion driving sustainable demand mechanics');
    points.push('Growing developer activity and ecosystem partnerships accelerating adoption');
    points.push('Macro crypto bull cycle providing sector-wide liquidity tailwinds');
    return points.slice(0, 5);
  }
}

function generateBearCase(type: string, data: StockData | CryptoData): string[] {
  if (type === 'stock') {
    const d = data as StockData;
    const points: string[] = [];
    if (d.peRatio && d.peRatio > 40)
      points.push(`Premium valuation (${d.peRatio.toFixed(0)}x P/E) leaves limited margin of safety`);
    else points.push('Valuation re-rating risk if growth decelerates from current trajectory');
    if (d.totalDebt && d.cash && d.totalDebt > d.cash)
      points.push('Net debt position could constrain strategic flexibility in downturn');
    else points.push('Capital allocation efficiency and ROI on investments remain to be proven');
    points.push('Intensifying competitive landscape could erode market share over time');
    if (d.beta && d.beta > 1.5)
      points.push(`High beta (${d.beta.toFixed(1)}x) amplifies drawdowns in risk-off macro environments`);
    else points.push('Macro headwinds (rates, inflation) may compress sector multiples');
    points.push('Customer concentration or single-product risk could limit diversification');
    return points.slice(0, 5);
  } else {
    const d = data as CryptoData;
    const points: string[] = [];
    if (d.fdv && d.marketCap && d.fdv > d.marketCap * 5)
      points.push(`High FDV/MC ratio (${(d.fdv / (d.marketCap || 1)).toFixed(1)}x) implies significant future dilution risk`);
    else points.push('Unlock schedule and vesting cliffs may create selling pressure');
    points.push('Regulatory uncertainty remains a systemic risk across all crypto assets');
    if (d.priceChangePercentage30d && d.priceChangePercentage30d < -20)
      points.push('Recent price weakness may signal fading momentum or distribution');
    else points.push('Highly volatile asset class with potential for 50-80% drawdowns');
    points.push('Competition from better-funded or more technically advanced protocols');
    points.push('Smart contract exploits and security vulnerabilities remain ongoing risks');
    return points.slice(0, 5);
  }
}

function generateCatalysts(type: string, data: StockData | CryptoData, assetClass: string): string[] {
  if (type === 'stock') {
    const d = data as StockData;
    const cats: string[] = [];
    cats.push(d.lastEarningsDate ? `Upcoming earnings report (last: ${d.lastEarningsDate}) with potential beat & raise` : 'Next earnings report with potential beat & raise scenario');
    if (assetClass.includes('AI') || assetClass.includes('Semiconductor'))
      cats.push('AI infrastructure spending cycle acceleration by hyperscalers (MSFT, GOOGL, AMZN)');
    else if (assetClass.includes('SaaS'))
      cats.push('AI-driven product expansion expanding TAM and average contract value');
    else cats.push('Product cycle upgrade driving volume and ASP improvement');
    cats.push('Potential new customer wins or partnership announcements expanding revenue base');
    cats.push('Share buyback program or dividend initiation signaling management confidence');
    cats.push('Sector re-rating as interest rate environment becomes more favorable');
    return cats.slice(0, 5);
  } else {
    const d = data as CryptoData;
    const cats: string[] = [];
    cats.push('Major protocol upgrade or mainnet launch improving scalability/utility');
    if (d.categories?.some((c) => c.toLowerCase().includes('layer 1')))
      cats.push('DApp ecosystem expansion driving transaction volume and fee revenue');
    else cats.push('New exchange listings improving liquidity and price discovery');
    cats.push('Institutional adoption via ETF, custody, or Treasury allocation');
    cats.push('Strategic ecosystem partnerships or developer grants accelerating growth');
    cats.push('Favorable regulatory clarity unlocking institutional participation');
    return cats.slice(0, 5);
  }
}

export default function InfographicPage1({ type, data, assetClass }: InfographicPage1Props) {
  const isStock = type === 'stock';
  const stockData = isStock ? (data as StockData) : null;
  const cryptoData = !isStock ? (data as CryptoData) : null;

  const ticker = isStock ? stockData!.ticker : cryptoData!.symbol;
  const name = isStock ? stockData!.name : cryptoData!.name;

  const thesis = generateThesis(type, data, assetClass);
  const bullCase = generateBullCase(type, data);
  const bearCase = generateBearCase(type, data);
  const catalysts = generateCatalysts(type, data, assetClass);

  // Stock financial bar data
  const financialBars = isStock && stockData
    ? [
        { label: 'Gross Margin', value: stockData.grossMargin, color: '#60a5fa' },
        { label: 'Operating Margin', value: stockData.operatingMargin, color: '#a855f7' },
        { label: 'Profit Margin', value: stockData.profitMargin, color: '#4ade80' },
      ]
    : [];

  // Crypto tokenomics donut
  const tokenomicsSegments = cryptoData
    ? (() => {
        const circ = cryptoData.circulatingSupply || 0;
        const total = cryptoData.totalSupply || circ;
        const max = cryptoData.maxSupply || total;
        const locked = Math.max(0, total - circ);
        const burned = Math.max(0, max - total);
        const segs = [
          { label: 'Circulating', value: circ, color: '#60a5fa' },
          locked > 0 ? { label: 'Locked/Vesting', value: locked, color: '#a855f7' } : null,
          burned > 0 ? { label: 'Burned/Reserved', value: burned, color: '#1E2D47' } : null,
        ].filter(Boolean) as Array<{ label: string; value: number; color: string }>;
        if (segs.length === 0) {
          return [
            { label: 'Community', value: 40, color: '#60a5fa' },
            { label: 'Ecosystem', value: 25, color: '#a855f7' },
            { label: 'Team & Advisors', value: 15, color: '#f59e0b' },
            { label: 'Treasury', value: 12, color: '#4ade80' },
            { label: 'Investors', value: 8, color: '#f87171' },
          ];
        }
        return segs;
      })()
    : [];

  // Big picture cards
  const bigPictureCards = isStock && stockData
    ? [
        {
          icon: '🏭',
          title: 'Product',
          value: stockData.industry || stockData.sector || 'Technology Products & Services',
        },
        {
          icon: '🌐',
          title: 'Market',
          value: `${stockData.sector || 'Technology'} • ${stockData.exchange || 'NASDAQ'}`,
        },
        {
          icon: '💰',
          title: 'Revenue',
          value: fmtLarge(stockData.revenue) + (stockData.revenueGrowth ? ` (${fmtPct(stockData.revenueGrowth)} YoY)` : ''),
        },
        {
          icon: '📈',
          title: 'Growth Driver',
          value: assetClass.includes('AI') ? 'AI Compute Demand' : assetClass.includes('SaaS') ? 'Cloud Expansion' : 'Market Share Gains',
        },
      ]
    : cryptoData
    ? [
        {
          icon: '🔗',
          title: 'Protocol',
          value: cryptoData.categories?.[0] || 'Blockchain Protocol',
        },
        {
          icon: '🌐',
          title: 'Chain',
          value: cryptoData.chain || 'Native Blockchain',
        },
        {
          icon: '💎',
          title: 'Market Cap',
          value: fmtLarge(cryptoData.marketCap) + ` (Rank #${cryptoData.marketCapRank || 'N/A'})`,
        },
        {
          icon: '🚀',
          title: 'Utility',
          value: cryptoData.categories?.slice(1, 2)[0] || 'Transaction & Governance',
        },
      ]
    : [];

  // Flags
  const flags: Array<{ icon: string; label: string; color: string }> = [];
  if (isStock && stockData) {
    if (stockData.grossMargin && stockData.grossMargin > 0.6)
      flags.push({ icon: '✅', label: 'High-Margin Business', color: 'text-green-400' });
    if (stockData.revenueGrowth && stockData.revenueGrowth > 0.2)
      flags.push({ icon: '📈', label: 'Hypergrowth Revenue', color: 'text-green-400' });
    if (stockData.peRatio && stockData.peRatio > 60)
      flags.push({ icon: '⚠️', label: 'Premium Valuation Risk', color: 'text-yellow-400' });
    if (stockData.totalDebt && stockData.cash && stockData.totalDebt > stockData.cash * 2)
      flags.push({ icon: '🔴', label: 'Elevated Debt Load', color: 'text-red-400' });
    if (stockData.beta && stockData.beta > 1.5)
      flags.push({ icon: '⚡', label: 'High Volatility (Beta)', color: 'text-yellow-400' });
    if (stockData.shortRatio && stockData.shortRatio > 5)
      flags.push({ icon: '🐻', label: 'Elevated Short Interest', color: 'text-red-400' });
  } else if (cryptoData) {
    if (cryptoData.fdv && cryptoData.marketCap && cryptoData.fdv > cryptoData.marketCap * 5)
      flags.push({ icon: '⚠️', label: 'High Dilution Risk (FDV)', color: 'text-yellow-400' });
    if (cryptoData.priceChangePercentage30d && cryptoData.priceChangePercentage30d > 50)
      flags.push({ icon: '🚀', label: 'Strong 30d Momentum', color: 'text-green-400' });
    if (cryptoData.priceChangePercentage30d && cryptoData.priceChangePercentage30d < -30)
      flags.push({ icon: '🔴', label: 'Bearish 30d Trend', color: 'text-red-400' });
    if (cryptoData.marketCapRank && cryptoData.marketCapRank <= 10)
      flags.push({ icon: '👑', label: 'Top 10 by Market Cap', color: 'text-green-400' });
    if (cryptoData.athChangePercentage && cryptoData.athChangePercentage < -70)
      flags.push({ icon: '📉', label: 'Deep ATH Drawdown', color: 'text-red-400' });
  }
  if (flags.length === 0)
    flags.push({ icon: '📊', label: 'Monitor for Entry Signals', color: 'text-blue-400' });

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
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-lg font-black tracking-widest px-2 py-0.5 rounded"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  color: '#fff',
                }}
              >
                {ticker}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: '#1E2D47', color: '#60a5fa' }}
              >
                {assetClass}
              </span>
            </div>
            <div className="text-base font-bold text-slate-100">{name}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-slate-100">
              {isStock
                ? `$${stockData!.price?.toFixed(2) ?? 'N/A'}`
                : cryptoData!.currentPrice
                ? cryptoData!.currentPrice < 0.01
                  ? `$${cryptoData!.currentPrice.toFixed(6)}`
                  : cryptoData!.currentPrice < 1
                  ? `$${cryptoData!.currentPrice.toFixed(4)}`
                  : `$${cryptoData!.currentPrice.toFixed(2)}`
                : 'N/A'}
            </div>
            <div
              className={`text-xs font-bold ${
                isStock
                  ? pctColor(stockData?.priceChangePercent)
                  : pctColor(cryptoData?.priceChangePercentage24h)
              }`}
            >
              {isStock
                ? fmtPctDirect(stockData?.priceChangePercent) + ' today'
                : fmtPctDirect(cryptoData?.priceChangePercentage24h) + ' 24h'}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed italic">{thesis}</div>
      </div>

      {/* PAGE 1 LABEL */}
      <div className="flex items-center gap-2 px-5 py-2" style={{ borderBottom: '1px solid #1E2D47' }}>
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400">
          STOCKLENS
        </div>
        <div className="flex-1 h-px bg-[#1E2D47]" />
        <div className="text-[9px] text-slate-500 uppercase tracking-widest">PAGE 1 / 2</div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-4">
        {/* BIG PICTURE */}
        <div>
          <div className="section-header">The Big Picture</div>
          <div className="grid grid-cols-2 gap-2">
            {bigPictureCards.map((card, i) => (
              <div
                key={i}
                className="infographic-card flex items-start gap-2"
                style={{ padding: '8px 10px' }}
              >
                <span className="text-lg leading-tight">{card.icon}</span>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {card.title}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200 leading-tight">
                    {card.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KEY FACTS */}
        <div>
          <div className="section-header">Key Facts</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="infographic-card">
              {isStock && stockData ? (
                <>
                  <div className="metric-row">
                    <span className="metric-label">Market Cap</span>
                    <span className="metric-value">{fmtLarge(stockData.marketCap)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Enterprise Value</span>
                    <span className="metric-value">{fmtLarge(stockData.enterpriseValue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Revenue (TTM)</span>
                    <span className="metric-value">{fmtLarge(stockData.revenue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Net Income</span>
                    <span className="metric-value">{fmtLarge(stockData.netIncome)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Total Cash</span>
                    <span className="metric-value">{fmtLarge(stockData.cash)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Total Debt</span>
                    <span className="metric-value">{fmtLarge(stockData.totalDebt)}</span>
                  </div>
                </>
              ) : cryptoData ? (
                <>
                  <div className="metric-row">
                    <span className="metric-label">Market Cap</span>
                    <span className="metric-value">{fmtLarge(cryptoData.marketCap)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">FDV</span>
                    <span className="metric-value">{fmtLarge(cryptoData.fdv)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Volume 24h</span>
                    <span className="metric-value">{fmtLarge(cryptoData.volume24h)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Circulating Supply</span>
                    <span className="metric-value">
                      {cryptoData.circulatingSupply
                        ? fmtLarge(cryptoData.circulatingSupply, '')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Max Supply</span>
                    <span className="metric-value">
                      {cryptoData.maxSupply ? fmtLarge(cryptoData.maxSupply, '') : '∞'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Exchanges Listed</span>
                    <span className="metric-value">{cryptoData.exchangeListings ?? 'N/A'}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="infographic-card">
              {isStock && stockData ? (
                <>
                  <div className="metric-row">
                    <span className="metric-label">P/E (TTM)</span>
                    <span className="metric-value">
                      {stockData.peRatio ? `${stockData.peRatio.toFixed(1)}x` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Forward P/E</span>
                    <span className="metric-value">
                      {stockData.forwardPE ? `${stockData.forwardPE.toFixed(1)}x` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">P/S Ratio</span>
                    <span className="metric-value">
                      {stockData.psRatio ? `${stockData.psRatio.toFixed(1)}x` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">EPS (TTM)</span>
                    <span className="metric-value">
                      {stockData.eps ? `$${stockData.eps.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">52W High</span>
                    <span className="metric-value">
                      {stockData.fiftyTwoWeekHigh
                        ? `$${stockData.fiftyTwoWeekHigh.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">52W Low</span>
                    <span className="metric-value">
                      {stockData.fiftyTwoWeekLow
                        ? `$${stockData.fiftyTwoWeekLow.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                </>
              ) : cryptoData ? (
                <>
                  <div className="metric-row">
                    <span className="metric-label">ATH Price</span>
                    <span className="metric-value">
                      {cryptoData.athPrice
                        ? cryptoData.athPrice < 1
                          ? `$${cryptoData.athPrice.toFixed(4)}`
                          : `$${cryptoData.athPrice.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">ATH Change</span>
                    <span className={`metric-value ${pctColor(cryptoData.athChangePercentage)}`}>
                      {fmtPctDirect(cryptoData.athChangePercentage)}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">7d Change</span>
                    <span className={`metric-value ${pctColor(cryptoData.priceChangePercentage7d)}`}>
                      {fmtPctDirect(cryptoData.priceChangePercentage7d)}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">30d Change</span>
                    <span className={`metric-value ${pctColor(cryptoData.priceChangePercentage30d)}`}>
                      {fmtPctDirect(cryptoData.priceChangePercentage30d)}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">MC Rank</span>
                    <span className="metric-value">#{cryptoData.marketCapRank ?? 'N/A'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">ATH Date</span>
                    <span className="metric-value">{cryptoData.athDate ?? 'N/A'}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Market Reality card */}
          <div
            className="mt-2 rounded-lg p-3"
            style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Market Reality
            </div>
            <div className="flex gap-3">
              {isStock && stockData ? (
                <>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Beta</div>
                    <div
                      className={`text-sm font-bold ${stockData.beta && stockData.beta > 1.5 ? 'text-yellow-400' : 'text-slate-200'}`}
                    >
                      {stockData.beta?.toFixed(2) ?? 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Debt/Equity</div>
                    <div className="text-sm font-bold text-slate-200">
                      {stockData.debtToEquity?.toFixed(1) ?? 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Short Ratio</div>
                    <div
                      className={`text-sm font-bold ${stockData.shortRatio && stockData.shortRatio > 5 ? 'text-red-400' : 'text-slate-200'}`}
                    >
                      {stockData.shortRatio?.toFixed(1) ?? 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Employees</div>
                    <div className="text-sm font-bold text-slate-200">
                      {stockData.employees
                        ? stockData.employees >= 1000
                          ? `${(stockData.employees / 1000).toFixed(0)}K`
                          : stockData.employees.toString()
                        : 'N/A'}
                    </div>
                  </div>
                </>
              ) : cryptoData ? (
                <>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Vol/MCap</div>
                    <div className="text-sm font-bold text-slate-200">
                      {cryptoData.volume24h && cryptoData.marketCap
                        ? `${((cryptoData.volume24h / cryptoData.marketCap) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Circ/Max</div>
                    <div className="text-sm font-bold text-slate-200">
                      {cryptoData.circulatingSupply && cryptoData.maxSupply
                        ? `${((cryptoData.circulatingSupply / cryptoData.maxSupply) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">FDV/MCap</div>
                    <div
                      className={`text-sm font-bold ${cryptoData.fdv && cryptoData.marketCap && cryptoData.fdv > cryptoData.marketCap * 5 ? 'text-yellow-400' : 'text-slate-200'}`}
                    >
                      {cryptoData.fdv && cryptoData.marketCap
                        ? `${(cryptoData.fdv / cryptoData.marketCap).toFixed(1)}x`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="w-px bg-[#1E2D47]" />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">Liquidity</div>
                    <div className="text-sm font-bold text-slate-200">
                      {cryptoData.liquidityScore?.toFixed(0) ?? 'N/A'}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* FINANCIALS / TOKENOMICS */}
        <div>
          <div className="section-header">
            {isStock ? 'Financial Profile' : 'Token Economics'}
          </div>
          <div className="infographic-card">
            {isStock && stockData ? (
              <div className="flex flex-col gap-2">
                {financialBars.map((bar, i) => {
                  const val = bar.value ? bar.value * 100 : null;
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-slate-400">{bar.label}</span>
                        <span className="text-[10px] font-semibold" style={{ color: bar.color }}>
                          {val !== null ? `${val.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full"
                        style={{ background: '#1E2D47' }}
                      >
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, val ?? 0))}%`,
                            background: `linear-gradient(90deg, ${bar.color}80, ${bar.color})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500">EBITDA</div>
                    <div className="text-[11px] font-bold text-slate-200">
                      {fmtLarge(stockData.ebitda)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500">PEG Ratio</div>
                    <div className="text-[11px] font-bold text-slate-200">
                      {stockData.pegRatio?.toFixed(2) ?? 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500">P/Book</div>
                    <div className="text-[11px] font-bold text-slate-200">
                      {stockData.pbRatio?.toFixed(2) ?? 'N/A'}x
                    </div>
                  </div>
                </div>
              </div>
            ) : cryptoData ? (
              <div>
                <DonutChart
                  segments={tokenomicsSegments}
                  size={150}
                  strokeWidth={26}
                />
                <p className="text-[9px] text-slate-500 mt-2 text-center">
                  * Supply allocation estimates. Verify via project docs.
                </p>
              </div>
            ) : null}
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {flags.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
                >
                  <span>{f.icon}</span>
                  <span className={f.color}>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INVESTMENT THESIS */}
        <div>
          <div className="section-header">Investment Thesis</div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg p-3"
              style={{ background: '#0a1a0f', border: '1px solid #166534' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                  Bull Case
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {bullCase.map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-green-400 text-[9px] mt-0.5 flex-shrink-0">▲</span>
                    <span className="text-[10px] text-slate-300 leading-tight">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ background: '#1a0a0a', border: '1px solid #991b1b' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                  Bear Case
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {bearCase.map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-red-400 text-[9px] mt-0.5 flex-shrink-0">▼</span>
                    <span className="text-[10px] text-slate-300 leading-tight">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CATALYSTS */}
        <div>
          <div className="section-header">Key Catalysts</div>
          <div className="flex flex-col gap-1.5">
            {catalysts.map((cat, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg px-3 py-2"
                style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
              >
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                    color: '#fff',
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-[11px] text-slate-300 leading-tight">{cat}</span>
              </div>
            ))}
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
        <div className="text-sm font-black text-slate-100 mb-2 leading-tight">
          {isStock
            ? `${name}: A ${assetClass} at the intersection of structural growth and market opportunity.`
            : `${name}: Positioned in the ${cryptoData?.categories?.[0] || assetClass} sector with asymmetric upside potential.`}
        </div>
        <div className="text-[9px] text-slate-600 leading-relaxed">
          DISCLAIMER: This report is for informational purposes only and does not constitute financial advice.
          All data sourced from public APIs. Past performance is not indicative of future results.
          Stocklens © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
