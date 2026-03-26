import { WorkspaceTabs, ActivityBar } from './Sidebar';
import { WorkspaceView } from '../workspace/WorkspaceView';

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WorkspaceTabs />
      <main className="flex-1 overflow-y-auto dashboard-bg relative">
        <div className="relative z-10">
          <WorkspaceView />
        </div>
      </main>
      <ActivityBar />
    </div>
  );
}
