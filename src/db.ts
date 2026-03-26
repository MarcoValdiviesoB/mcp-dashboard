import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DASHBOARD_DB || path.join(__dirname, '..', 'data', 'dashboard.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name)
  );

  for (const [name, sql] of MIGRATIONS) {
    if (!applied.has(name)) {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
      console.error(`[Dashboard DB] Migration applied: ${name}`);
    }
  }
}

const MIGRATIONS: [string, string][] = [
  ['001_initial', `
    CREATE TABLE IF NOT EXISTS workspaces (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      icon        TEXT,
      columns     INTEGER NOT NULL DEFAULT 12,
      row_height  INTEGER NOT NULL DEFAULT 80,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS widgets (
      id            TEXT PRIMARY KEY,
      workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      type          TEXT NOT NULL,
      title         TEXT NOT NULL,
      data          TEXT NOT NULL DEFAULT '{}',
      config        TEXT NOT NULL DEFAULT '{}',
      pos_x         INTEGER NOT NULL DEFAULT 0,
      pos_y         INTEGER NOT NULL DEFAULT 0,
      pos_w         INTEGER NOT NULL DEFAULT 4,
      pos_h         INTEGER NOT NULL DEFAULT 3,
      source        TEXT,
      pinned        INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_widgets_workspace ON widgets(workspace_id);

    CREATE TABLE IF NOT EXISTS artifacts (
      id          TEXT PRIMARY KEY,
      widget_id   TEXT REFERENCES widgets(id) ON DELETE SET NULL,
      type        TEXT NOT NULL,
      name        TEXT NOT NULL,
      content     TEXT NOT NULL,
      metadata    TEXT NOT NULL DEFAULT '{}',
      tags        TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_artifacts_widget ON artifacts(widget_id);

    CREATE TABLE IF NOT EXISTS activity_log (
      id              TEXT PRIMARY KEY,
      timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
      server_name     TEXT NOT NULL,
      tool_name       TEXT NOT NULL,
      params          TEXT,
      result_summary  TEXT,
      workspace_id    TEXT,
      widget_id       TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC);
  `],
  ['002_workspace_archived', `
    ALTER TABLE workspaces ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
  `],
  ['003_workspace_utilities', `
    CREATE TABLE IF NOT EXISTS workspace_tasks (
      id            TEXT PRIMARY KEY,
      workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      text          TEXT NOT NULL,
      completed     INTEGER NOT NULL DEFAULT 0,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ws_tasks_workspace ON workspace_tasks(workspace_id);

    CREATE TABLE IF NOT EXISTS workspace_highlights (
      id            TEXT PRIMARY KEY,
      workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      text          TEXT NOT NULL,
      color         TEXT NOT NULL DEFAULT 'blue',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ws_highlights_workspace ON workspace_highlights(workspace_id);
  `],
];

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
