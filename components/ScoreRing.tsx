'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export default function ScoreRing({ score, size = 100, label, sublabel }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(10, score));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = clampedScore / 10;
  const dashArray = pct * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const getColor = (s: number) => {
    if (s >= 7.5) return '#4ade80';
    if (s >= 5.5) return '#60a5fa';
    if (s >= 4) return '#facc15';
    return '#f87171';
  };

  const getRating = (s: number) => {
    if (s >= 8) return 'STRONG BUY';
    if (s >= 6.5) return 'BUY';
    if (s >= 5) return 'HOLD';
    if (s >= 3.5) return 'UNDERWEIGHT';
    return 'AVOID';
  };

  const color = getColor(clampedScore);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1E2D47"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${dashArray} ${circumference - dashArray}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size < 80 ? '16' : '20'}
          fontWeight="bold"
        >
          {clampedScore.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + (size < 80 ? 10 : 14)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize="9"
          fontWeight="500"
        >
          / 10
        </text>
      </svg>
      {label && (
        <div className="text-[11px] font-bold text-slate-200 text-center leading-tight">
          {label}
        </div>
      )}
      {sublabel && (
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded text-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {getRating(clampedScore)}
        </div>
      )}
    </div>
  );
}
