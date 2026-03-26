import { useState } from 'react';
import { cn } from '../../../lib/utils';

interface HeatmapData {
  rows: string[];
  cols: string[];
  values: number[][];
  colorScale?: { min: string; max: string };
}

function interpolateColor(minColor: string, maxColor: string, t: number): string {
  // Simple hex interpolation
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(minColor);
  const [r2, g2, b2] = parse(maxColor);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function HeatmapWidget({ data }: { data: HeatmapData; config?: any }) {
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);

  if (!data.rows?.length || !data.cols?.length || !data.values?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const allValues = data.values.flat();
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const minColor = data.colorScale?.min || '#1e1b4b';
  const maxColor = data.colorScale?.max || '#60a5fa';

  return (
    <div className="h-full overflow-auto">
      <div className="inline-grid gap-px" style={{ gridTemplateColumns: `auto repeat(${data.cols.length}, 1fr)` }}>
        {/* Header row */}
        <div />
        {data.cols.map((col, ci) => (
          <div key={ci} className="px-1 py-0.5 text-[8px] text-zinc-500 data-mono text-center truncate min-w-[28px]">
            {col}
          </div>
        ))}

        {/* Data rows */}
        {data.rows.map((row, ri) => (
          <>
            <div key={`r${ri}`} className="px-1 py-0.5 text-[8px] text-zinc-500 data-mono text-right pr-2 flex items-center justify-end">
              {row}
            </div>
            {data.cols.map((_col, ci) => {
              const val = data.values[ri]?.[ci] ?? 0;
              const t = (val - minVal) / range;
              const isHovered = hover?.row === ri && hover?.col === ci;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={cn('min-w-[28px] h-7 rounded-sm flex items-center justify-center transition-all cursor-default', isHovered && 'ring-1 ring-white/30')}
                  style={{ backgroundColor: interpolateColor(minColor, maxColor, t) }}
                  onMouseEnter={() => setHover({ row: ri, col: ci })}
                  onMouseLeave={() => setHover(null)}
                >
                  {isHovered && (
                    <span className="text-[9px] text-white font-medium data-mono">{val}</span>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
