interface CodeBlockData {
  code: string;
  language: string;
  filename?: string;
}

export function CodeBlock({ data }: { data: CodeBlockData; config?: any }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {data.filename && (
        <div className="px-3 py-1 text-[10px] text-zinc-500 bg-zinc-800/50 border-b border-zinc-800 font-mono">
          {data.filename}
        </div>
      )}
      <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-zinc-300 bg-zinc-900/50 leading-relaxed">
        <code>{data.code || ''}</code>
      </pre>
    </div>
  );
}
