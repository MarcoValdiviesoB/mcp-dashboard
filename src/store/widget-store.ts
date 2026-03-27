import { nanoid } from 'nanoid';
import { getDb } from '../db.js';
import type { Widget, WidgetType, Position, WIDGET_REGISTRY } from '../types.js';
import { WIDGET_REGISTRY as registry } from '../types.js';

function rowToWidget(row: any): Widget {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type as WidgetType,
    title: row.title,
    data: JSON.parse(row.data),
    config: JSON.parse(row.config),
    position: { x: row.pos_x, y: row.pos_y, w: row.pos_w, h: row.pos_h },
    source: row.source ?? undefined,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function autoPlace(existingWidgets: Widget[], widgetType: WidgetType, columns: number): Position {
  const def = registry[widgetType];
  const { w, h } = def.defaultSize;

  const occupied = new Set<string>();
  let maxY = 0;

  for (const widget of existingWidgets) {
    const p = widget.position;
    for (let dx = 0; dx < p.w; dx++) {
      for (let dy = 0; dy < p.h; dy++) {
        occupied.add(`${p.x + dx},${p.y + dy}`);
      }
    }
    maxY = Math.max(maxY, p.y + p.h);
  }

  for (let y = 0; y <= maxY + h; y++) {
    for (let x = 0; x <= columns - w; x++) {
      let fits = true;
      for (let dx = 0; dx < w && fits; dx++) {
        for (let dy = 0; dy < h && fits; dy++) {
          if (occupied.has(`${x + dx},${y + dy}`)) fits = false;
        }
      }
      if (fits) return { x, y, w, h };
    }
  }

  return { x: 0, y: maxY, w, h };
}

export const WidgetStore = {
  create(params: {
    workspaceId: string;
    type: WidgetType;
    title: string;
    data: unknown;
    config?: Record<string, unknown>;
    position?: Position;
    source?: string;
  }): Widget {
    const db = getDb();
    const id = nanoid(12);
    const now = new Date().toISOString();

    // Auto-place if no position given
    let pos = params.position;
    if (!pos) {
      const existing = this.listByWorkspace(params.workspaceId);
      const wsRow = db.prepare('SELECT columns FROM workspaces WHERE id = ?').get(params.workspaceId) as any;
      const columns = wsRow?.columns ?? 12;
      pos = autoPlace(existing, params.type, columns);
    }

    db.prepare(`
      INSERT INTO widgets (id, workspace_id, type, title, data, config, pos_x, pos_y, pos_w, pos_h, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, params.workspaceId, params.type, params.title,
      JSON.stringify(params.data), JSON.stringify(params.config ?? {}),
      pos.x, pos.y, pos.w, pos.h,
      params.source ?? null, now, now
    );

    return this.get(id)!;
  },

  get(id: string): Widget | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as any;
    return row ? rowToWidget(row) : null;
  },

  listByWorkspace(workspaceId: string): Widget[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM widgets WHERE workspace_id = ? ORDER BY created_at ASC').all(workspaceId);
    return rows.map(rowToWidget);
  },

  update(id: string, params: { title?: string; data?: unknown; config?: Record<string, unknown> }): Widget | null {
    const db = getDb();
    const existing = this.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const newData = params.data !== undefined ? JSON.stringify(params.data) : undefined;
    const newConfig = params.config !== undefined
      ? JSON.stringify({ ...existing.config, ...params.config })
      : undefined;

    db.prepare(`
      UPDATE widgets SET
        title = COALESCE(?, title),
        data = COALESCE(?, data),
        config = COALESCE(?, config),
        updated_at = ?
      WHERE id = ?
    `).run(params.title ?? null, newData ?? null, newConfig ?? null, now, id);

    return this.get(id);
  },

  pushData(id: string, push: unknown): Widget | null {
    const existing = this.get(id);
    if (!existing) return null;

    const merged = mergeData(existing.type, existing.data, push);
    return this.update(id, { data: merged });
  },

  updatePosition(id: string, position: Position): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE widgets SET pos_x = ?, pos_y = ?, pos_w = ?, pos_h = ?, updated_at = ?
      WHERE id = ?
    `).run(position.x, position.y, position.w, position.h, now, id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM widgets WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

function mergeData(type: WidgetType, current: unknown, push: unknown): unknown {
  const cur = current as any;
  const p = push as any;

  switch (type) {
    case 'metric_card':
      return { ...cur, ...p, sparkline: p.sparkline ? [...(cur.sparkline ?? []), ...p.sparkline].slice(-50) : cur.sparkline };

    case 'line_chart': {
      const series = [...(cur.series ?? [])];
      for (const pushed of (p.series ?? [])) {
        const idx = series.findIndex((s: any) => s.name === pushed.name);
        if (idx >= 0) {
          series[idx] = { ...series[idx], data: [...series[idx].data, ...pushed.data] };
        } else {
          series.push(pushed);
        }
      }
      return { ...cur, series };
    }

    case 'bar_chart': {
      const series = [...(cur.series ?? [])];
      for (const pushed of (p.series ?? [])) {
        const idx = series.findIndex((s: any) => s.name === pushed.name);
        if (idx >= 0) {
          series[idx] = { ...series[idx], values: pushed.values };
        } else {
          series.push(pushed);
        }
      }
      return { ...cur, series, categories: p.categories ?? cur.categories };
    }

    case 'pie_chart':
      return { ...cur, slices: p.slices ?? cur.slices };

    case 'table': {
      const maxRows = (cur as any).maxRows ?? 500;
      const rows = [...(cur.rows ?? []), ...(p.rows ?? [])].slice(-maxRows);
      return { ...cur, rows, columns: p.columns ?? cur.columns };
    }

    case 'terminal': {
      const maxLines = 1000;
      const lines = [...(cur.lines ?? []), ...(p.lines ?? [])].slice(-maxLines);
      return { ...cur, lines };
    }

    case 'timeline': {
      const events = [...(p.events ?? []), ...(cur.events ?? [])];
      return { ...cur, events };
    }

    case 'progress_tracker': {
      const tasks = [...(cur.tasks ?? [])];
      for (const pushed of (p.tasks ?? [])) {
        const idx = tasks.findIndex((t: any) => t.id === pushed.id);
        if (idx >= 0) {
          tasks[idx] = { ...tasks[idx], ...pushed };
        } else {
          tasks.push(pushed);
        }
      }
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const overallProgress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      return { ...cur, tasks, overallProgress };
    }

    case 'links': {
      const items = [...(cur.items ?? []), ...(p.items ?? [])];
      return { ...cur, items };
    }

    case 'project': {
      if (p.endpoints) {
        const endpoints = [...(cur.endpoints ?? [])];
        for (const ep of p.endpoints) {
          const idx = endpoints.findIndex((e: any) => e.name === ep.name || e.url === ep.url);
          if (idx >= 0) endpoints[idx] = { ...endpoints[idx], ...ep };
          else endpoints.push(ep);
        }
        return { ...cur, ...p, endpoints };
      }
      return { ...cur, ...p };
    }

    default:
      return { ...cur, ...p };
  }
}
