import { useState, useEffect, useCallback } from 'react';
import { ListChecks, Bell, Plus, X, Check, Circle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { socketEmit, socketRequest } from '../../lib/socket';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Reminder {
  id: string;
  text: string;
  dueAt: string | null;
  completed: boolean;
}

function req<T>(event: string, data: any): Promise<T> {
  return socketRequest<T>(event, data);
}

export function UtilityPanel({ workspaceId }: { workspaceId: string }) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'reminders' | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newText, setNewText] = useState('');
  const [newDue, setNewDue] = useState('');

  const loadTasks = useCallback(async () => {
    const r = await req<Task[]>('tasks_list', { workspaceId });
    setTasks(r || []);
  }, [workspaceId]);

  const loadReminders = useCallback(async () => {
    const r = await req<Reminder[]>('reminders_list', { workspaceId });
    setReminders(r || []);
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'tasks') loadTasks();
    if (activeTab === 'reminders') loadReminders();
  }, [activeTab, workspaceId, loadTasks, loadReminders]);

  // Tasks
  const addTask = async () => {
    if (!newText.trim()) return;
    const t = await req<Task>('task_create', { workspaceId, text: newText.trim() });
    if (t) setTasks(prev => [...prev, t]);
    setNewText('');
  };
  const toggleTask = async (id: string) => {
    const t = await req<Task>('task_toggle', { id });
    if (t) setTasks(prev => prev.map(x => x.id === id ? t : x));
  };
  const deleteTask = (id: string) => {
    socketEmit('task_delete', { id });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Reminders
  const addReminder = async () => {
    if (!newText.trim()) return;
    const r = await req<Reminder>('reminder_create', { workspaceId, text: newText.trim(), dueAt: newDue || undefined });
    if (r) setReminders(prev => [...prev, r]);
    setNewText('');
    setNewDue('');
  };
  const toggleReminder = async (id: string) => {
    const r = await req<Reminder>('reminder_toggle', { id });
    if (r) setReminders(prev => prev.map(x => x.id === id ? r : x));
  };
  const deleteReminder = (id: string) => {
    socketEmit('reminder_delete', { id });
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const activeReminders = reminders.filter(r => !r.completed).length;

  function isOverdue(dueAt: string | null): boolean {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  function formatDue(dueAt: string | null): string {
    if (!dueAt) return '';
    const d = new Date(dueAt);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <div className="border-b border-white/[0.03]">
      <div className="flex items-center gap-0 px-2">
        <button
          onClick={() => setActiveTab(activeTab === 'tasks' ? null : 'tasks')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[10px] data-mono uppercase tracking-wider transition-colors',
            activeTab === 'tasks' ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-400'
          )}
        >
          <ListChecks className="w-3 h-3" />
          Tasks
          {tasks.length > 0 && (
            <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-500">{completedTasks}/{tasks.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'reminders' ? null : 'reminders')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[10px] data-mono uppercase tracking-wider transition-colors',
            activeTab === 'reminders' ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
          )}
        >
          <Bell className="w-3 h-3" />
          Reminders
          {activeReminders > 0 && (
            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400">{activeReminders}</span>
          )}
        </button>
      </div>

      {activeTab && (
        <div className="px-4 pb-3 pt-1">
          {activeTab === 'tasks' && (
            <div className="space-y-1">
              <div className="flex gap-2 mb-2">
                <input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a task..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30"
                />
                <button onClick={addTask} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.02] group">
                  <button onClick={() => toggleTask(task.id)} className="shrink-0">
                    {task.completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
                  </button>
                  <span className={cn('text-xs flex-1', task.completed ? 'text-zinc-600 line-through' : 'text-zinc-300')}>{task.text}</span>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-[10px] text-zinc-600 text-center py-2">No tasks yet</p>}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-1">
              <div className="flex gap-2 mb-2">
                <input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addReminder()}
                  placeholder="Remind me to..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/30"
                />
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-amber-500/30 [color-scheme:dark]"
                />
                <button onClick={addReminder} className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {reminders.map((r) => (
                <div key={r.id} className={cn('flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.02] group', !r.completed && isOverdue(r.dueAt) && 'bg-red-500/5')}>
                  <button onClick={() => toggleReminder(r.id)} className="shrink-0">
                    {r.completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bell className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <span className={cn('text-xs flex-1', r.completed ? 'text-zinc-600 line-through' : 'text-zinc-300')}>{r.text}</span>
                  {r.dueAt && !r.completed && (
                    <span className={cn('text-[10px] data-mono flex items-center gap-1', isOverdue(r.dueAt) ? 'text-red-400' : 'text-zinc-500')}>
                      <Clock className="w-3 h-3" />
                      {formatDue(r.dueAt)}
                    </span>
                  )}
                  <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {reminders.length === 0 && <p className="text-[10px] text-zinc-600 text-center py-2">No reminders yet</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
