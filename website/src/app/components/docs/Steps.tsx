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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#B5845A]/10 border-[#B5845A]/20 text-[#B5845A] text-sm font-bold">
          {number}
        </div>
        <div className="mt-2 w-px flex-1 bg-[#E8E3DC]" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-2">
        <h3 className="text-base font-semibold text-[#191716] mb-2">{title}</h3>
        <div className="text-sm text-[#6B6662] [&>pre]:my-3">{children}</div>
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
