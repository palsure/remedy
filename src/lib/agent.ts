import { youSearch, youContents, youAgent } from "./you-client";
import { buildAgentInput, getDisclaimerExtras } from "./prompts";
import { encodeSSE } from "./utils";
import type {
  Citation,
  SafetyLevel,
  EvidenceQuality,
  HealthReport,
  SourceTier,
  ContraindicationAlert,
  ConflictingEvidence,
  RejectedSource,
} from "./types";

interface AgentContext {
  question: string;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
}

async function send(ctx: AgentContext, event: Parameters<typeof encodeSSE>[0]) {
  await ctx.writer.write(ctx.encoder.encode(encodeSSE(event)));
}

function parseSafetyRating(text: string): SafetyLevel {
  const lower = text.toLowerCase();
  if (lower.includes("danger") || lower.includes("contraindicated") || lower.includes("do not take") || lower.includes("avoid")) return "danger";
  if (lower.includes("warning") || lower.includes("significant risk") || lower.includes("serious")) return "warning";
  if (lower.includes("caution") || lower.includes("moderate risk") || lower.includes("use with caution") || lower.includes("consult") || lower.includes("monitor")) return "caution";
  if (lower.includes("generally safe") || lower.includes("safe") || lower.includes("low risk") || lower.includes("well-tolerated") || lower.includes("no significant")) return "safe";
  return "unknown";
}

function parseEvidenceLevel(text: string): EvidenceQuality {
  const lower = text.toLowerCase();
  if (lower.includes("strong evidence") || lower.includes("well-established") || lower.includes("robust evidence") || lower.includes("clinical trials confirm") || lower.includes("widely supported") || lower.includes("well-documented") || lower.includes("extensively studied") || lower.includes("conclusive")) return "strong";
  if (lower.includes("moderate evidence") || lower.includes("some evidence") || lower.includes("several studies") || lower.includes("research suggests") || lower.includes("studies show") || lower.includes("studies indicate") || lower.includes("evidence suggests") || lower.includes("research indicates") || lower.includes("clinical studies") || lower.includes("mixed evidence") || lower.includes("emerging evidence")) return "moderate";
  if (lower.includes("limited evidence") || lower.includes("insufficient") || lower.includes("few studies") || lower.includes("preliminary") || lower.includes("anecdotal") || lower.includes("early research") || lower.includes("small studies") || lower.includes("more research needed") || lower.includes("inconclusive")) return "limited";
  if (lower.includes("no evidence") || lower.includes("no studies") || lower.includes("not studied") || lower.includes("not been studied")) return "none";
  // Fallback heuristics based on citation density
  const citationCount = (text.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length;
  if (citationCount >= 5) return "moderate";
  if (citationCount >= 2) return "limited";
  return "unknown";
}

function assignSourceTier(url: string, title: string, snippet: string): SourceTier {
  const u = url.toLowerCase();
  const t = (title + " " + snippet).toLowerCase();
  if (u.includes("fda.gov") || u.includes("accessdata.fda")) return "fda_label";
  if (u.includes("pubmed") || u.includes("ncbi.nlm.nih.gov") || t.includes("randomized controlled") || t.includes("rct)")) return "rct";
  if (t.includes("meta-analysis") || t.includes("systematic review") || t.includes("cochrane")) return "meta_analysis";
  if (t.includes("observational") || t.includes("cohort") || u.includes("nih.gov") || u.includes("mayoclinic") || u.includes("who.int")) return "observational";
  if (u.includes("blog") || u.includes("medium.com") || u.includes("substack")) return "blog";
  if (u.includes("drugs.com") || u.includes("webmd") || u.includes("healthline") || u.includes("medlineplus")) return "observational";
  return "unknown";
}

function extractCitationsFromAgent(output: { text?: string; type: string; content?: { citation_uri: string; title: string; snippet: string; url: string }[] }[]): Citation[] {
  const citations: Citation[] = [];
  for (const item of output) {
    if (item.type === "web_search.results" && item.content) {
      for (const source of item.content) {
        const url = source.url || source.citation_uri;
        citations.push({
          title: source.title,
          url,
          snippet: source.snippet,
          source_tier: assignSourceTier(url, source.title, source.snippet),
        });
      }
    }
  }
  return citations;
}

function cleanExtractedContent(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      const ll = l.toLowerCase();
      if (l.length < 8) return false;
      // Nav / chrome junk
      if (/^(skip to|enable accessibility|open the|go to our|shop with|shipping to|sign in|log in|subscribe|newsletter|cookie|accept all|privacy|menu|navigation|breadcrumb|footer|copyright|©|all rights reserved)/i.test(l)) return false;
      if (/^(share|tweet|pin|email|print|save|bookmark|follow us|contact us|about us|terms of|advertisement|show more|load more|read more|see all|view all)/i.test(l)) return false;
      if (/^\[?\s*(facebook|twitter|instagram|youtube|linkedin|pinterest|tiktok)\s*\]?$/i.test(l)) return false;
      if (/^(request appointment|find a doctor|schedule|make an appointment|get care now|medically reviewed|reviewed by|written by|updated|last reviewed|fact.?checked)/i.test(l)) return false;
      if (/^#{1,3}\s*$/.test(l)) return false;
      // URL paths and link artifacts
      if (/^https?:\/\//i.test(l)) return false;
      if (/^org\/|^com\/|^www\.|^\/[\w-]+\/[\w-]/i.test(l)) return false;
      if (/\]\(\/|utm_source=|utm_medium=|source=mayo/i.test(l)) return false;
      if (/this content does not have an english version/i.test(ll)) return false;
      // Lines that are only a short label (1-2 words that are not sentences)
      const words = l.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
      if (words.length <= 2 && !/[.!?]/.test(l)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Remove URLs, redirect text, and junk from a snippet so it reads as clean prose. */
function cleanSnippetForDisplay(text: string): string {
  if (!text || typeof text !== "string") return "";
  let s = text
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\[?[*.]?(?:org|com|gov|edu)\/[^\s\]()]+\]?/gi, "")
    .replace(/\([^)]*\.(com|org|gov)[^)]*\)/gi, "")
    .replace(/we're redirecting you[^.]*\.?/gi, "")
    .replace(/redirecting you in \d+/gi, "")
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s*\d{4}\b/gi, "")
    .replace(/\*\*+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Do not truncate — return full cleaned sentence
  return s;
}

/**
 * Returns true only if text is a real English sentence:
 * - At least 6 words
 * - Starts with a capital letter
 * - Not a URL, path, or navigation fragment
 * - Contains at least one subject-like word (a word of 4+ letters)
 * - Ratio of alphabetic words is high
 */
function isReadableContent(text: string): boolean {
  const t = text.trim();
  if (t.length < 30 || t.length > 2000) return false;
  // Reject URL paths, link fragments, redirect text
  if (/^https?:\/\//i.test(t)) return false;
  if (/^[a-z]+\.(com|org|gov|edu|net)\//i.test(t)) return false;
  if (/^org\/|^com\/|^\/[\w-]/i.test(t)) return false;
  if (/we're redirecting|redirecting you in \d+/i.test(t)) return false;
  if (/utm_source=|utm_medium=/i.test(t)) return false;
  if (/^\[.*\]\(/i.test(t)) return false;   // markdown links
  if (/^\s*[\d.]+\s*$/.test(t)) return false; // only numbers
  // Must start with a capital letter (real sentence)
  if (!/^[A-Z"'(]/.test(t)) return false;
  // Count real alpha words
  const words = t.split(/\s+/).filter(w => /[a-zA-Z]{3,}/.test(w));
  if (words.length < 5) return false;
  // Ratio of alpha-word tokens must be >= 60%
  const totalTokens = t.split(/\s+/).length;
  if (words.length / totalTokens < 0.55) return false;
  // Must not look like a label or nav link (single phrase without verb-like tokens)
  const verbPatterns = /\b(is|are|was|were|has|have|had|can|may|might|could|should|will|would|helps|shows|suggests|indicates|found|proven|linked|associated|reduced|increased|improve|lower|raise|cause|prevent|treat|affect|support|contain|provide|offer)\b/i;
  if (!verbPatterns.test(t)) return false;
  return true;
}

/** Sanitize agent or fallback analysis markdown: remove lines that are raw URLs, redirects, junk, and the Sources section. */
function sanitizeAnalysisMarkdown(markdown: string): string {
  if (!markdown) return markdown;
  let out = markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line; // preserve blank lines
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) return "";
      if (/^[*.]?[a-z0-9-]+\.(com|org|gov|edu|net)\/[^\s]*\s*(\))?\s*$/i.test(trimmed)) return "";
      if (/^org\/|^com\/|^www\./i.test(trimmed)) return "";
      if (/we're redirecting you in \d+/i.test(trimmed)) return "";
      if (/^redirecting you/i.test(trimmed)) return "";
      if (/^\]\(\/|^\[\]\(\//.test(trimmed)) return "";
      if (/^\[?[^\]]*\]\(\s*\/(?:healthy-lifestyle|appointments|[\w-]+)/i.test(trimmed) && trimmed.length < 120) return "";
      if (/utm_source=|utm_medium=|source=mayo/i.test(trimmed)) return "";
      if (/this content does not have an english version/i.test(trimmed)) return "";
      if (/^(medically reviewed|reviewed by|fact.?checked|written by|last reviewed|updated on)/i.test(trimmed)) return "";
      // Remove stray lines that are only URL path fragments without any plain words
      if (/^[\w-]+\/[\w/-]+\)?$/.test(trimmed) && !/\s/.test(trimmed)) return "";
      return line;
    })
    .filter((l) => l !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Remove ## Sources or ### Sources section
  out = out.replace(/\n##\s+Sources[\s\S]*?(?=\n##\s+[^S]|$)/gi, "");
  out = out.replace(/\n###\s+Sources[\s\S]*?(?=\n##\s+|\n###\s+[^S]|$)/gi, "");
  return out.trim();
}

function classifyQuery(question: string): { type: string; tasks: string[]; queries: string[] } {
  const q = question.toLowerCase();
  const isInteraction = /interact|combin|together with|mix|safe to take .+ with|take .+ and/i.test(question);
  const isSupplement = /supplement|vitamin|mineral|herb|ashwagandha|turmeric|magnesium|zinc|omega|creatine|melatonin|probiotic|collagen|biotin/i.test(question);
  const isWellness = /intermittent fasting|cold (shower|plunge|exposure)|keto|paleo|detox|cleanse|diet|fasting|sauna|grounding|seed oil/i.test(question);

  if (isInteraction) {
    return {
      type: "INTERACTION",
      tasks: ["Searching for interaction data", "Checking clinical evidence", "Analyzing safety profiles"],
      queries: [
        `${question} drug interaction safety`,
        `${question} clinical evidence mechanism`,
      ],
    };
  }
  if (isSupplement) {
    return {
      type: "SUPPLEMENT",
      tasks: ["Researching clinical evidence", "Checking dosage and safety", "Evaluating efficacy"],
      queries: [
        `${question} clinical evidence research`,
        `${question} safety side effects dosage`,
      ],
    };
  }
  if (isWellness) {
    return {
      type: "WELLNESS",
      tasks: ["Finding scientific studies", "Checking expert consensus", "Evaluating claims"],
      queries: [
        `${question} scientific evidence study`,
        `${question} benefits risks research`,
      ],
    };
  }
  return {
    type: "GENERAL",
    tasks: ["Searching medical literature", "Finding expert guidelines", "Gathering evidence"],
    queries: [
      `${question} medical research evidence`,
      `${question} health guidelines`,
    ],
  };
}

export async function runHealthResearchAgent(
  question: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
): Promise<void> {
  const ctx: AgentContext = { question, writer, encoder };

  try {
    // Step 1: Plan
    const plan = classifyQuery(question);
    await send(ctx, { type: "planning", tasks: plan.tasks });
    await send(ctx, { type: "agent_role", role: "Research Agent" });
    const queryLog: string[] = [];

    // Step 2: Search (run initial + targeted in parallel)
    const allCitations: Citation[] = [];
    let creditsError = false;

    const searchPromises = plan.queries.map(async (query) => {
      queryLog.push(query);
      await send(ctx, { type: "searching", query });
      try {
        const results = await youSearch(query, { count: 5, freshness: "year" });
        const sources: Citation[] = [];
        const add = (r: { title: string; url: string; snippets?: string[]; description?: string; favicon_url?: string }) => {
          const snippet = r.snippets?.[0] || r.description || "";
          sources.push({
            title: r.title,
            url: r.url,
            snippet,
            favicon_url: r.favicon_url,
            source_tier: assignSourceTier(r.url, r.title, snippet),
          });
        };
        if (results.results?.web) for (const r of results.results.web) add(r);
        if (results.results?.news) for (const r of results.results.news) add(r);
        return sources;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/credits|402|used up/i.test(msg)) creditsError = true;
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    for (const sources of searchResults) {
      allCitations.push(...sources);
      if (sources.length > 0) {
        await send(ctx, { type: "search_results", sources: sources.slice(0, 5) });
      }
    }

    // Step 3: Extract content from top authoritative sources
    const authorityDomains = ["nih.gov", "mayoclinic.org", "who.int", "fda.gov", "webmd.com", "drugs.com", "examine.com", "pubmed", "clevelandclinic.org", "medlineplus.gov", "healthline.com"];
    const uniqueUrls = [...new Set(allCitations.map(c => c.url))];
    const priorityUrls = uniqueUrls.filter(url => authorityDomains.some(d => url.includes(d))).slice(0, 2);
    const otherUrls = uniqueUrls.filter(url => !authorityDomains.some(d => url.includes(d))).slice(0, 1);
    const urlsToRead = [...priorityUrls, ...otherUrls].slice(0, 3);

    let extractedContent = "";

    if (urlsToRead.length > 0) {
      for (const url of urlsToRead) {
        const citation = allCitations.find(c => c.url === url);
        await send(ctx, { type: "reading", url, title: citation?.title || url });
      }

      try {
        const contents = await youContents(urlsToRead, ["markdown"]);
        for (const page of contents) {
          if (page.markdown) {
            const cleaned = cleanExtractedContent(page.markdown.slice(0, 3000));
            extractedContent += `\n\n### Source: ${page.title} (${page.url})\n${cleaned.slice(0, 2000)}`;
          }
        }
      } catch {
        extractedContent = allCitations
          .slice(0, 6)
          .map(c => `### Source: ${c.title} (${c.url})\n${c.snippet}`)
          .join("\n\n");
      }
    }

    await send(ctx, { type: "agent_role", role: "Verifier Agent" });
    await send(ctx, { type: "agent_role", role: "Safety Agent" });
    // Step 4: Reason with Agents API (with timeout + fallback)
    await send(ctx, { type: "reasoning", thought: "Analyzing evidence with AI reasoning engine..." });

    let analysisText = "";
    let agentCitations: Citation[] = [];
    let usedAgent = false;

    // Build context-aware prompt with cleaned evidence (no raw URLs or redirect text)
    const evidenceBlock = extractedContent
      ? extractedContent
      : allCitations
          .slice(0, 6)
          .map((c) => {
            const snippet = cleanSnippetForDisplay(c.snippet || "");
            return snippet && isReadableContent(snippet) ? `- ${c.title}: ${snippet}` : `- ${c.title}`;
          })
          .join("\n");
    const contextPrompt = `${buildAgentInput(question)}\n\nHere is evidence already gathered from medical sources:\n${evidenceBlock}`;

    try {
      const agentResponse = await youAgent(contextPrompt, {
        tools: [
          { type: "research", search_effort: "medium", report_verbosity: "medium" },
        ],
        verbosity: "medium",
        maxSteps: 3,
        timeoutMs: 45000,
      });

      for (const output of agentResponse.output) {
        if (output.type === "message.answer" && output.text) {
          analysisText = output.text;
          usedAgent = true;
        }
      }
      agentCitations = extractCitationsFromAgent(agentResponse.output);
    } catch (err) {
      const isTimeout = (err as Error).name === "AbortError";
      await send(ctx, {
        type: "reasoning",
        thought: isTimeout
          ? "Agent timed out — synthesizing report from gathered evidence..."
          : "Building report from gathered medical sources...",
      });
    }

    // Fallback: build analysis from gathered search + contents data
    if (!analysisText) {
      analysisText = buildSmartAnalysis(question, plan.type, allCitations, extractedContent);
    }

    analysisText = sanitizeAnalysisMarkdown(analysisText);

    await send(ctx, { type: "agent_role", role: "Bias Auditor" });

    // Combine citations and finalize
    const finalCitations = deduplicateCitations([...allCitations, ...agentCitations]).map(c => ({
      ...c,
      source_tier: c.source_tier ?? assignSourceTier(c.url, c.title, c.snippet),
    }));
    const safetyRating = parseSafetyRating(analysisText + " " + extractedContent);
    const evidenceLevel = parseEvidenceLevel(analysisText + " " + extractedContent);
    const riskScore = computeRiskScore(safetyRating, evidenceLevel, finalCitations.length);
    const disclaimerExtras = getDisclaimerExtras(plan.type, question);
    const contraindicationAlerts = parseContraindicationAlerts(analysisText);
    const conflictingEvidence = parseConflictingEvidence(analysisText);
    const rejectedSources = buildRejectedSources(uniqueUrls, urlsToRead, allCitations);

    await send(ctx, { type: "safety_rating", rating: safetyRating });
    await send(ctx, { type: "evidence_level", level: evidenceLevel });
    await send(ctx, { type: "report_chunk", markdown: analysisText });
    await send(ctx, { type: "citations", sources: finalCitations.slice(0, 10) });

    const creditsUnavailable = creditsError || finalCitations.length === 0;
    if (creditsUnavailable && analysisText) {
      analysisText =
        "**⚠️ Unable to use You.com** — API credits are not available. This response is limited and was not generated from live You.com search or sources. Please add credits in your You.com developer account for full research.\n\n---\n\n" +
        analysisText;
    }

    const report: HealthReport = {
      safety_rating: safetyRating,
      evidence_level: evidenceLevel,
      risk_score: riskScore,
      summary: analysisText.split("\n").find(l => l.trim().length > 20)?.replace(/^#+\s*/, "") || "Analysis complete",
      detailed_analysis: analysisText,
      citations: finalCitations.slice(0, 10),
      disclaimer: "This information is for educational purposes only and is not medical advice. Always consult your healthcare provider before making changes to medications or supplements.",
      disclaimer_extras: disclaimerExtras.length > 0 ? disclaimerExtras : undefined,
      contraindication_alerts: contraindicationAlerts.length > 0 ? contraindicationAlerts : undefined,
      conflicting_evidence: conflictingEvidence.length > 0 ? conflictingEvidence : undefined,
      rejected_sources: rejectedSources.length > 0 ? rejectedSources : undefined,
      query_log: queryLog,
      agent_roles_used: ["Research Agent", "Verifier Agent", "Safety Agent", "Bias Auditor"],
      credits_unavailable: creditsUnavailable || undefined,
    };

    await send(ctx, { type: "complete", report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    const isCreditsError = /credits|402|used up/i.test(message);
    if (isCreditsError) {
      await send(ctx, { type: "error", message });
      const degradedReport: HealthReport = {
        safety_rating: "unknown",
        evidence_level: "unknown",
        summary: "Unable to complete research — You.com API credits are not available.",
        detailed_analysis:
          "**⚠️ Unable to use You.com** — API credits are not available. This response could not be generated from live You.com search or sources.\n\nPlease add credits in your You.com developer account and try again for full research.",
        citations: [],
        disclaimer: "This is not medical advice. Consult your healthcare provider.",
        credits_unavailable: true,
      };
      await send(ctx, { type: "complete", report: degradedReport });
    } else {
      await send(ctx, { type: "error", message });
    }
  } finally {
    await ctx.writer.close();
  }
}

function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

/** Quantified risk score 0–100 from safety + evidence + citation count. */
function computeRiskScore(safety: SafetyLevel, evidence: EvidenceQuality, citationCount: number): number {
  const safetyScores: Record<SafetyLevel, number> = {
    danger: 85,
    warning: 65,
    caution: 45,
    safe: 18,
    unknown: 55,
  };
  let score = safetyScores[safety] ?? 50;
  const evidenceAdjust: Record<EvidenceQuality, number> = {
    strong: -12,
    moderate: -5,
    limited: 5,
    none: 15,
    unknown: 0,
  };
  score += evidenceAdjust[evidence] ?? 0;
  if (citationCount >= 8) score = Math.max(0, score - 5);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function parseContraindicationAlerts(text: string): ContraindicationAlert[] {
  const alerts: ContraindicationAlert[] = [];
  const section = text.match(/##\s*Contraindication Alerts[\s\S]*?(?=##|$)/i);
  if (!section) return alerts;
  const bullets = section[0].match(/[-*]\s+\*\*([^*]+)\*\*[:\s]+([^\n]+)/g) || [];
  for (const b of bullets) {
    const m = b.match(/\*\*([^*]+)\*\*[:\s]+(.+)/);
    if (m) alerts.push({ population: m[1].trim(), summary: m[2].trim() });
  }
  return alerts.slice(0, 6);
}

function parseConflictingEvidence(text: string): ConflictingEvidence[] {
  const out: ConflictingEvidence[] = [];
  const section = text.match(/##\s*Conflicting Evidence[\s\S]*?(?=##|$)/i);
  if (!section) return out;
  const conflictMatch = section[0].match(/\*\*Conflict\*\*[:\s]*"([^"]+)"[^)]*\([^)]+\)\s+vs\s+"([^"]+)"[^)]*\([^)]+\)/i);
  if (conflictMatch) {
    out.push({ claim_a: conflictMatch[1], claim_b: conflictMatch[2] });
  }
  return out;
}

function buildRejectedSources(allUrls: string[], readUrls: string[], citations: Citation[]): RejectedSource[] {
  const readSet = new Set(readUrls);
  const rejected: RejectedSource[] = [];
  for (const url of allUrls) {
    if (readSet.has(url) || rejected.length >= 5) continue;
    const c = citations.find(x => x.url === url);
    if (c) rejected.push({ title: c.title, url: c.url, reason: "Not in top-priority read list; used for context only." });
  }
  return rejected;
}

function buildSmartAnalysis(question: string, queryType: string, citations: Citation[], extractedContent: string): string {
  const sourceCount = citations.length;

  const typeLabel: Record<string, string> = {
    INTERACTION: "Interaction Analysis",
    SUPPLEMENT: "Supplement Research",
    WELLNESS: "Wellness Claim Analysis",
    GENERAL: "Health Research",
  };

  // --- Phase 1: Extract clean, meaningful sentences from citation snippets first ---
  // Snippets from search results are human-readable summaries and far cleaner than raw crawled content.
  const snippetSentences: string[] = [];
  for (const c of citations.slice(0, 10)) {
    if (!c.snippet || c.snippet.length < 40) continue;
    const raw = cleanSnippetForDisplay(c.snippet);
    // Split snippet into sentences and validate each
    const parts = raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map(s => s.trim()).filter(s => isReadableContent(s));
    snippetSentences.push(...parts);
  }

  // --- Phase 2: Supplement with extracted content sentences if snippets are sparse ---
  const extractedSentences: string[] = [];
  if (snippetSentences.length < 5 && extractedContent) {
    const cleaned = cleanExtractedContent(extractedContent);
    const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/).map(s => cleanSnippetForDisplay(s.trim())).filter(s => isReadableContent(s));
    extractedSentences.push(...parts);
  }

  const allSentences = [...new Set([...snippetSentences, ...extractedSentences])];

  // --- Phase 3: Classify sentences by relevance to question then by sentiment ---
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = allSentences.filter(s =>
    questionWords.some(w => s.toLowerCase().includes(w))
  );
  // Fall back to all sentences if relevance filter is too strict
  const pool = relevant.length >= 3 ? relevant : allSentences;

  const pros: string[] = [];
  const cons: string[] = [];
  const keyPoints: string[] = [];

  for (const s of pool) {
    const lower = s.toLowerCase();
    if (pros.length < 3 && /benefit|help|improve|reduce risk|protect|support|effective|positive|safe|well-tolerated|lower|decrease|enhance|boost|promote|linked to improved|associated with better/i.test(lower)) {
      pros.push(s);
    } else if (cons.length < 3 && /risk|side effect|danger|avoid|harm|negative|interact|caution|warning|adverse|toxicity|overdose|contraindic|limit|excessive/i.test(lower)) {
      cons.push(s);
    } else if (keyPoints.length < 4) {
      keyPoints.push(s);
    }
  }

  const formatList = (items: string[], fallback: string) => {
    if (items.length === 0) return `- ${fallback}`;
    return items.map(f => `- ${f}`).join("\n");
  };

  const noSourcesWarning =
    sourceCount === 0
      ? "\n\n**⚠️ Unable to reach You.com** — API credits may not be available. This response was generated without live search. Add credits in your You.com developer account for full research.\n\n"
      : "";

  const summaryLine =
    sourceCount > 0
      ? `Based on ${sourceCount} medical source${sourceCount !== 1 ? "s" : ""}, here is what the evidence says about: **${question}**.`
      : `No live sources were retrieved. The findings below reflect general medical knowledge.`;

  const keyPointsSection =
    keyPoints.length > 0
      ? `\n\n### Key Points\n${keyPoints.map(f => `- ${f}`).join("\n")}`
      : "";

  return `## ${typeLabel[queryType] || "Health Research"}: ${question}
${noSourcesWarning}
### Summary
${summaryLine}${keyPointsSection}

### Potential Benefits (Pros)
${formatList(pros, "No specific benefit data found in the retrieved sources.")}

### Risks & Considerations (Cons)
${formatList(cons, "No specific risk data found in the retrieved sources. Consult your doctor before use.")}

### Recommendations
- **Consult your doctor** before making changes — share these findings for personalized advice
- **Start conservatively** if your provider approves — lower doses, monitor your response
- **Check for interactions** with any current medications or supplements
- **Use reputable sources** — look for products with third-party testing (USP, NSF)
- **Track your response** — keep notes on any changes, positive or negative`;
}
