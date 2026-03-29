import { Github, MessageSquare, BookOpen, ArrowRight, FolderKanban, Circle, Globe, Zap } from 'lucide-react';
import { useDashboardStore } from '../../../stores/dashboard-store';
import { cn } from '../../../lib/utils';

interface ProjectRepo {
  name: string; url: string; description?: string; language?: string;
}
interface ProjectChannel {
  name: string; url?: string; type?: string;
}
interface ProjectNotionPage {
  title: string; url: string; type?: string;
}
interface ProjectEndpoint {
  name: string; url: string; status?: string; responseTime?: number; statusCode?: number; lastChecked?: string;
}
interface ProjectData {
  name: string; description?: string; status?: string;
  repos?: ProjectRepo[]; channels?: ProjectChannel[];
  notion?: ProjectNotionPage[]; endpoints?: ProjectEndpoint[]; workspaceId?: string; tags?: string[];
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active:   { color: 'text-emerald-400 bg-emerald-500/15', label: 'Active' },
  paused:   { color: 'text-amber-400 bg-amber-500/15', label: 'Paused' },
  archived: { color: 'text-zinc-500 bg-zinc-500/15', label: 'Archived' },
  planning: { color: 'text-blue-400 bg-blue-500/15', label: 'Planning' },
};

const LANG_COLORS: Record<string, string> = {
  typescript: 'bg-blue-400', javascript: 'bg-yellow-400', python: 'bg-green-400',
  ruby: 'bg-red-400', go: 'bg-cyan-400', rust: 'bg-orange-400',
};

export function ProjectWidget({ data }: { data: ProjectData; config?: any }) {
  const setActiveWorkspaceId = useDashboardStore((s) => s.setActiveWorkspaceId);
  const workspaces = useDashboardStore((s) => s.workspaces);
  const linkedWs = data.workspaceId ? workspaces.find(w => w.id === data.workspaceId) : null;
  const status = STATUS_STYLE[data.status ?? 'active'] ?? STATUS_STYLE.active;

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FolderKanban className="w-4 h-4 text-zinc-400 shrink-0" />
        <h4 className="text-sm font-medium text-zinc-200 truncate flex-1">{data.name}</h4>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full data-mono', status.color)}>
          {status.label}
        </span>
      </div>

      {/* Endpoints status - most prominent */}
      {data.endpoints && data.endpoints.length > 0 && (
        <div className="mb-3 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="space-y-1">
            {data.endpoints.map((ep, i) => {
              const isUp = ep.status === 'up';
              const isSlow = ep.status === 'slow';
              const isDown = ep.status === 'down';
              return (
                <a key={i} href={ep.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-0.5 hover:opacity-80 transition-opacity cursor-pointer">
                  <span className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    isUp ? 'bg-emerald-400' : isSlow ? 'bg-amber-400' : isDown ? 'bg-red-400' : 'bg-zinc-600',
                    isUp && 'status-breathe'
                  )} />
                  <span className="text-[11px] text-zinc-300 truncate flex-1">{ep.name}</span>
                  {ep.responseTime !== undefined && ep.responseTime > 0 && (
                    <span className={cn('text-[9px] data-mono', isUp ? 'text-emerald-400/70' : isSlow ? 'text-amber-400' : 'text-red-400')}>
                      {ep.responseTime}ms
                    </span>
                  )}
                  {ep.statusCode !== undefined && ep.statusCode > 0 && (
                    <span className={cn('text-[8px] data-mono px-1 py-0.5 rounded', isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                      {ep.statusCode}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {data.description && (
        <p className="text-[10px] text-zinc-500 mb-3">{data.description}</p>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {data.tags.map(tag => (
            <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 data-mono">{tag}</span>
          ))}
        </div>
      )}

      {/* Repos */}
      {data.repos && data.repos.length > 0 && (
        <div className="mb-3">
          <span className="text-[9px] text-zinc-600 data-mono uppercase tracking-wider">Repos</span>
          <div className="mt-1 space-y-1">
            {data.repos.map((repo, i) => (
              <a key={i} href={repo.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] group transition-colors">
                <Github className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                <span className="text-[11px] text-zinc-300 group-hover:text-white truncate">{repo.name}</span>
                {repo.language && (
                  <span className={cn('w-2 h-2 rounded-full shrink-0', LANG_COLORS[repo.language.toLowerCase()] ?? 'bg-zinc-500')} />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Channels */}
      {data.channels && data.channels.length > 0 && (
        <div className="mb-3">
          <span className="text-[9px] text-zinc-600 data-mono uppercase tracking-wider">Channels</span>
          <div className="mt-1 space-y-1">
            {data.channels.map((ch, i) => (
              <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] group transition-colors">
                <MessageSquare className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                <span className="text-[11px] text-zinc-300 group-hover:text-white">#{ch.name}</span>
                {ch.type && <span className="text-[8px] text-zinc-600 data-mono">{ch.type}</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notion */}
      {data.notion && data.notion.length > 0 && (
        <div className="mb-3">
          <span className="text-[9px] text-zinc-600 data-mono uppercase tracking-wider">Notion</span>
          <div className="mt-1 space-y-1">
            {data.notion.map((page, i) => (
              <a key={i} href={page.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] group transition-colors">
                <BookOpen className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                <span className="text-[11px] text-zinc-300 group-hover:text-white truncate">{page.title}</span>
                {page.type && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-zinc-800/80 text-zinc-600 data-mono shrink-0">{page.type}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Linked workspace */}
      {linkedWs && (
        <button
          onClick={() => setActiveWorkspaceId(linkedWs.id)}
          className="mt-auto flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors group"
        >
          <span className="text-sm">{linkedWs.icon || '📋'}</span>
          <span className="text-[11px] text-blue-300 group-hover:text-blue-200 truncate flex-1 text-left">{linkedWs.name}</span>
          <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}
    </div>
  );
}
