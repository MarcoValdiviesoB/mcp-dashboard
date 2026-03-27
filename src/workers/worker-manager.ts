import os from 'os';
import { execSync } from 'child_process';
import { WidgetStore } from '../store/widget-store.js';
import { broadcast } from '../bridge.js';

export interface WorkerConfig {
  id: string;
  widgetId: string;
  type: string;
  interval: number; // ms
  params?: Record<string, unknown>;
}

interface RunningWorker {
  config: WorkerConfig;
  timer: ReturnType<typeof setInterval>;
  startedAt: string;
}

const workers = new Map<string, RunningWorker>();

// ─── Worker Type Implementations ──────────────────────────────

const WORKER_TYPES: Record<string, (config: WorkerConfig) => unknown> = {

  system_cpu: () => {
    const cpus = os.cpus();
    const usage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return Math.round(((total - idle) / total) * 100);
    });
    const avg = Math.round(usage.reduce((a, b) => a + b, 0) / usage.length);
    return { value: avg, label: 'CPU USAGE', unit: '%', sparkline: [avg] };
  },

  system_memory: () => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const pct = Math.round((used / total) * 100);
    const usedGB = (used / 1073741824).toFixed(1);
    const totalGB = (total / 1073741824).toFixed(1);
    return { value: `${usedGB}/${totalGB}`, label: 'MEMORY', unit: 'GB', sparkline: [pct] };
  },

  system_uptime: () => {
    const secs = os.uptime();
    const days = Math.floor(secs / 86400);
    const hrs = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return { value: days > 0 ? `${days}d ${hrs}h` : `${hrs}h ${mins}m`, label: 'UPTIME' };
  },

  system_load: () => {
    const load = os.loadavg();
    return {
      value: load[0].toFixed(2),
      label: 'LOAD AVG',
      unit: `/ ${os.cpus().length} cores`,
      trend: { direction: load[0] > load[2] ? 'up' : load[0] < load[2] ? 'down' : 'flat', percentage: Math.round(Math.abs(load[0] - load[2]) / (load[2] || 1) * 100) },
    };
  },

  system_full: () => {
    const cpus = os.cpus();
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return Math.round(((total - cpu.times.idle) / total) * 100);
    });
    const avgCpu = Math.round(cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length);
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const memPct = Math.round((usedMem / totalMem) * 100);
    const load = os.loadavg();

    return {
      series: [
        { name: 'CPU %', data: [{ timestamp: new Date().toISOString(), value: avgCpu }] },
        { name: 'Memory %', data: [{ timestamp: new Date().toISOString(), value: memPct }] },
      ],
    };
  },

  system_processes: () => {
    const cpus = os.cpus();
    return {
      columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' }],
      rows: [
        { metric: 'Platform', value: `${os.platform()} ${os.arch()}` },
        { metric: 'Node.js', value: process.version },
        { metric: 'CPU Cores', value: cpus.length },
        { metric: 'CPU Model', value: cpus[0]?.model?.split('@')[0]?.trim() || 'Unknown' },
        { metric: 'Total Memory', value: `${(os.totalmem() / 1073741824).toFixed(1)} GB` },
        { metric: 'Free Memory', value: `${(os.freemem() / 1073741824).toFixed(1)} GB` },
        { metric: 'Uptime', value: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m` },
        { metric: 'Load Avg (1/5/15m)', value: os.loadavg().map(l => l.toFixed(2)).join(' / ') },
        { metric: 'Hostname', value: os.hostname() },
      ],
    };
  },

  http_poll: async (config: WorkerConfig) => {
    const url = config.params?.url as string;
    if (!url) return { value: 'No URL', label: 'ERROR' };
    try {
      const start = Date.now();
      const res = await fetch(url);
      const ms = Date.now() - start;
      return {
        lines: [{
          text: `${res.status} ${res.statusText} - ${ms}ms - ${url}`,
          type: res.ok ? 'stdout' : 'stderr',
          timestamp: new Date().toISOString(),
        }],
      };
    } catch (err: any) {
      return {
        lines: [{
          text: `ERROR: ${err.message} - ${url}`,
          type: 'stderr',
          timestamp: new Date().toISOString(),
        }],
      };
    }
  },

  // Fetch a URL and push the JSON body directly as widget data
  http_json: async (config: WorkerConfig) => {
    const url = config.params?.url as string;
    if (!url) return { value: 'No URL', label: 'ERROR' };
    try {
      const res = await fetch(url);
      if (!res.ok) return { value: `HTTP ${res.status}`, label: 'ERROR' };
      const body = await res.json();
      return body;
    } catch (err: any) {
      return { value: 'Error', label: err.message };
    }
  },

  // Execute a shell command and push parsed JSON output as widget data
  shell_exec: (config: WorkerConfig) => {
    const cmd = config.params?.command as string;
    if (!cmd) return { value: 'No command', label: 'ERROR' };
    try {
      const output = execSync(cmd, { timeout: 10000, encoding: 'utf-8' }).trim();
      try {
        return JSON.parse(output);
      } catch {
        // If not JSON, return as terminal lines
        return {
          lines: output.split('\n').map((text: string) => ({
            text,
            type: 'stdout' as const,
            timestamp: new Date().toISOString(),
          })),
        };
      }
    } catch (err: any) {
      return {
        lines: [{
          text: `ERROR: ${err.message}`,
          type: 'stderr' as const,
          timestamp: new Date().toISOString(),
        }],
      };
    }
  },
};

// ─── Manager ──────────────────────────────────────────────────

export function startWorker(config: WorkerConfig): { ok: boolean; error?: string } {
  if (workers.has(config.id)) {
    return { ok: false, error: 'Worker already running with this ID' };
  }

  const handler = WORKER_TYPES[config.type];
  if (!handler) {
    return { ok: false, error: `Unknown worker type: ${config.type}. Available: ${Object.keys(WORKER_TYPES).join(', ')}` };
  }

  const tick = async () => {
    try {
      const data = await handler(config);
      if (!data) return;

      // Push data to widget
      const widget = WidgetStore.pushData(config.widgetId, data);
      if (widget) {
        broadcast({ type: 'widget_data_pushed', payload: { widgetId: config.widgetId, push: data } });
      }
    } catch (err: any) {
      console.error(`[Worker ${config.id}] Error:`, err.message);
    }
  };

  // Run immediately then on interval
  tick();
  const timer = setInterval(tick, config.interval);

  workers.set(config.id, { config, timer, startedAt: new Date().toISOString() });
  console.error(`[Worker] Started: ${config.id} (${config.type}) -> widget ${config.widgetId} every ${config.interval}ms`);
  return { ok: true };
}

export function stopWorker(id: string): boolean {
  const worker = workers.get(id);
  if (!worker) return false;
  clearInterval(worker.timer);
  workers.delete(id);
  console.error(`[Worker] Stopped: ${id}`);
  return true;
}

export function listWorkers(): Array<{ id: string; type: string; widgetId: string; interval: number; startedAt: string }> {
  return [...workers.values()].map(w => ({
    id: w.config.id,
    type: w.config.type,
    widgetId: w.config.widgetId,
    interval: w.config.interval,
    startedAt: w.startedAt,
  }));
}

export function stopAllWorkers(): void {
  for (const [id] of workers) {
    stopWorker(id);
  }
}
