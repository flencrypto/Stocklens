# Stocklens

**Emerging-Tech Investment Two-Pager Generator**

Generate investor-grade, 2-page vertical infographics for any stock ticker, crypto token, or Ethereum contract address — powered by live market data.

## Features

- 🔍 **Auto-detection**: Paste a stock ticker (e.g. `NVDA`), crypto symbol (e.g. `SOL`), token name (e.g. `BEST`), or Ethereum contract address (e.g. `0xba83b5...`) — Stocklens figures out the asset type automatically.
- 📊 **Live data**: Stock fundamentals via Yahoo Finance; crypto data via CoinGecko public API.
- 🤖 **AI-generated insights** (optional): Provide your OpenAI API key to replace the
  built-in heuristic thesis / bull case / bear case / catalysts with model-generated
  analysis grounded in the live asset snapshot.
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

### Stock data reliability (recommended for local testing)

Yahoo Finance browser access can be rate-limited by public CORS relays. For a more
stable stock feed, run the included backend in parallel:

```bash
npm run stocklens:server
```

When running locally, the frontend automatically prefers `http://127.0.0.1:3001/api/yahoo`
for stock lookups and falls back to public relays only if the backend is unavailable.

### Examples

| Input | Type |
|-------|------|
| `NVDA` | AI Infrastructure Stock |
| `SOL` | Layer 1 Crypto |
| `BEST` | Crypto Token |
| `0xba83b5ed3f12Bfa44f066f03eE0433419B74f469` | Ethereum Contract |

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom dark fintech theme
- **Charts**: Pure SVG (no external chart libraries)
- **Stock Data**: `yahoo-finance2`
- **Crypto Data**: CoinGecko public API

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own due diligence before investing.

## AI API keys (OpenAI / xAI)

Stocklens can use an LLM provider to generate the **Investment Thesis**,
**Bull / Bear Case** and **Key Catalysts** sections of the two-pager. When no
key is provided the app falls back to its built-in heuristic generators, so AI
is fully optional.

Recommended (Vercel / server): set one of these env vars so the browser never sees the key:

- OpenAI: `OPENAI_API_KEY` (preferred) or `OPENAI_KEY`
- xAI: `XAI_API_KEY`

The app will call `/api/insights` which reads the env vars server-side.

You can also supply a key at runtime:

1. **At runtime** — click *"Optional: add API key for AI insights"*
   under the search bar and paste your key. It is stored only in your
   browser's `localStorage`. When `/api/insights` is available it will be sent
   to the server route; on static-only deployments it may be sent directly to
   the provider API from the browser.

Defaults: OpenAI uses `gpt-4o-mini`; xAI uses `grok-2-mini` (override by sending
`model` to `/api/insights`).

## Stock-LENS one-page backend (local)

This repo also includes a small Express backend (`server.js`) that uses the
OpenAI Responses API with built-in tools (`web_search` + `image_generation`)
to generate a **one-page Stock-LENS image** and save it locally under
`./outputs`.

1. Install deps

```bash
npm install
```

2. Create `.env` (start from `.env.example`)

```bash
cp .env.example .env
```

3. Create `stocklens-instructions.txt`

Start from `stocklens-instructions.example.txt` and paste your full Mr.FLENS
Stock-LENS GPT instructions.

4. Run the backend

```bash
npm run stocklens:server
```

5. Call it

```js
await fetch('http://localhost:3001/api/stocklens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker: 'PL', horizon: '3–5 years' }),
});
```

### Frontend embed snippet

See `components/StockLensApiEmbed.tsx` for a drop-in client component that
calls the backend and displays the returned text + image.
