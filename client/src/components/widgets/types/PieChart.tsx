import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#22d3ee', '#e879f9'];

interface PieChartData {
  slices: Array<{ label: string; value: number; color?: string }>;
}

export function PieChartWidget({ data, config }: { data: PieChartData; config?: any }) {
  if (!data.slices?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const chartData = data.slices.map((s) => ({ name: s.label, value: s.value, color: s.color }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={config?.donut !== false ? '55%' : 0}
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
