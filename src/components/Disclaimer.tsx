"use client";

import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="overflow-hidden border-b border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 whitespace-nowrap py-1.5 text-xs text-amber-800 animate-marquee dark:text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Remedy provides research-based information only. This is{" "}
          <strong>not medical advice</strong>. Always consult your healthcare
          provider before making medication or supplement changes.
        </span>
        <span className="mx-12 text-amber-400 dark:text-amber-700">•</span>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Remedy provides research-based information only. This is{" "}
          <strong>not medical advice</strong>. Always consult your healthcare
          provider before making medication or supplement changes.
        </span>
        <span className="mx-12 text-amber-400 dark:text-amber-700">•</span>
      </div>
    </div>
  );
}
