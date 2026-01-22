import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import React from 'react';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

// Badge styles matching Kanban colors
const getBadgeHTML = (match: string, type: string): string => {
  const badgeStyles: Record<string, string> = {
    CRITICAL: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-1 ring-red-200/50 dark:ring-red-800/30',
    HIGH: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200/50 dark:ring-orange-800/30',
    MEDIUM: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/30',
    LOW: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30',
    BLOCKED: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-1 ring-red-200/50 dark:ring-red-800/30',
    'WAITING CLIENT': 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/30',
  };

  const displayText = type === 'WAITING_CLIENT' ? 'WAITING CLIENT' : type;
  const style = badgeStyles[type] || '';

  return `<span class="${style}">${displayText}</span>`;
};

// Preprocess markdown to convert badge patterns to HTML
function preprocessBadges(markdown: string): string {
  // Replace priority badges: [CRITICAL], [HIGH], [MEDIUM], [LOW]
  markdown = markdown.replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/g, (match, priority) => {
    return getBadgeHTML(match, priority);
  });

  // Replace status badges: [BLOCKED], [WAITING_CLIENT]
  markdown = markdown.replace(/\[(BLOCKED|WAITING_CLIENT)\]/g, (match, status) => {
    const displayStatus = status.replace('_', ' ');
    return getBadgeHTML(match, displayStatus);
  });

  return markdown;
}

/**
 * MarkdownRenderer component for styling markdown content
 * Supports GitHub Flavored Markdown (lists, tables, strikethrough, etc.)
 * Renders colored badges for [CRITICAL], [HIGH], [MEDIUM], [LOW], [BLOCKED], [WAITING_CLIENT]
 */
export default function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  // Preprocess the markdown to convert badges to HTML
  const processedContent = preprocessBadges(children);

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ node, children, ...props }) => (
            <h1 className="text-xl font-bold text-gray-900 dark:text-foreground mt-6 mb-3 first:mt-0" {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mt-5 mb-2 first:mt-0" {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-base font-semibold text-gray-900 dark:text-foreground mt-4 mb-2 first:mt-0" {...props}>{children}</h3>
          ),
          // Paragraphs
          p: ({ node, children, ...props }) => (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-2 first:mt-0" {...props}>{children}</p>
          ),
          // Lists
          ul: ({ node, children, ...props }) => (
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 my-2 pl-4 list-disc" {...props}>{children}</ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 my-2 pl-4 list-decimal" {...props}>{children}</ol>
          ),
          // List items
          li: ({ node, children, ...props }) => (
            <li className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>{children}</li>
          ),
          // Strong/Bold
          strong: ({ node, children, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-foreground" {...props}>{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ node, children, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-200" {...props}>{children}</em>
          ),
          // Code blocks
          code: ({ node, inline, children, ...props }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 text-xs font-mono" {...props}>{children}</code>
            ) : (
              <code className="block p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-mono overflow-x-auto my-3" {...props}>{children}</code>
            ),
          // Blockquotes
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="border-l-4 border-violet-300 dark:border-violet-700 pl-4 py-2 my-3 bg-violet-50 dark:bg-violet-950/20 text-gray-700 dark:text-gray-300 italic" {...props}>{children}</blockquote>
          ),
          // Links
          a: ({ node, children, ...props }) => (
            <a className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline transition-colors" {...props}>{children}</a>
          ),
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="border-gray-200 dark:border-gray-800 my-4" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
