import { ReactNode } from "react";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "danger";
  title?: string;
  children: ReactNode;
}

const labelByType = {
  info: { dot: "var(--accent)", label: "info" },
  warning: { dot: "var(--gold)", label: "warning" },
  tip: { dot: "#7A9A7A", label: "tip" },
  danger: { dot: "var(--danger)", label: "danger" },
};

export default function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  const meta = labelByType[type];
  return (
    <div className="my-6 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          {title ?? meta.label}
        </span>
      </div>
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  );
}
