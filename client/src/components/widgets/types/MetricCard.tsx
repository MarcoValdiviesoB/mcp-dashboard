import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MetricCardData {
  value: number | string;
  label: string;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; percentage: number };
  icon?: string;
  color?: string;
  sparkline?: number[];
}

export function MetricCard({ data }: { data: MetricCardData; config?: any }) {
  const TrendIcon = data.trend?.direction === 'up' ? TrendingUp
    : data.trend?.direction === 'down' ? TrendingDown
    : Minus;

  const trendColor = data.trend?.direction === 'up' ? 'text-emerald-400'
    : data.trend?.direction === 'down' ? 'text-red-400'
    : 'text-zinc-500';

  return (
    <div className="flex flex-col justify-center h-full gap-1">
      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] data-mono">{data.label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-zinc-100 data-mono tracking-tight">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </span>
        {data.unit && <span className="text-sm text-zinc-500 data-mono">{data.unit}</span>}
      </div>
      {data.trend && (
        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{data.trend.percentage}%</span>
        </div>
      )}
      {data.sparkline && data.sparkline.length > 1 && (
        <svg viewBox={`0 0 ${data.sparkline.length - 1} 20`} className="w-full h-6 mt-1" preserveAspectRatio="none">
          <polyline
            points={data.sparkline.map((v, i) => {
              const min = Math.min(...data.sparkline!);
              const max = Math.max(...data.sparkline!);
              const range = max - min || 1;
              const y = 20 - ((v - min) / range) * 18;
              return `${i},${y}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(96 165 250)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}
