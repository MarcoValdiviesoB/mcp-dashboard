import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];

interface ScatterData {
  series: Array<{ name: string; data: Array<{ x: number; y: number; z?: number; label?: string }>; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

export function ScatterWidget({ data }: { data: ScatterData; config?: any }) {
  if (!data.series?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const hasZ = data.series.some(s => s.data.some(d => d.z !== undefined));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" name={data.xLabel || 'X'} />
        <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" name={data.yLabel || 'Y'} />
        {hasZ && <ZAxis dataKey="z" range={[30, 300]} />}
        <Tooltip contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12 }} />
        {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {data.series.map((s, i) => (
          <Scatter key={s.name} name={s.name} data={s.data} fill={s.color || COLORS[i % COLORS.length]} fillOpacity={0.7} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
