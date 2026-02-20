import type { SSEEvent, SafetyLevel, EvidenceQuality } from "./types";

export function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function safetyColor(rating: SafetyLevel): string {
  switch (rating) {
    case "safe":
      return "#10B981";
    case "caution":
      return "#F59E0B";
    case "warning":
      return "#F97316";
    case "danger":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

export function safetyLabel(rating: SafetyLevel): string {
  switch (rating) {
    case "safe":
      return "Generally Safe";
    case "caution":
      return "Use With Caution";
    case "warning":
      return "Significant Risk";
    case "danger":
      return "Potentially Dangerous";
    default:
      return "Insufficient Data";
  }
}

export function evidenceLabel(level: EvidenceQuality): string {
  switch (level) {
    case "strong":
      return "Strong Evidence";
    case "moderate":
      return "Moderate Evidence";
    case "limited":
      return "Limited Evidence";
    case "none":
      return "No Evidence Found";
    default:
      return "Unknown";
  }
}

export function evidenceColor(level: EvidenceQuality): string {
  switch (level) {
    case "strong":
      return "#10B981";
    case "moderate":
      return "#0EA5E9";
    case "limited":
      return "#F59E0B";
    case "none":
      return "#6B7280";
    default:
      return "#6B7280";
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

/** Remove Sources section, clean invalid links, and bold key headings in report analysis for display. */
export function formatReportAnalysis(markdown: string): string {
  if (!markdown?.trim()) return markdown;
  let out = markdown;

  // Remove ## Sources or ### Sources section (and its content until next ## or end)
  out = out.replace(/\n##\s+Sources\s*\n[\s\S]*?(?=\n##\s+|\n###\s+[^S]|$)/gi, "");
  out = out.replace(/\n###\s+Sources\s*\n[\s\S]*?(?=\n##\s+|\n###\s+[^S]|$)/gi, "");

  // Remove lines that are invalid link fragments, URL paths, or navigation noise
  out = out
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      // Link fragments and relative links
      if (/^\]\(\/|^\[\]\(\/|^\[.*\]\(\/[\w-/]*\)\s*$/.test(t)) return false;
      // Bare URL path fragments (e.g. org/health/articles/123, com/articles/foo)
      if (/^(?:org|com|www|gov|edu|net)[\./][\w/.-]+\s*\)?\s*$/i.test(t)) return false;
      // Lines that are clearly a partial URL path without spaces (path/segments)
      if (/^[\w-]+\/[\w/-]+\)?$/.test(t) && !/\s/.test(t)) return false;
      // UTM / tracking params
      if (/utm_source=|utm_medium=|utm_campaign=/i.test(t)) return false;
      // Noise phrases
      if (/this content does not have an english version/i.test(t)) return false;
      if (/^request appointment/i.test(t)) return false;
      if (/^source=mayo/i.test(t)) return false;
      if (/^(medically reviewed|reviewed by|fact.?checked|written by|last reviewed|updated on)/i.test(t)) return false;
      // Raw https links on their own line
      if (/^https?:\/\/\S+$/.test(t)) return false;
      return true;
    })
    .join("\n");

  // Replace relative or invalid markdown links with link text only: [text](/path) or [text](org/...)
  out = out.replace(/\[([^\]]+)\]\(\s*\/[^)]*\)/g, "$1");
  out = out.replace(/\[([^\]]+)\]\(\s*(?:org|com|www)\.?[^)]*\)/gi, "$1");

  // Bold key headings when they appear at start of line (with optional ### prefix)
  const boldPhrases = [
    "Wellness Claim Analysis:",
    "Interaction Analysis:",
    "Supplement Research:",
    "Health Research:",
    "Summary",
    "Key Points",
    "What is intermittent fasting",
    "Potential Benefits (Pros)",
    "Risks & Considerations (Cons)",
    "Recommendations",
  ];
  for (const phrase of boldPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|\\n)(\\s*#*\\s*)(${escaped})(?=\\s|$|:|\\.|\\?|\\n)`, "gi");
    out = out.replace(re, (_, before, prefix, match) => `${before}${prefix}**${match}**`);
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
