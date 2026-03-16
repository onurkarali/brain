import { ReactNode } from "react";

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Connector line */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400 text-sm font-bold">
          {number}
        </div>
        <div className="mt-2 w-px flex-1 bg-gray-800" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-2">
        <h3 className="text-base font-semibold text-gray-100 mb-2">{title}</h3>
        <div className="text-sm text-gray-400 [&>pre]:my-3">{children}</div>
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
