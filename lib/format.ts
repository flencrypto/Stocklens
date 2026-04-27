/** Shared formatting utilities for infographic components */

export function fmtLarge(n: number | null | undefined, prefix = '$'): string {
  if (n === null || n === undefined) return 'N/A';
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

/** Formats a fractional value as a percentage, e.g. 0.123 → "+12.3%" */
export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(1)}%`;
}

/** Formats an already-percentage value, e.g. 12.3 → "+12.3%" */
export function fmtPctDirect(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function pctColor(n: number | null | undefined, invert = false): string {
  if (n === null || n === undefined) return 'text-slate-400';
  const positive = n >= 0;
  if (invert) return positive ? 'text-red-400' : 'text-green-400';
  return positive ? 'text-green-400' : 'text-red-400';
}
