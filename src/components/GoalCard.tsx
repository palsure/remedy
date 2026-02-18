"use client";

import { motion } from "framer-motion";
import {
  Target,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lightbulb,
  ExternalLink,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { HealthGoal, GoalTip } from "@/lib/types";
import { useState } from "react";

const categoryColors: Record<string, { bg: string; text: string; ring: string }> = {
  nutrition: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", ring: "ring-green-500" },
  exercise: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500" },
  sleep: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-500" },
  supplements: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", ring: "ring-purple-500" },
  mental_health: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-500" },
  hydration: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-500" },
  custom: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", ring: "ring-zinc-500" },
};

const categoryLabels: Record<string, string> = {
  nutrition: "Nutrition",
  exercise: "Exercise",
  sleep: "Sleep",
  supplements: "Supplements",
  mental_health: "Mental Health",
  hydration: "Hydration",
  custom: "Custom",
};

export default function GoalCard({
  goal,
  onUpdateProgress,
  onToggleStatus,
  onToggleNotifications,
  onDelete,
  onFetchTips,
  tipsLoading,
}: {
  goal: HealthGoal;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleStatus: (id: string) => void;
  onToggleNotifications: (id: string) => void;
  onDelete: (id: string) => void;
  onFetchTips: (id: string) => void;
  tipsLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = categoryColors[goal.category] || categoryColors.custom;
  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`rounded-xl border bg-white transition-shadow hover:shadow-sm dark:bg-zinc-800/50 ${
        isCompleted
          ? "border-emerald-200 dark:border-emerald-800/40"
          : isPaused
          ? "border-zinc-200 opacity-70 dark:border-zinc-700/50"
          : "border-zinc-200 dark:border-zinc-700/50"
      }`}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
              >
                {categoryLabels[goal.category]}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Done
                </span>
              )}
            </div>
            <h3
              className={`mt-1.5 text-sm font-semibold ${
                isCompleted
                  ? "text-zinc-400 line-through dark:text-zinc-500"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {goal.title}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {goal.target}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onToggleNotifications(goal.id)}
              className={`rounded-md p-1.5 transition-colors ${
                goal.notificationsEnabled
                  ? "text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                  : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title={goal.notificationsEnabled ? "Notifications on" : "Notifications off"}
            >
              {goal.notificationsEnabled ? (
                <Bell className="h-3.5 w-3.5" />
              ) : (
                <BellOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {goal.progress}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
            <motion.div
              className={`h-full rounded-full ${
                isCompleted
                  ? "bg-emerald-500"
                  : "bg-teal-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {!isCompleted && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))
                }
                className="rounded-md border border-zinc-200 p-1 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={goal.progress}
                onChange={(e) =>
                  onUpdateProgress(goal.id, Number(e.target.value))
                }
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-teal-600 dark:bg-zinc-600"
              />
              <button
                onClick={() =>
                  onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))
                }
                className="rounded-md border border-zinc-200 p-1 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(goal.id)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isCompleted
                ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                : isPaused
                ? "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
            }`}
          >
            {isCompleted ? (
              <>
                <Target className="h-3 w-3" /> Reopen
              </>
            ) : isPaused ? (
              <>
                <Play className="h-3 w-3" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            )}
          </button>
          {!isCompleted && (
            <button
              onClick={() =>
                onUpdateProgress(goal.id, 100)
              }
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3" /> Complete
            </button>
          )}
          <button
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded && (!goal.tips || goal.tips.length === 0)) {
                onFetchTips(goal.id);
              }
            }}
            className="ml-auto flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:bg-zinc-700/50 dark:text-zinc-300"
          >
            <Lightbulb className="h-3 w-3" />
            Tips
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable tips section */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700/50 dark:bg-zinc-800/30"
        >
          {tipsLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching for tips with You.com...
            </div>
          ) : goal.tips && goal.tips.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                AI-Powered Tips via You.com
              </p>
              {goal.tips.map((tip) => (
                <div
                  key={tip.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <p className="text-xs font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {tip.text}
                  </p>
                  {tip.highlights && tip.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1.5 border-l-2 border-teal-300 pl-3 dark:border-teal-700">
                      {tip.highlights.map((h, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400"
                        >
                          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-teal-500 dark:text-teal-400" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tip.source && tip.sourceUrl && (
                    <a
                      href={tip.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 hover:underline dark:text-teal-400"
                    >
                      {tip.source}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-xs text-zinc-400">
              No tips available yet. Click to fetch.
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
