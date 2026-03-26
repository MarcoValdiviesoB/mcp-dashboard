import { z } from 'zod';
import { WidgetStore } from '../store/widget-store.js';
import { broadcast } from '../bridge.js';
import type { WidgetType } from '../types.js';

const WIDGET_TYPES: WidgetType[] = [
  'metric_card', 'line_chart', 'bar_chart', 'pie_chart',
  'table', 'markdown', 'json_viewer', 'code_block',
  'terminal', 'timeline', 'progress_tracker', 'geometry', 'links', 'workspace_ref', 'section', 'project',
];

export const definitions = [
  {
    name: 'dashboard_create_widget',
    description: 'Create a widget in a workspace. Types: metric_card, line_chart, bar_chart, pie_chart, table, markdown, json_viewer, code_block, terminal, timeline, progress_tracker, geometry. The geometry type accepts {svg: string, viewBox?: string, background?: string} for direct SVG art - use it for geometric/artistic expression when other widgets fall short. Position is auto-calculated if omitted.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Target workspace ID' },
        type: { type: 'string', enum: WIDGET_TYPES, description: 'Widget type' },
        title: { type: 'string', description: 'Widget title' },
        data: { type: 'object', description: 'Data payload. EXACT formats by type: metric_card: {value: number|string, label: string, unit?: string, trend?: {direction: "up"|"down"|"flat", percentage: number}, sparkline?: number[]}. line_chart: {series: [{name: string, data: [{timestamp: string, value: number}], color?: string}], xLabel?, yLabel?}. bar_chart: {categories: string[], series: [{name: string, values: number[], color?: string}]}. pie_chart: {slices: [{label: string, value: number, color?: string}]}. table: {columns: [{key: string, label: string, type?: string, sortable?: boolean, align?: string}], rows: Record<string,unknown>[]}. markdown: {content: string}. json_viewer: {json: unknown}. code_block: {code: string, language: string, filename?: string}. terminal: {lines: [{text: string, type?: "stdout"|"stderr"}]}. timeline: {events: [{id: string, timestamp: string, title: string, description?: string, status?: "success"|"error"|"warning"|"info"|"pending"}]}. progress_tracker: {tasks: [{id: string, label: string, status: "pending"|"in_progress"|"completed"|"failed", progress?: number, message?: string}], overallProgress?: number}. geometry: {svg: string, viewBox?: string, background?: string}. links: {items: [{url: string, title: string, description?: string, icon?: "github"|"notion"|"slack"|"jira"|"figma"|"docs"|"globe"|"link", tag?: string}]}. workspace_ref: {workspaceId: string, note?: string} - creates a card that references another workspace for meta-dashboards. section: {label: string, description?: string} - full-width section divider/title to organize widgets visually. project: {name: string, description?: string, status?: "active"|"paused"|"archived"|"planning", repos?: [{name, url, description?, language?}], channels?: [{name, url?, type?: "slack"|"discord"|"teams"}], notion?: [{title, url, type?: "database"|"page"|"task"}], workspaceId?: string, tags?: string[]} - project hub card with repos, channels, notion pages and optional workspace link.' },
        config: { type: 'object', description: 'Optional presentation config' },
        position: {
          type: 'object',
          description: 'Grid position {x,y,w,h}. Omit for auto-placement.',
          properties: {
            x: { type: 'number' }, y: { type: 'number' },
            w: { type: 'number' }, h: { type: 'number' },
          },
        },
      },
      required: ['workspaceId', 'type', 'title', 'data'],
    },
  },
  {
    name: 'dashboard_update_widget',
    description: 'Update a widget\'s title, data, or config.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        widgetId: { type: 'string', description: 'Widget ID to update' },
        title: { type: 'string', description: 'New title' },
        data: { type: 'object', description: 'Full replacement of widget data' },
        config: { type: 'object', description: 'Config to merge into existing' },
      },
      required: ['widgetId'],
    },
  },
  {
    name: 'dashboard_push_data',
    description: 'Push incremental data to a widget. Merge semantics depend on type: metric_card replaces value; line_chart appends points to series; table appends rows; terminal appends lines; timeline prepends events; progress_tracker upserts tasks by id.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        widgetId: { type: 'string', description: 'Target widget ID' },
        push: { type: 'object', description: 'Data to push/merge' },
      },
      required: ['widgetId', 'push'],
    },
  },
  {
    name: 'dashboard_delete_widget',
    description: 'Delete a widget from the dashboard.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        widgetId: { type: 'string', description: 'Widget ID to delete' },
      },
      required: ['widgetId'],
    },
  },
  {
    name: 'dashboard_list_widgets',
    description: 'List all widgets in a workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
      },
      required: ['workspaceId'],
    },
  },
];

export const handlers: Record<string, (args: any) => Promise<any>> = {
  async dashboard_create_widget(args: any) {
    const parsed = z.object({
      workspaceId: z.string(),
      type: z.enum(WIDGET_TYPES as [string, ...string[]]),
      title: z.string().min(1),
      data: z.record(z.unknown()),
      config: z.record(z.unknown()).optional(),
      position: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1),
        h: z.number().int().min(1),
      }).optional(),
    }).parse(args);

    const widget = WidgetStore.create({
      ...parsed,
      type: parsed.type as WidgetType,
      source: 'mcp',
    });

    broadcast({ type: 'widget_created', payload: widget });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ widgetId: widget.id, type: widget.type, position: widget.position }),
      }],
    };
  },

  async dashboard_update_widget(args: any) {
    const parsed = z.object({
      widgetId: z.string(),
      title: z.string().optional(),
      data: z.record(z.unknown()).optional(),
      config: z.record(z.unknown()).optional(),
    }).parse(args);

    const widget = WidgetStore.update(parsed.widgetId, {
      title: parsed.title,
      data: parsed.data,
      config: parsed.config,
    });

    if (!widget) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Widget not found' }) }], isError: true };
    }

    broadcast({ type: 'widget_updated', payload: widget });
    return { content: [{ type: 'text', text: JSON.stringify({ widgetId: widget.id, updated: true }) }] };
  },

  async dashboard_push_data(args: any) {
    const parsed = z.object({
      widgetId: z.string(),
      push: z.record(z.unknown()),
    }).parse(args);

    const widget = WidgetStore.pushData(parsed.widgetId, parsed.push);
    if (!widget) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Widget not found' }) }], isError: true };
    }

    broadcast({ type: 'widget_data_pushed', payload: { widgetId: widget.id, push: parsed.push } });
    return { content: [{ type: 'text', text: JSON.stringify({ widgetId: widget.id, pushed: true }) }] };
  },

  async dashboard_delete_widget(args: any) {
    const { widgetId } = z.object({ widgetId: z.string() }).parse(args);
    const deleted = WidgetStore.delete(widgetId);

    if (deleted) {
      broadcast({ type: 'widget_deleted', payload: { widgetId } });
    }

    return { content: [{ type: 'text', text: JSON.stringify({ deleted, widgetId }) }] };
  },

  async dashboard_list_widgets(args: any) {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(args);
    const widgets = WidgetStore.listByWorkspace(workspaceId);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(widgets.map(w => ({
          id: w.id, type: w.type, title: w.title, position: w.position,
        }))),
      }],
    };
  },
};
