import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import type { Components } from 'react-markdown';

interface MarkdownProperties {
  content: string;
  className?: string;
}

const generateId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim(); // Trim leading/trailing spaces
};

export const Markdown = ({ content, className }: MarkdownProperties) => {
  const components: Partial<Components> = {
    h1: ({ children }) => (
      <h1
        id={generateId(children as string)}
        className="text-heading1 mb-4 text-accent-foreground"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={generateId(children as string)}
        className="text-heading2 mb-3 mt-6"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={generateId(children as string)}
        className="text-heading3 mb-2 mt-4"
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-muted-foreground">{children}</p>
    ),
    ul: ({ children }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
    ol: ({ children }) => (
      <ol className="list-decimal ml-6 mb-4">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http');

      // Process internal links
      let processedHref = href;
      if (!isExternal && href?.startsWith('#')) {
        // Remove any URL encoding and ensure single #
        processedHref = '#' + generateId(href.slice(1));
      }

      return (
        <a
          href={processedHref}
          className="text-muted-foreground hover:text-primary hover:underline"
          {...(isExternal && {
            target: '_blank',
            rel: 'noopener noreferrer',
          })}
        >
          {children}
        </a>
      );
    },
    // @ts-expect-error - inline prop is valid for react-markdown code components
    code({ inline, className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match ? match[1] : ''}
          PreTag="div"
          className="rounded-lg !my-4 !bg-muted inline-block !p-4 !m-0 code"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono">
          {children}
        </code>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic mb-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
