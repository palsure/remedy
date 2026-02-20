"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY_MODE = "remedy-data-mode";
const STORAGE_KEY_REFRESH = "remedy-refresh-interval-min";

export type DataMode = "live" | "offline";

export const REFRESH_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hr" },
  { value: 120, label: "2 hr" },
  { value: 240, label: "4 hr" },
] as const;

export type RefreshIntervalMinutes = (typeof REFRESH_OPTIONS)[number]["value"];

interface OnlineModeContextValue {
  /** "live" = use You.com API; "offline" = cache only */
  mode: DataMode;
  setMode: (m: DataMode) => void;
  /** When mode is "live", don't refetch if cache is newer than this (minutes). */
  refreshIntervalMinutes: RefreshIntervalMinutes;
  setRefreshIntervalMinutes: (v: RefreshIntervalMinutes) => void;
  /** True when mode === "live" (for existing isOnline checks). */
  isOnline: boolean;
  /** Refresh interval in ms for cache freshness checks. */
  refreshIntervalMs: number;
}

const defaultRefresh: RefreshIntervalMinutes = 60;

const OnlineModeContext = createContext<OnlineModeContextValue>({
  mode: "live",
  setMode: () => {},
  refreshIntervalMinutes: defaultRefresh,
  setRefreshIntervalMinutes: () => {},
  isOnline: true,
  refreshIntervalMs: defaultRefresh * 60 * 1000,
});

export function useOnlineMode() {
  const ctx = useContext(OnlineModeContext);
  if (!ctx) throw new Error("useOnlineMode must be used within OnlineModeProvider");
  return ctx;
}

export function OnlineModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>("live");
  const [refreshIntervalMinutes, setRefreshIntervalState] = useState<RefreshIntervalMinutes>(defaultRefresh);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as DataMode | null;
    const legacyOnline = localStorage.getItem("remedy-online-mode");
    if (savedMode === "live" || savedMode === "offline") {
      setModeState(savedMode);
    } else if (legacyOnline === "false") {
      setModeState("offline");
      localStorage.setItem(STORAGE_KEY_MODE, "offline");
    }
    const savedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH);
    const num = parseInt(savedRefresh || "", 10);
    if ([30, 60, 120, 240].includes(num)) setRefreshIntervalState(num as RefreshIntervalMinutes);
    setMounted(true);
  }, []);

  const setMode = useCallback((m: DataMode) => {
    setModeState(m);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_MODE, m);
  }, []);

  const setRefreshIntervalMinutes = useCallback((v: RefreshIntervalMinutes) => {
    setRefreshIntervalState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_REFRESH, String(v));
  }, []);

  const isOnline = mounted ? mode === "live" : true;
  const refreshIntervalMs = refreshIntervalMinutes * 60 * 1000;

  return (
    <OnlineModeContext.Provider
      value={{
        mode: mounted ? mode : "live",
        setMode,
        refreshIntervalMinutes: mounted ? refreshIntervalMinutes : defaultRefresh,
        setRefreshIntervalMinutes,
        isOnline,
        refreshIntervalMs,
      }}
    >
      {children}
    </OnlineModeContext.Provider>
  );
}
