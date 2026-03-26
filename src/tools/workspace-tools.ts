import { z } from 'zod';
import { WorkspaceStore } from '../store/workspace-store.js';
import { WidgetStore } from '../store/widget-store.js';
import { broadcast } from '../bridge.js';

export const definitions = [
  {
    name: 'dashboard_create_workspace',
    description: 'Create a new workspace in the dashboard. Workspaces are top-level containers for widgets.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Workspace name' },
        description: { type: 'string', description: 'Optional description' },
        icon: { type: 'string', description: 'Emoji or icon name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'dashboard_list_workspaces',
    description: 'List all workspaces with their widget counts.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'dashboard_delete_workspace',
    description: 'Delete a workspace and all its widgets.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID to delete' },
      },
      required: ['workspaceId'],
    },
  },
];

export const handlers: Record<string, (args: any) => Promise<any>> = {
  async dashboard_create_workspace(args: any) {
    const parsed = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      icon: z.string().optional(),
    }).parse(args);

    const workspace = WorkspaceStore.create(parsed);
    broadcast({ type: 'workspace_created', payload: workspace });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ workspaceId: workspace.id, name: workspace.name, message: `Workspace "${workspace.name}" created. Open http://localhost:${process.env.DASHBOARD_PORT || 4800} to view.` }),
      }],
    };
  },

  async dashboard_list_workspaces() {
    const workspaces = WorkspaceStore.listWithCounts();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(workspaces.map(ws => ({
          id: ws.id,
          name: ws.name,
          description: ws.description,
          icon: ws.icon,
          widgetCount: ws.widgetCount,
          createdAt: ws.createdAt,
        }))),
      }],
    };
  },

  async dashboard_delete_workspace(args: any) {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(args);
    const deleted = WorkspaceStore.delete(workspaceId);

    if (deleted) {
      broadcast({ type: 'workspace_deleted', payload: { workspaceId } });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ deleted, workspaceId }),
      }],
    };
  },
};
