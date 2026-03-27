import { useMemo, useRef, useCallback, useState } from 'react';
import { Star, FileDown, Loader2 } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboard-store';
import { WidgetGrid } from '../widgets/WidgetGrid';
import { WidgetShell } from '../widgets/WidgetShell';
import { EmptyWorkspace } from './EmptyWorkspace';
import { UtilityPanel } from './UtilityPanel';
import { cn } from '../../lib/utils';

export function WorkspaceView() {
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const workspaces = useDashboardStore((s) => s.workspaces);
  const allWidgets = useDashboardStore((s) => s.widgets);
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const workspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  );
  const widgets = useMemo(
    () => allWidgets.filter((w) => w.workspaceId === activeWorkspaceId),
    [allWidgets, activeWorkspaceId]
  );

  const highlighted = useMemo(() => widgets.filter(w => w.pinned), [widgets]);

  const exportPDF = useCallback(async () => {
    if (!contentRef.current || !workspace) return;
    setExporting(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const el = contentRef.current;

      // Temporarily expand the container to show all content
      const prevOverflow = el.style.overflow;
      const prevHeight = el.style.height;
      const prevMaxHeight = el.style.maxHeight;
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';

      // Wait for reflow
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        backgroundColor: '#09090b',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      // Restore
      el.style.overflow = prevOverflow;
      el.style.height = prevHeight;
      el.style.maxHeight = prevMaxHeight;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scaledWidth = pageWidth;
      const scaledHeight = (canvas.height * scaledWidth) / canvas.width;

      // Title page header
      pdf.setFillColor(9, 9, 11);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(228, 228, 231);
      pdf.setFontSize(8);
      pdf.text(`${workspace.icon || ''} ${workspace.name}`, 10, 8);
      pdf.setTextColor(113, 113, 122);
      pdf.setFontSize(6);
      pdf.text(`Exported ${new Date().toLocaleString()} — ${widgets.length} widgets`, 10, 12);

      const headerOffset = 15;
      let yOffset = 0;
      let page = 0;

      while (yOffset < scaledHeight) {
        if (page > 0) {
          pdf.addPage();
        }

        const topMargin = page === 0 ? headerOffset : 0;

        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.92),
          'JPEG',
          0,
          topMargin - yOffset,
          scaledWidth,
          scaledHeight,
        );

        yOffset += (pageHeight - (page === 0 ? headerOffset : 0));
        page++;
      }

      const safeName = workspace.name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || 'workspace';
      pdf.save(`${safeName} - ${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [workspace]);

  if (!workspace) return <EmptyWorkspace />;

  return (
    <div className="h-full flex flex-col">
      {/* Description bar */}
      <div className="px-5 py-2 flex items-center gap-3 border-b border-white/[0.03]">
        {workspace.description && (
          <p className="text-[11px] text-zinc-500 flex-1">{workspace.description}</p>
        )}
        {!workspace.description && <div className="flex-1" />}
        <span className="text-[10px] text-zinc-600 data-mono px-2 py-0.5 rounded-full border border-zinc-800/50">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] data-mono transition-colors',
            exporting
              ? 'text-zinc-600 bg-zinc-800/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
          data-tip="Export to PDF"
        >
          {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
          PDF
        </button>
      </div>

      {/* Utility panel (tasks + reminders) */}
      <UtilityPanel workspaceId={workspace.id} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>

        {/* Highlighted widgets - pinned row */}
        {highlighted.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-amber-400/70 data-mono uppercase tracking-wider">Highlights</span>
              <span className="text-[9px] text-zinc-600 data-mono">{highlighted.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {highlighted.map((widget) => (
                <div key={widget.id} className="h-48">
                  <WidgetShell widget={widget} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full widget grid (all widgets, including pinned ones) */}
        <div className="p-4">
          {widgets.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-zinc-600">
                This workspace is empty. Claude will add widgets via MCP tools.
              </p>
            </div>
          ) : (
            <WidgetGrid
              key={activeWorkspaceId}
              widgets={widgets}
              columns={workspace.columns}
              rowHeight={workspace.rowHeight}
            />
          )}
        </div>
      </div>
    </div>
  );
}
