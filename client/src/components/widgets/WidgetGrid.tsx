import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import { useDashboardStore, type Widget } from '../../stores/dashboard-store';
import { WidgetShell } from './WidgetShell';
import { socketEmit } from '../../lib/socket';

interface WidgetGridProps {
  widgets: Widget[];
  columns: number;
  rowHeight: number;
}

export function WidgetGrid({ widgets, columns, rowHeight }: WidgetGridProps) {
  const moveWidget = useDashboardStore((s) => s.moveWidget);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);

    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() =>
    widgets.map((w) => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: 2,
      minH: 2,
    })),
    [widgets]
  );

  const handleLayoutChange = useCallback(
    (newLayout: GridLayout.Layout[]) => {
      for (const item of newLayout) {
        const widget = widgets.find((w) => w.id === item.i);
        if (!widget) continue;
        const pos = widget.position;
        if (pos.x !== item.x || pos.y !== item.y || pos.w !== item.w || pos.h !== item.h) {
          const newPos = { x: item.x, y: item.y, w: item.w, h: item.h };
          moveWidget(item.i, newPos);
          socketEmit('widget_move', { widgetId: item.i, position: newPos });
        }
      }
    },
    [widgets, moveWidget]
  );

  return (
    <div ref={containerRef}>
      {width > 0 && (
        <GridLayout
          className="layout"
          layout={layout}
          cols={columns}
          rowHeight={rowHeight}
          width={width}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          draggableHandle=".widget-drag-handle"
          onLayoutChange={handleLayoutChange}
          isResizable
          isDraggable
          compactType="vertical"
          useCSSTransforms
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetShell widget={widget} />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
