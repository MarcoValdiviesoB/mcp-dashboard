import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardStore } from '../../stores/dashboard-store';
import { LayoutDashboard, Activity, Wifi, WifiOff, X, Archive, ArchiveRestore, Trash2, Bell, Share2, Copy, Check, Cpu, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { socketEmit, socketRequest } from '../../lib/socket';

export function WorkspaceTabs() {
  const workspaces = useDashboardStore((s) => s.workspaces);
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useDashboardStore((s) => s.setActiveWorkspaceId);
  const removeWorkspace = useDashboardStore((s) => s.removeWorkspace);
  const updateWorkspace = useDashboardStore((s) => s.updateWorkspace);
  const connected = useDashboardStore((s) => s.connected);
  const [showArchived, setShowArchived] = useState(false);

  const active = workspaces.filter((ws) => ws && !ws.archived);
  const archived = workspaces.filter((ws) => ws && ws.archived);

  const handleArchive = (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    updateWorkspace({ ...ws, archived: true });
    socketEmit('workspace_archive', { workspaceId: wsId });
  };

  const handleUnarchive = (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    updateWorkspace({ ...ws, archived: false });
    socketEmit('workspace_unarchive', { workspaceId: wsId });
  };

  const handleDelete = (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    if (confirm('Delete permanently? This cannot be undone.')) {
      socketEmit('workspace_delete', { workspaceId: wsId });
      removeWorkspace(wsId);
    }
  };

  return (
    <header className="border-b border-blue-500/10 bg-zinc-950/80 backdrop-blur-md flex items-center gap-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-2 border-r border-blue-500/10">
        <div className="relative">
          <LayoutDashboard className="w-4 h-4 text-blue-400" />
          {connected && <span className="absolute -top-0.5 -right-0.5 activity-dot" />}
        </div>
        <span className="text-xs font-semibold text-zinc-300 tracking-tight">MCP</span>
        {connected ? (
          <Wifi className="w-3 h-3 text-emerald-400 status-breathe" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
      </div>

      {/* Active tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
        {active.map((ws) => !ws ? null : (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-r border-blue-500/5 transition-all duration-200 relative',
              activeWorkspaceId === ws.id
                ? 'bg-blue-500/10 text-zinc-100'
                : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
            )}
          >
            {activeWorkspaceId === ws.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-400 rounded-full" />
            )}
            <span className="text-sm">{ws.icon || '📋'}</span>
            <span className="max-w-[140px] truncate">{ws.name}</span>
            {/* Archive button */}
            <span
              onClick={(e) => handleArchive(e, ws.id)}
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-amber-500/20 hover:text-amber-400 transition-all cursor-pointer"
              title="Archive"
            >
              <Archive className="w-3 h-3" />
            </span>
          </button>
        ))}

        {active.length === 0 && (
          <span className="px-4 py-2 text-xs text-zinc-600">No workspaces yet</span>
        )}
      </div>

      {/* Archived toggle */}
      {archived.length > 0 && (
        <ArchiveDropdown
          archived={archived}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      )}

      {/* Share LAN */}
      <ShareLAN />
    </header>
  );
}

function ShareLAN() {
  const [urls, setUrls] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const workspace = useDashboardStore((s) => s.workspaces.find(w => w.id === s.activeWorkspaceId));

  const fetchIPs = async () => {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      setUrls(data.urls || []);
    } catch { setUrls([]); }
  };

  const toggle = () => {
    if (!open) fetchIPs();
    setOpen(!open);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  };

  const copyUrl = (baseUrl: string) => {
    const url = activeWorkspaceId ? `${baseUrl}?workspace=${activeWorkspaceId}` : baseUrl;
    navigator.clipboard.writeText(url);
    setCopiedUrl(baseUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-[10px] data-mono border-l border-blue-500/5 transition-colors',
          open ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'
        )}
        data-tip="Share on LAN"
      >
        <Share2 className="w-3 h-3" />
      </button>

      {open && createPortal(
        <div
          className="fixed z-[9999] w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="px-3 py-2 border-b border-zinc-800 text-[10px] text-zinc-500 data-mono uppercase tracking-wider">
            Share on Local Network
          </div>
          {workspace && (
            <div className="px-3 py-2 border-b border-zinc-800/50 flex items-center gap-2">
              <span className="text-sm">{workspace.icon || '📋'}</span>
              <span className="text-xs text-zinc-300 truncate">{workspace.name}</span>
            </div>
          )}
          {urls.length === 0 ? (
            <p className="px-3 py-3 text-xs text-zinc-600">No network interfaces found</p>
          ) : (
            <div className="p-2 space-y-1">
              {urls.map(baseUrl => {
                const fullUrl = activeWorkspaceId ? `${baseUrl}?workspace=${activeWorkspaceId}` : baseUrl;
                return (
                  <div key={baseUrl} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 group">
                    <span className="text-[10px] text-blue-400 data-mono flex-1 truncate">{fullUrl}</span>
                    <button
                      onClick={() => copyUrl(baseUrl)}
                      className="p-1 rounded hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      {copiedUrl === baseUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
              <p className="px-2 pt-1 text-[9px] text-zinc-600">Opens directly in this workspace</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function ArchiveDropdown({ archived, showArchived, setShowArchived, onUnarchive, onDelete }: {
  archived: any[];
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
  onUnarchive: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (showArchived && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [showArchived]);

  // Close on click outside
  useEffect(() => {
    if (!showArchived) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setShowArchived(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showArchived, setShowArchived]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setShowArchived(!showArchived)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-[10px] data-mono border-l border-blue-500/5 transition-colors',
          showArchived ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-600 hover:text-zinc-400'
        )}
      >
        <Archive className="w-3 h-3" />
        {archived.length}
      </button>

      {showArchived && createPortal(
        <div
          className="fixed z-[9999] w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="px-3 py-2 border-b border-zinc-800 text-[10px] text-zinc-500 data-mono uppercase tracking-wider">
            Archived Workspaces
          </div>
          {archived.map((ws) => !ws ? null : (
            <div
              key={ws.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50"
            >
              <span className="text-sm">{ws.icon || '📋'}</span>
              <span className="text-xs text-zinc-400 truncate flex-1">{ws.name}</span>
              <button
                onClick={(e) => onUnarchive(e, ws.id)}
                className="p-1 rounded hover:bg-blue-500/20 text-zinc-600 hover:text-blue-400 transition-colors"
                title="Restore"
              >
                <ArchiveRestore className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => onDelete(e, ws.id)}
                className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors"
                title="Delete permanently"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export function ActivityBar() {
  const activities = useDashboardStore((s) => s.activities);
  const [reminders, setReminders] = useState<any[]>([]);
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);

  // Load reminders for active workspace
  useEffect(() => {
    if (!activeWorkspaceId) return;
    socketRequest<any[]>('reminders_list', { workspaceId: activeWorkspaceId }).then(r => setReminders((r || []).filter((x: any) => !x.completed)));
  }, [activeWorkspaceId]);

  const latest = activities[0];
  const now = new Date();
  const overdue = reminders.filter(r => r.dueAt && new Date(r.dueAt) < now);
  const upcoming = reminders.filter(r => !r.dueAt || new Date(r.dueAt) >= now);

  return (
    <div className="border-t border-blue-500/10 px-4 py-1.5 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md shrink-0">
      {/* Overdue reminders */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-1.5 text-red-400">
          <Bell className="w-3 h-3" />
          <span className="text-[10px] data-mono">{overdue.length} overdue</span>
          <span className="text-[10px] text-red-400/70 truncate max-w-[200px]">{overdue[0].text}</span>
        </div>
      )}

      {/* Upcoming reminders */}
      {upcoming.length > 0 && overdue.length === 0 && (
        <div className="flex items-center gap-1.5 text-amber-400/70">
          <Bell className="w-3 h-3" />
          <span className="text-[10px] data-mono">{upcoming.length}</span>
        </div>
      )}

      {/* Separator */}
      {reminders.length > 0 && latest && <div className="w-px h-3 bg-zinc-800" />}

      {/* Latest activity */}
      {latest && (
        <>
          <Activity className="w-3 h-3 text-zinc-600 shrink-0" />
          <span className="activity-dot shrink-0" />
          <span className="text-blue-400/70 data-mono text-[10px]">{latest.serverName}</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400 text-[10px]">{latest.toolName}</span>
          {latest.resultSummary && (
            <span className="text-zinc-600 text-[10px] truncate">{latest.resultSummary}</span>
          )}
        </>
      )}

      {activities.length > 1 && (
        <span className="text-zinc-700 text-[10px] data-mono ml-auto">+{activities.length - 1}</span>
      )}

      {/* Idle state */}
      {!latest && reminders.length === 0 && (
        <div className="flex items-center gap-1.5 text-zinc-700">
          <Activity className="w-3 h-3" />
          <span className="text-[10px] data-mono">Waiting for signals...</span>
        </div>
      )}

      {/* Workers indicator - pushed to right */}
      <WorkersIndicator />
    </div>
  );
}

function WorkersIndicator() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ bottom: 0, right: 0 });

  const load = async () => {
    try {
      const res = await fetch('/api/workers');
      setWorkers(await res.json());
    } catch { setWorkers([]); }
  };

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right });
    }
  };

  const stop = async (id: string) => {
    await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    load();
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={cn(
          'ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] data-mono transition-colors',
          workers.length > 0
            ? open ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-400/70 hover:text-emerald-400'
            : 'text-zinc-700'
        )}
      >
        <Cpu className={cn('w-3 h-3', workers.length > 0 && 'status-breathe')} />
        {workers.length > 0 ? workers.length : '0'} workers
      </button>

      {open && workers.length > 0 && createPortal(
        <div
          className="fixed z-[9999] w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          style={{ bottom: pos.bottom, right: pos.right }}
        >
          <div className="px-3 py-2 border-b border-zinc-800 text-[10px] text-zinc-500 data-mono uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            Running Workers
          </div>
          <div className="max-h-64 overflow-auto">
            {workers.map((w: any) => (
              <div key={w.id} className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 group">
                <span className="activity-dot shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400 data-mono">{w.type}</span>
                    <span className="text-[9px] text-zinc-600 data-mono">every {w.interval / 1000}s</span>
                  </div>
                  <span className="text-[9px] text-zinc-600 truncate block">{w.widgetId}</span>
                </div>
                <button
                  onClick={() => stop(w.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all"
                  data-tip="Stop worker"
                >
                  <Square className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
