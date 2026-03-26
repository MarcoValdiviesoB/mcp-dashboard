import { useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';

interface TerminalLine {
  text: string;
  type?: 'stdout' | 'stderr' | 'stdin' | 'system';
  timestamp?: string;
}

interface TerminalData {
  lines: TerminalLine[];
  title?: string;
}

const LINE_COLORS: Record<string, string> = {
  stdout: 'text-zinc-300',
  stderr: 'text-red-400',
  stdin: 'text-blue-400',
  system: 'text-zinc-500 italic',
};

export function TerminalWidget({ data, config }: { data: TerminalData; config?: any }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.lines?.length]);

  return (
    <div className="h-full flex flex-col bg-zinc-950 rounded-md overflow-hidden font-mono text-xs">
      {data.title && (
        <div className="px-3 py-1 text-[10px] text-zinc-500 bg-zinc-900 border-b border-zinc-800">
          {data.title}
        </div>
      )}
      <div className="flex-1 overflow-auto p-2 space-y-px">
        {(data.lines ?? []).map((line, i) => (
          <div key={i} className={cn('whitespace-pre-wrap break-all', LINE_COLORS[line.type ?? 'stdout'])}>
            {config?.showTimestamps && line.timestamp && (
              <span className="text-zinc-600 mr-2">{new Date(line.timestamp).toLocaleTimeString()}</span>
            )}
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
