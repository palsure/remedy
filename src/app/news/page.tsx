"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Activity,
  Dumbbell,
  Apple,
  Brain,
  Layers,
} from "lucide-react";
import { useOnlineMode } from "@/lib/online-mode-context";
import { cacheKeyNewsFull, getCached, setCached, isCacheFresh } from "@/lib/api-cache";

interface NewsArticle {
  title: string;
  url: string;
  description: string;
  thumbnail_url?: string;
  favicon_url?: string;
  source: string;
  age?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Layers },
  { id: "medical", label: "Medical", icon: Activity },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "diet", label: "Diet & Nutrition", icon: Apple },
  { id: "wellness", label: "Wellness", icon: Brain },
] as const;

const DAY_OPTIONS = [
  { value: 1, label: "Today" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

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

function formatTimeAgo(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} day${hr >= 48 ? "s" : ""} ago`;
}

export default function HealthNewsPage() {
  const { mode, isOnline, refreshIntervalMs } = useOnlineMode();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [days, setDays] = useState(7);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextEffectRef = useRef(false);

  function normalizeErrorMessage(apiError: string): string {
    const lower = apiError.toLowerCase();
    if (lower.includes("credits") || lower.includes("used up") || lower.includes("402")) {
      return "You.com API credits not available. Please add credits in your You.com developer account.";
    }
    return apiError;
  }

  const cacheKey = cacheKeyNewsFull(category, days, true);

  async function fetchNews(requestSummary: boolean, signal?: AbortSignal, forceRefresh = false) {
    setError(null);
    if (mode === "offline") {
      const entry = getCached<{ articles: NewsArticle[]; summary: string }>(cacheKey);
      const cached = entry?.data;
      setLoading(true);
      if (cached?.articles && entry) {
        setArticles(cached.articles);
        setSummary(cached.summary || "");
        setCachedAt(entry.timestamp);
      } else {
        setArticles([]);
        setSummary("");
        setError("Offline mode — no cached data for this filter. Switch to Live and load once to cache.");
      }
      setLoading(false);
      setSummaryLoading(false);
      return;
    }

    const entry = getCached<{ articles: NewsArticle[]; summary: string }>(cacheKey);
    if (!forceRefresh && isCacheFresh(entry, refreshIntervalMs) && entry?.data) {
      setArticles((entry.data as { articles: NewsArticle[] }).articles || []);
      setSummary((entry.data as { summary: string }).summary || "");
      setCachedAt(entry.timestamp);
      setLoading(false);
      setSummaryLoading(false);
      return;
    }

    setLoading(true);
    if (requestSummary) setSummaryLoading(true);

    try {
      const params = new URLSearchParams({
        category,
        days: String(days),
        summary: String(requestSummary),
      });
      const res = await fetch(`/api/news/full?${params}`, {
        signal,
        headers: { ...(isOnline ? {} : { "X-Offline-Mode": "true" }) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to fetch news";
        throw new Error(normalizeErrorMessage(msg));
      }
      if (data.error) throw new Error(normalizeErrorMessage(data.error));
      const list = data.articles || [];
      const sum = data.summary || "";
      setArticles(list);
      setSummary(sum);
      setCachedAt(Date.now());
      setCached(cacheKey, { articles: list, summary: sum });
      if (data.offline && !list.length) setError("Offline mode is on. Switch to Live in the header to fetch news.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError((err as Error).message);
      if (entry?.data) {
        const d = entry.data as { articles: NewsArticle[]; summary: string };
        setArticles(d.articles || []);
        setSummary(d.summary || "");
        setCachedAt(entry.timestamp);
      }
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }
    setSummary("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchNews(true, controller.signal);
    return () => {
      skipNextEffectRef.current = true;
      abortRef.current = null;
    };
  }, [category, days, mode, refreshIntervalMs]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
              <Newspaper className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Health News
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Live News Analyzer · Track emerging trends · AI daily briefing powered by You.com
              </p>
              {cachedAt != null && (
                <span className="mt-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {mode === "offline" ? "Offline · cached " : "Cached "}
                  {formatTimeAgo(Date.now() - cachedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Day range picker */}
            <div className="relative">
              <button
                onClick={() => setShowDayPicker(!showDayPicker)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-700"
              >
                <Clock className="h-3.5 w-3.5" />
                {DAY_OPTIONS.find((d) => d.value === days)?.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {showDayPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {DAY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDays(opt.value);
                          setShowDayPicker(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                          days === opt.value
                            ? "bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => fetchNews(true, undefined, true)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* AI Summary */}
        <AnimatePresence mode="wait">
          {(summary || summaryLoading) && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5"
            >
              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-900/30 dark:from-teal-950/20 dark:to-zinc-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI daily briefing
                </div>
                {summaryLoading && !summary ? (
                  <div className="mt-2 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-teal-100 dark:bg-teal-900/30" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-teal-100 dark:bg-teal-900/30" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-teal-100 dark:bg-teal-900/30" />
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {summary}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && articles.length === 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50"
              >
                <div className="h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-3 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-2 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-1 h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {/* Articles grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {articles.map((article, i) => (
              <motion.a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="group flex flex-col rounded-xl border border-zinc-200 bg-white transition-all hover:border-teal-300 hover:shadow-md dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:hover:border-teal-800"
              >
                {article.thumbnail_url && (
                  <div className="relative h-36 overflow-hidden rounded-t-xl bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={article.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
                    {article.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {article.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-700/50">
                    <div className="flex items-center gap-1.5">
                      {article.favicon_url && (
                        <img
                          src={article.favicon_url}
                          alt=""
                          className="h-3.5 w-3.5 rounded-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                        {article.source}
                      </span>
                      {article.age && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">
                            ·
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(article.age)}
                          </span>
                        </>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
                  </div>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>

        {!loading && !error && articles.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <Newspaper className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-400">
              No news found for this category and time range.
            </p>
          </div>
        )}

        {/* Results count */}
        {!loading && articles.length > 0 && (
          <p className="mt-6 pb-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            Insight dashboard: {articles.length} articles · {CATEGORIES.find((c) => c.id === category)?.label} · {DAY_OPTIONS.find((d) => d.value === days)?.label} · You.com Live News
          </p>
        )}
      </div>
    </div>
  );
}
