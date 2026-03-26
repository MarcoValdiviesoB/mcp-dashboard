import { cn } from '../../../lib/utils';
import { CheckCircle2, Circle, Loader2, XCircle, SkipForward } from 'lucide-react';

interface ProgressTask {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  message?: string;
}

interface ProgressTrackerData {
  tasks: ProgressTask[];
  title?: string;
  overallProgress?: number;
}

const STATUS_ICONS: Record<string, { icon: typeof Circle; color: string }> = {
  pending: { icon: Circle, color: 'text-zinc-600' },
  in_progress: { icon: Loader2, color: 'text-blue-400' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400' },
  failed: { icon: XCircle, color: 'text-red-400' },
  skipped: { icon: SkipForward, color: 'text-zinc-500' },
};

export function ProgressTracker({ data }: { data: ProgressTrackerData; config?: any }) {
  if (!data.tasks?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No tasks</div>;
  }

  const overall = data.overallProgress ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Overall progress bar */}
      <div className="mb-3">
        {data.title && <p className="text-xs text-zinc-400 mb-1">{data.title}</p>}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${overall}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono">{overall}%</span>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto space-y-1">
        {data.tasks.map((task) => {
          const cfg = STATUS_ICONS[task.status] ?? STATUS_ICONS.pending;
          const Icon = cfg.icon;

          return (
            <div key={task.id} className="flex items-start gap-2 px-1 py-1">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', cfg.color, task.status === 'in_progress' && 'animate-spin')} />
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-xs',
                  task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-300',
                )}>
                  {task.label}
                </p>
                {task.message && (
                  <p className="text-[10px] text-zinc-600 mt-0.5">{task.message}</p>
                )}
                {task.progress !== undefined && task.status === 'in_progress' && (
                  <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
