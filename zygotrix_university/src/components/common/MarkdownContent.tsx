import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  children: string;
  className?: string;
}

/**
 * A reusable wrapper component for rendering Markdown content with consistent styling.
 * Provides themed styles for all markdown elements that adapt to light/dark modes.
 */
const MarkdownContent: React.FC<MarkdownContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <ReactMarkdown
      className={`prose prose-sm max-w-none ${className}`}
      components={{
        p: ({ children }) => (
          <p className="text-sm leading-7 text-muted mb-4">{children}</p>
        ),
        h1: ({ children }) => (
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-foreground mb-3">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted mb-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-muted mb-4">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-accent underline transition-colors hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded border border-border bg-background-subtle px-1.5 py-0.5 text-xs text-accent font-mono">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="rounded-lg border border-border bg-background-subtle p-4 mb-4 overflow-x-auto">
            {children}
          </pre>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-accent pl-4 italic text-muted mb-4">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-6" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownContent;
