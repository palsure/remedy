import type {
  SearchResponse,
  ContentsResult,
  AgentResponse,
} from "./types";

const SEARCH_BASE = "https://ydc-index.io";
const CONTENTS_BASE = "https://ydc-index.io";
const AGENTS_BASE = "https://api.you.com";

function getApiKey(): string {
  const key = process.env.YOU_API_KEY;
  if (!key) {
    throw new Error("YOU_API_KEY environment variable is not set");
  }
  return key;
}

export async function youSearch(
  query: string,
  options: {
    count?: number;
    freshness?: "day" | "week" | "month" | "year";
    livecrawl?: "web" | "news" | "all";
    livecrawlFormats?: "html" | "markdown";
  } = {}
): Promise<SearchResponse> {
  const params = new URLSearchParams({ query });
  if (options.count) params.set("count", String(options.count));
  if (options.freshness) params.set("freshness", options.freshness);
  if (options.livecrawl) params.set("livecrawl", options.livecrawl);
  if (options.livecrawlFormats) params.set("livecrawl_formats", options.livecrawlFormats);

  const res = await fetch(`${SEARCH_BASE}/v1/search?${params.toString()}`, {
    headers: { "X-API-Key": getApiKey() },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`You.com Search API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function youContents(
  urls: string[],
  formats: ("html" | "markdown" | "metadata")[] = ["markdown"]
): Promise<ContentsResult[]> {
  const res = await fetch(`${CONTENTS_BASE}/v1/contents`, {
    method: "POST",
    headers: {
      "X-API-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls, formats, crawl_timeout: 10 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`You.com Contents API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function youAgent(
  input: string,
  options: {
    tools?: { type: string; search_effort?: string; report_verbosity?: string }[];
    verbosity?: "medium" | "high";
    maxSteps?: number;
    timeoutMs?: number;
  } = {}
): Promise<AgentResponse> {
  const body: Record<string, unknown> = {
    agent: "advanced",
    input,
    stream: false,
    tools: options.tools || [
      { type: "research", search_effort: "medium", report_verbosity: "medium" },
    ],
    verbosity: options.verbosity || "medium",
    workflow_config: {
      max_workflow_steps: options.maxSteps || 3,
    },
  };

  const timeoutMs = options.timeoutMs || 45000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${AGENTS_BASE}/v1/agents/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`You.com Agents API error ${res.status}: ${text}`);
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}
