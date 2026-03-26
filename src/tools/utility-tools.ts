import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getDb } from '../db.js';
import { broadcast } from '../bridge.js';
import { WorkspaceStore } from '../store/workspace-store.js';
import { WidgetStore } from '../store/widget-store.js';
import { TaskStore, HighlightStore, ReminderStore } from '../store/utility-store.js';

export const definitions = [
  {
    name: 'dashboard_snapshot',
    description: 'Take a snapshot of a workspace\'s current state (all widgets and data). Saved as an artifact.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace to snapshot' },
        name: { type: 'string', description: 'Snapshot name' },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'dashboard_notify',
    description: 'Send a toast notification to the dashboard UI.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'], description: 'Notification type' },
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Optional message body' },
        duration: { type: 'number', description: 'Duration in ms (0 = persistent). Default 5000.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'dashboard_report_activity',
    description: 'Report MCP activity from another server. Used to track what other MCPs are doing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        serverName: { type: 'string', description: 'Name of the MCP server' },
        toolName: { type: 'string', description: 'Tool that was called' },
        params: { type: 'object', description: 'Tool parameters (optional)' },
        resultSummary: { type: 'string', description: 'Brief summary of the result' },
        workspaceId: { type: 'string', description: 'Associate with a workspace (optional)' },
      },
      required: ['serverName', 'toolName'],
    },
  },
  // ─── Tasks ──────────────────────────────────────────────────
  {
    name: 'dashboard_add_task',
    description: 'Add a task to a workspace. Tasks are simple todo items visible in the workspace utility panel.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
        text: { type: 'string', description: 'Task text' },
      },
      required: ['workspaceId', 'text'],
    },
  },
  {
    name: 'dashboard_list_tasks',
    description: 'List all tasks in a workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'dashboard_complete_task',
    description: 'Toggle a task as completed/uncompleted.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
      },
      required: ['taskId'],
    },
  },
  // ─── Reminders ──────────────────────────────────────────────
  {
    name: 'dashboard_add_reminder',
    description: 'Add a reminder to a workspace. Reminders show in the activity bar and workspace overview cards. Overdue reminders appear in red.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
        text: { type: 'string', description: 'Reminder text' },
        dueAt: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD or full ISO). Optional.' },
      },
      required: ['workspaceId', 'text'],
    },
  },
  {
    name: 'dashboard_list_reminders',
    description: 'List all reminders in a workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'dashboard_complete_reminder',
    description: 'Toggle a reminder as completed/uncompleted.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        reminderId: { type: 'string', description: 'Reminder ID' },
      },
      required: ['reminderId'],
    },
  },
  // ─── Highlights (pin/unpin widgets) ─────────────────────────
  {
    name: 'dashboard_pin_widget',
    description: 'Pin a widget as a highlight. Pinned widgets appear in a special row at the top of the workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        widgetId: { type: 'string', description: 'Widget ID to pin' },
        pinned: { type: 'boolean', description: 'true to pin, false to unpin. Default true.' },
      },
      required: ['widgetId'],
    },
  },
];

export const handlers: Record<string, (args: any) => Promise<any>> = {
  async dashboard_snapshot(args: any) {
    const parsed = z.object({
      workspaceId: z.string(),
      name: z.string().optional(),
    }).parse(args);

    const workspace = WorkspaceStore.get(parsed.workspaceId);
    if (!workspace) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Workspace not found' }) }], isError: true };
    }

    const widgets = WidgetStore.listByWorkspace(parsed.workspaceId);
    const snapshot = { workspace, widgets, takenAt: new Date().toISOString() };

    const db = getDb();
    const id = nanoid(12);
    const snapshotName = parsed.name || `Snapshot ${workspace.name} - ${new Date().toLocaleDateString()}`;

    db.prepare(`
      INSERT INTO artifacts (id, type, name, content, metadata, created_at)
      VALUES (?, 'snapshot', ?, ?, '{}', datetime('now'))
    `).run(id, snapshotName, JSON.stringify(snapshot));

    return {
      content: [{ type: 'text', text: JSON.stringify({ artifactId: id, name: snapshotName, widgetCount: widgets.length }) }],
    };
  },

  async dashboard_notify(args: any) {
    const parsed = z.object({
      type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
      title: z.string().min(1),
      message: z.string().optional(),
      duration: z.number().int().min(0).max(60000).default(5000),
    }).parse(args);

    broadcast({ type: 'notification', payload: { id: nanoid(8), ...parsed } });
    return { content: [{ type: 'text', text: JSON.stringify({ notified: true }) }] };
  },

  async dashboard_report_activity(args: any) {
    const parsed = z.object({
      serverName: z.string(),
      toolName: z.string(),
      params: z.unknown().optional(),
      resultSummary: z.string().optional(),
      workspaceId: z.string().optional(),
    }).parse(args);

    const db = getDb();
    const id = nanoid(12);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO activity_log (id, timestamp, server_name, tool_name, params, result_summary, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, now, parsed.serverName, parsed.toolName, parsed.params ? JSON.stringify(parsed.params) : null, parsed.resultSummary ?? null, parsed.workspaceId ?? null);

    broadcast({ type: 'activity', payload: { id, timestamp: now, serverName: parsed.serverName, toolName: parsed.toolName, resultSummary: parsed.resultSummary } as any });
    return { content: [{ type: 'text', text: JSON.stringify({ logged: true, activityId: id }) }] };
  },

  // ─── Tasks ──────────────────────────────────────────────────

  async dashboard_add_task(args: any) {
    const { workspaceId, text } = z.object({ workspaceId: z.string(), text: z.string().min(1) }).parse(args);
    const task = TaskStore.create(workspaceId, text);
    broadcast({ type: 'utility_update', payload: { workspaceId } });
    return { content: [{ type: 'text', text: JSON.stringify(task) }] };
  },

  async dashboard_list_tasks(args: any) {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(args);
    const tasks = TaskStore.list(workspaceId);
    return { content: [{ type: 'text', text: JSON.stringify(tasks) }] };
  },

  async dashboard_complete_task(args: any) {
    const { taskId } = z.object({ taskId: z.string() }).parse(args);
    const task = TaskStore.toggle(taskId);
    if (!task) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Task not found' }) }], isError: true };
    broadcast({ type: 'utility_update', payload: { workspaceId: task.workspaceId } });
    return { content: [{ type: 'text', text: JSON.stringify(task) }] };
  },

  // ─── Reminders ──────────────────────────────────────────────

  async dashboard_add_reminder(args: any) {
    const parsed = z.object({ workspaceId: z.string(), text: z.string().min(1), dueAt: z.string().optional() }).parse(args);
    const reminder = ReminderStore.create(parsed.workspaceId, parsed.text, parsed.dueAt);
    broadcast({ type: 'utility_update', payload: { workspaceId: parsed.workspaceId } });
    return { content: [{ type: 'text', text: JSON.stringify(reminder) }] };
  },

  async dashboard_list_reminders(args: any) {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(args);
    const reminders = ReminderStore.list(workspaceId);
    return { content: [{ type: 'text', text: JSON.stringify(reminders) }] };
  },

  async dashboard_complete_reminder(args: any) {
    const { reminderId } = z.object({ reminderId: z.string() }).parse(args);
    const reminder = ReminderStore.toggle(reminderId);
    if (!reminder) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Reminder not found' }) }], isError: true };
    broadcast({ type: 'utility_update', payload: { workspaceId: reminder.workspaceId } });
    return { content: [{ type: 'text', text: JSON.stringify(reminder) }] };
  },

  // ─── Highlights ─────────────────────────────────────────────

  async dashboard_pin_widget(args: any) {
    const parsed = z.object({ widgetId: z.string(), pinned: z.boolean().default(true) }).parse(args);
    const db = getDb();
    db.prepare('UPDATE widgets SET pinned = ? WHERE id = ?').run(parsed.pinned ? 1 : 0, parsed.widgetId);
    const widget = WidgetStore.get(parsed.widgetId);
    if (!widget) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Widget not found' }) }], isError: true };
    broadcast({ type: 'widget_updated', payload: widget });
    return { content: [{ type: 'text', text: JSON.stringify({ widgetId: widget.id, pinned: widget.pinned }) }] };
  },
};
