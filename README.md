# MCP Dashboard

Interactive dashboard that works as an MCP server. Claude Code (or any MCP client) calls tools to create workspaces, widgets, and artifacts in real-time. The browser renders everything live via Socket.io.

```
Claude Code  --stdio-->  MCP Server (Node.js)  --Socket.io-->  Browser Dashboard
                              |                                    (React 19)
                         Express HTTP (0.0.0.0)
                         SQLite (better-sqlite3)
```

## Quick Start

```bash
npm install
npm run build:all
npm start
# Dashboard at http://localhost:4800
```

For development:

```bash
npm run dev    # Server + Client in parallel
```

## MCP Setup

Add to your Claude Code config (`~/.claude.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "mcp-dashboard": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-dashboard/dist/index.js"],
      "env": { "DASHBOARD_PORT": "4800" }
    }
  }
}
```

## 18 MCP Tools

### Workspaces
| Tool | Description |
|------|-------------|
| `dashboard_create_workspace` | Create a workspace (name, description, icon) |
| `dashboard_list_workspaces` | List all workspaces with widget counts |
| `dashboard_delete_workspace` | Delete a workspace and all its widgets |

### Widgets
| Tool | Description |
|------|-------------|
| `dashboard_create_widget` | Create a widget in a workspace |
| `dashboard_update_widget` | Update widget data, title, or config |
| `dashboard_push_data` | Push incremental data (append rows, points, etc.) |
| `dashboard_delete_widget` | Remove a widget |
| `dashboard_list_widgets` | List widgets in a workspace |

### Tasks & Reminders
| Tool | Description |
|------|-------------|
| `dashboard_add_task` | Add a task to a workspace |
| `dashboard_list_tasks` | List tasks |
| `dashboard_complete_task` | Toggle task completion |
| `dashboard_add_reminder` | Add a reminder with optional due date |
| `dashboard_list_reminders` | List reminders |
| `dashboard_complete_reminder` | Toggle reminder completion |

### Highlights & Utilities
| Tool | Description |
|------|-------------|
| `dashboard_pin_widget` | Pin/unpin widget as highlight |
| `dashboard_snapshot` | Snapshot workspace state as artifact |
| `dashboard_notify` | Send toast notification to dashboard |
| `dashboard_report_activity` | Log MCP activity from other servers |

## 15 Widget Types

| Type | Description | Streaming |
|------|-------------|-----------|
| `metric_card` | Single KPI with trend and sparkline | Yes |
| `line_chart` | Time series (Recharts) | Yes |
| `bar_chart` | Categorical comparison | Yes |
| `pie_chart` | Distribution donut chart | No |
| `table` | Sortable, paginated data table | Yes |
| `markdown` | Rich text with GFM tables | No |
| `json_viewer` | Collapsible JSON tree | No |
| `code_block` | Syntax-highlighted code | No |
| `terminal` | Streaming command output | Yes |
| `timeline` | Chronological events | Yes |
| `progress_tracker` | Task progress with overall bar | Yes |
| `geometry` | SVG art canvas for visual expression | No |
| `links` | Bookmark collection with auto-icons | Yes |
| `project` | Project hub: repos, Slack, Notion, workspace link | No |
| `workspace_ref` | Card referencing another workspace | No |
| `section` | Full-width divider/title | No |

## Data Formats

Each widget type has a specific data schema. The MCP tool description includes all formats. Examples:

```javascript
// Metric Card
{ value: 158000, label: "Revenue", unit: "$", trend: { direction: "up", percentage: 12.5 }, sparkline: [120, 135, 155, 158] }

// Bar Chart
{ categories: ["North", "South", "East"], series: [{ name: "Q1", values: [42000, 35000, 28000], color: "#60a5fa" }] }

// Line Chart
{ series: [{ name: "Revenue", data: [{ timestamp: "2026-01", value: 45000 }], color: "#60a5fa" }] }

// Table
{ columns: [{ key: "name", label: "Name", sortable: true }], rows: [{ name: "Acme Corp" }] }

// Project
{ name: "Tables", status: "active", repos: [{ name: "tables-sdk", url: "https://...", language: "TypeScript" }], channels: [{ name: "dev", type: "slack" }], notion: [{ title: "Docs", url: "https://...", type: "database" }], workspaceId: "xxx" }

// Geometry (SVG art)
{ svg: "<circle cx='200' cy='200' r='50' fill='#60a5fa'/>", viewBox: "0 0 400 400" }
```

## Features

- **Real-time**: Socket.io bridge pushes updates instantly to all connected browsers
- **Multi-instance**: Multiple Claude Code sessions share the same dashboard. First instance owns HTTP, others relay via API
- **Drag & resize**: react-grid-layout with drag handles and resize
- **Highlights**: Pin any widget to a featured row at the top
- **Tasks & Reminders**: Per-workspace todo lists and reminders with due dates
- **Archive**: Workspaces can be archived and restored
- **Expand**: Click any widget title to view fullscreen
- **Markdown**: Full GFM support with expand-to-page
- **PDF export**: One-click workspace export to PDF
- **LAN sharing**: Share workspace URLs on local network
- **Activity bar**: Shows MCP activity stream and overdue reminders
- **Workspace references**: Meta-dashboards that link to other workspaces
- **Dark theme**: Futuristic AI aesthetic with neural grid, scan lines, and ambient glow

## Tech Stack

**Server**: Node.js 20, TypeScript, @modelcontextprotocol/sdk, Express 5, Socket.io 4, better-sqlite3, Zod

**Client**: React 19, Vite 6, TailwindCSS 4.1, Recharts, react-grid-layout, Zustand, Lucide icons, html2canvas-pro, jsPDF

## License

MIT
