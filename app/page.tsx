'use client';

import React, { useEffect, useState, useRef } from 'react';
import InfographicPage1 from '@/components/InfographicPage1';
import InfographicPage2 from '@/components/InfographicPage2';
import { StockData } from '@/lib/stockData';
import { CryptoData } from '@/lib/cryptoData';
import { researchAsset, ResearchResult } from '@/lib/research';

const EXAMPLE_TICKERS = [
  { label: 'NVDA', desc: 'AI Chip Stock' },
  { label: 'SOL', desc: 'Layer 1 Crypto' },
  { label: 'BEST', desc: 'Crypto Token' },
  { label: '0xba83b5ed3f12Bfa44f066f03eE0433419B74f469', desc: 'ETH Contract' },
];

const OPENAI_KEY_STORAGE = 'stocklens.openaiApiKey';

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load any previously saved key on mount. Falls back to a build-time env
  // var so the app can be configured at deploy time too. We prefer
  // `OPENAI_KEY` (the variable name used in the Vercel deployment settings)
  // and fall back to `NEXT_PUBLIC_OPENAI_API_KEY` for backward compatibility.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OPENAI_KEY_STORAGE);
      if (saved) {
        setOpenaiKey(saved);
        return;
      }
    } catch {
      // ignore localStorage errors (e.g. private mode)
    }
    const envKey =
      process.env.OPENAI_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (envKey) setOpenaiKey(envKey);
  }, []);

  const handleKeyChange = (value: string) => {
    setOpenaiKey(value);
    try {
      if (value.trim()) {
        window.localStorage.setItem(OPENAI_KEY_STORAGE, value.trim());
      } else {
        window.localStorage.removeItem(OPENAI_KEY_STORAGE);
      }
    } catch {
      // ignore
    }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await researchAsset(q.trim(), { openaiApiKey: openaiKey });
      setResult(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleExampleClick = (ticker: string) => {
    setQuery(ticker);
    handleSearch(ticker);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #050810 0%, #080C14 100%)' }}
    >
      {/* Hero / Search Section */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}
            >
              SL
            </div>
            <span className="text-2xl font-black gradient-text tracking-tight">Stocklens</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 mb-2 leading-tight">
            Emerging-Tech Investment Two-Pager Generator
          </h1>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Enter any stock ticker, crypto symbol, or Ethereum contract address to generate
            an investor-grade infographic in seconds.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="NVDA, SOL, BEST, 0xba83b5..."
              className="flex-1 px-4 py-3 rounded-xl text-slate-100 text-base outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: '#0D1422',
                border: '1px solid #1E2D47',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl font-bold text-white text-base transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching...
                </span>
              ) : (
                'Analyze →'
              )}
            </button>
          </div>
        </form>

        {/* Example Tickers */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 uppercase tracking-widest">Try:</span>
          {EXAMPLE_TICKERS.map((ex) => (
            <button
              key={ex.label}
              onClick={() => handleExampleClick(ex.label)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-blue-500 disabled:opacity-50"
              style={{ background: '#0D1422', border: '1px solid #1E2D47', color: '#94a3b8' }}
            >
              <span className="text-blue-400 font-bold">{ex.label.length > 12 ? ex.label.slice(0, 8) + '...' : ex.label}</span>
              <span className="text-slate-600">{ex.desc}</span>
            </button>
          ))}
        </div>

        {/* OpenAI API Key */}
        <div className="max-w-xl mx-auto mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowKeyInput((v) => !v)}
            className="text-[11px] text-slate-500 hover:text-slate-300 uppercase tracking-widest"
          >
            {openaiKey
              ? '🤖 OpenAI key set — AI insights enabled (edit)'
              : '🤖 Add OpenAI API key for AI-generated insights'}
          </button>
          {showKeyInput && (
            <div className="mt-2 flex gap-2 items-center">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 px-3 py-2 rounded-lg text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
              />
              {openaiKey && (
                <button
                  type="button"
                  onClick={() => handleKeyChange('')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300"
                  style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {showKeyInput && (
            <p className="text-[10px] text-slate-600 mt-2">
              Stored only in your browser&apos;s localStorage. The key is sent directly to
              api.openai.com from your browser and is never transmitted to our servers.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="max-w-xl mx-auto mt-6 rounded-xl p-4 text-sm"
            style={{ background: '#1a0a0a', border: '1px solid #991b1b', color: '#fca5a5' }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto mt-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-400 text-sm">Fetching market data and generating your two-pager...</p>
              <p className="text-slate-600 text-xs">This may take a few seconds</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div ref={resultsRef} className="pb-16">
          {/* Results Header */}
          <div className="max-w-4xl mx-auto px-4 mb-6 flex items-center justify-between no-print">
            <div>
              <h2 className="text-xl font-black text-slate-100">
                {result.type === 'stock'
                  ? (result.data as StockData).name
                  : (result.data as CryptoData).name}{' '}
                <span className="text-blue-400">— Two-Pager</span>
              </h2>
              <p className="text-xs text-slate-500">
                Generated from live {result.type === 'stock' ? 'Yahoo Finance' : 'CoinGecko'} data ·{' '}
                {result.assetClass}
                {result.insights && (
                  <span className="ml-2 text-purple-400">· 🤖 AI insights via OpenAI</span>
                )}
                {result.insightsError && (
                  <span className="ml-2 text-amber-400" title={result.insightsError}>
                    · AI insights unavailable
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: '#0D1422',
                border: '1px solid #1E2D47',
                color: '#94a3b8',
              }}
            >
              🖨️ Export / Print
            </button>
          </div>

          {/* Infographic Pages */}
          <div className="flex flex-col lg:flex-row justify-center gap-6 px-4 items-start">
            <div className="overflow-auto rounded-xl" style={{ border: '1px solid #1E2D47' }}>
              <InfographicPage1
                type={result.type}
                data={result.data}
                assetClass={result.assetClass}
                insights={result.insights}
              />
            </div>
            <div className="overflow-auto rounded-xl" style={{ border: '1px solid #1E2D47' }}>
              <InfographicPage2
                type={result.type}
                data={result.data}
                assetClass={result.assetClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-[11px] text-slate-700 no-print">
        Stocklens — For educational purposes only. Not financial advice.
      </div>
    </main>
  );
}

