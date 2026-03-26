import { ExternalLink, Github, FileText, MessageSquare, Layout, Figma, Globe, Link2, BookOpen } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface LinkItem {
  url: string;
  title: string;
  description?: string;
  icon?: string;
  tag?: string;
}

interface LinksData {
  items: LinkItem[];
}

const ICON_MAP: Record<string, typeof Github> = {
  github: Github,
  notion: BookOpen,
  slack: MessageSquare,
  jira: Layout,
  figma: Figma,
  docs: FileText,
  globe: Globe,
  link: Link2,
};

const TAG_COLORS: Record<string, string> = {
  source: 'bg-blue-500/15 text-blue-400',
  docs: 'bg-emerald-500/15 text-emerald-400',
  design: 'bg-purple-500/15 text-purple-400',
  ref: 'bg-amber-500/15 text-amber-400',
  api: 'bg-cyan-500/15 text-cyan-400',
  repo: 'bg-orange-500/15 text-orange-400',
};

function detectIcon(url: string, icon?: string): typeof Github {
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  if (url.includes('github.com')) return Github;
  if (url.includes('notion.')) return BookOpen;
  if (url.includes('slack.com')) return MessageSquare;
  if (url.includes('figma.com')) return Figma;
  if (url.includes('atlassian') || url.includes('jira')) return Layout;
  return Globe;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function LinksWidget({ data }: { data: LinksData; config?: any }) {
  if (!data.items?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No links</div>;
  }

  return (
    <div className="h-full overflow-auto space-y-1">
      {data.items.map((item, i) => {
        const Icon = detectIcon(item.url, item.icon);
        const tagColor = item.tag ? (TAG_COLORS[item.tag.toLowerCase()] || 'bg-zinc-500/15 text-zinc-400') : '';

        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
              <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {item.title}
                </span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 shrink-0" />
              </div>
              {item.description && (
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{item.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-zinc-600 data-mono">{getDomain(item.url)}</span>
                {item.tag && (
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full data-mono', tagColor)}>
                    {item.tag}
                  </span>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
