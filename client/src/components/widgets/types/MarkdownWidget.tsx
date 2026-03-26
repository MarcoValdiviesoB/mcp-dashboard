import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownData {
  content: string;
}

const PROSE = 'prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-400 prose-a:text-blue-400 prose-code:text-pink-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-800/50 prose-pre:border prose-pre:border-zinc-700';

export function MarkdownWidget({ data }: { data: MarkdownData; config?: any }) {
  return (
    <div className={`h-full overflow-auto ${PROSE}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content || ''}</ReactMarkdown>
    </div>
  );
}
