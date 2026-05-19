const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const OpenAI = require("openai").default;

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "250mb" }));

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || "127.0.0.1";
const OUTPUT_DIR = path.join(process.cwd(), "outputs");
const RATE_LIMIT_WINDOW_MS = Number(process.env.STOCKLENS_RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.STOCKLENS_RATE_LIMIT_MAX_REQUESTS || 10);
const stockLensLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait and try again." },
});
const yahooProxyLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS * 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many market-data requests. Please retry shortly." },
});
const ALLOWED_YAHOO_HOSTS = new Set(["query1.finance.yahoo.com"]);
const ALLOWED_YAHOO_PATH_PREFIXES = ["/v1/finance/search", "/v8/finance/chart"];

app.use("/outputs", express.static(OUTPUT_DIR));

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadStockLensInstructions() {
  const instructionsPath = path.join(process.cwd(), "stocklens-instructions.txt");
  return fs.readFileSync(instructionsPath, "utf8");
}

function safeFileSlug(input) {
  return String(input || "STOCKLENS")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function getBase64ImageFromResponse(response) {
  const output = Array.isArray(response?.output) ? response.output : [];

  for (const item of output) {
    if (item?.type !== "image_generation_call") continue;
    const result = item?.result;
    if (!result) continue;
    if (typeof result === "string") return result;
    if (typeof result?.b64_json === "string") return result.b64_json;
    if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  }

  return null;
}

app.get("/api/stocklens/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/yahoo", yahooProxyLimiter, async (req, res) => {
  try {
    const endpoint = typeof req.query.endpoint === "string" ? req.query.endpoint : "";
    let upstreamUrl = "";

    if (endpoint === "search") {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const quotesCount = Number(req.query.quotesCount || 10);
      if (!q) {
        return res.status(400).json({ error: "Missing query param: q" });
      }
      const safeLimit = Number.isFinite(quotesCount)
        ? Math.max(1, Math.min(50, Math.trunc(quotesCount)))
        : 10;
      upstreamUrl =
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}` +
        `&quotesCount=${safeLimit}&newsCount=0&listsCount=0`;
    } else if (endpoint === "chart") {
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol.trim() : "";
      if (!symbol) {
        return res.status(400).json({ error: "Missing query param: symbol" });
      }
      const safeSymbol = symbol.toUpperCase();
      const allowedSymbolPatterns = [
        /^[A-Z0-9.-]{1,15}$/,
        /^\^[A-Z0-9.-]{1,15}$/,
        /^[A-Z]{3,10}=X$/,
      ];
      if (!allowedSymbolPatterns.some((pattern) => pattern.test(safeSymbol))) {
        return res.status(400).json({ error: "Invalid symbol." });
      }
      upstreamUrl =
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(safeSymbol)}` +
        "?interval=1d&range=1d";
    } else {
      return res.status(400).json({ error: "Unsupported endpoint." });
    }

    const parsed = new URL(upstreamUrl);
    if (
      parsed.protocol !== "https:" ||
      !ALLOWED_YAHOO_HOSTS.has(parsed.hostname) ||
      !ALLOWED_YAHOO_PATH_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))
    ) {
      return res.status(500).json({ error: "Server misconfiguration for Yahoo route allowlist." });
    }

    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "StocklensYahooProxy/1.0",
      },
      signal: AbortSignal.timeout(6_000),
    });

    const bodyText = await upstream.text();
    return res
      .status(upstream.status)
      .set("Content-Type", "application/json; charset=utf-8")
      .send(bodyText);
  } catch (error) {
    return res.status(502).json({
      error: "Yahoo upstream request failed.",
      detail: error?.message || String(error),
    });
  }
});

app.post("/api/stocklens", stockLensLimiter, async (req, res) => {
  try {
    const { message, ticker, horizon } = req.body || {};

    if (!message && !ticker) {
      return res.status(400).json({
        error: "Send either { message } or { ticker, horizon }.",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY.",
      });
    }

    let stockLensInstructions;
    try {
      stockLensInstructions = loadStockLensInstructions();
    } catch (readError) {
      return res.status(500).json({
        error: "Missing stocklens-instructions.txt.",
        detail:
          "Create stocklens-instructions.txt in the repo root and paste your full Mr.FLENS Stock-LENS GPT instructions into it.",
      });
    }

    const userPrompt =
      message ||
      `Create a Mr.FLENS Stock-LENS one-page infographic for ${ticker} with a ${
        horizon || "3–5 year"
      } view.`;

    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
You are the API version of Mr.FLENS Stock-LENS 1pager.

Follow the operating instructions below exactly.

Important API deployment rules:
- Use current, verifiable data.
- Use web search where current stock, market, filing, consensus, or catalyst data is needed.
- Do not fabricate market data.
- Produce a distinct Stock-LENS one-page image when the user requests or implies a ticker/horizon one-pager.
- Keep the final answer educational and informational only, not investment advice.

OPERATING INSTRUCTIONS:
${stockLensInstructions}
          `.trim(),
        },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "web_search" }, { type: "image_generation" }],
    });

    const text = response.output_text || "";
    const b64 = getBase64ImageFromResponse(response);

    let imageUrl = null;
    if (b64) {
      const slug = safeFileSlug(ticker || userPrompt);
      const today = new Date().toISOString().slice(0, 10);
      const uniqueSuffix = safeFileSlug(response.id || String(Date.now()));
      const filename = `${slug}_MrFLENS_StockLENS_One_Page_DeepDive_${today}_${uniqueSuffix}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      await fsp.writeFile(filepath, Buffer.from(b64, "base64"));
      imageUrl = `/outputs/${filename}`;
    }

    return res.json({
      text,
      imageUrl,
      responseId: response.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Stock-LENS generation failed.",
      detail: error?.message || String(error),
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Stock-LENS API running on http://${HOST}:${PORT}`);
});
