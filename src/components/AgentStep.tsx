"use client";

import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Brain,
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Globe,
  Shield,
} from "lucide-react";
import type { AgentStepData } from "@/lib/types";
import SourceCard from "./SourceCard";

const stepConfig: Record<
  AgentStepData["type"],
  { icon: React.ElementType; color: string; label: string }
> = {
  planning: {
    icon: ListChecks,
    color: "text-violet-500",
    label: "Planning",
  },
  searching: {
    icon: Search,
    color: "text-blue-500",
    label: "Searching",
  },
  search_results: {
    icon: Globe,
    color: "text-sky-500",
    label: "Sources Found",
  },
  reading: {
    icon: BookOpen,
    color: "text-teal-500",
    label: "Reading",
  },
  reasoning: {
    icon: Brain,
    color: "text-purple-500",
    label: "Analyzing",
  },
  agent_role: {
    icon: Shield,
    color: "text-amber-500",
    label: "Pipeline",
  },
  complete: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    label: "Complete",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    label: "Error",
  },
};

export default function AgentStep({ step }: { step: AgentStepData }) {
  const cfg = stepConfig[step.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 ${cfg.color}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {step.type === "agent_role" && step.role ? step.role : cfg.label}
        </p>
        {step.type !== "agent_role" && (
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {step.content}
          </p>
        )}
        {step.sources && step.sources.length > 0 && (
          <div className="mt-2 grid gap-2">
            {step.sources.slice(0, 4).map((source, i) => (
              <SourceCard key={`${source.url}-${i}`} source={source} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
