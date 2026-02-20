/**
 * Client-side cache for You.com API responses to reduce usage and support offline.
 */

const PREFIX = "remedy-cache-";
const MAX_AGE_MS_OFFLINE = 7 * 24 * 60 * 60 * 1000; // 7 days for offline display

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

export function cacheKeyNewsFull(category: string, days: number, summary: boolean): string {
  return `${PREFIX}news-full-${category}-${days}-${summary}`;
}

export function cacheKeyEvents(category: string): string {
  return `${PREFIX}events-${category}`;
}

export function cacheKeyGoalsTips(goalTitle: string, category: string): string {
  return `${PREFIX}goals-${encodeURIComponent(goalTitle)}-${category}`;
}

export function cacheKeyResearch(question: string): string {
  const normalized = question.trim().toLowerCase().slice(0, 200);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return `${PREFIX}research-${Math.abs(hash).toString(36)}`;
}

export function cacheKeyNews(): string {
  return `${PREFIX}news`;
}

export function getCached<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isCacheFresh(entry: CacheEntry | null, refreshIntervalMs: number): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < refreshIntervalMs;
}

export function setCached(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function getCachedForOffline<T>(key: string): T | null {
  const entry = getCached<T>(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MAX_AGE_MS_OFFLINE) return null;
  return entry.data as T;
}
