# Stocklens

**Emerging-Tech Investment Two-Pager Generator**

Generate investor-grade, 2-page vertical infographics for any stock ticker, crypto token, or Ethereum contract address — powered by live market data.

## Features

- 🔍 **Auto-detection**: Paste a stock ticker (e.g. `NVDA`), crypto symbol (e.g. `SOL`), token name (e.g. `BEST`), or Ethereum contract address (e.g. `0xba83b5...`) — Stocklens figures out the asset type automatically.
- 📊 **Live data**: Stock fundamentals via Yahoo Finance; crypto data via CoinGecko public API.
- 🖼️ **Two-page infographic** in 9:16 format:
  - **Page 1** — Investment Summary: header, big picture, key facts table, tokenomics donut / financial bars, bull/bear thesis, key catalysts.
  - **Page 2** — Product, Market & Risk: product ecosystem tiles, market opportunity, competitive landscape table, risk cards, investment score ring, path-to-value timeline, conclusion with ideal entry & invalidation.
- 🎨 **Premium dark navy theme** with purple/blue accents, glassmorphism panels, SVG charts, and print/export support.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and type any asset into the search bar.

### Examples

| Input | Type |
|-------|------|
| `NVDA` | AI Infrastructure Stock |
| `SOL` | Layer 1 Crypto |
| `BEST` | Crypto Token |
| `0xba83b5ed3f12Bfa44f066f03eE0433419B74f469` | Ethereum Contract |

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom dark fintech theme
- **Charts**: Pure SVG (no external chart libraries)
- **Stock Data**: `yahoo-finance2`
- **Crypto Data**: CoinGecko public API

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own due diligence before investing.
