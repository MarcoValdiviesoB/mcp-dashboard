import { useEffect } from 'react';
import { useDashboardStore } from '../stores/dashboard-store';
import { getSocket, socketEmit } from '../lib/socket';

export { socketEmit } from '../lib/socket';
export { socketRequest } from '../lib/socket';

let initialized = false;

export function useSocketInit() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const s = getSocket();
    const store = useDashboardStore;

    s.on('connect', () => {
      console.log('[Dashboard] Connected');
      store.getState().setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Dashboard] Disconnected');
      store.getState().setConnected(false);
    });

    s.on('dashboard_event', (event: any) => {
      const state = store.getState();
      switch (event.type) {
        case 'init':
          state.initState(event.payload.workspaces, event.payload.widgets);
          break;
        case 'workspace_created':
          state.addWorkspace(event.payload);
          break;
        case 'workspace_updated':
          state.updateWorkspace(event.payload);
          break;
        case 'workspace_deleted':
          state.removeWorkspace(event.payload.workspaceId);
          break;
        case 'widget_created':
          state.addWidget(event.payload);
          break;
        case 'widget_updated':
          state.updateWidget(event.payload);
          break;
        case 'widget_data_pushed':
          state.pushWidgetData(event.payload.widgetId, event.payload.push);
          break;
        case 'widget_deleted':
          state.removeWidget(event.payload.widgetId);
          break;
        case 'activity':
          state.addActivity(event.payload);
          break;
        case 'notification':
          console.log('[Dashboard] Notification:', event.payload);
          break;
      }
    });
  }, []);
}
