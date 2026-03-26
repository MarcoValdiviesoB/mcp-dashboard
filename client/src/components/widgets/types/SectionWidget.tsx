interface SectionData {
  label: string;
  description?: string;
}

export function SectionWidget({ data }: { data: SectionData; config?: any }) {
  return (
    <div className="h-full flex items-center gap-3 px-1">
      <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
      <div className="flex items-center gap-2 shrink-0">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-[0.15em] data-mono">
          {data.label}
        </h3>
        {data.description && (
          <span className="text-[10px] text-zinc-600">{data.description}</span>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-blue-500/20 to-transparent" />
    </div>
  );
}
