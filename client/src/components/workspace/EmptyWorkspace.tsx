import { LayoutDashboard } from 'lucide-react';

export function EmptyWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <LayoutDashboard className="w-16 h-16 text-zinc-700 mb-4" />
      <h2 className="text-xl font-semibold text-zinc-400 mb-2">No Workspaces Yet</h2>
      <p className="text-sm text-zinc-600 max-w-md">
        Workspaces and widgets are created by Claude via MCP tools.
        Start a conversation and ask Claude to create a dashboard workspace.
      </p>
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left max-w-lg">
        <p className="text-xs text-zinc-500 mb-2">Example prompt for Claude:</p>
        <code className="text-xs text-blue-400">
          "Create a dashboard workspace called 'Analytics' and add a metric card showing total revenue of $158,000"
        </code>
      </div>
    </div>
  );
}
