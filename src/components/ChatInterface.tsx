"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import type { ChatMessage, AgentStepData, SSEEvent } from "@/lib/types";
import { generateId } from "@/lib/utils";
import MessageBubble from "./MessageBubble";
import ResearchModeCards from "./ResearchModeCards";
import SuggestedQueries from "./SuggestedQueries";

export interface ResearchEntry {
  id: string;
  question: string;
  summary: string;
  analysis: string;
  safetyRating: string;
  evidenceLevel: string;
  citations: { title: string; url: string; snippet: string }[];
  timestamp: number;
}

export const HISTORY_KEY = "remedy-research-history";
export const HISTORY_EVENT = "remedy-history-updated";

function loadHistory(): ResearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAndBroadcast(entry: ResearchEntry) {
  const updated = [entry, ...loadHistory()].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingQuestionRef = useRef<string>("");
  const savedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isLoading) return;

    setInput("");
    pendingQuestionRef.current = question;
    savedRef.current = false;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: question,
      timestamp: Date.now(),
    };

    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      steps: [],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let allSources: { title: string; url: string; snippet: string; favicon_url?: string }[] = [];
    let sourcesStepAdded = false;
    const searchQueries: string[] = [];

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);

          try {
            const event: SSEEvent = JSON.parse(jsonStr);

            if (event.type === "searching") {
              const q = event.query;
              if (!searchQueries.includes(q)) searchQueries.push(q);

              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const filtered = (m.steps || []).filter(
                    (s) => s.id !== "search-step"
                  );
                  return {
                    ...m,
                    steps: [
                      ...filtered,
                      {
                        id: "search-step",
                        type: "searching" as const,
                        content: searchQueries
                          .map((sq) => `"${sq}"`)
                          .join(", "),
                        timestamp: Date.now(),
                      },
                    ],
                  };
                })
              );
            } else if (event.type === "search_results") {
              const newSources = event.sources.filter(
                (s) => !allSources.some((existing) => existing.url === s.url)
              );
              allSources = [...allSources, ...newSources];

              if (!sourcesStepAdded) {
                sourcesStepAdded = true;
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    return {
                      ...m,
                      steps: [
                        ...(m.steps || []),
                        {
                          id: "sources-step",
                          type: "search_results" as const,
                          content: `Found ${allSources.length} relevant sources`,
                          sources: allSources,
                          timestamp: Date.now(),
                        },
                      ],
                    };
                  })
                );
              } else {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    return {
                      ...m,
                      steps: (m.steps || []).map((s) =>
                        s.id === "sources-step"
                          ? {
                              ...s,
                              content: `Found ${allSources.length} relevant sources`,
                              sources: [...allSources],
                            }
                          : s
                      ),
                    };
                  })
                );
              }
            } else {
              processEvent(assistantId, event);
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errorStep: AgentStepData = {
        id: generateId(),
        type: "error",
        content: (err as Error).message || "An error occurred",
        timestamp: Date.now(),
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, steps: [...(m.steps || []), errorStep] }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const processEvent = (assistantId: string, event: SSEEvent) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m;

        const steps = [...(m.steps || [])];
        let report = m.report;

        switch (event.type) {
          case "planning":
            steps.push({
              id: generateId(),
              type: "planning",
              content: event.tasks.join(" \u2022 "),
              timestamp: Date.now(),
            });
            break;

          case "reading":
            steps.push({
              id: generateId(),
              type: "reading",
              content: `Reading: ${event.title}`,
              timestamp: Date.now(),
            });
            break;

          case "reasoning":
            steps.push({
              id: generateId(),
              type: "reasoning",
              content: event.thought,
              timestamp: Date.now(),
            });
            break;

          case "complete": {
            report = event.report;
            steps.push({
              id: generateId(),
              type: "complete",
              content: "Research complete",
              timestamp: Date.now(),
            });
            const completedReport = report;
            if (completedReport && !savedRef.current) {
              savedRef.current = true;
              setTimeout(() => {
                saveAndBroadcast({
                  id: generateId(),
                  question: pendingQuestionRef.current || "Research query",
                  summary: completedReport.summary || "",
                  analysis: completedReport.detailed_analysis || "",
                  safetyRating: completedReport.safety_rating || "unknown",
                  evidenceLevel: completedReport.evidence_level || "unknown",
                  citations: (completedReport.citations || []).map((c) => ({
                    title: c.title,
                    url: c.url,
                    snippet: c.snippet,
                  })),
                  timestamp: Date.now(),
                });
              }, 0);
            }
            break;
          }

          case "error":
            steps.push({
              id: generateId(),
              type: "error",
              content: event.message,
              timestamp: Date.now(),
            });
            break;

          default:
            break;
        }

        return { ...m, steps, report };
      })
    );
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center pb-4 pt-8">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                What health question can I research?
              </h1>
              <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                I&apos;ll search medical sources, analyze the evidence, and deliver
                a citation-backed report.
              </p>
              <div className="mt-8 w-full">
                <ResearchModeCards onSelect={(q) => handleSubmit(q)} />
              </div>
              <div className="mt-8 w-full">
                <SuggestedQueries onSelect={(q) => handleSubmit(q)} />
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={
                isLoading &&
                msg.role === "assistant" &&
                msg.id === messages[messages.length - 1]?.id
              }
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a health question..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-teal-500"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          {isLoading ? (
            <button
              onClick={handleCancel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
