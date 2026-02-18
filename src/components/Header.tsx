"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Target, LogIn, LogOut, Home, Newspaper, Sun, Moon } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();

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
              <Link
                href="/research"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/research")
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Research</span>
              </Link>
              <Link
                href="/news"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/news")
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Health News</span>
              </Link>
            </>
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
                  onClick={logout}
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
    </header>
  );
}
