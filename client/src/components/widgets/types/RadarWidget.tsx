import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];

interface RadarData {
  axes: Array<{ name: string; max?: number }>;
  series: Array<{ name: string; values: number[]; color?: string }>;
}

export function RadarWidget({ data }: { data: RadarData; config?: any }) {
  if (!data.axes?.length || !data.series?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const chartData = data.axes.map((axis, i) => {
    const point: Record<string, any> = { axis: axis.name };
    for (const s of data.series) {
      point[s.name] = s.values[i] ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData}>
        <PolarGrid stroke="#27272a" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#71717a', fontSize: 10 }} />
        <PolarRadiusAxis tick={{ fill: '#52525b', fontSize: 9 }} stroke="#27272a" />
        <Tooltip contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12 }} />
        {data.series.map((s, i) => (
          <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color || COLORS[i % COLORS.length]} fill={s.color || COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
        ))}
        {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}
