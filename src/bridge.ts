import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { DashboardEvent } from './types.js';
import { getDb } from './db.js';
import { WorkspaceStore } from './store/workspace-store.js';
import { WidgetStore } from './store/widget-store.js';
import { TaskStore, HighlightStore, ReminderStore } from './store/utility-store.js';

let io: SocketServer | null = null;
let remotePort: number | null = null;

export function initBridge(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.error(`[Dashboard Bridge] Client connected: ${socket.id}`);

    const workspaces = WorkspaceStore.listAll();
    const widgets = workspaces.flatMap(ws => WidgetStore.listByWorkspace(ws.id));
    socket.emit('dashboard_event', { type: 'init', payload: { workspaces, widgets } } as DashboardEvent);

    socket.on('widget_move', (data: { widgetId: string; position: { x: number; y: number; w: number; h: number } }) => {
      WidgetStore.updatePosition(data.widgetId, data.position);
      socket.broadcast.emit('dashboard_event', {
        type: 'widget_updated',
        payload: WidgetStore.get(data.widgetId),
      } as DashboardEvent);
    });

    // Handle widget pin/unpin
    socket.on('widget_pin', (data: { widgetId: string; pinned: boolean }) => {
      const db = getDb();
      db.prepare('UPDATE widgets SET pinned = ? WHERE id = ?').run(data.pinned ? 1 : 0, data.widgetId);
      const widget = WidgetStore.get(data.widgetId);
      if (widget) {
        socket.broadcast.emit('dashboard_event', { type: 'widget_updated', payload: widget } as DashboardEvent);
      }
    });

    socket.on('workspace_delete', (data: { workspaceId: string }) => {
      WorkspaceStore.delete(data.workspaceId);
      socket.broadcast.emit('dashboard_event', {
        type: 'workspace_deleted',
        payload: { workspaceId: data.workspaceId },
      } as DashboardEvent);
    });

    socket.on('workspace_archive', (data: { workspaceId: string }) => {
      const ws = WorkspaceStore.archive(data.workspaceId);
      if (ws) io!.emit('dashboard_event', { type: 'workspace_updated', payload: ws } as DashboardEvent);
    });

    socket.on('workspace_unarchive', (data: { workspaceId: string }) => {
      const ws = WorkspaceStore.unarchive(data.workspaceId);
      if (ws) io!.emit('dashboard_event', { type: 'workspace_updated', payload: ws } as DashboardEvent);
    });

    // Utility: Tasks
    socket.on('tasks_list', (data: { workspaceId: string }, cb: Function) => {
      cb(TaskStore.list(data.workspaceId));
    });
    socket.on('task_create', (data: { workspaceId: string; text: string }, cb: Function) => {
      const task = TaskStore.create(data.workspaceId, data.text);
      cb(task);
      socket.broadcast.emit('dashboard_event', { type: 'utility_update', payload: { workspaceId: data.workspaceId } });
    });
    socket.on('task_toggle', (data: { id: string }, cb: Function) => {
      const task = TaskStore.toggle(data.id);
      cb(task);
      if (task) socket.broadcast.emit('dashboard_event', { type: 'utility_update', payload: { workspaceId: task.workspaceId } });
    });
    socket.on('task_delete', (data: { id: string }) => {
      TaskStore.delete(data.id);
    });

    // Utility: Highlights
    socket.on('highlights_list', (data: { workspaceId: string }, cb: Function) => {
      cb(HighlightStore.list(data.workspaceId));
    });
    socket.on('highlight_create', (data: { workspaceId: string; text: string; color?: string }, cb: Function) => {
      const hl = HighlightStore.create(data.workspaceId, data.text, data.color);
      cb(hl);
      socket.broadcast.emit('dashboard_event', { type: 'utility_update', payload: { workspaceId: data.workspaceId } });
    });
    socket.on('highlight_delete', (data: { id: string }) => {
      HighlightStore.delete(data.id);
    });

    // Utility: Reminders
    socket.on('reminders_list', (data: { workspaceId: string }, cb: Function) => {
      cb(ReminderStore.list(data.workspaceId));
    });
    socket.on('reminder_create', (data: { workspaceId: string; text: string; dueAt?: string }, cb: Function) => {
      const r = ReminderStore.create(data.workspaceId, data.text, data.dueAt);
      cb(r);
      socket.broadcast.emit('dashboard_event', { type: 'utility_update', payload: { workspaceId: data.workspaceId } });
    });
    socket.on('reminder_toggle', (data: { id: string }, cb: Function) => {
      const r = ReminderStore.toggle(data.id);
      cb(r);
    });
    socket.on('reminder_delete', (data: { id: string }) => {
      ReminderStore.delete(data.id);
    });

    socket.on('disconnect', () => {
      console.error(`[Dashboard Bridge] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/** Set remote mode - this instance doesn't own the HTTP server, broadcasts via HTTP POST */
export function setRemoteMode(port: number): void {
  remotePort = port;
  console.error(`[Dashboard Bridge] Remote mode -> http://localhost:${port}`);
}

export function broadcast(event: DashboardEvent): void {
  if (io) {
    // We own the server, broadcast directly
    io.emit('dashboard_event', event);
  } else if (remotePort) {
    // Another instance owns the server, POST the event
    fetch(`http://localhost:${remotePort}/api/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(err => {
      console.error('[Dashboard Bridge] Remote broadcast failed:', err.message);
    });
  }
}
