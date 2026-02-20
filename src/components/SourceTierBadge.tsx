"use client";

import type { SourceTier } from "@/lib/types";

const TIER_LABELS: Record<SourceTier, string> = {
  fda_label: "FDA label",
  rct: "RCT",
  meta_analysis: "Meta-analysis",
  observational: "Observational",
  blog: "Blog",
  unknown: "Source",
};

const TIER_STYLES: Record<SourceTier, string> = {
  fda_label: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rct: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  meta_analysis: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  observational: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  blog: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
  unknown: "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
};

export default function SourceTierBadge({ tier }: { tier?: SourceTier | string }) {
  const t = (tier as SourceTier) || "unknown";
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${TIER_STYLES[t] ?? TIER_STYLES.unknown}`}
    >
      {TIER_LABELS[t] ?? TIER_LABELS.unknown}
    </span>
  );
}
