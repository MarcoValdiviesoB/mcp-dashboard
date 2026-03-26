// ─── Widget Types ─────────────────────────────────────────────

export type WidgetType =
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'markdown'
  | 'json_viewer'
  | 'code_block'
  | 'terminal'
  | 'timeline'
  | 'progress_tracker'
  | 'geometry'
  | 'links'
  | 'workspace_ref'
  | 'section'
  | 'project';

export interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── Widget Data Contracts ────────────────────────────────────

export interface MetricCardData {
  value: number | string;
  label: string;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; percentage: number };
  icon?: string;
  color?: string;
  sparkline?: number[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface LineChartData {
  series: Array<{ name: string; data: TimeSeriesPoint[]; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

export interface BarChartData {
  categories: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

export interface PieChartData {
  slices: Array<{ label: string; value: number; color?: string }>;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export interface MarkdownData {
  content: string;
}

export interface JsonViewerData {
  json: unknown;
  rootLabel?: string;
}

export interface CodeBlockData {
  code: string;
  language: string;
  filename?: string;
}

export interface TerminalLine {
  text: string;
  type?: 'stdout' | 'stderr' | 'stdin' | 'system';
  timestamp?: string;
}

export interface TerminalData {
  lines: TerminalLine[];
  title?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending';
  icon?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
}

export interface ProgressTask {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  message?: string;
}

export interface ProgressTrackerData {
  tasks: ProgressTask[];
  title?: string;
  overallProgress?: number;
}

// ─── Geometry (SVG Art) ────────────────────────────────────────

export interface GeometryData {
  /** Direct SVG markup string - maximum creative freedom */
  svg?: string;
  /** Viewbox dimensions (default "0 0 400 400") */
  viewBox?: string;
  /** Background color (default transparent) */
  background?: string;
}

// ─── Links ────────────────────────────────────────────────────

export interface LinkItem {
  url: string;
  title: string;
  description?: string;
  icon?: 'github' | 'notion' | 'slack' | 'jira' | 'figma' | 'docs' | 'link' | 'globe' | string;
  tag?: string;
}

export interface LinksData {
  items: LinkItem[];
}

// ─── Workspace Reference ──────────────────────────────────────

export interface WorkspaceRefData {
  workspaceId: string;
  note?: string;
}

// ─── Widget Data Map ──────────────────────────────────────────

export interface WidgetDataMap {
  metric_card: MetricCardData;
  line_chart: LineChartData;
  bar_chart: BarChartData;
  pie_chart: PieChartData;
  table: TableData;
  markdown: MarkdownData;
  json_viewer: JsonViewerData;
  code_block: CodeBlockData;
  terminal: TerminalData;
  timeline: TimelineData;
  progress_tracker: ProgressTrackerData;
  geometry: GeometryData;
  links: LinksData;
  workspace_ref: WorkspaceRefData;
  section: { label: string; description?: string };
  project: ProjectData;
}

// ─── Project ──────────────────────────────────────────────────

export interface ProjectRepo {
  name: string;
  url: string;
  description?: string;
  language?: string;
}

export interface ProjectChannel {
  name: string;
  url?: string;
  type?: 'slack' | 'discord' | 'teams';
}

export interface ProjectNotionPage {
  title: string;
  url: string;
  type?: 'database' | 'page' | 'task';
}

export interface ProjectData {
  name: string;
  description?: string;
  status?: 'active' | 'paused' | 'archived' | 'planning';
  repos?: ProjectRepo[];
  channels?: ProjectChannel[];
  notion?: ProjectNotionPage[];
  workspaceId?: string;
  tags?: string[];
}

// ─── Core Entities ────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  columns: number;
  rowHeight: number;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  workspaceId: string;
  type: WidgetType;
  title: string;
  data: unknown;
  config?: Record<string, unknown>;
  position: Position;
  source?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Artifact {
  id: string;
  widgetId?: string;
  type: 'dataset' | 'template' | 'snapshot' | 'image' | 'document' | 'config';
  name: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  serverName: string;
  toolName: string;
  params?: unknown;
  resultSummary?: string;
  workspaceId?: string;
  widgetId?: string;
}

// ─── Widget Registry ──────────────────────────────────────────

export interface WidgetTypeDefinition {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: Pick<Position, 'w' | 'h'>;
  minSize: Pick<Position, 'w' | 'h'>;
  supportsStreaming: boolean;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetTypeDefinition> = {
  metric_card: {
    type: 'metric_card', label: 'Metric Card', icon: 'hash',
    defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, supportsStreaming: true,
  },
  line_chart: {
    type: 'line_chart', label: 'Line Chart', icon: 'trending-up',
    defaultSize: { w: 6, h: 4 }, minSize: { w: 4, h: 3 }, supportsStreaming: true,
  },
  bar_chart: {
    type: 'bar_chart', label: 'Bar Chart', icon: 'bar-chart-2',
    defaultSize: { w: 6, h: 4 }, minSize: { w: 4, h: 3 }, supportsStreaming: true,
  },
  pie_chart: {
    type: 'pie_chart', label: 'Pie Chart', icon: 'pie-chart',
    defaultSize: { w: 4, h: 4 }, minSize: { w: 3, h: 3 }, supportsStreaming: false,
  },
  table: {
    type: 'table', label: 'Table', icon: 'table-2',
    defaultSize: { w: 8, h: 5 }, minSize: { w: 4, h: 3 }, supportsStreaming: true,
  },
  markdown: {
    type: 'markdown', label: 'Markdown', icon: 'file-text',
    defaultSize: { w: 6, h: 4 }, minSize: { w: 3, h: 2 }, supportsStreaming: false,
  },
  json_viewer: {
    type: 'json_viewer', label: 'JSON Viewer', icon: 'braces',
    defaultSize: { w: 6, h: 5 }, minSize: { w: 4, h: 3 }, supportsStreaming: false,
  },
  code_block: {
    type: 'code_block', label: 'Code Block', icon: 'code-2',
    defaultSize: { w: 6, h: 5 }, minSize: { w: 4, h: 3 }, supportsStreaming: false,
  },
  terminal: {
    type: 'terminal', label: 'Terminal', icon: 'terminal',
    defaultSize: { w: 8, h: 5 }, minSize: { w: 4, h: 3 }, supportsStreaming: true,
  },
  timeline: {
    type: 'timeline', label: 'Timeline', icon: 'git-branch',
    defaultSize: { w: 4, h: 6 }, minSize: { w: 3, h: 4 }, supportsStreaming: true,
  },
  progress_tracker: {
    type: 'progress_tracker', label: 'Progress', icon: 'list-checks',
    defaultSize: { w: 4, h: 4 }, minSize: { w: 3, h: 3 }, supportsStreaming: true,
  },
  geometry: {
    type: 'geometry', label: 'Geometry', icon: 'pentagon',
    defaultSize: { w: 6, h: 6 }, minSize: { w: 3, h: 3 }, supportsStreaming: false,
  },
  links: {
    type: 'links', label: 'Links', icon: 'link',
    defaultSize: { w: 4, h: 4 }, minSize: { w: 3, h: 2 }, supportsStreaming: true,
  },
  workspace_ref: {
    type: 'workspace_ref', label: 'Workspace', icon: 'layout-dashboard',
    defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, supportsStreaming: false,
  },
  section: {
    type: 'section', label: 'Section', icon: 'minus',
    defaultSize: { w: 12, h: 1 }, minSize: { w: 6, h: 1 }, supportsStreaming: false,
  },
  project: {
    type: 'project', label: 'Project', icon: 'folder-kanban',
    defaultSize: { w: 4, h: 5 }, minSize: { w: 3, h: 3 }, supportsStreaming: false,
  },
};

// ─── Socket.io Events ─────────────────────────────────────────

export type DashboardEvent =
  | { type: 'init'; payload: { workspaces: Workspace[]; widgets: Widget[] } }
  | { type: 'workspace_created'; payload: Workspace }
  | { type: 'workspace_updated'; payload: Workspace }
  | { type: 'workspace_deleted'; payload: { workspaceId: string } }
  | { type: 'widget_created'; payload: Widget }
  | { type: 'widget_updated'; payload: Widget }
  | { type: 'widget_data_pushed'; payload: { widgetId: string; push: unknown } }
  | { type: 'widget_deleted'; payload: { widgetId: string } }
  | { type: 'activity'; payload: ActivityEntry }
  | { type: 'notification'; payload: { id: string; type: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string; duration?: number } }
  | { type: 'utility_update'; payload: { workspaceId: string } };
