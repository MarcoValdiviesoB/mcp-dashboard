#!/usr/bin/env node
/**
 * MCP Dashboard Server
 * Supports multiple instances: first one owns HTTP/Socket.io, others relay via HTTP.
 * Accessible on local network via 0.0.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

import { getDb } from './db.js';
import { initBridge, setRemoteMode, broadcast } from './bridge.js';
import { registerTools, TOOL_COUNT } from './tools/index.js';
import { WidgetStore } from './store/widget-store.js';
import { WorkspaceStore } from './store/workspace-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.DASHBOARD_PORT || '4800', 10);

function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        ips.push(info.address);
      }
    }
  }
  return ips;
}

function tryStartHttp(): Promise<boolean> {
  return new Promise((resolve) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDist));

    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', tools: TOOL_COUNT, primary: true });
    });

    // Local network info
    app.get('/api/network', (_req, res) => {
      const ips = getLocalIPs();
      res.json({
        ips,
        port: PORT,
        urls: ips.map(ip => `http://${ip}:${PORT}`),
      });
    });

    // ─── Events API (external systems push data here) ──────────
    app.post('/api/events', (req, res) => {
      const { action, ...payload } = req.body;

      try {
        switch (action) {
          case 'push_data': {
            let { widgetId, push } = payload;

            // Magic ID: find widget by source tag
            if (widgetId.startsWith('__') && widgetId.endsWith('__')) {
              const tag = widgetId.slice(2, -2);
              const db = getDb();
              const row = db.prepare('SELECT id FROM widgets WHERE source = ? LIMIT 1').get(tag) as any;
              if (row) widgetId = row.id;
              else { res.json({ ok: false, skipped: true, reason: 'No widget with source: ' + tag }); return; }
            }

            const widget = WidgetStore.pushData(widgetId, push);
            if (!widget) { res.status(404).json({ error: 'Widget not found' }); return; }
            broadcast({ type: 'widget_data_pushed', payload: { widgetId, push } });
            res.json({ ok: true, widgetId });
            break;
          }

          case 'update_widget': {
            const { widgetId, title, data, config } = payload;
            const widget = WidgetStore.update(widgetId, { title, data, config });
            if (!widget) { res.status(404).json({ error: 'Widget not found' }); return; }
            broadcast({ type: 'widget_updated', payload: widget });
            res.json({ ok: true, widgetId });
            break;
          }

          case 'create_widget': {
            const { workspaceId, type, title, data, config, position } = payload;
            const widget = WidgetStore.create({ workspaceId, type, title, data, config, position, source: 'api' });
            broadcast({ type: 'widget_created', payload: widget });
            res.json({ ok: true, widgetId: widget.id });
            break;
          }

          case 'notify': {
            const { type: nType, title, message, duration } = payload;
            broadcast({ type: 'notification', payload: { id: Date.now().toString(36), type: nType || 'info', title, message, duration } });
            res.json({ ok: true });
            break;
          }

          default:
            res.status(400).json({ error: `Unknown action: ${action}`, available: ['push_data', 'update_widget', 'create_widget', 'notify'] });
        }
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // GET helper to list widgets for integrations
    app.get('/api/workspaces', (_req, res) => {
      res.json(WorkspaceStore.listWithCounts());
    });

    app.get('/api/workspaces/:id/widgets', (req, res) => {
      const widgets = WidgetStore.listByWorkspace(req.params.id);
      res.json(widgets.map(w => ({ id: w.id, type: w.type, title: w.title })));
    });

    // Receive broadcast from secondary instances
    app.post('/api/broadcast', (req, res) => {
      const event = req.body;
      if (event && event.type) {
        broadcast(event);
      }
      res.json({ ok: true });
    });

    // SPA fallback
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });

    const httpServer = createServer(app);

    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[MCP Dashboard] Port ${PORT} in use -> secondary mode`);
        resolve(false);
      } else {
        console.error('[MCP Dashboard] HTTP error:', err);
        resolve(false);
      }
    });

    // Listen on 0.0.0.0 to accept connections from local network
    httpServer.listen(PORT, '0.0.0.0', () => {
      const ips = getLocalIPs();
      console.error(`[MCP Dashboard] HTTP server on http://localhost:${PORT}`);
      for (const ip of ips) {
        console.error(`   Network: http://${ip}:${PORT}`);
      }
      initBridge(httpServer);
      resolve(true);
    });
  });
}

async function main() {
  try {
    console.error('[MCP Dashboard] Initializing...');

    // 1. Database
    getDb();
    console.error('[MCP Dashboard] Database ready');

    // 2. Try to own the HTTP server
    const isPrimary = await tryStartHttp();

    if (!isPrimary) {
      setRemoteMode(PORT);
    }

    // 3. MCP server (always starts, regardless of HTTP)
    const mcpServer = new Server(
      { name: 'mcp-dashboard', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    registerTools(mcpServer);
    console.error(`[MCP Dashboard] ${TOOL_COUNT} tools registered`);

    // 4. Connect stdio
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);

    console.error(`[MCP Dashboard] Started (${isPrimary ? 'primary' : 'secondary'})`);
    console.error(`   Dashboard: http://localhost:${PORT}`);
  } catch (error) {
    console.error('[MCP Dashboard] Failed to start:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.error('[MCP Dashboard] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[MCP Dashboard] Shutting down...');
  process.exit(0);
});

main();
