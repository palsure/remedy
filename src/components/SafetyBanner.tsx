"use client";

import { Shield } from "lucide-react";
import type { SafetyLevel } from "@/lib/types";

const BANNER_STYLES: Record<
  SafetyLevel,
  { bg: string; border: string; text: string; label: string }
> = {
  safe: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-200",
    label: "Generally safe",
  },
  caution: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
    label: "Use with caution",
  },
  warning: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-800 dark:text-orange-200",
    label: "Significant risk",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    label: "Potentially dangerous",
  },
  unknown: {
    bg: "bg-zinc-100 dark:bg-zinc-800/50",
    border: "border-zinc-200 dark:border-zinc-700",
    text: "text-zinc-700 dark:text-zinc-300",
    label: "Insufficient data",
  },
};

export default function SafetyBanner({
  rating,
  riskScore,
  compact,
}: {
  rating: SafetyLevel;
  riskScore?: number;
  compact?: boolean;
}) {
  const style = BANNER_STYLES[rating] ?? BANNER_STYLES.unknown;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${style.bg} ${style.border} ${compact ? "py-2" : "py-3"}`}
    >
      <Shield className={`shrink-0 ${style.text}`} style={{ width: compact ? 18 : 22, height: compact ? 18 : 22 }} />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${style.text} ${compact ? "text-xs" : "text-sm"}`}>
          {style.label}
        </p>
        {!compact && riskScore != null && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Clinical risk score: {riskScore}/100 (evidence-weighted)
          </p>
        )}
      </div>
      {riskScore != null && compact && (
        <span className={`text-xs font-medium ${style.text}`}>{riskScore}/100</span>
      )}
    </div>
  );
}
