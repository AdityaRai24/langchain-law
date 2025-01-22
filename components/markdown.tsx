import React from "react";
import markdownit from "markdown-it";
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  text: string;
  className?: string;
}

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    return `<pre class="language-${lang}"><code>${str}</code></pre>`;
  }
});

// Configure markdown-it
md.renderer.rules.table_open = () => '<div class="table-container"><table>';
md.renderer.rules.table_close = () => '</table></div>';

const Markdown = ({ text, className }: MarkdownProps) => {
  const htmlContent = md.render(text);
  const sanitized = DOMPurify.sanitize(htmlContent);

  return (
    <div 
      className={cn(
        'markdown-content',
        // Basic text styling
        'prose dark:prose-invert max-w-none',
        'prose-p:my-2 prose-p:leading-relaxed',
        // Headings
        'prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4',
        // Lists
        'prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4',
        'prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4',
        // Code blocks
        'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-2',
        'prose-code:text-sm prose-code:bg-muted/50 prose-code:rounded prose-code:px-1 prose-code:py-0.5',
        'prose-code:before:content-none prose-code:after:content-none',
        // Tables
        'prose-table:my-2 prose-table:w-full prose-table:text-sm',
        'prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50',
        'prose-td:border prose-td:border-border prose-td:p-2',
        // Links
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Blockquotes
        'prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default Markdown;