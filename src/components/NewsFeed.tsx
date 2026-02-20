"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useOnlineMode } from "@/lib/online-mode-context";
import { cacheKeyNews, getCached, setCached, isCacheFresh } from "@/lib/api-cache";

interface NewsArticle {
  title: string;
  url: string;
  description: string;
  thumbnail_url?: string;
  favicon_url?: string;
  source: string;
  age?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  } catch {
    return "";
  }
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mode, isOnline, refreshIntervalMs } = useOnlineMode();
  const fetchNews = useCallback(async (forceRefresh = false) => {
    const key = cacheKeyNews();
    setError(null);
    if (mode === "offline") {
      setLoading(true);
      const entry = getCached<NewsArticle[]>(key);
      if (entry?.data) {
        setArticles(Array.isArray(entry.data) ? entry.data : []);
      } else {
        setArticles([]);
      }
      setLoading(false);
      return;
    }
    const entry = getCached<NewsArticle[]>(key);
    if (!forceRefresh && isCacheFresh(entry, refreshIntervalMs) && entry?.data && Array.isArray(entry.data)) {
      setArticles(entry.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        headers: { ...(isOnline ? {} : { "X-Offline-Mode": "true" }) },
      });
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const list = data.articles || [];
      setArticles(list);
      setCached(key, list);
    } catch (err) {
      setError((err as Error).message);
      if (entry?.data && Array.isArray(entry.data)) setArticles(entry.data);
    } finally {
      setLoading(false);
    }
  }, [mode, isOnline, refreshIntervalMs]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => fetchNews(), refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNews, refreshIntervalMs]);

  return (
    <aside className="flex h-full flex-col border-l border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Health News
          </h2>
          <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            LIVE
          </span>
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={loading}
          className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          aria-label="Refresh news"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && articles.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700/50 dark:bg-zinc-800/50"
              >
                <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-2 h-2 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-1 h-2 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {articles.map((article, i) => (
              <motion.a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="group block rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:border-teal-300 hover:shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:hover:border-teal-800"
              >
                <div className="flex gap-2.5">
                  {article.thumbnail_url && (
                    <img
                      src={article.thumbnail_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
                      {article.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {article.description}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {article.favicon_url && (
                      <img
                        src={article.favicon_url}
                        alt=""
                        className="h-3 w-3 rounded-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {article.source}
                    </span>
                    {article.age && (
                      <>
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
                          ·
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(article.age)}
                        </span>
                      </>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
                </div>
              </motion.a>
            ))}
          </div>
        </AnimatePresence>

        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Newspaper className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs text-zinc-400">No news available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
          Powered by You.com Live News · Auto-refreshes every 5 min
        </p>
      </div>
    </aside>
  );
}
