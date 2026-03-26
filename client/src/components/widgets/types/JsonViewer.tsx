import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface JsonViewerData {
  json: unknown;
  rootLabel?: string;
}

export function JsonViewer({ data }: { data: JsonViewerData; config?: any }) {
  return (
    <div className="h-full overflow-auto font-mono text-xs">
      <JsonNode value={data.json} label={data.rootLabel} depth={0} defaultExpanded={2} />
    </div>
  );
}

function JsonNode({ value, label, depth, defaultExpanded }: { value: unknown; label?: string; depth: number; defaultExpanded: number }) {
  const [expanded, setExpanded] = useState(depth < defaultExpanded);

  if (value === null) return <span className="text-zinc-500">{label && <Label text={label} />}null</span>;
  if (typeof value === 'boolean') return <span className="text-amber-400">{label && <Label text={label} />}{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-blue-400">{label && <Label text={label} />}{value}</span>;
  if (typeof value === 'string') return <span className="text-emerald-400">{label && <Label text={label} />}"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{label && <Label text={label} />}[]</span>;
    return (
      <div>
        <button onClick={() => setExpanded(!expanded)} className="inline-flex items-center hover:bg-zinc-800 rounded">
          {expanded ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
          {label && <Label text={label} />}
          <span className="text-zinc-500">[{value.length}]</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-zinc-800 pl-2">
            {value.map((item, i) => (
              <div key={i}><JsonNode value={item} label={String(i)} depth={depth + 1} defaultExpanded={defaultExpanded} /></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{label && <Label text={label} />}{'{}'}</span>;
    return (
      <div>
        <button onClick={() => setExpanded(!expanded)} className="inline-flex items-center hover:bg-zinc-800 rounded">
          {expanded ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
          {label && <Label text={label} />}
          <span className="text-zinc-500">{'{'}...{'}'}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-zinc-800 pl-2">
            {entries.map(([k, v]) => (
              <div key={k}><JsonNode value={v} label={k} depth={depth + 1} defaultExpanded={defaultExpanded} /></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-zinc-500">{String(value)}</span>;
}

function Label({ text }: { text: string }) {
  return <span className="text-purple-400 mr-1">{text}: </span>;
}
