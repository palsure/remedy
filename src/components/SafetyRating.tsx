"use client";

import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ShieldX,
  HelpCircle,
} from "lucide-react";
import type { SafetyLevel } from "@/lib/types";
import { safetyLabel } from "@/lib/utils";

const config: Record<
  SafetyLevel,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  safe: {
    icon: ShieldCheck,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  caution: {
    icon: ShieldAlert,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800/40",
  },
  danger: {
    icon: ShieldX,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800/40",
  },
  unknown: {
    icon: HelpCircle,
    bg: "bg-zinc-50 dark:bg-zinc-800/30",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700/40",
  },
};

export default function SafetyRatingBadge({ rating }: { rating: SafetyLevel }) {
  const c = config[rating];
  const Icon = c.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${c.bg} ${c.text} ${c.border}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{safetyLabel(rating)}</span>
    </div>
  );
}
