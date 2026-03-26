import { cn } from '../../../lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending';
  icon?: string;
}

interface TimelineData {
  events: TimelineEvent[];
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
};

export function TimelineWidget({ data }: { data: TimelineData; config?: any }) {
  if (!data.events?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No events</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-px bg-zinc-800" />

        {data.events.map((event, idx) => {
          const cfg = STATUS_CONFIG[event?.status ?? 'info'] ?? STATUS_CONFIG.info;
          const Icon = cfg.icon;

          return (
            <div key={event?.id ?? idx} className="relative pb-4 last:pb-0">
              <div className={cn('absolute left-[-16px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center', cfg.bg)}>
                <Icon className={cn('w-3 h-3', cfg.color)} />
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-zinc-200">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-zinc-500 mt-0.5">{event.description}</p>
                )}
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
