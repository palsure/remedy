"use client";

import { motion } from "framer-motion";
import { User, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import AgentTimeline from "./AgentTimeline";
import SafetyRatingBadge from "./SafetyRating";
import EvidenceLevelBadge from "./EvidenceLevel";
import SourceCard from "./SourceCard";
import ThinkingAnimation from "./ThinkingAnimation";

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
                <div className="flex flex-wrap gap-2">
                  <SafetyRatingBadge rating={message.report.safety_rating} />
                  <EvidenceLevelBadge level={message.report.evidence_level} />
                </div>

                <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-a:text-teal-600 dark:prose-a:text-teal-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.report.detailed_analysis}
                  </ReactMarkdown>
                </div>

                {message.report.citations.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Sources
                    </h4>
                    <div className="grid gap-2">
                      {message.report.citations.slice(0, 6).map((source, i) => (
                        <SourceCard key={`${source.url}-${i}`} source={source} />
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
