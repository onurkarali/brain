import { ReactNode } from "react";

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="relative flex gap-5 pb-7 last:pb-0">
      <div className="flex flex-col items-center pt-0.5">
        <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        <div className="mt-3 w-px flex-1 bg-[var(--border)]" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed [&>pre]:my-3">{children}</div>
      </div>
    </div>
  );
}

interface StepsProps {
  children: ReactNode;
}

export default function Steps({ children }: StepsProps) {
  return <div className="my-6">{children}</div>;
}
