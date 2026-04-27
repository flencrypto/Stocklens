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

const KNOWN_STOCK_TICKERS = new Set([
  'NVDA', 'AMD', 'INTC', 'TSMC', 'QCOM', 'AVGO', 'AAPL', 'MSFT', 'GOOGL',
  'GOOG', 'META', 'AMZN', 'TSLA', 'NFLX', 'ORCL', 'CRM', 'ADBE', 'NOW',
  'SNOW', 'PLTR', 'PANW', 'CRWD', 'ZS', 'OKTA', 'NET', 'DDOG', 'MDB',
  'COIN', 'HOOD', 'MSTR', 'SMCI', 'ARM', 'ASML', 'AMAT', 'LRCX', 'KLAC',
  'TXN', 'MU', 'MRVL', 'ON', 'STX', 'WDC', 'HPE', 'DELL', 'IBM', 'CSCO',
  'JPM', 'GS', 'MS', 'BAC', 'WFC', 'V', 'MA', 'PYPL', 'SQ', 'ADYEY',
  'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'XLK', 'XLF', 'XLE',
]);

export function detectAssetType(input: string): AssetType {
  const trimmed = input.trim();

  if (trimmed.startsWith('0x') && trimmed.length === 42) {
    return 'contract';
  }

  const upper = trimmed.toUpperCase();

  if (KNOWN_STOCK_TICKERS.has(upper)) {
    return 'stock';
  }

  if (KNOWN_CRYPTO_TICKERS.has(upper)) {
    return 'crypto';
  }

  // Heuristics: if it looks like a crypto pattern
  if (/^[A-Z0-9]{2,10}$/.test(upper) && trimmed.length <= 5) {
    // Short tickers could be either - default to try crypto first for unknown
    return 'crypto';
  }

  return 'stock';
}
