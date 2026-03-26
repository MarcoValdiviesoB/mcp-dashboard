import { nanoid } from 'nanoid';
import { getDb } from '../db.js';

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface WorkspaceHighlight {
  id: string;
  workspaceId: string;
  text: string;
  color: string;
  createdAt: string;
}

function rowToTask(row: any): WorkspaceTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    text: row.text,
    completed: row.completed === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function rowToHighlight(row: any): WorkspaceHighlight {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    text: row.text,
    color: row.color,
    createdAt: row.created_at,
  };
}

export const TaskStore = {
  list(workspaceId: string): WorkspaceTask[] {
    const db = getDb();
    return db.prepare('SELECT * FROM workspace_tasks WHERE workspace_id = ? ORDER BY sort_order, created_at').all(workspaceId).map(rowToTask);
  },

  create(workspaceId: string, text: string): WorkspaceTask {
    const db = getDb();
    const id = nanoid(12);
    const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM workspace_tasks WHERE workspace_id = ?').get(workspaceId) as any)?.m ?? 0;
    db.prepare('INSERT INTO workspace_tasks (id, workspace_id, text, sort_order, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, workspaceId, text, maxOrder + 1);
    const row = db.prepare('SELECT * FROM workspace_tasks WHERE id = ?').get(id) as any;
    return rowToTask(row);
  },

  toggle(id: string): WorkspaceTask | null {
    const db = getDb();
    db.prepare('UPDATE workspace_tasks SET completed = 1 - completed WHERE id = ?').run(id);
    const row = db.prepare('SELECT * FROM workspace_tasks WHERE id = ?').get(id) as any;
    return row ? rowToTask(row) : null;
  },

  delete(id: string): boolean {
    const db = getDb();
    return db.prepare('DELETE FROM workspace_tasks WHERE id = ?').run(id).changes > 0;
  },
};

export const HighlightStore = {
  list(workspaceId: string): WorkspaceHighlight[] {
    const db = getDb();
    return db.prepare('SELECT * FROM workspace_highlights WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId).map(rowToHighlight);
  },

  create(workspaceId: string, text: string, color: string = 'blue'): WorkspaceHighlight {
    const db = getDb();
    const id = nanoid(12);
    db.prepare('INSERT INTO workspace_highlights (id, workspace_id, text, color, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, workspaceId, text, color);
    const row = db.prepare('SELECT * FROM workspace_highlights WHERE id = ?').get(id) as any;
    return rowToHighlight(row);
  },

  delete(id: string): boolean {
    const db = getDb();
    return db.prepare('DELETE FROM workspace_highlights WHERE id = ?').run(id).changes > 0;
  },
};

// ─── Reminders ────────────────────────────────────────────────

export interface WorkspaceReminder {
  id: string;
  workspaceId: string;
  text: string;
  dueAt: string | null;
  completed: boolean;
  createdAt: string;
}

function rowToReminder(row: any): WorkspaceReminder {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    text: row.text,
    dueAt: row.due_at ?? null,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export const ReminderStore = {
  list(workspaceId: string): WorkspaceReminder[] {
    const db = getDb();
    return db.prepare('SELECT * FROM workspace_reminders WHERE workspace_id = ? ORDER BY due_at IS NULL, due_at, created_at').all(workspaceId).map(rowToReminder);
  },

  create(workspaceId: string, text: string, dueAt?: string): WorkspaceReminder {
    const db = getDb();
    const id = nanoid(12);
    db.prepare('INSERT INTO workspace_reminders (id, workspace_id, text, due_at, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, workspaceId, text, dueAt ?? null);
    const row = db.prepare('SELECT * FROM workspace_reminders WHERE id = ?').get(id) as any;
    return rowToReminder(row);
  },

  toggle(id: string): WorkspaceReminder | null {
    const db = getDb();
    db.prepare('UPDATE workspace_reminders SET completed = 1 - completed WHERE id = ?').run(id);
    const row = db.prepare('SELECT * FROM workspace_reminders WHERE id = ?').get(id) as any;
    return row ? rowToReminder(row) : null;
  },

  delete(id: string): boolean {
    const db = getDb();
    return db.prepare('DELETE FROM workspace_reminders WHERE id = ?').run(id).changes > 0;
  },
};
