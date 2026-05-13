'use client';

import React, { useMemo, useState } from 'react';

type StockLensResponse = {
  text?: string;
  imageUrl?: string | null;
  responseId?: string;
  error?: string;
  detail?: string;
};

function resolveImageUrl(endpoint: string, imageUrl: string) {
  try {
    const base = new URL(endpoint);
    return new URL(imageUrl, `${base.origin}/`).toString();
  } catch {
    return imageUrl;
  }
}

export default function StockLensApiEmbed({
  endpoint = 'http://localhost:3001/api/stocklens',
}: {
  endpoint?: string;
}) {
  const [ticker, setTicker] = useState('PL');
  const [horizon, setHorizon] = useState('3–5 years');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockLensResponse | null>(null);

  const imageHref = useMemo(() => {
    if (!result?.imageUrl) return null;
    if (!result.imageUrl) return null;
    return resolveImageUrl(endpoint, result.imageUrl);
  }, [endpoint, result?.imageUrl]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body =
        message.trim().length > 0
          ? { message: message.trim() }
          : { ticker: ticker.trim(), horizon: horizon.trim() };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await resp.json()) as StockLensResponse;
      if (!resp.ok) {
        throw new Error(data?.error || `Request failed (${resp.status})`);
      }

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B1220]/70 p-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="mb-3 text-lg font-semibold">Mr.FLENS Stock-LENS (API)</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-white/80">
          Ticker
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
            placeholder="PL"
          />
        </label>

        <label className="grid gap-1 text-sm text-white/80">
          Horizon
          <input
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
            placeholder="3–5 years"
          />
        </label>
      </div>

      <label className="mt-3 grid gap-1 text-sm text-white/80">
        Or custom message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[84px] resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
          placeholder="Create a Stock-LENS one-page infographic for..."
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>

        <div className="text-xs text-white/60">
          Endpoint: <span className="font-mono">{endpoint}</span>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}

      {result && (
        <div className="mt-4 grid gap-3">
          {result.responseId && (
            <div className="text-xs text-white/60">
              responseId: <span className="font-mono">{result.responseId}</span>
            </div>
          )}

          {result.text && (
            <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
              {result.text}
            </pre>
          )}

          {imageHref && (
            <a href={imageHref} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageHref}
                alt="Stock-LENS one-page"
                className="w-full rounded-xl border border-white/10"
              />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

