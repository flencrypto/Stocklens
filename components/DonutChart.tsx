'use client';

import React from 'react';

interface Segment {
  label: string;
  value: number;
  color: string;
  amount?: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  title?: string;
}

export default function DonutChart({
  segments,
  size = 160,
  strokeWidth = 28,
  title,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      {title && <div className="text-xs font-bold uppercase tracking-widest text-blue-400">{title}</div>}
      <div className="flex items-center gap-4">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#1E2D47"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => {
            const pct = total > 0 ? seg.value / total : 0;
            const dashArray = pct * circumference;
            const offset = circumference - cumulativeOffset * circumference / total;
            cumulativeOffset += seg.value;

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
          {/* Center text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#e2e8f0"
            fontSize="11"
            fontWeight="bold"
            style={{ transform: `rotate(90deg) translate(0px, -${size}px)` }}
          />
        </svg>
        {/* Legend */}
        <div className="flex flex-col gap-1.5">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="rounded-sm flex-shrink-0"
                style={{ width: 10, height: 10, backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-slate-300 leading-tight">
                <span className="font-semibold" style={{ color: seg.color }}>
                  {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
                </span>{' '}
                {seg.label}
                {seg.amount && (
                  <span className="text-slate-500 ml-1">({seg.amount})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
