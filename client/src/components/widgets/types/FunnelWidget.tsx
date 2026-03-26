const COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'];

interface FunnelData {
  stages: Array<{ name: string; value: number; color?: string }>;
}

export function FunnelWidget({ data }: { data: FunnelData; config?: any }) {
  if (!data.stages?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  }

  const maxValue = Math.max(...data.stages.map(s => s.value));

  return (
    <div className="h-full flex flex-col justify-center gap-1 px-2">
      {data.stages.map((stage, i) => {
        const pct = (stage.value / maxValue) * 100;
        const color = stage.color || COLORS[i % COLORS.length];
        const convRate = i > 0 ? ((stage.value / data.stages[i - 1].value) * 100).toFixed(1) : null;

        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 flex justify-center">
              <div
                className="h-7 rounded-md flex items-center justify-center transition-all relative"
                style={{ width: `${Math.max(pct, 15)}%`, backgroundColor: color, opacity: 0.25 }}
              >
                <div
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: color, opacity: 0.3 }}
                />
              </div>
            </div>
            <div className="w-28 flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-zinc-300 truncate">{stage.name}</span>
              <span className="text-[10px] text-zinc-100 data-mono font-medium">{stage.value.toLocaleString()}</span>
            </div>
            {convRate && (
              <span className="text-[9px] text-zinc-600 data-mono w-10 text-right shrink-0">{convRate}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
