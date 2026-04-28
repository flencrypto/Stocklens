export type AssetType = 'stock' | 'crypto' | 'contract';

const KNOWN_CRYPTO_TICKERS = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'SHIB', 'DOT', 'AVAX',
  'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'FTM', 'NEAR', 'ALGO', 'VET', 'ICP',
  'FIL', 'SAND', 'MANA', 'GALA', 'APE', 'CRO', 'XLM', 'ETC', 'HBAR', 'FLOW',
  'EOS', 'THETA', 'EGLD', 'AXS', 'KSM', 'WAVES', 'HNT', 'ZEC', 'DASH', 'XMR',
  'CHZ', 'ENJ', 'SUSHI', 'CAKE', 'COMP', 'AAVE', 'MKR', 'SNX', 'CRV', 'YFI',
  '1INCH', 'BAL', 'REN', 'BAND', 'OCEAN', 'GRT', 'AR', 'RUNE', 'TRX', 'OP',
  'ARB', 'TON', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'TRUMP', 'VIRTUAL', 'BEST',
  'SUI', 'SEI', 'TIA', 'INJ', 'JUP', 'PYTH', 'W', 'STRK', 'EIGEN', 'PENDLE',
  'FET', 'AGIX', 'RNDR', 'WLD', 'TAO', 'TURBO', 'MEME', 'BRETT', 'MOG',
]);

export function detectAssetType(input: string): AssetType {
  const trimmed = input.trim();

  if (trimmed.startsWith('0x') && trimmed.length === 42) {
    return 'contract';
  }

  const upper = trimmed.toUpperCase();

  if (KNOWN_CRYPTO_TICKERS.has(upper)) {
    return 'crypto';
  }

  // Default unknown tickers to stock so any public equity ticker works out of
  // the box. The research layer transparently falls back to crypto if the
  // stock lookup fails, so crypto-only symbols still resolve correctly.
  return 'stock';
}
