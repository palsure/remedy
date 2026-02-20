"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  History,
  Clock,
  ShieldCheck,
  FlaskConical,
  FileText,
  Trash2,
  Search,
  X,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Download,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import SafetyBanner from "@/components/SafetyBanner";
import CollapsibleSection from "@/components/CollapsibleSection";
import SourceTierBadge from "@/components/SourceTierBadge";
import ChatInterface from "@/components/ChatInterface";
import { HISTORY_KEY, HISTORY_EVENT } from "@/components/ChatInterface";
import type { ResearchEntry } from "@/components/ChatInterface";
import { formatReportAnalysis } from "@/lib/utils";

function loadHistory(): ResearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function safetyColor(rating: string) {
  switch (rating) {
    case "safe":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "caution":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "warning":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "danger":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function evidenceColor(level: string) {
  switch (level) {
    case "strong":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "moderate":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "limited":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function extractProsCons(analysis: string): {
  pros: string[];
  cons: string[];
  recommendations: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const recommendations: string[] = [];

  const sections = analysis.split(/^##\s+/m);
  for (const section of sections) {
    const lines = section.split("\n");
    const heading = (lines[0] || "").toLowerCase();
    const bullets = lines
      .slice(1)
      .filter((l) => l.trim().startsWith("- "))
      .map((l) =>
        l
          .replace(/^-\s+/, "")
          .replace(/\*\*/g, "")
          .replace(/\[.*?\]\(.*?\)/g, "")
          .trim()
      )
      .filter((l) => l.length > 10 && l.length < 200);

    if (/benefit|pros/i.test(heading)) {
      pros.push(...bullets.slice(0, 3));
    } else if (/risk|cons|consideration/i.test(heading)) {
      cons.push(...bullets.slice(0, 3));
    } else if (/recommendation/i.test(heading)) {
      recommendations.push(...bullets.slice(0, 3));
    }
  }

  return { pros, cons, recommendations };
}

type ReportViewMode = "patient" | "doctor";

export default function ResearchPage() {
  const [history, setHistory] = useState<ResearchEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ResearchEntry | null>(null);
  const [reportViewMode, setReportViewMode] = useState<ReportViewMode>("patient");

  useEffect(() => {
    setHistory(loadHistory());
    const handler = () => setHistory(loadHistory());
    window.addEventListener(HISTORY_EVENT, handler);
    return () => window.removeEventListener(HISTORY_EVENT, handler);
  }, []);

  useEffect(() => {
    if (selectedEntry) setReportViewMode("patient");
  }, [selectedEntry?.id]);

  const deleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    setSelectedEntry(null);
  };

  const exportReport = (entry: ResearchEntry) => {
    const lines = [
      `Remedy — Research Report`,
      `Question: ${entry.question}`,
      `Safety: ${entry.safetyRating} | Evidence: ${entry.evidenceLevel}${entry.riskScore != null ? ` | Risk score: ${entry.riskScore}/100` : ""}`,
      ``,
      `Summary: ${entry.summary}`,
      ``,
      entry.analysis,
      ``,
      `Sources:`,
      ...(entry.citations || []).map((c) => `- ${c.title} (${c.url})`),
    ];
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remedy-report-${entry.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* Chat panel */}
      <div className="flex-1 min-w-0">
        <ChatInterface />
      </div>

      {/* Research History sidebar */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50/50 lg:flex xl:w-96 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Research Summary
            </h2>
            {history.length > 0 && (
              <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                {history.length}
              </span>
            )}
          </div>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No research yet
              </p>
              <p className="max-w-[200px] text-[11px] text-zinc-400 dark:text-zinc-600">
                Ask a health question and results will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedEntry(entry)}
                  role="button"
                  tabIndex={0}
                  className="group w-full cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 text-left transition-all hover:border-teal-300 hover:shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:hover:border-teal-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
                      {entry.question}
                    </h3>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  {(() => {
                    const { pros, cons, recommendations } = entry.analysis
                      ? extractProsCons(entry.analysis)
                      : { pros: [], cons: [], recommendations: [] };
                    const hasParsed =
                      pros.length > 0 ||
                      cons.length > 0 ||
                      recommendations.length > 0;
                    return hasParsed ? (
                      <div className="mt-1.5 space-y-1">
                        {pros.length > 0 && (
                          <div className="flex items-start gap-1">
                            <ThumbsUp className="mt-0.5 h-2.5 w-2.5 shrink-0 text-emerald-500" />
                            <p className="line-clamp-1 text-[10px] leading-snug text-emerald-700 dark:text-emerald-400">
                              {pros[0]}
                            </p>
                          </div>
                        )}
                        {cons.length > 0 && (
                          <div className="flex items-start gap-1">
                            <ThumbsDown className="mt-0.5 h-2.5 w-2.5 shrink-0 text-red-400" />
                            <p className="line-clamp-1 text-[10px] leading-snug text-red-600 dark:text-red-400">
                              {cons[0]}
                            </p>
                          </div>
                        )}
                        {recommendations.length > 0 && (
                          <div className="flex items-start gap-1">
                            <Lightbulb className="mt-0.5 h-2.5 w-2.5 shrink-0 text-amber-500" />
                            <p className="line-clamp-1 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
                              {recommendations[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : entry.summary ? (
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {entry.summary}
                      </p>
                    ) : null;
                  })()}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${safetyColor(entry.safetyRating)}`}
                      >
                        <ShieldCheck className="h-2.5 w-2.5" />
                        {entry.safetyRating}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${evidenceColor(entry.evidenceLevel)}`}
                      >
                        <FlaskConical className="h-2.5 w-2.5" />
                        {entry.evidenceLevel}
                      </span>
                      {entry.citations?.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                          <FileText className="h-2.5 w-2.5" />
                          {entry.citations.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => deleteEntry(e, entry.id)}
                      className="rounded p-0.5 text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            Click an entry to view full report
          </p>
        </div>
      </aside>

      {/* Research Detail Overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {selectedEntry.question}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${safetyColor(selectedEntry.safetyRating)}`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {selectedEntry.safetyRating}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${evidenceColor(selectedEntry.evidenceLevel)}`}
                    >
                      <FlaskConical className="h-3 w-3" />
                      {selectedEntry.evidenceLevel} evidence
                    </span>
                    {selectedEntry.riskScore != null && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                        Risk score: {selectedEntry.riskScore}/100
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {timeAgo(selectedEntry.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setReportViewMode("patient")}
                      className={`rounded-l-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        reportViewMode === "patient"
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      }`}
                      title="Plain language + action steps"
                    >
                      Patient
                    </button>
                    <button
                      onClick={() => setReportViewMode("doctor")}
                      className={`rounded-r-md border-l border-zinc-200 px-2 py-1 text-[11px] font-medium transition-colors dark:border-zinc-700 ${
                        reportViewMode === "doctor"
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      }`}
                      title="Clinical summary format"
                    >
                      Doctor
                    </button>
                  </div>
                  <button
                    onClick={() => exportReport(selectedEntry)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-teal-600 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
                    title="Export report (physician share format)"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {selectedEntry.creditsUnavailable && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/40">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold">Unable to use You.com</p>
                      <p className="mt-0.5 text-xs">
                        API credits were not available for this research. This response is limited and was not generated from live You.com search or sources.
                      </p>
                    </div>
                  </div>
                )}
                {/* Safety banner */}
                <SafetyBanner
                  rating={selectedEntry.safetyRating as "safe" | "caution" | "warning" | "danger" | "unknown"}
                  riskScore={selectedEntry.riskScore}
                />

                {/* Summary */}
                {selectedEntry.summary && (
                  <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/30 dark:bg-teal-950/20">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Summary
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {selectedEntry.summary}
                    </p>
                  </div>
                )}

                {/* Contraindication alerts */}
                {selectedEntry.contraindicationAlerts && selectedEntry.contraindicationAlerts.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Contraindication alerts
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                      {selectedEntry.contraindicationAlerts.map((a, i) => (
                        <li key={i}>
                          <strong>{a.population}:</strong> {a.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conflicting evidence */}
                {selectedEntry.conflictingEvidence && selectedEntry.conflictingEvidence.length > 0 && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-800/50 dark:bg-orange-950/20">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      Conflicting evidence
                    </h3>
                    <ul className="mt-2 space-y-2 text-xs text-orange-800 dark:text-orange-300">
                      {selectedEntry.conflictingEvidence.map((c, i) => (
                        <li key={i}>
                          &ldquo;{c.claim_a}&rdquo; vs &ldquo;{c.claim_b}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer extras */}
                {selectedEntry.disclaimerExtras && selectedEntry.disclaimerExtras.length > 0 && (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                    {selectedEntry.disclaimerExtras.map((line, i) => (
                      <p key={i} className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        {line}
                      </p>
                    ))}
                  </div>
                )}

                {/* Collapsible: Evidence / Analysis */}
                {selectedEntry.analysis && (
                  <div className="mt-4">
                    <CollapsibleSection
                      title={reportViewMode === "doctor" ? "Clinical summary" : "Detailed analysis (plain language)"}
                      defaultOpen={true}
                    >
                      <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300 prose-headings:text-zinc-900 prose-headings:dark:text-zinc-100 prose-a:text-teal-600 prose-a:dark:text-teal-400 prose-strong:text-zinc-900 prose-strong:dark:text-zinc-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formatReportAnalysis(selectedEntry.analysis)}
                        </ReactMarkdown>
                      </div>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Collapsible: Sources with hierarchy */}
                {selectedEntry.citations?.length > 0 && (
                  <div className="mt-4">
                    <CollapsibleSection title={`Sources (${selectedEntry.citations.length}) — evidence hierarchy`} defaultOpen={true}>
                      <div className="space-y-2">
                        {selectedEntry.citations.map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-teal-300 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:hover:border-teal-800 dark:hover:bg-zinc-800"
                          >
                            <SourceTierBadge tier={c.source_tier} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
                                {c.title}
                              </p>
                              {c.snippet && (
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                  {c.snippet}
                                </p>
                              )}
                              <span className="mt-1 inline-block text-[10px] text-zinc-400 dark:text-zinc-500">
                                {extractDomain(c.url)}
                                {c.pubmed_id ? ` · PubMed ${c.pubmed_id}` : ""}
                                {c.doi ? ` · DOI ${c.doi}` : ""}
                              </span>
                            </div>
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-500 dark:text-zinc-600" />
                          </a>
                        ))}
                      </div>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Collapsible: Query log (reproducible research) */}
                {selectedEntry.queryLog && selectedEntry.queryLog.length > 0 && (
                  <div className="mt-4">
                    <CollapsibleSection title="Research steps (query log)" defaultOpen={false}>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <GitBranch className="h-3.5 w-3.5" />
                        Reproducible: exact queries run for this report
                      </div>
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {selectedEntry.queryLog.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ol>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Rejected sources (reasoning checkpoints) */}
                {selectedEntry.rejectedSources && selectedEntry.rejectedSources.length > 0 && (
                  <div className="mt-4">
                    <CollapsibleSection title="Sources not used (reasoning checkpoints)" defaultOpen={false}>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        These were considered but not in the top-priority read list.
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        {selectedEntry.rejectedSources.map((r, i) => (
                          <li key={i}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline dark:text-teal-400">
                              {r.title}
                            </a>
                            <span className="text-zinc-400"> — {r.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
                <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                  This is research-based information, not medical advice.
                  Consult your healthcare provider.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
