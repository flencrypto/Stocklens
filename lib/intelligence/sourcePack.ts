import { CryptoData } from '@/lib/cryptoData';
import { StockData } from '@/lib/stockData';
import { Source } from '@/lib/intelligence/types';

function nowIso() {
  return new Date().toISOString();
}

export function buildDefaultSourcePack(params: {
  type: 'stock' | 'crypto';
  data: StockData | CryptoData;
  exchangeContext?: string;
}): Source[] {
  const retrievedAt = nowIso();

  if (params.type === 'stock') {
    const stock = params.data as StockData;
    return [
      {
        id: 'yahoo_finance',
        kind: 'data_provider',
        title: 'Yahoo Finance (price + issuer snapshot)',
        url: 'https://finance.yahoo.com',
        retrievedAt,
        authorityScore: 0.55,
        notes: stock.ticker ? `Primary market data provider for ${stock.ticker}` : undefined,
      },
      {
        id: 'stocklens_exchange_reference',
        kind: 'internal_reference',
        title: 'Stocklens exchange & venue reference',
        retrievedAt,
        authorityScore: 0.4,
        notes: 'Maps exchange identifiers to market-tier context; not a primary disclosure document.',
      },
      ...(params.exchangeContext
        ? [
            {
              id: 'stocklens_market_structure_context',
              kind: 'computed',
              title: 'Stocklens computed market-structure context (from exchange mapping)',
              retrievedAt,
              authorityScore: 0.35,
              notes: 'Derived context intended for interpretation only; verify with exchange notices/filings for critical decisions.',
            } satisfies Source,
          ]
        : []),
      {
        id: 'stocklens_computed',
        kind: 'computed',
        title: 'Stocklens computed metrics (derived from provider data)',
        retrievedAt,
        authorityScore: 0.35,
      },
    ];
  }

  const crypto = params.data as CryptoData;
  return [
    {
      id: 'coingecko',
      kind: 'data_provider',
      title: 'CoinGecko (market + token snapshot)',
      url: 'https://www.coingecko.com',
      retrievedAt,
      authorityScore: 0.55,
      notes: crypto.id ? `Primary market data provider for ${crypto.id}` : undefined,
    },
    {
      id: 'stocklens_computed',
      kind: 'computed',
      title: 'Stocklens computed metrics (derived from provider data)',
      retrievedAt,
      authorityScore: 0.35,
    },
  ];
}

