"use client";

import type { AgentStepData } from "@/lib/types";
import AgentStep from "./AgentStep";

export default function AgentTimeline({ steps }: { steps: AgentStepData[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-0">
      {steps.map((step) => (
        <AgentStep key={step.id} step={step} />
      ))}
    </div>
  );
}
