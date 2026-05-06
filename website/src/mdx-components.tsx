import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Callout from "@/app/components/docs/Callout";
import CodeBlock from "@/app/components/docs/CodeBlock";
import Steps, { Step } from "@/app/components/docs/Steps";
import AgentTabs, { TabContent } from "@/app/components/docs/AgentTabs";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1 className="font-semibold tracking-tight text-[var(--text-primary)] mb-4" style={{ fontSize: "clamp(1.875rem, 2.5vw + 1rem, 2.5rem)", lineHeight: 1.1 }} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, id, ...props }) => (
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mt-12 mb-3 pb-2 border-b border-[var(--border)]" style={{ scrollMarginTop: "calc(var(--nav-h) + 1.5rem)" }} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, id, ...props }) => (
      <h3 id={id} className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-2" style={{ scrollMarginTop: "calc(var(--nav-h) + 1.5rem)" }} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-2" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-7 text-[var(--text-secondary)]" {...props}>
        {children}
      </p>
    ),
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      const cls = "text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 transition-colors";
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props}>
            {children}
          </a>
        );
      }
      return (
        <Link href={href ?? "#"} className={cls} {...props}>
          {children}
        </Link>
      );
    },
    ul: ({ children, ...props }) => (
      <ul className="mb-4 list-disc pl-6 space-y-1 text-[var(--text-secondary)]" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="mb-4 list-decimal pl-6 space-y-1 text-[var(--text-secondary)]" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),
    code: ({ children, ...props }) => {
      const isInline = typeof children === "string" && !String(children).includes("\n");
      if (isInline) {
        return (
          <code
            className="font-mono text-[0.85em] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-primary)]"
            {...props}
          >
            {children}
          </code>
        );
      }
      return <code {...props}>{children}</code>;
    },
    pre: ({ children, ...props }) => (
      <pre className="mb-4 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm" {...props}>
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="my-4 border-l-2 border-[var(--border-strong)] pl-4 text-[var(--text-secondary)] italic" {...props}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="my-6 overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm text-left border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody {...props}>{children}</tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="border-b border-[var(--border-subtle)] last:border-b-0" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2.5 text-[var(--text-secondary)]" {...props}>
        {children}
      </td>
    ),
    hr: (props) => <hr className="my-8 border-[var(--border)]" {...props} />,
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-[var(--text-primary)]" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="text-[var(--text-secondary)] italic" {...props}>
        {children}
      </em>
    ),

    Callout,
    CodeBlock,
    Steps,
    Step,
    AgentTabs,
    TabContent,

    ...components,
  };
}
