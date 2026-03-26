import { useMemo, useState, useEffect } from 'react';
import { LayoutDashboard, ArrowRight, Star, Bell, ListChecks } from 'lucide-react';
import { useDashboardStore } from '../../../stores/dashboard-store';
import { socketRequest } from '../../../lib/socket';
import { cn } from '../../../lib/utils';

interface WorkspaceRefData {
  workspaceId: string;
  note?: string;
}

interface Reminder {
  id: string;
  text: string;
  dueAt: string | null;
  completed: boolean;
}

export function WorkspaceRefWidget({ data }: { data: WorkspaceRefData; config?: any }) {
  const workspaces = useDashboardStore((s) => s.workspaces);
  const allWidgets = useDashboardStore((s) => s.widgets);
  const setActiveWorkspaceId = useDashboardStore((s) => s.setActiveWorkspaceId);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const ws = useMemo(
    () => workspaces.find(w => w.id === data.workspaceId),
    [workspaces, data.workspaceId]
  );

  const widgets = useMemo(
    () => allWidgets.filter(w => w.workspaceId === data.workspaceId),
    [allWidgets, data.workspaceId]
  );

  useEffect(() => {
    socketRequest<Reminder[]>('reminders_list', { workspaceId: data.workspaceId }).then(r => setReminders((r || []).filter(x => !x.completed)));
    socketRequest<any[]>('tasks_list', { workspaceId: data.workspaceId }).then(t => setTasks(t || []));
  }, [data.workspaceId]);

  const highlighted = widgets.filter(w => w.pinned).length;
  const widgetTypes = [...new Set(widgets.map(w => w.type))];
  const now = new Date();
  const overdueReminders = reminders.filter(r => r.dueAt && new Date(r.dueAt) < now);
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (!ws) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-zinc-600">
        Workspace not found
      </div>
    );
  }

  return (
    <div
      onClick={() => setActiveWorkspaceId(ws.id)}
      className="h-full flex flex-col cursor-pointer group"
    >
      {/* Workspace header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{ws.icon || '📋'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors">
            {ws.name}
          </h4>
          {ws.description && (
            <p className="text-[10px] text-zinc-500 truncate">{ws.description}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 data-mono">
          <LayoutDashboard className="w-3 h-3" />
          {widgets.length}
        </div>
        {highlighted > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/70 data-mono">
            <Star className="w-3 h-3 fill-amber-400/70" />
            {highlighted}
          </div>
        )}
        {tasks.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 data-mono">
            <ListChecks className="w-3 h-3" />
            {completedTasks.length}/{tasks.length}
          </div>
        )}
        {reminders.length > 0 && (
          <div className={cn('flex items-center gap-1 text-[10px] data-mono', overdueReminders.length > 0 ? 'text-red-400' : 'text-amber-400/70')}>
            <Bell className="w-3 h-3" />
            {reminders.length}
          </div>
        )}
      </div>

      {/* Reminders preview */}
      {reminders.length > 0 && (
        <div className="space-y-0.5 mb-2">
          {reminders.slice(0, 3).map(r => (
            <div key={r.id} className={cn('flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded', r.dueAt && new Date(r.dueAt) < now ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/5 text-amber-400/60')}>
              <Bell className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{r.text}</span>
            </div>
          ))}
          {reminders.length > 3 && (
            <span className="text-[9px] text-zinc-600 data-mono px-1.5">+{reminders.length - 3} more</span>
          )}
        </div>
      )}

      {/* Widget type badges */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {widgetTypes.slice(0, 5).map(type => (
          <span key={type} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 data-mono">
            {type.replace(/_/g, ' ')}
          </span>
        ))}
        {widgetTypes.length > 5 && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 data-mono">
            +{widgetTypes.length - 5}
          </span>
        )}
      </div>

      {/* Note */}
      {data.note && (
        <p className="text-[10px] text-zinc-500 italic mt-1">{data.note}</p>
      )}

      {/* Archived badge */}
      {ws.archived && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/70 data-mono self-start mt-1">
          archived
        </span>
      )}
    </div>
  );
}
