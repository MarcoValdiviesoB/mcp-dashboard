import { create } from 'zustand';

// Types mirrored from server (kept in sync manually for now)
export type WidgetType =
  | 'metric_card' | 'line_chart' | 'bar_chart' | 'pie_chart'
  | 'table' | 'markdown' | 'json_viewer' | 'code_block'
  | 'terminal' | 'timeline' | 'progress_tracker'
  | 'geometry'
  | 'links'
  | 'workspace_ref'
  | 'section'
  | 'project'
  | 'radar' | 'treemap' | 'gauge' | 'funnel' | 'scatter' | 'heatmap';

export interface Position {
  x: number; y: number; w: number; h: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  columns: number;
  rowHeight: number;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  workspaceId: string;
  type: WidgetType;
  title: string;
  data: any;
  config?: Record<string, unknown>;
  position: Position;
  source?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  serverName: string;
  toolName: string;
  resultSummary?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface DashboardState {
  // Data
  workspaces: Workspace[];
  widgets: Widget[];
  activities: ActivityEntry[];

  // UI state
  activeWorkspaceId: string | null;
  connected: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setActiveWorkspaceId: (id: string | null) => void;

  // Init
  initState: (workspaces: Workspace[], widgets: Widget[]) => void;

  // Workspace mutations
  addWorkspace: (ws: Workspace) => void;
  updateWorkspace: (ws: Workspace) => void;
  removeWorkspace: (id: string) => void;

  // Widget mutations
  addWidget: (w: Widget) => void;
  updateWidget: (w: Widget) => void;
  pushWidgetData: (widgetId: string, push: any) => void;
  removeWidget: (id: string) => void;
  moveWidget: (widgetId: string, position: Position) => void;

  // Activity
  addActivity: (entry: ActivityEntry) => void;

  // Selectors
  activeWidgets: () => Widget[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  workspaces: [],
  widgets: [],
  activities: [],
  activeWorkspaceId: null,
  connected: false,

  setConnected: (connected) => set({ connected }),
  setActiveWorkspaceId: (id) => {
    set({ activeWorkspaceId: id });
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('workspace', id);
    else url.searchParams.delete('workspace');
    window.history.replaceState({}, '', url.toString());
  },

  initState: (workspaces, widgets) => {
    const activeId = get().activeWorkspaceId;
    const safeWs = (workspaces || []).filter(w => w && w.id);
    const safeWidgets = (widgets || []).filter(w => w && w.id);
    const nonArchived = safeWs.filter(w => !w.archived);

    // Check URL for ?workspace= param
    const urlWsId = new URLSearchParams(window.location.search).get('workspace');
    const urlMatch = urlWsId && safeWs.find(w => w.id === urlWsId);

    set({
      workspaces: safeWs,
      widgets: safeWidgets,
      activeWorkspaceId: urlMatch
        ? urlWsId
        : activeId && safeWs.find(w => w.id === activeId)
          ? activeId
          : nonArchived[0]?.id ?? null,
    });
  },

  addWorkspace: (ws) => set((s) => {
    if (!ws || !ws.id) return s;
    const newState: Partial<DashboardState> = { workspaces: [...s.workspaces, ws] };
    if (!s.activeWorkspaceId && !ws.archived) newState.activeWorkspaceId = ws.id;
    return newState;
  }),

  updateWorkspace: (ws) => set((s) => {
    if (!ws || !ws.id) return s;
    const exists = s.workspaces.some(w => w.id === ws.id);
    return {
      workspaces: exists
        ? s.workspaces.map(w => w.id === ws.id ? ws : w)
        : [...s.workspaces, ws],
    };
  }),

  removeWorkspace: (id) => set((s) => {
    const workspaces = s.workspaces.filter(w => w.id !== id);
    const widgets = s.widgets.filter(w => w.workspaceId !== id);
    const activeWorkspaceId = s.activeWorkspaceId === id
      ? workspaces[0]?.id ?? null
      : s.activeWorkspaceId;
    return { workspaces, widgets, activeWorkspaceId };
  }),

  addWidget: (w) => set((s) => ({ widgets: [...s.widgets, w] })),

  updateWidget: (w) => set((s) => ({
    widgets: s.widgets.map(existing => existing.id === w.id ? w : existing),
  })),

  pushWidgetData: (widgetId, push) => set((s) => ({
    widgets: s.widgets.map(w => {
      if (w.id !== widgetId) return w;
      return { ...w, data: mergeWidgetData(w.type, w.data, push) };
    }),
  })),

  removeWidget: (id) => set((s) => ({
    widgets: s.widgets.filter(w => w.id !== id),
  })),

  moveWidget: (widgetId, position) => set((s) => ({
    widgets: s.widgets.map(w => w.id === widgetId ? { ...w, position } : w),
  })),

  addActivity: (entry) => set((s) => ({
    activities: [entry, ...s.activities].slice(0, 100),
  })),

  activeWidgets: () => {
    const s = get();
    return s.widgets.filter(w => w.workspaceId === s.activeWorkspaceId);
  },
}));

function mergeWidgetData(type: WidgetType, current: any, push: any): any {
  switch (type) {
    case 'metric_card':
      return { ...current, ...push, sparkline: push.sparkline ? [...(current.sparkline ?? []), ...push.sparkline].slice(-50) : current.sparkline };

    case 'line_chart': {
      const series = [...(current.series ?? [])];
      for (const p of (push.series ?? [])) {
        const idx = series.findIndex((s: any) => s.name === p.name);
        if (idx >= 0) series[idx] = { ...series[idx], data: [...series[idx].data, ...p.data] };
        else series.push(p);
      }
      return { ...current, series };
    }

    case 'bar_chart': {
      const series = [...(current.series ?? [])];
      for (const p of (push.series ?? [])) {
        const idx = series.findIndex((s: any) => s.name === p.name);
        if (idx >= 0) series[idx] = { ...series[idx], values: p.values };
        else series.push(p);
      }
      return { ...current, series, categories: push.categories ?? current.categories };
    }

    case 'table':
      return { ...current, rows: [...(current.rows ?? []), ...(push.rows ?? [])].slice(-500) };

    case 'terminal':
      return { ...current, lines: [...(current.lines ?? []), ...(push.lines ?? [])].slice(-1000) };

    case 'timeline':
      return { ...current, events: [...(push.events ?? []), ...(current.events ?? [])] };

    case 'progress_tracker': {
      const tasks = [...(current.tasks ?? [])];
      for (const p of (push.tasks ?? [])) {
        const idx = tasks.findIndex((t: any) => t.id === p.id);
        if (idx >= 0) tasks[idx] = { ...tasks[idx], ...p };
        else tasks.push(p);
      }
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      return { ...current, tasks, overallProgress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
    }

    case 'links':
      return { ...current, items: [...(current.items ?? []), ...(push.items ?? [])] };

    default:
      return { ...current, ...push };
  }
}
