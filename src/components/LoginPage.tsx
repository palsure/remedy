"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setError(result.error || "Login failed");
      } else {
        router.push("/research");
      }
      setIsSubmitting(false);
    }, 400);
  };

  const fillDemo = () => {
    setEmail("demo@remedy.health");
    setPassword("demo1234");
    setError("");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-zinc-50 via-teal-50/30 to-zinc-50 px-4 dark:from-zinc-950 dark:via-teal-950/10 dark:to-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo & Title */}
        <div className="flex flex-col items-center">
          <AnimatedLogo size={48} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Remedy
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            AI Health Research Agent
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Sign in to continue
            </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/30 dark:bg-teal-950/20"
        >
          <p className="text-center text-xs font-semibold text-teal-800 dark:text-teal-300">
            Demo Account
          </p>
          <div className="mt-2 space-y-1 text-center text-xs text-teal-700 dark:text-teal-400">
            <p>
              Email: <code className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-teal-900/40">demo@remedy.health</code>
            </p>
            <p>
              Password: <code className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-teal-900/40">demo1234</code>
            </p>
          </div>
          <button
            onClick={fillDemo}
            className="mx-auto mt-3 flex items-center gap-1 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
          >
            Use Demo Account
            <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>

        <p className="mt-6 text-center text-[10px] text-zinc-400 dark:text-zinc-600">
          Powered by You.com APIs
        </p>
      </motion.div>
    </div>
  );
}
