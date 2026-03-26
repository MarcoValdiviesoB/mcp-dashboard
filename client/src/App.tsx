import { Component, type ReactNode } from 'react';
import { useSocketInit } from './hooks/use-socket';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Toaster } from 'sonner';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#f87171', fontFamily: 'monospace' }}>
          <h1>Dashboard Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#71717a', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardApp() {
  useSocketInit();
  return (
    <>
      <DashboardLayout />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(24 24 27)',
            border: '1px solid rgb(39 39 42)',
            color: 'rgb(244 244 245)',
          },
        }}
      />
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <DashboardApp />
    </ErrorBoundary>
  );
}
