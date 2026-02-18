"use client";

import type { HealthReport } from "@/lib/types";
import SafetyRatingBadge from "./SafetyRating";
import EvidenceLevelBadge from "./EvidenceLevel";

export default function InteractionResult({
  report,
}: {
  report: HealthReport;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/50">
      <div className="flex flex-wrap items-center gap-3">
        <SafetyRatingBadge rating={report.safety_rating} />
        <EvidenceLevelBadge level={report.evidence_level} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {report.summary}
      </p>
    </div>
  );
}
