import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#22d3ee'];

interface LineChartData {
  series: Array<{ name: string; data: Array<{ timestamp: string; value: number; label?: string }>; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

export function LineChartWidget({ data, config }: { data: LineChartData; config?: any }) {
  if (!data.series?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  // Transform series data into recharts format
  const allTimestamps = new Set<string>();
  for (const s of data.series) {
    for (const p of s.data) allTimestamps.add(p.timestamp);
  }
  const sorted = [...allTimestamps].sort();

  const chartData = sorted.map((ts) => {
    const point: Record<string, any> = { timestamp: ts };
    for (const s of data.series) {
      const match = s.data.find((p) => p.timestamp === ts);
      point[s.name] = match?.value ?? null;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="timestamp"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickFormatter={(v) => {
            try { return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
            catch { return v; }
          }}
          stroke="#27272a"
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
        <Tooltip
          contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          labelStyle={{ color: '#52525b' }}
        />
        {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {data.series.map((s, i) => (
          <Line
            key={s.name}
            type={config?.smooth !== false ? 'monotone' : 'linear'}
            dataKey={s.name}
            stroke={s.color || COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={config?.showDots ?? false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
