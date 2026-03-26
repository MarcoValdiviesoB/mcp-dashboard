# MCP Dashboard

Dashboard interactivo que funciona como MCP server. Crea workspaces, widgets y graficos en tiempo real.

## MCP Tools Disponibles

- `dashboard_create_workspace` - Crear workspace (name, description?, icon?)
- `dashboard_list_workspaces` - Listar workspaces
- `dashboard_delete_workspace` - Eliminar workspace
- `dashboard_create_widget` - Crear widget (workspaceId, type, title, data, config?, position?)
- `dashboard_update_widget` - Actualizar widget
- `dashboard_push_data` - Push incremental de datos a un widget
- `dashboard_delete_widget` - Eliminar widget
- `dashboard_list_widgets` - Listar widgets de un workspace
- `dashboard_snapshot` - Snapshot del workspace
- `dashboard_notify` - Enviar notificacion toast al dashboard
- `dashboard_report_activity` - Reportar actividad de otros MCPs

## Widget Types

metric_card, line_chart, bar_chart, pie_chart, table, markdown, json_viewer, code_block, terminal, timeline, progress_tracker

## Desarrollo

```bash
npm run dev          # Server MCP + Client Vite en paralelo
npm run build:all    # Build completo
npm start            # Produccion (server + SPA)
```

## Observabilidad MCP

Despues de llamar herramientas en otros MCP servers, reporta la actividad al dashboard:
```
dashboard_report_activity({ serverName: "tables-mcp", toolName: "get_orders", resultSummary: "Fetched 42 orders" })
```
