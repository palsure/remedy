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
