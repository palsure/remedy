"use client";

import { motion } from "framer-motion";
import { User, Activity, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import { formatReportAnalysis } from "@/lib/utils";
import AgentTimeline from "./AgentTimeline";
import SafetyRatingBadge from "./SafetyRating";
import EvidenceLevelBadge from "./EvidenceLevel";
import SafetyBanner from "./SafetyBanner";
import SourceCard from "./SourceCard";
import SourceTierBadge from "./SourceTierBadge";
import ThinkingAnimation from "./ThinkingAnimation";

/** Split markdown by ## headers into sections for clearer, scannable layout. */
function parseReportSections(markdown: string): { title: string; content: string }[] {
  if (!markdown?.trim()) return [];
  const blocks = markdown.split(/\n(?=##\s+)/);
  const sections: { title: string; content: string }[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const firstLineEnd = trimmed.indexOf("\n");
    const firstLine = firstLineEnd >= 0 ? trimmed.slice(0, firstLineEnd) : trimmed;
    const content = firstLineEnd >= 0 ? trimmed.slice(firstLineEnd + 1).trim() : "";
    const titleMatch = firstLine.match(/^##\s+(.+)$/);
    if (titleMatch) {
      sections.push({ title: titleMatch[1].trim().replace(/^#+\s*/, ""), content });
    } else if (trimmed) {
      sections.push({ title: "Summary", content: trimmed });
    }
  }
  return sections.filter((s) => s.content || s.title.toLowerCase().includes("assessment"));
}

/**
 * Sections that should always render as a bullet list.
 * If the content isn't already a markdown list, convert each non-heading line into a bullet.
 */
const BULLET_SECTIONS = new Set([
  "Key Points",
  "key points",
  "Potential Benefits (Pros)",
  "potential benefits (pros)",
  "Risks & Considerations (Cons)",
  "risks & considerations (cons)",
]);

function ensureBulletList(title: string, content: string): string {
  const key = title.toLowerCase();
  if (!BULLET_SECTIONS.has(key) && !BULLET_SECTIONS.has(title)) return content;

  // Strip any ### sub-headings that repeat the section name
  const lines = content.split("\n").filter((l) => {
    const t = l.trim();
    return t && !/^#{1,4}\s*(Key Points|Potential Benefits|Risks|Considerations)/i.test(t);
  });

  return lines
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      // Already a bullet or numbered list item — keep as-is
      if (/^[-*+]\s/.test(t) || /^\d+\.\s/.test(t)) return line;
      // Skip lines that are themselves headings
      if (/^#{1,4}\s/.test(t)) return line;
      // Wrap plain text lines as bullet items
      return `- ${t}`;
    })
    .filter(Boolean)
    .join("\n");
}

export default function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
          <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
      )}

      <div
        className={`max-w-[85%] min-w-0 ${
          isUser
            ? "rounded-2xl rounded-tr-md bg-teal-600 px-4 py-2.5 text-white"
            : "flex-1"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="space-y-4">
            {message.steps && message.steps.length > 0 && (
              <AgentTimeline steps={message.steps} />
            )}

            {isStreaming && (!message.steps || message.steps.length === 0) && (
              <ThinkingAnimation label="Researching..." />
            )}

            {message.report && (
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
                {message.report.credits_unavailable && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/40">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold">Unable to use You.com</p>
                      <p className="mt-0.5 text-xs">
                        API credits are not available. This response is limited and was not generated from live You.com search or sources. Add credits in your You.com developer account for full research.
                      </p>
                    </div>
                  </div>
                )}
                <SafetyBanner
                  rating={message.report.safety_rating}
                  riskScore={message.report.risk_score}
                  compact
                />
                <div className="flex flex-wrap gap-2">
                  <SafetyRatingBadge rating={message.report.safety_rating} />
                  <EvidenceLevelBadge level={message.report.evidence_level} />
                </div>

                {/* Report sections: Summary, Key Points, Benefits, Risks, etc. in clear cards */}
                {(() => {
                  const formatted = formatReportAnalysis(message.report.detailed_analysis);
                  const sections = parseReportSections(formatted).filter(
                    (s) => s.title.toLowerCase() !== "sources"
                  );
                  const sectionLabels: Record<string, string> = {
                    "Safety Assessment": "Safety",
                    "Key Points": "Key points",
                    "Potential Benefits (Pros)": "Potential benefits",
                    "Risks & Considerations (Cons)": "Risks & considerations",
                    "How It Works": "How it works",
                    "Recommendations": "Recommendations",
                    "Questions for Your Doctor": "Questions for your doctor",
                    "Contraindication Alerts (if any)": "Contraindication alerts",
                    "Conflicting Evidence (if any)": "Conflicting evidence",
                  };
                  if (sections.length === 0) {
                    return (
                      <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-a:text-teal-600 dark:prose-a:text-teal-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formatted}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {sections.map((sec, i) => {
                        const label = sectionLabels[sec.title] || sec.title;
                        if (!sec.content && !sec.title.toLowerCase().includes("assessment")) return null;
                        const renderedContent = ensureBulletList(sec.title, sec.content || sec.title);
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/50 dark:bg-zinc-800/30"
                          >
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              {label}
                            </h3>
                            <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-1.5 prose-headings:mb-1 prose-headings:text-sm prose-a:text-teal-600 dark:prose-a:text-teal-400">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{renderedContent}</ReactMarkdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {message.report.contraindication_alerts && message.report.contraindication_alerts.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Contraindication alerts
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                      {message.report.contraindication_alerts.map((a, i) => (
                        <li key={i}>
                          <strong>{a.population}:</strong> {a.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.report.conflicting_evidence && message.report.conflicting_evidence.length > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-800/50 dark:bg-orange-950/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      Conflicting evidence
                    </h4>
                    <ul className="mt-2 space-y-2 text-xs text-orange-800 dark:text-orange-300">
                      {message.report.conflicting_evidence.map((c, i) => (
                        <li key={i}>
                          &ldquo;{c.claim_a}&rdquo; vs &ldquo;{c.claim_b}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.report.citations.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Sources (evidence hierarchy)
                    </h4>
                    <div className="grid gap-2">
                      {message.report.citations.slice(0, 6).map((source, i) => (
                        <div key={`${source.url}-${i}`} className="flex items-start gap-2">
                          <SourceTierBadge tier={source.source_tier} />
                          <SourceCard source={source} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                  {message.report.disclaimer}
                </p>
              </div>
            )}

            {!message.report && !isStreaming && message.content && (
              <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {isStreaming && message.steps && message.steps.length > 0 && !message.report && (
              <ThinkingAnimation label="Processing..." />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
}
