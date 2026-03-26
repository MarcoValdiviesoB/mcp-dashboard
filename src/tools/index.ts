import { z } from 'zod';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import * as workspaceTools from './workspace-tools.js';
import * as widgetTools from './widget-tools.js';
import * as utilityTools from './utility-tools.js';

const allDefinitions = [
  ...workspaceTools.definitions,
  ...widgetTools.definitions,
  ...utilityTools.definitions,
];

const allHandlers: Record<string, (args: any) => Promise<any>> = {
  ...workspaceTools.handlers,
  ...widgetTools.handlers,
  ...utilityTools.handlers,
};

export const TOOL_COUNT = allDefinitions.length;

export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const handler = allHandlers[name];
      if (!handler) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        };
      }
      return await handler(args ?? {});
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Validation error:\n${error.errors.map(e => `- ${e.path.join('.')}: ${e.message}`).join('\n')}`,
          }],
        };
      }
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  });
}
