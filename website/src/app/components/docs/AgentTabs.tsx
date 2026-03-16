"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ReactNode, useCallback } from "react";

const agents = [
  { id: "claude", label: "Claude Code" },
  { id: "gemini", label: "Gemini CLI" },
  { id: "codex", label: "Codex" },
] as const;

type AgentId = (typeof agents)[number]["id"];

export default function AgentTabs({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentAgent = (searchParams.get("agent") as AgentId) || "claude";

  const setAgent = useCallback(
    (agent: AgentId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("agent", agent);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="my-6">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setAgent(agent.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              currentAgent === agent.id
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
            }`}
          >
            {agent.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function TabContent({
  agent,
  children,
}: {
  agent: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const currentAgent = searchParams.get("agent") || "claude";

  if (currentAgent !== agent) {
    return null;
  }

  return <div>{children}</div>;
}
