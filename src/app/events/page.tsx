"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ExternalLink,
  Activity,
  Dumbbell,
  Heart,
  Layers,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Link2,
} from "lucide-react";
import { useOnlineMode } from "@/lib/online-mode-context";
import { cacheKeyEvents, getCached, setCached, isCacheFresh } from "@/lib/api-cache";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  favicon_url?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Layers },
  { id: "health", label: "Health", icon: Heart },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "wellness", label: "Wellness", icon: Activity },
] as const;

function normalizeErrorMessage(apiError: string): string {
  const lower = apiError.toLowerCase();
  if (lower.includes("credits") || lower.includes("used up") || lower.includes("402")) {
    return "You.com API credits not available. Please add credits in your You.com developer account.";
  }
  return apiError;
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

export default function EventsPage() {
  const { mode, isOnline, refreshIntervalMs } = useOnlineMode();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const skipNextEffectRef = useRef(false);

  const cacheKey = cacheKeyEvents(category);

  async function fetchEvents(signal?: AbortSignal, forceRefresh = false) {
    setError(null);
    if (mode === "offline") {
      const entry = getCached<EventItem[]>(cacheKey);
      setLoading(true);
      if (entry?.data?.length) {
        setEvents(entry.data);
        setCachedAt(entry.timestamp);
      } else {
        setEvents([]);
        setError("Offline — no cached data for this category. Switch to Live and load once to cache.");
      }
      setLoading(false);
      return;
    }
    const entry = getCached<EventItem[]>(cacheKey);
    if (!forceRefresh && isCacheFresh(entry, refreshIntervalMs) && entry?.data) {
      setEvents(entry.data);
      setCachedAt(entry.timestamp);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events?category=${encodeURIComponent(category)}`, {
        signal,
        headers: { ...(isOnline ? {} : { "X-Offline-Mode": "true" }) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to fetch events";
        throw new Error(normalizeErrorMessage(msg));
      }
      const list = data.events || [];
      setEvents(list);
      setCachedAt(Date.now());
      setCached(cacheKey, list);
      if (data.offline && !list.length) setError("Offline mode. Switch to Live to fetch events.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError((err as Error).message);
      if (entry?.data) {
        setEvents(entry.data);
        setCachedAt(entry.timestamp);
      } else setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }
    const controller = new AbortController();
    fetchEvents(controller.signal);
    return () => {
      skipNextEffectRef.current = true;
    };
  }, [category, mode, refreshIntervalMs]);

  const currentCategoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? "All";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Events
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upcoming health, fitness, and wellness events · Live data via You.com Search
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
            <div className="relative">
              <button
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-700"
              >
                {(() => {
                  const Icon = CATEGORIES.find((c) => c.id === category)?.icon ?? Layers;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {currentCategoryLabel}
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {showCategoryPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {CATEGORIES.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setCategory(opt.id);
                            setShowCategoryPicker(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                            category === opt.id
                              ? "bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                              : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => fetchEvents(undefined, true)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
          </motion.div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600/30 border-t-teal-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading events…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {events.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700/50 dark:bg-zinc-800/50"
                >
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No events available
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {error
                      ? "Try again after adding You.com API credits or check your connection."
                      : "No upcoming events found for this category. Try another category or refresh later."}
                  </p>
                </motion.div>
              ) : (
                events.map((event, i) => {
                  const Icon =
                    event.category === "health"
                      ? Heart
                      : event.category === "fitness"
                        ? Dumbbell
                        : Activity;
                  const color =
                    event.category === "health"
                      ? "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400"
                      : event.category === "fitness"
                        ? "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400"
                        : "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400";
                  return (
                    <motion.article
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700/50 dark:bg-zinc-800/50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${color}`}
                            >
                              <Icon className="h-3 w-3" />
                              {event.category}
                            </span>
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                              {event.source}
                            </span>
                          </div>
                          <h2 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {event.title}
                          </h2>
                          {event.description && (
                            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {event.description}
                            </p>
                          )}
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
                          >
                            <Link2 className="h-3.5 w-3.5 shrink-0" />
                            Cited source: {event.source}
                          </a>
                        </div>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:bg-teal-900/20 dark:hover:text-teal-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open link
                        </a>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </AnimatePresence>
          )}
        </div>

        {!loading && events.length > 0 && (
          <p className="mt-6 pb-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            {events.length} event{events.length !== 1 ? "s" : ""} · Live data from You.com Search
          </p>
        )}
      </div>
    </div>
  );
}
