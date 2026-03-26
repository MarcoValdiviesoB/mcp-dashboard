import { cn } from '../../../lib/utils';

interface GaugeData {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  thresholds?: Array<{ value: number; color: string }>;
}

export function GaugeWidget({ data }: { data: GaugeData; config?: any }) {
  const min = data.min ?? 0;
  const max = data.max ?? 100;
  const value = Math.max(min, Math.min(max, data.value));
  const pct = ((value - min) / (max - min)) * 100;

  // Arc geometry
  const cx = 100, cy = 90, r = 70;
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 0.2;
  const totalAngle = startAngle + (2 * Math.PI - startAngle) + endAngle;
  const valueAngle = startAngle + (pct / 100) * totalAngle;

  const arcStart = { x: cx + r * Math.cos(Math.PI + startAngle), y: cy - r * Math.sin(Math.PI + startAngle) };
  const arcEnd = { x: cx + r * Math.cos(Math.PI + endAngle), y: cy - r * Math.sin(Math.PI + endAngle) };
  const needle = { x: cx + (r - 8) * Math.cos(Math.PI + valueAngle), y: cy - (r - 8) * Math.sin(Math.PI + valueAngle) };

  // Color based on thresholds
  let color = '#60a5fa';
  if (data.thresholds) {
    const sorted = [...data.thresholds].sort((a, b) => a.value - b.value);
    for (const t of sorted) {
      if (value >= t.value) color = t.color;
    }
  } else {
    if (pct > 75) color = '#34d399';
    else if (pct > 50) color = '#fbbf24';
    else if (pct > 25) color = '#fb923c';
    else color = '#f87171';
  }

  // Build arc path
  function arc(startA: number, endA: number, radius: number): string {
    const s = { x: cx + radius * Math.cos(Math.PI + startA), y: cy - radius * Math.sin(Math.PI + startA) };
    const e = { x: cx + radius * Math.cos(Math.PI + endA), y: cy - radius * Math.sin(Math.PI + endA) };
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 130" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path d={arc(startAngle, startAngle + totalAngle, r)} fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
        {/* Value arc */}
        {pct > 0 && (
          <path d={arc(startAngle, valueAngle, r)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" opacity="0.8" />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#d4d4d8" />
        {/* Value text */}
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#e4e4e7" fontSize="18" fontFamily="monospace" fontWeight="bold">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
          {data.unit && <tspan fill="#71717a" fontSize="10">{` ${data.unit}`}</tspan>}
        </text>
        {/* Min/Max labels */}
        <text x={arcStart.x - 5} y={arcStart.y + 12} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">{min}</text>
        <text x={arcEnd.x + 5} y={arcEnd.y + 12} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">{max}</text>
      </svg>
      {data.label && <p className="text-[10px] text-zinc-500 data-mono uppercase tracking-wider mt-1">{data.label}</p>}
    </div>
  );
}
