"use client";

import { ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/types";
import { extractDomain, truncate } from "@/lib/utils";

export default function SourceCard({ source }: { source: Citation }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:border-teal-300 hover:shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:hover:border-teal-700"
    >
      {source.favicon_url ? (
        <img
          src={source.favicon_url}
          alt=""
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
            {truncate(source.title, 80)}
          </h4>
          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {extractDomain(source.url)}
        </p>
        {source.snippet && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {truncate(source.snippet, 150)}
          </p>
        )}
      </div>
    </a>
  );
}
