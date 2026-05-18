'use client';

import React, { useEffect, useState, useRef } from 'react';
import InfographicPage1 from '@/components/InfographicPage1';
import InfographicPage2 from '@/components/InfographicPage2';
import { StockData } from '@/lib/stockData';
import { CryptoData } from '@/lib/cryptoData';
import {
  researchByCandidate,
  searchAssetCandidates,
  ResearchResult,
  SearchCandidate,
  SearchMode,
} from '@/lib/research';

const EXAMPLE_TICKERS: Array<{ label: string; desc: string; mode: SearchMode }> = [
  { label: 'NVDA', desc: 'AI Chip Stock', mode: 'stock' },
  { label: 'F', desc: 'Ford Motor Co.', mode: 'stock' },
  { label: 'SOL', desc: 'Layer 1 Crypto', mode: 'crypto' },
  { label: 'BEST', desc: 'Crypto Token', mode: 'crypto' },
];

const OPENAI_KEY_STORAGE = 'stocklens.openaiApiKey';

export default function Home() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('stock');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [candidates, setCandidates] = useState<SearchCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ query: string; mode: SearchMode } | null>(null);
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

  const fetchCandidate = async (candidate: SearchCandidate) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await researchByCandidate(candidate, { openaiApiKey: openaiKey });
      setResult(data);
      setCandidates(null);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string, searchMode: SearchMode) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCandidates(null);
    setLastAttempt({ query: trimmed, mode: searchMode });

    try {
      const matches = await searchAssetCandidates(trimmed, searchMode);
      if (matches.length === 0) {
        throw new Error(
          searchMode === 'stock'
            ? `No stocks found for: ${trimmed}`
            : `No crypto found for: ${trimmed}`,
        );
      }
      if (matches.length === 1) {
        await fetchCandidate(matches[0]);
        return;
      }
      // Multiple matches — let the user disambiguate.
      setCandidates(matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, mode);
  };

  const handleExampleClick = (ex: { label: string; mode: SearchMode }) => {
    setQuery(ex.label);
    setMode(ex.mode);
    handleSearch(ex.label, ex.mode);
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
      <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-10">
        {/* Decorative trading-grid + ticker glow backdrop (no-op for layout) */}
        <div className="hero-backdrop no-print" aria-hidden="true" />

        <div className="hero-content">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3 mb-4">
            {/* Mr.FLENS lens avatar — neon cyan ring around the cover artwork. */}
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden neon-ring"
              style={{ background: '#04070f' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/splash.jpg"
                alt="Mr.FLENS Stock-Lens"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center leading-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300/80">
                Mr.FLENS
              </span>
              <span className="text-3xl sm:text-4xl font-black neon-text tracking-tight mt-1">
                STOCK&nbsp;·&nbsp;LENS
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-100 mb-2 leading-tight">
            Emerging-Tech Investment Two-Pager Generator
          </h1>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Pick a market, then enter a ticker, company name, or Ethereum
            contract address to generate an investor-grade infographic in
            seconds.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-3">
          <div
            className="inline-flex rounded-xl p-1"
            style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
            role="tablist"
            aria-label="Search market"
          >
            {(['stock', 'crypto'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setMode(m);
                    setCandidates(null);
                    setError(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                  style={
                    active
                      ? {
                          background:
                            'linear-gradient(135deg, #22d3ee 0%, #38bdf8 50%, #0ea5e9 100%)',
                          color: '#04070f',
                          boxShadow:
                            '0 0 0 1px rgba(34,211,238,0.55), 0 0 18px rgba(34,211,238,0.45)',
                        }
                      : { color: '#94a3b8' }
                  }
                >
                  {m === 'stock' ? '📈 Stock Market' : '🪙 Crypto'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'stock'
                  ? 'AAPL, Ford, BABA, RIVN, recent IPOs...'
                  : 'BTC, SOL, BEST, 0xba83b5...'
              }
              className="flex-1 px-4 py-3 rounded-xl text-slate-100 text-base outline-none focus:ring-2 focus:ring-cyan-400"
              style={{
                background: '#0D1422',
                border: '1px solid #1E2D47',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, #22d3ee 0%, #38bdf8 50%, #0ea5e9 100%)',
                color: '#04070f',
                boxShadow:
                  '0 0 0 1px rgba(34,211,238,0.55), 0 0 18px rgba(34,211,238,0.45), 0 0 42px rgba(14,165,233,0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search →'
              )}
            </button>
          </div>
        </form>

        {/* Example Tickers */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 uppercase tracking-widest">Try:</span>
          {EXAMPLE_TICKERS.map((ex) => (
            <button
              key={`${ex.mode}:${ex.label}`}
              onClick={() => handleExampleClick(ex)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-cyan-400 disabled:opacity-50"
              style={{ background: '#0D1422', border: '1px solid #1E2D47', color: '#94a3b8' }}
            >
              <span className="text-cyan-300 font-bold">
                {ex.label.length > 12 ? ex.label.slice(0, 8) + '...' : ex.label}
              </span>
              <span className="text-slate-600">{ex.desc}</span>
              <span className="text-[10px] text-slate-700 uppercase">
                {ex.mode === 'stock' ? '· Stock' : '· Crypto'}
              </span>
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
              : '🤖 Optional: add OpenAI key for AI insights (heuristic mode works without it)'}
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
              Optional and stored only in your browser&apos;s localStorage. Without a key, Stock-Lens still works using built-in heuristic insights.
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
            {lastAttempt && (
              <button
                type="button"
                onClick={() => handleSearch(lastAttempt.query, lastAttempt.mode)}
                className="ml-3 px-2 py-1 rounded text-xs font-semibold"
                style={{ background: '#450a0a', border: '1px solid #991b1b', color: '#fecaca' }}
              >
                Retry
              </button>
            )}
            {mode === 'stock' && (
              <p className="mt-2 text-xs text-rose-300/90">
                Stock data can be rate-limited upstream. Retry shortly, or run the local Stock-LENS backend (`npm run stocklens:server`) for a steadier feed.
              </p>
            )}
          </div>
        )}

        {/* Candidate Picker */}
        {candidates && candidates.length > 0 && !loading && (
          <div
            className="max-w-xl mx-auto mt-6 rounded-xl p-4"
            style={{ background: '#0D1422', border: '1px solid #1E2D47' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-300">
                Found <strong className="text-blue-400">{candidates.length}</strong> matches
                for &ldquo;{query}&rdquo;. Choose the exact listing/symbol:
              </p>
              <button
                type="button"
                onClick={() => setCandidates(null)}
                className="text-[11px] text-slate-500 hover:text-slate-300 uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {candidates.map((c) => {
                const key = c.type === 'stock' ? `stock:${c.symbol}` : `crypto:${c.id}`;
                const sub = c.type === 'stock' ? c.quoteType : 'Cryptocurrency';
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => fetchCandidate(c)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-all hover:border-blue-500"
                      style={{ background: '#080C14', border: '1px solid #1E2D47' }}
                    >
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-100 truncate">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-500 flex flex-wrap gap-1">
                          <span>{c.market}</span>
                          <span>·</span>
                          <span>{sub}</span>
                        </span>
                      </span>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-slate-500 uppercase tracking-widest">Ticker</span>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {c.symbol}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto mt-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-400 text-sm">
                {candidates
                  ? 'Fetching market data and generating your two-pager...'
                  : `Searching ${mode === 'stock' ? 'stock markets' : 'crypto'}...`}
              </p>
              <p className="text-slate-600 text-xs">This may take a few seconds</p>
            </div>
          </div>
        )}
        </div>
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
                <span className="neon-text">— Two-Pager</span>
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
        Mr.FLENS Stock-Lens — For educational purposes only. Not financial advice.
      </div>
    </main>
  );
}
