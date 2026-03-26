import { useMemo } from 'react';

interface GeometryData {
  svg?: string;
  viewBox?: string;
  background?: string;
}

function sanitizeSvg(raw: string): string {
  // Strip script tags and event handlers for safety
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

export function GeometryWidget({ data }: { data: GeometryData; config?: any }) {
  const viewBox = data.viewBox || '0 0 400 400';
  const bg = data.background || 'transparent';

  const svgContent = useMemo(() => {
    if (!data.svg) return null;
    return sanitizeSvg(data.svg);
  }, [data.svg]);

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-zinc-600">
        No SVG content
      </div>
    );
  }

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" style="background:${bg}">${svgContent}</svg>`;

  return (
    <div
      className="h-full w-full flex items-center justify-center overflow-hidden"
      dangerouslySetInnerHTML={{ __html: fullSvg }}
    />
  );
}
