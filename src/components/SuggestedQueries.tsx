"use client";

import { Lightbulb } from "lucide-react";

const queries = [
  "Is it safe to take vitamin D with blood pressure medication?",
  "Does turmeric actually have anti-inflammatory effects?",
  "What does the research say about melatonin for sleep?",
  "Are there interactions between green tea extract and iron supplements?",
  "Is creatine safe for long-term use?",
  "Does cold exposure actually boost the immune system?",
];

export default function SuggestedQueries({
  onSelect,
}: {
  onSelect: (query: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        <Lightbulb className="h-3 w-3" />
        <span>Try asking</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {queries.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:border-teal-800 dark:hover:text-teal-300"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
