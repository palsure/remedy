"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  Trophy,
  TrendingUp,
  X,
  Sparkles,
  Bell,
  ExternalLink,
  Clock,
  CheckCheck,
  Trash2,
} from "lucide-react";
import type { HealthGoal, GoalTip, GoalCategory, GoalNotification } from "@/lib/types";
import { generateId } from "@/lib/utils";
import GoalCard from "@/components/GoalCard";
import NotificationToast from "@/components/NotificationToast";

const STORAGE_KEY = "remedy-health-goals";
const NOTIF_KEY = "remedy-notifications";

const categoryOptions: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: "nutrition", label: "Nutrition", emoji: "🥗" },
  { value: "exercise", label: "Exercise", emoji: "🏃" },
  { value: "sleep", label: "Sleep", emoji: "😴" },
  { value: "supplements", label: "Supplements", emoji: "💊" },
  { value: "mental_health", label: "Mental Health", emoji: "🧠" },
  { value: "hydration", label: "Hydration", emoji: "💧" },
  { value: "custom", label: "Custom", emoji: "🎯" },
];

const presetGoals: { title: string; category: GoalCategory; target: string }[] = [
  { title: "Drink 8 glasses of water daily", category: "hydration", target: "Stay hydrated throughout the day" },
  { title: "Sleep 7-8 hours per night", category: "sleep", target: "Improve sleep quality and consistency" },
  { title: "Exercise 30 minutes daily", category: "exercise", target: "Build a regular exercise habit" },
  { title: "Eat 5 servings of vegetables daily", category: "nutrition", target: "Improve daily nutrition intake" },
  { title: "Practice 10 minutes of meditation", category: "mental_health", target: "Reduce stress and improve focus" },
  { title: "Take daily vitamins consistently", category: "supplements", target: "Never miss daily supplement routine" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<GoalCategory>("custom");
  const [newTarget, setNewTarget] = useState("");
  const [tipsLoadingId, setTipsLoadingId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setGoals(JSON.parse(saved)); } catch {}
    }
    const savedNotifs = localStorage.getItem(NOTIF_KEY);
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals]);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Auto-fetch tips for goals with notifications enabled (every 2 minutes for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeGoals = goals.filter(
        (g) => g.status === "active" && g.notificationsEnabled
      );
      if (activeGoals.length > 0) {
        const randomGoal =
          activeGoals[Math.floor(Math.random() * activeGoals.length)];
        fetchTipsAndNotify(randomGoal);
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [goals]);

  const fetchTipsAndNotify = useCallback(
    async (goal: HealthGoal) => {
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalTitle: goal.title,
            category: goal.category,
          }),
        });
        const data = await res.json();
        if (data.tips && data.tips.length > 0) {
          const randomTip =
            data.tips[Math.floor(Math.random() * data.tips.length)];
          const notif: GoalNotification = {
            id: generateId(),
            goalId: goal.id,
            goalTitle: goal.title,
            tip: randomTip.text,
            source: randomTip.source,
            sourceUrl: randomTip.sourceUrl,
            read: false,
            createdAt: Date.now(),
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 20));
        }
      } catch {}
    },
    []
  );

  const addGoal = (title: string, category: GoalCategory, target: string) => {
    const goal: HealthGoal = {
      id: generateId(),
      title,
      category,
      status: "active",
      target,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tips: [],
      notificationsEnabled: true,
    };
    setGoals((prev) => [goal, ...prev]);
    setShowAddModal(false);
    setNewTitle("");
    setNewTarget("");
    setNewCategory("custom");

    // Auto-fetch tips for the new goal
    setTimeout(() => fetchTipsForGoal(goal.id, title, category), 500);
  };

  const fetchTipsForGoal = async (goalId: string, title: string, category: GoalCategory) => {
    setTipsLoadingId(goalId);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle: title, category }),
      });
      const data = await res.json();
      if (data.tips) {
        const tips: GoalTip[] = data.tips.map(
          (t: { text: string; highlights?: string[]; source: string; sourceUrl: string }) => ({
            id: generateId(),
            text: t.text,
            highlights: t.highlights || [],
            source: t.source,
            sourceUrl: t.sourceUrl,
            fetchedAt: Date.now(),
          })
        );
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, tips } : g))
        );

        // Also create a notification if notifications are enabled
        const goal = goals.find((g) => g.id === goalId);
        if (goal?.notificationsEnabled && tips.length > 0) {
          const notif: GoalNotification = {
            id: generateId(),
            goalId,
            goalTitle: title,
            tip: tips[0].text,
            source: tips[0].source,
            sourceUrl: tips[0].sourceUrl,
            read: false,
            createdAt: Date.now(),
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 20));
        }
      }
    } catch {
    } finally {
      setTipsLoadingId(null);
    }
  };

  const updateProgress = (id: string, progress: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newStatus = progress >= 100 ? "completed" : g.status === "completed" ? "active" : g.status;
        return { ...g, progress: Math.min(100, Math.max(0, progress)), status: newStatus, updatedAt: Date.now() };
      })
    );
  };

  const toggleStatus = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = g.status === "active" ? "paused" : g.status === "paused" ? "active" : "active";
        return { ...g, status: next, progress: next === "active" && g.status === "completed" ? 0 : g.progress, updatedAt: Date.now() };
      })
    );
  };

  const toggleNotifications = (id: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, notificationsEnabled: !g.notificationsEnabled }
          : g
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIF_KEY);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleFetchTips = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      fetchTipsForGoal(goalId, goal.title, goal.category);
    }
  };

  function formatTimeAgo(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const pausedGoals = goals.filter((g) => g.status === "paused");
  const avgProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + g.progress, 0) /
            activeGoals.length
        )
      : 0;

  return (
    <>
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="flex h-full">
        {/* Main goals panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Health Goals
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Track your health goals and get AI-powered tips to achieve them
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Target className="h-3.5 w-3.5 text-teal-500" />
                  Active Goals
                </div>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {activeGoals.length}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  Avg Progress
                </div>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {avgProgress}%
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Completed
                </div>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {completedGoals.length}
                </p>
              </div>
            </div>

            {/* Goals list */}
            {goals.length === 0 ? (
              <div className="mt-12 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <Target className="h-8 w-8 text-zinc-400" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  No goals yet
                </h2>
                <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  Start tracking your health goals. The AI will suggest
                  evidence-based tips to help you achieve them.
                </p>
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {presetGoals.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() =>
                        addGoal(preset.title, preset.category, preset.target)
                      }
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-left text-xs transition-all hover:border-teal-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-teal-700"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {preset.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {activeGoals.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Active ({activeGoals.length})
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {activeGoals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onUpdateProgress={updateProgress}
                            onToggleStatus={toggleStatus}
                            onToggleNotifications={toggleNotifications}
                            onDelete={deleteGoal}
                            onFetchTips={handleFetchTips}
                            tipsLoading={tipsLoadingId === goal.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {pausedGoals.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Paused ({pausedGoals.length})
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {pausedGoals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onUpdateProgress={updateProgress}
                            onToggleStatus={toggleStatus}
                            onToggleNotifications={toggleNotifications}
                            onDelete={deleteGoal}
                            onFetchTips={handleFetchTips}
                            tipsLoading={tipsLoadingId === goal.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {completedGoals.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Completed ({completedGoals.length})
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {completedGoals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onUpdateProgress={updateProgress}
                            onToggleStatus={toggleStatus}
                            onToggleNotifications={toggleNotifications}
                            onDelete={deleteGoal}
                            onFetchTips={handleFetchTips}
                            tipsLoading={tipsLoadingId === goal.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications sidebar */}
        <aside className="hidden w-80 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50/50 lg:flex xl:w-96 dark:border-zinc-800 dark:bg-zinc-900/50">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                  title="Mark all read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  No notifications yet
                </p>
                <p className="max-w-[200px] text-[11px] text-zinc-400 dark:text-zinc-600">
                  Enable notifications on a goal to receive AI-powered tips here.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2 }}
                      className={`group relative rounded-lg border p-3 transition-colors ${
                        notif.read
                          ? "border-zinc-200 bg-white dark:border-zinc-700/50 dark:bg-zinc-800/30"
                          : "border-teal-200 bg-teal-50/50 dark:border-teal-900/40 dark:bg-teal-950/20"
                      }`}
                    >
                      {!notif.read && (
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
                      )}

                      <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500 dark:text-teal-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                            {notif.goalTitle}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {notif.tip}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {notif.source && notif.sourceUrl && (
                              <a
                                href={notif.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-teal-600 hover:underline dark:text-teal-400"
                              >
                                {notif.source}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="absolute right-1.5 bottom-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {!notif.read && (
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                            title="Mark read"
                          >
                            <CheckCheck className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
              Tips auto-refresh every 2 min for active goals
            </p>
          </div>
        </aside>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  New Health Goal
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Drink 8 glasses of water daily"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Category
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setNewCategory(cat.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          newCategory === cat.value
                            ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Target / Description
                  </label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="e.g., Improve daily hydration"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {/* Quick presets */}
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Quick Add
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {presetGoals.slice(0, 4).map((preset) => (
                      <button
                        key={preset.title}
                        onClick={() => {
                          setNewTitle(preset.title);
                          setNewCategory(preset.category);
                          setNewTarget(preset.target);
                        }}
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-left text-[11px] text-zinc-600 transition-colors hover:border-teal-300 hover:bg-teal-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-teal-800"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    addGoal(
                      newTitle || "Health Goal",
                      newCategory,
                      newTarget || "Achieve this goal"
                    )
                  }
                  disabled={!newTitle.trim()}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
                >
                  Add Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
