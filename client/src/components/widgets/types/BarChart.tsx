import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#22d3ee'];

interface BarChartData {
  categories: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

export function BarChartWidget({ data, config }: { data: BarChartData; config?: any }) {
  if (!data.categories?.length || !data.series?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const chartData = data.categories.map((cat, i) => {
    const point: Record<string, any> = { category: cat };
    for (const s of data.series) {
      point[s.name] = s.values[i] ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="category" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
        <Tooltip
          contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          labelStyle={{ color: '#52525b' }}
        />
        {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {data.series.map((s, i) => (
          <Bar
            key={s.name}
            dataKey={s.name}
            fill={s.color || COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
