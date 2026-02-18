"use client";

import { Pill, FlaskConical, Sparkles, Stethoscope } from "lucide-react";
const modes: { id: string; title: string; description: string; icon: React.ElementType; example: string; color: string }[] = [
  {
    id: "interaction",
    title: "Interaction Checker",
    description: "Check medication & supplement interactions",
    icon: Pill,
    example: "Is it safe to take magnesium with lisinopril?",
    color: "teal",
  },
  {
    id: "supplement",
    title: "Supplement Research",
    description: "Evidence-based supplement analysis",
    icon: FlaskConical,
    example: "Does ashwagandha actually reduce cortisol?",
    color: "blue",
  },
  {
    id: "wellness",
    title: "Wellness Claims",
    description: "Fact-check health trends & claims",
    icon: Sparkles,
    example: "Is intermittent fasting safe for women?",
    color: "violet",
  },
  {
    id: "general",
    title: "Health Q&A",
    description: "Research any health question",
    icon: Stethoscope,
    example: "What are the benefits of omega-3 fatty acids?",
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  teal: {
    bg: "hover:bg-teal-50 dark:hover:bg-teal-950/20",
    border: "border-zinc-200 hover:border-teal-300 dark:border-zinc-700/50 dark:hover:border-teal-800",
    text: "text-teal-700 dark:text-teal-300",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
  },
  blue: {
    bg: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
    border: "border-zinc-200 hover:border-blue-300 dark:border-zinc-700/50 dark:hover:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  violet: {
    bg: "hover:bg-violet-50 dark:hover:bg-violet-950/20",
    border: "border-zinc-200 hover:border-violet-300 dark:border-zinc-700/50 dark:hover:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
  },
  emerald: {
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    border: "border-zinc-200 hover:border-emerald-300 dark:border-zinc-700/50 dark:hover:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
};

export default function ResearchModeCards({
  onSelect,
}: {
  onSelect: (example: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {modes.map((mode) => {
        const colors = colorMap[mode.color];
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.example)}
            className={`group cursor-pointer rounded-xl border p-4 text-left transition-all ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}
              >
                <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {mode.title}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {mode.description}
                </p>
                <p className="mt-2 text-xs italic text-zinc-400 dark:text-zinc-500">
                  &ldquo;{mode.example}&rdquo;
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
