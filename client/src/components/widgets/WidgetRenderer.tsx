import type { Widget } from '../../stores/dashboard-store';
import { MetricCard } from './types/MetricCard';
import { LineChartWidget } from './types/LineChart';
import { BarChartWidget } from './types/BarChart';
import { PieChartWidget } from './types/PieChart';
import { TableWidget } from './types/TableWidget';
import { MarkdownWidget } from './types/MarkdownWidget';
import { JsonViewer } from './types/JsonViewer';
import { CodeBlock } from './types/CodeBlock';
import { TerminalWidget } from './types/TerminalWidget';
import { TimelineWidget } from './types/TimelineWidget';
import { ProgressTracker } from './types/ProgressTracker';
import { GeometryWidget } from './types/GeometryWidget';
import { LinksWidget } from './types/LinksWidget';
import { WorkspaceRefWidget } from './types/WorkspaceRefWidget';
import { SectionWidget } from './types/SectionWidget';
import { ProjectWidget } from './types/ProjectWidget';

const REGISTRY: Record<string, React.ComponentType<{ data: any; config?: any }>> = {
  metric_card: MetricCard,
  line_chart: LineChartWidget,
  bar_chart: BarChartWidget,
  pie_chart: PieChartWidget,
  table: TableWidget,
  markdown: MarkdownWidget,
  json_viewer: JsonViewer,
  code_block: CodeBlock,
  terminal: TerminalWidget,
  timeline: TimelineWidget,
  progress_tracker: ProgressTracker,
  geometry: GeometryWidget,
  links: LinksWidget,
  workspace_ref: WorkspaceRefWidget,
  section: SectionWidget,
  project: ProjectWidget,
};

interface WidgetRendererProps {
  widget: Widget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  const Component = REGISTRY[widget.type];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-zinc-600">
        Unknown widget type: {widget.type}
      </div>
    );
  }

  return <Component data={widget.data} config={widget.config} />;
}
