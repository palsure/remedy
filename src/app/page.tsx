"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Brain,
  ShieldCheck,
  Pill,
  FlaskConical,
  Sparkles,
  Stethoscope,
  ArrowRight,
  Newspaper,
  CheckCircle2,
  Zap,
  Globe,
  FileText,
  MessageSquare,
  Target,
  LogIn,
} from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";
import { useAuth } from "@/lib/auth-context";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.section className="text-center" {...fadeIn}>
          <h1 className="flex items-center justify-center gap-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            <AnimatedLogo size={52} />
            Remedy
          </h1>
          <p className="mx-auto mt-2 text-lg font-medium text-teal-600 dark:text-teal-400">
            AI Health Research Agent
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Research medication interactions, supplement evidence, and wellness
            claims with an AI agent that searches live medical sources, analyzes
            the evidence, and delivers structured, citation-backed reports.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-teal-600/20 transition-colors hover:bg-teal-700"
              >
                <MessageSquare className="h-4 w-4" />
                Start Researching
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-teal-600/20 transition-colors hover:bg-teal-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In to Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </motion.section>

        {/* Problem */}
        <motion.section className="mt-24" {...fadeIn}>
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            The Problem
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
            People make health decisions based on bad information every day.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                stat: "70%",
                text: "of Americans take supplements without checking interactions with their medications",
              },
              {
                stat: "125K",
                text: "deaths per year in the US are caused by drug interactions alone",
              },
              {
                stat: "15 min",
                text: "average doctor appointment — not enough for thorough health Q&A",
              },
              {
                stat: "10+",
                text: "browser tabs of contradicting information from a single symptom search",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700/50 dark:bg-zinc-800/50"
              >
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {item.stat}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section className="mt-24" {...fadeIn}>
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Key Features
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Pill,
                title: "Interaction Checker",
                desc: "Check medication & supplement interactions with safety ratings and clinical evidence.",
                color: "text-teal-600 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-400",
              },
              {
                icon: FlaskConical,
                title: "Supplement Research",
                desc: "Evidence-based analysis of supplements — does it actually work? What does the science say?",
                color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400",
              },
              {
                icon: Sparkles,
                title: "Wellness Claims",
                desc: "Fact-check health trends and viral claims with real clinical evidence and citations.",
                color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-400",
              },
              {
                icon: Target,
                title: "Goal Tracking",
                desc: "Set health goals and get AI-powered tips via live research to help you achieve them.",
                color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
              },
              {
                icon: Newspaper,
                title: "Live Health News",
                desc: "Real-time health and medical news sidebar powered by You.com Search API.",
                color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400",
              },
              {
                icon: ShieldCheck,
                title: "Safety & Evidence Ratings",
                desc: "Every report includes a clear safety level and evidence quality assessment at a glance.",
                color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700/50 dark:bg-zinc-800/50"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Agent Workflow */}
        <motion.section className="mt-24" {...fadeIn}>
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            How the Agent Works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
            Remedy&apos;s AI agent researches your question like a medical
            researcher would — and shows every step in real-time.
          </p>
          <div className="mt-10 space-y-0">
            {[
              {
                step: 1,
                icon: Zap,
                title: "Plan",
                desc: "The agent classifies your question and generates targeted medical search queries.",
                api: null,
                color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
                line: "border-violet-300 dark:border-violet-700",
              },
              {
                step: 2,
                icon: Search,
                title: "Search",
                desc: "Executes multiple targeted searches against live medical sources — NIH, Mayo Clinic, PubMed, FDA, and more.",
                api: "You.com Search API",
                color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
                line: "border-blue-300 dark:border-blue-700",
              },
              {
                step: 3,
                icon: BookOpen,
                title: "Read",
                desc: "Extracts full-text content from the most authoritative sources. Prioritizes medical databases.",
                api: "You.com Contents API",
                color: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
                line: "border-teal-300 dark:border-teal-700",
              },
              {
                step: 4,
                icon: Brain,
                title: "Reason",
                desc: "The Advanced Agent analyzes evidence using research and compute tools, cross-references sources, and determines safety ratings.",
                api: "You.com Advanced Agents API",
                color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
                line: "border-purple-300 dark:border-purple-700",
              },
              {
                step: 5,
                icon: CheckCircle2,
                title: "Report",
                desc: "Delivers a structured health report with safety rating, evidence level, detailed analysis, and every claim linked to its source.",
                api: null,
                color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
                line: "border-emerald-300 dark:border-emerald-700",
              },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className={`mt-1 w-px flex-1 border-l-2 border-dashed ${item.line}`}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
                        Step {item.step}
                      </span>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.desc}
                    </p>
                    {item.api && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        <Globe className="h-3 w-3" />
                        {item.api}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* API Integration */}
        <motion.section className="mt-24" {...fadeIn}>
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            You.com API Integration
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
            Remedy uses all three You.com public APIs working in concert.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Search,
                name: "Search API",
                endpoint: "GET /v1/search",
                desc: "Evidence gathering with targeted medical queries, freshness filters, and livecrawl for enriched results.",
                color: "border-t-blue-500",
              },
              {
                icon: FileText,
                name: "Contents API",
                endpoint: "POST /v1/contents",
                desc: "Deep-reads authoritative medical sources by extracting clean markdown from NIH, Mayo Clinic, PubMed, and more.",
                color: "border-t-teal-500",
              },
              {
                icon: Brain,
                name: "Advanced Agents API",
                endpoint: "POST /v1/agents/runs",
                desc: "Core reasoning engine with research + compute tools for multi-step health analysis workflows.",
                color: "border-t-purple-500",
              },
            ].map((api, i) => {
              const Icon = api.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`rounded-xl border border-zinc-200 border-t-4 bg-white p-5 ${api.color} dark:border-zinc-700/50 dark:bg-zinc-800/50`}
                >
                  <Icon className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {api.name}
                  </h3>
                  <code className="mt-1 block text-[11px] text-zinc-400 dark:text-zinc-500">
                    {api.endpoint}
                  </code>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {api.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section className="mt-24" {...fadeIn}>
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tech Stack
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              "Next.js 16",
              "React 19",
              "TypeScript",
              "Tailwind CSS v4",
              "Framer Motion",
              "Server-Sent Events",
              "Docker",
              "You.com APIs",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section className="mt-24 mb-12 text-center" {...fadeIn}>
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-8 dark:border-teal-900/30 dark:from-teal-950/20 dark:to-zinc-900/50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Ready to research?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Ask Remedy any health question and watch the AI agent think,
              search, and reason — all in real-time with full citations.
            </p>
            {user ? (
              <Link
                href="/research"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <MessageSquare className="h-4 w-4" />
                Start Researching
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In to Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
