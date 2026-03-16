import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Callout from "@/app/components/docs/Callout";
import CodeBlock from "@/app/components/docs/CodeBlock";
import Steps, { Step } from "@/app/components/docs/Steps";
import AgentTabs, { TabContent } from "@/app/components/docs/AgentTabs";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children, ...props }) => (
      <h1
        className="mb-4 text-3xl font-bold tracking-tight text-gray-50"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, id, ...props }) => (
      <h2
        id={id}
        className="mb-3 mt-10 text-2xl font-semibold text-gray-100 border-b border-gray-800 pb-2"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, id, ...props }) => (
      <h3
        id={id}
        className="mb-2 mt-8 text-xl font-semibold text-gray-200"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="mb-2 mt-6 text-lg font-semibold text-gray-200" {...props}>
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-7 text-gray-300" {...props}>
        {children}
      </p>
    ),

    // Links
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href ?? "#"}
          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="mb-4 list-disc pl-6 space-y-1 text-gray-300" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="mb-4 list-decimal pl-6 space-y-1 text-gray-300"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),

    // Code
    code: ({ children, ...props }) => {
      // If it's inside a pre (code block), don't style it
      const isInline =
        typeof children === "string" && !String(children).includes("\n");
      if (isInline) {
        return (
          <code
            className="rounded-md bg-gray-800 px-1.5 py-0.5 text-sm text-amber-300 font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return <code {...props}>{children}</code>;
    },
    pre: ({ children, ...props }) => (
      <pre
        className="mb-4 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-4 border-l-2 border-amber-500 pl-4 text-gray-400 italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Table
    table: ({ children, ...props }) => (
      <div className="my-6 overflow-x-auto">
        <table
          className="w-full text-sm text-left border-collapse"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-b border-gray-700 text-gray-300" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="divide-y divide-gray-800" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    th: ({ children, ...props }) => (
      <th className="px-3 py-2 font-semibold text-gray-200" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-3 py-2 text-gray-400" {...props}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: (props) => <hr className="my-8 border-gray-800" {...props} />,

    // Strong / Em
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-gray-100" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="text-gray-300" {...props}>
        {children}
      </em>
    ),

    // Custom components available in MDX
    Callout,
    CodeBlock,
    Steps,
    Step,
    AgentTabs,
    TabContent,

    ...components,
  };
}
