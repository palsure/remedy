"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, Target, LogIn, LogOut, Home, Newspaper, Calendar, Sun, Moon, Wifi, WifiOff, ChevronDown, RefreshCw } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useOnlineMode, REFRESH_OPTIONS } from "@/lib/online-mode-context";
import { RESEARCH_RESET_EVENT } from "@/components/ChatInterface";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const { mode, setMode, refreshIntervalMinutes, setRefreshIntervalMinutes, isOnline } = useOnlineMode();
  const [dataOptionsOpen, setDataOptionsOpen] = useState(false);
  const dataOptionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dataOptionsRef.current && !dataOptionsRef.current.contains(e.target as Node)) {
        setDataOptionsOpen(false);
      }
    }
    if (dataOptionsOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dataOptionsOpen]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-teal-100 bg-white/80 backdrop-blur-md dark:border-teal-900/30 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 items-center justify-between px-8 sm:px-12 lg:px-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <AnimatedLogo size={42} />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Remedy
            </span>
          </Link>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
              AI Health Research Agent
            </span>
            <a
              href="https://you.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-zinc-400 transition-colors hover:text-teal-600 dark:text-zinc-500 dark:hover:text-teal-400"
            >
              Powered by You.com
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* About / Home link — always visible */}
          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">About</span>
          </Link>

          {/* Auth-gated nav links */}
          {user && (
            <>
              <Link
                href="/goals"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/goals")
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Goals</span>
              </Link>
              {pathname.startsWith("/research") ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent(RESEARCH_RESET_EVENT))}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Research</span>
                </button>
              ) : (
                <Link
                  href="/research"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Research</span>
                </Link>
              )}
              <Link
                href="/news"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/news")
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">News</span>
              </Link>
              <Link
                href="/events"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/events")
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Events</span>
              </Link>
            </>
          )}

          {/* Live / Offline — visible segment control for easy toggle */}
          {user && (
            <div className="relative ml-2 flex items-center gap-0 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800" ref={dataOptionsRef}>
              <button
                type="button"
                onClick={() => setMode("live")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                  mode === "live"
                    ? "bg-white text-teal-700 shadow-sm dark:bg-zinc-700 dark:text-teal-300"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
                title="Use You.com API; data cached until refresh interval"
              >
                <Wifi className="h-3.5 w-3.5" />
                <span>Live</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("offline")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                  mode === "offline"
                    ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
                title="Cached data only; no API calls"
              >
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </button>
              {mode === "live" && (
                <>
                  <div className="mx-0.5 h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDataOptionsOpen((o) => !o); }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-600/80"
                    title="Refresh interval"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>{REFRESH_OPTIONS.find((o) => o.value === refreshIntervalMinutes)?.label ?? "1 hr"}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {dataOptionsOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500">Refresh every</div>
                      {REFRESH_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setRefreshIntervalMinutes(opt.value); setDataOptionsOpen(false); }}
                          className={`block w-full px-3 py-1.5 text-left text-xs ${
                            refreshIntervalMinutes === opt.value
                              ? "bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                              : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="ml-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolved === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {user ? (
            <>
              <div className="ml-1 hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
              <div className="ml-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  {user.avatar}
                </div>
                <span className="hidden text-xs font-medium text-zinc-600 md:inline dark:text-zinc-400">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
      {/* Data mode bar — just below main nav for easy visibility */}
      {user && (
        <div className="flex items-center justify-center gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-1.5 text-[11px] dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-zinc-500 dark:text-zinc-400">Data:</span>
          <span className={mode === "live" ? "font-medium text-teal-600 dark:text-teal-400" : "font-medium text-zinc-600 dark:text-zinc-300"}>
            {mode === "live" ? "Live" : "Offline"}
          </span>
          {mode === "live" && (
            <span className="text-zinc-400 dark:text-zinc-500">
              · Refresh every {REFRESH_OPTIONS.find((o) => o.value === refreshIntervalMinutes)?.label ?? "1 hr"}
            </span>
          )}
          {mode === "offline" && (
            <span className="text-zinc-400 dark:text-zinc-500">· Cached only, no API</span>
          )}
        </div>
      )}
    </header>
  );
}
