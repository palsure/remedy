"use client";

import { FlaskConical, FlaskRound, Beaker, CircleOff, HelpCircle } from "lucide-react";
import type { EvidenceQuality } from "@/lib/types";
import { evidenceLabel } from "@/lib/utils";

const config: Record<
  EvidenceQuality,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  strong: {
    icon: FlaskConical,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  moderate: {
    icon: FlaskRound,
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/40",
  },
  limited: {
    icon: Beaker,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  none: {
    icon: CircleOff,
    bg: "bg-zinc-50 dark:bg-zinc-800/30",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700/40",
  },
  unknown: {
    icon: HelpCircle,
    bg: "bg-zinc-50 dark:bg-zinc-800/30",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700/40",
  },
};

export default function EvidenceLevelBadge({
  level,
}: {
  level: EvidenceQuality;
}) {
  const c = config[level];
  const Icon = c.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${c.bg} ${c.text} ${c.border}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{evidenceLabel(level)}</span>
    </div>
  );
}
