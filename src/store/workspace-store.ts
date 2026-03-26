import { nanoid } from 'nanoid';
import { getDb } from '../db.js';
import type { Workspace } from '../types.js';

function rowToWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    columns: row.columns,
    rowHeight: row.row_height,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const WorkspaceStore = {
  create(params: { name: string; description?: string; icon?: string; columns?: number; rowHeight?: number }): Workspace {
    const db = getDb();
    const id = nanoid(12);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO workspaces (id, name, description, icon, columns, row_height, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, params.name, params.description ?? null, params.icon ?? null, params.columns ?? 12, params.rowHeight ?? 80, now, now);

    return this.get(id)!;
  },

  get(id: string): Workspace | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as any;
    return row ? rowToWorkspace(row) : null;
  },

  list(): Workspace[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM workspaces WHERE archived = 0 ORDER BY created_at DESC').all();
    return rows.map(rowToWorkspace);
  },

  listArchived(): Workspace[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM workspaces WHERE archived = 1 ORDER BY updated_at DESC').all();
    return rows.map(rowToWorkspace);
  },

  listAll(): Workspace[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM workspaces ORDER BY created_at DESC').all();
    return rows.map(rowToWorkspace);
  },

  listWithCounts(): (Workspace & { widgetCount: number })[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT w.*, COUNT(wg.id) as widget_count
      FROM workspaces w
      LEFT JOIN widgets wg ON wg.workspace_id = w.id
      WHERE w.archived = 0
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `).all() as any[];
    return rows.map(row => ({
      ...rowToWorkspace(row),
      widgetCount: row.widget_count,
    }));
  },

  archive(id: string): Workspace | null {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE workspaces SET archived = 1, updated_at = ? WHERE id = ?').run(now, id);
    return this.get(id);
  },

  unarchive(id: string): Workspace | null {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE workspaces SET archived = 0, updated_at = ? WHERE id = ?').run(now, id);
    return this.get(id);
  },

  update(id: string, params: { name?: string; description?: string; icon?: string }): Workspace | null {
    const db = getDb();
    const existing = this.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE workspaces SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        updated_at = ?
      WHERE id = ?
    `).run(params.name ?? null, params.description ?? null, params.icon ?? null, now, id);

    return this.get(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
