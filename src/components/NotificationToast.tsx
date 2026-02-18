"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, ExternalLink } from "lucide-react";
import type { GoalNotification } from "@/lib/types";

export default function NotificationToast({
  notifications,
  onDismiss,
}: {
  notifications: GoalNotification[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-80 flex-col gap-2 sm:w-96">
      <AnimatePresence mode="popLayout">
        {notifications
          .filter((n) => !n.read)
          .slice(0, 3)
          .map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="pointer-events-auto rounded-xl border border-teal-200 bg-white p-4 shadow-lg dark:border-teal-800/40 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
                  <Lightbulb className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                    Tip for: {n.goalTitle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {n.tip}
                  </p>
                  {n.source && n.sourceUrl && (
                    <a
                      href={n.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-teal-600 hover:underline dark:text-teal-400"
                    >
                      {n.source}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(n.id)}
                  className="shrink-0 rounded-md p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
