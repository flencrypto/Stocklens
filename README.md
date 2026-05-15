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

## OpenAI API key (AI insights)

Stocklens can use the OpenAI API to generate the **Investment Thesis**,
**Bull / Bear Case** and **Key Catalysts** sections of the two-pager. When no
key is provided the app falls back to its built-in heuristic generators, so AI
is fully optional.

You can supply a key in two ways:

1. **At runtime** — click *"Add OpenAI API key for AI-generated insights"*
   under the search bar and paste your key. It is stored only in your
   browser's `localStorage` and sent directly from your browser to
   `api.openai.com`.
2. **At build/deploy time** — set the `OPENAI_KEY` env var (this is the
   variable name configured in the Vercel project settings as a Sensitive
   variable for Production and Preview; `NEXT_PUBLIC_OPENAI_API_KEY` is also
   accepted as a fallback) before running `npm run build` / `npm run dev`.
   ⚠️ Because Stocklens is a client-rendered app, any value placed in this
   variable is bundled into the JavaScript shipped to the browser. Only use
   this option for personal deployments where exposing the key is
   acceptable; for shared deployments, prefer the runtime input.

The default model is `gpt-4o-mini`. Insight generation failures are
non-fatal — the UI will surface a small notice and continue to render the
heuristic insights.

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
