import { youSearch, youContents, youAgent } from "./you-client";
import { buildAgentInput } from "./prompts";
import { encodeSSE } from "./utils";
import type { Citation, SafetyLevel, EvidenceQuality, HealthReport } from "./types";

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

function extractCitationsFromAgent(output: { text?: string; type: string; content?: { citation_uri: string; title: string; snippet: string; url: string }[] }[]): Citation[] {
  const citations: Citation[] = [];
  for (const item of output) {
    if (item.type === "web_search.results" && item.content) {
      for (const source of item.content) {
        citations.push({
          title: source.title,
          url: source.url || source.citation_uri,
          snippet: source.snippet,
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
      const l = line.trim().toLowerCase();
      if (l.length < 5) return false;
      if (/^(skip to|enable accessibility|open the|go to our|shop with|shipping to|sign in|log in|subscribe|newsletter|cookie|accept all|privacy|menu|navigation|breadcrumb|footer|copyright|©|all rights reserved)/i.test(l)) return false;
      if (/^(share|tweet|pin|email|print|save|bookmark|follow us|contact us|about us|terms of|advertisement)/i.test(l)) return false;
      if (/^\[?\s*(facebook|twitter|instagram|youtube|linkedin|pinterest)\s*\]?$/i.test(l)) return false;
      if (l.startsWith("request appointment") || l.startsWith("find a doctor") || l.startsWith("schedule")) return false;
      if (/^#{1,3}\s*$/.test(line)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

    // Step 2: Search (run initial + targeted in parallel)
    const allCitations: Citation[] = [];

    const searchPromises = plan.queries.map(async (query) => {
      await send(ctx, { type: "searching", query });
      try {
        const results = await youSearch(query, { count: 5, freshness: "year" });
        const sources: Citation[] = [];
        if (results.results?.web) {
          for (const r of results.results.web) {
            sources.push({
              title: r.title,
              url: r.url,
              snippet: r.snippets?.[0] || r.description,
              favicon_url: r.favicon_url,
            });
          }
        }
        if (results.results?.news) {
          for (const r of results.results.news) {
            sources.push({
              title: r.title,
              url: r.url,
              snippet: r.snippets?.[0] || r.description,
              favicon_url: r.favicon_url,
            });
          }
        }
        return sources;
      } catch {
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

    // Step 4: Reason with Agents API (with timeout + fallback)
    await send(ctx, { type: "reasoning", thought: "Analyzing evidence with AI reasoning engine..." });

    let analysisText = "";
    let agentCitations: Citation[] = [];
    let usedAgent = false;

    // Build context-aware prompt that includes our gathered evidence
    const contextPrompt = `${buildAgentInput(question)}\n\nHere is evidence already gathered from medical sources:\n${extractedContent || allCitations.slice(0, 6).map(c => `- ${c.title}: ${c.snippet}`).join("\n")}`;

    try {
      const agentResponse = await youAgent(contextPrompt, {
        tools: [
          { type: "research", search_effort: "low", report_verbosity: "medium" },
        ],
        verbosity: "medium",
        maxSteps: 2,
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

    // Combine citations and finalize
    const finalCitations = deduplicateCitations([...allCitations, ...agentCitations]);
    const safetyRating = parseSafetyRating(analysisText + " " + extractedContent);
    const evidenceLevel = parseEvidenceLevel(analysisText + " " + extractedContent);

    await send(ctx, { type: "safety_rating", rating: safetyRating });
    await send(ctx, { type: "evidence_level", level: evidenceLevel });
    await send(ctx, { type: "report_chunk", markdown: analysisText });
    await send(ctx, { type: "citations", sources: finalCitations.slice(0, 10) });

    const report: HealthReport = {
      safety_rating: safetyRating,
      evidence_level: evidenceLevel,
      summary: analysisText.split("\n").find(l => l.trim().length > 20)?.replace(/^#+\s*/, "") || "Analysis complete",
      detailed_analysis: analysisText,
      citations: finalCitations.slice(0, 10),
      disclaimer: "This information is for educational purposes only and is not medical advice. Always consult your healthcare provider before making changes to medications or supplements.",
    };

    await send(ctx, { type: "complete", report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    await send(ctx, { type: "error", message });
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

function buildSmartAnalysis(question: string, queryType: string, citations: Citation[], extractedContent: string): string {
  const sourceCount = citations.length;
  const topSources = citations.slice(0, 6);
  const cleaned = cleanExtractedContent(extractedContent);

  const sentences = cleaned.split(/[.!?]+/).filter(s => {
    const t = s.trim();
    return t.length > 30 && t.length < 300 && !/^\[|^#|^http|^\d+$/.test(t);
  });

  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const relevantSentences = sentences
    .filter(s => questionWords.some(w => s.toLowerCase().includes(w)))
    .map(s => s.trim())
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 8);

  const pros: string[] = [];
  const cons: string[] = [];
  const neutral: string[] = [];

  for (const s of relevantSentences) {
    const lower = s.toLowerCase();
    if (/benefit|help|improve|reduce risk|protect|support|effective|positive|safe|well-tolerated|lower|decrease|enhance|boost/i.test(lower)) {
      pros.push(s);
    } else if (/risk|side effect|danger|avoid|harm|negative|interact|caution|warning|adverse|toxicity|overdose|contraindic/i.test(lower)) {
      cons.push(s);
    } else {
      neutral.push(s);
    }
  }

  if (pros.length === 0 && cons.length === 0) {
    for (const c of topSources) {
      if (!c.snippet || c.snippet.length < 40) continue;
      const lower = c.snippet.toLowerCase();
      if (/benefit|help|improve|effective|safe/i.test(lower)) {
        pros.push(c.snippet);
      } else if (/risk|side effect|caution|warning|avoid/i.test(lower)) {
        cons.push(c.snippet);
      } else {
        neutral.push(c.snippet);
      }
    }
  }

  const formatList = (items: string[]) =>
    items.length > 0
      ? items.slice(0, 4).map(f => `- ${f}`).join("\n")
      : "- No specific data found in the sources reviewed";

  const sourcesText = topSources.map((c, i) => `${i + 1}. [${c.title}](${c.url})`).join("\n");

  const keyPointsFromNeutral = neutral.length > 0
    ? "\n\n### Key Points\n" + neutral.slice(0, 3).map(f => `- **${f}**`).join("\n")
    : "";

  const typeLabel: Record<string, string> = {
    INTERACTION: "Interaction Analysis",
    SUPPLEMENT: "Supplement Research",
    WELLNESS: "Wellness Claim Analysis",
    GENERAL: "Health Research",
  };

  return `## ${typeLabel[queryType] || "Health Research"}: ${question}

### Summary
Based on research across ${sourceCount} medical sources, here is a balanced overview of the evidence.${keyPointsFromNeutral}

### Potential Benefits (Pros)
${formatList(pros)}

### Risks & Considerations (Cons)
${formatList(cons)}

### Recommendations
- **Consult your doctor** before making changes — share these findings for personalized advice
- **Start conservatively** if your provider approves — lower doses, monitor your response
- **Check for interactions** with any current medications or supplements
- **Use reputable sources** — look for products with third-party testing (USP, NSF)
- **Track your response** — keep notes on any changes, positive or negative

### Sources
${sourcesText}`;
}
