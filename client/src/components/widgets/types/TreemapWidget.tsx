import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#22d3ee', '#e879f9'];

interface TreemapItem {
  name: string;
  value: number;
  color?: string;
  children?: TreemapItem[];
}

interface TreemapData {
  items: TreemapItem[];
}

function assignColors(items: TreemapItem[]): any[] {
  return items.map((item, i) => ({
    name: item.name,
    size: item.value,
    fill: item.color || COLORS[i % COLORS.length],
    children: item.children ? assignColors(item.children) : undefined,
  }));
}

function CustomContent(props: any) {
  const { x, y, width, height, name, fill } = props;
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.25} stroke={fill} strokeWidth={1} strokeOpacity={0.4} rx={4} />
      {width > 50 && height > 25 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#d4d4d8" fontSize={10}>
          {name}
        </text>
      )}
    </g>
  );
}

export function TreemapWidget({ data }: { data: TreemapData; config?: any }) {
  if (!data.items?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const treeData = assignColors(data.items);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={treeData} dataKey="size" nameKey="name" content={<CustomContent />}>
        <Tooltip contentStyle={{ background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: 12 }} />
      </Treemap>
    </ResponsiveContainer>
  );
}
