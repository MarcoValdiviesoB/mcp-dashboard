import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Trash2, Star, X, Maximize2 } from 'lucide-react';
import { useDashboardStore, type Widget } from '../../stores/dashboard-store';
import { WidgetRenderer } from './WidgetRenderer';
import { cn } from '../../lib/utils';
import { socketEmit } from '../../lib/socket';

interface WidgetShellProps {
  widget: Widget;
  compact?: boolean;
}

const TYPE_GLOW: Record<string, { border: string; shadow: string }> = {
  metric_card:      { border: 'border-blue-500/15',    shadow: 'hover:shadow-blue-500/5' },
  line_chart:       { border: 'border-emerald-500/15', shadow: 'hover:shadow-emerald-500/5' },
  bar_chart:        { border: 'border-amber-500/15',   shadow: 'hover:shadow-amber-500/5' },
  pie_chart:        { border: 'border-purple-500/15',  shadow: 'hover:shadow-purple-500/5' },
  table:            { border: 'border-cyan-500/15',    shadow: 'hover:shadow-cyan-500/5' },
  markdown:         { border: 'border-zinc-500/15',    shadow: 'hover:shadow-zinc-500/5' },
  json_viewer:      { border: 'border-orange-500/15',  shadow: 'hover:shadow-orange-500/5' },
  code_block:       { border: 'border-pink-500/15',    shadow: 'hover:shadow-pink-500/5' },
  terminal:         { border: 'border-green-500/15',   shadow: 'hover:shadow-green-500/5' },
  timeline:         { border: 'border-indigo-500/15',  shadow: 'hover:shadow-indigo-500/5' },
  progress_tracker: { border: 'border-rose-500/15',    shadow: 'hover:shadow-rose-500/5' },
  geometry:         { border: 'border-violet-500/20',  shadow: 'hover:shadow-violet-500/5' },
  links:            { border: 'border-sky-500/15',     shadow: 'hover:shadow-sky-500/5' },
  workspace_ref:    { border: 'border-teal-500/15',    shadow: 'hover:shadow-teal-500/5' },
  section:          { border: 'border-transparent',     shadow: '' },
  project:          { border: 'border-indigo-500/15',  shadow: 'hover:shadow-indigo-500/5' },
  radar:            { border: 'border-cyan-500/15',    shadow: 'hover:shadow-cyan-500/5' },
  treemap:          { border: 'border-lime-500/15',    shadow: 'hover:shadow-lime-500/5' },
  gauge:            { border: 'border-orange-500/15',  shadow: 'hover:shadow-orange-500/5' },
  funnel:           { border: 'border-blue-500/15',    shadow: 'hover:shadow-blue-500/5' },
  scatter:          { border: 'border-fuchsia-500/15', shadow: 'hover:shadow-fuchsia-500/5' },
  heatmap:          { border: 'border-red-500/15',     shadow: 'hover:shadow-red-500/5' },
};

export function WidgetShell({ widget, compact }: WidgetShellProps) {
  const [expanded, setExpanded] = useState(false);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const updateWidget = useDashboardStore((s) => s.updateWidget);
  const glow = TYPE_GLOW[widget.type] || { border: 'border-zinc-800', shadow: '' };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...widget, pinned: !widget.pinned };
    updateWidget(updated);
    socketEmit('widget_pin', { widgetId: widget.id, pinned: !widget.pinned });
  };

  // Section widgets render without shell chrome
  if (widget.type === 'section') {
    return (
      <div className="h-full flex items-center widget-drag-handle cursor-grab active:cursor-grabbing">
        <WidgetRenderer widget={widget} />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'widget-card h-full flex flex-col rounded-xl border bg-zinc-900/60 backdrop-blur-md overflow-hidden',
          'hover:shadow-2xl transition-all duration-300',
          glow.border,
          glow.shadow,
          widget.pinned && 'ring-1 ring-amber-500/20',
        )}
      >
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.04] bg-white/[0.02]">
          {!compact && (
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/[0.06]">
              <GripVertical className="w-3.5 h-3.5 text-zinc-600" />
            </div>
          )}
          <h3
            onClick={() => setExpanded(true)}
            className="text-xs font-medium text-zinc-300 truncate flex-1 cursor-pointer hover:text-zinc-100 transition-colors flex items-center gap-1 group"
          >
            {widget.title}
            <Maximize2 className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </h3>
          <span className="text-[9px] text-zinc-600 data-mono uppercase tracking-wider">
            {widget.type.replace(/_/g, ' ')}
          </span>
          <button
            onClick={togglePin}
            className={cn(
              'p-0.5 rounded transition-colors',
              widget.pinned
                ? 'text-amber-400 hover:bg-amber-500/15'
                : 'text-zinc-700 hover:bg-amber-500/10 hover:text-amber-400'
            )}
            data-tip={widget.pinned ? 'Remove from highlights' : 'Add to highlights'}
          >
            <Star className={cn('w-3 h-3', widget.pinned && 'fill-amber-400')} />
          </button>
          <button
            onClick={() => removeWidget(widget.id)}
            className="p-0.5 rounded hover:bg-red-500/10 hover:text-red-400 text-zinc-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Widget content */}
        <div className="flex-1 overflow-hidden p-3">
          <WidgetRenderer widget={widget} />
        </div>
      </div>

      {/* Fullscreen modal */}
      {expanded && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className={cn(
              'relative w-full max-w-5xl h-[85vh] bg-zinc-900 border rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden',
              glow.border,
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04] bg-white/[0.02] shrink-0">
              <h3 className="text-sm font-medium text-zinc-200 flex-1">{widget.title}</h3>
              <span className="text-[10px] text-zinc-600 data-mono uppercase tracking-wider">
                {widget.type.replace(/_/g, ' ')}
              </span>
              <button
                onClick={togglePin}
                className={cn(
                  'p-1 rounded transition-colors',
                  widget.pinned ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'
                )}
              >
                <Star className={cn('w-4 h-4', widget.pinned && 'fill-amber-400')} />
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              <WidgetRenderer widget={widget} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
