import { youSearch, youContents } from "@/lib/you-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-offline-mode") === "true") {
      return NextResponse.json({ tips: [], offline: true });
    }
    const { goalTitle, category } = await request.json();

    if (!goalTitle) {
      return NextResponse.json(
        { error: "Goal title is required" },
        { status: 400 }
      );
    }

    if (!process.env.YOU_API_KEY) {
      return NextResponse.json(
        { error: "YOU_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const query = buildGoalQuery(goalTitle, category);

    const results = await youSearch(query, {
      count: 5,
      freshness: "year",
    });

    const webResults = results.results?.web || [];
    const topUrls = webResults.slice(0, 3).map((w) => w.url);

    let contentsMap: Record<string, string> = {};
    if (topUrls.length > 0) {
      try {
        const contents = await youContents(topUrls, ["markdown"]);
        for (const c of contents) {
          if (c.url && c.markdown) {
            contentsMap[c.url] = c.markdown;
          }
        }
      } catch {
        // fall back to snippets only
      }
    }

    const tips: {
      text: string;
      highlights: string[];
      source: string;
      sourceUrl: string;
    }[] = [];

    for (const item of webResults.slice(0, 5)) {
      const snippets = item.snippets || [];
      const snippet = snippets[0] || item.description || "";
      if (snippet.length < 30) continue;

      const fullContent = contentsMap[item.url] || "";
      const highlights = extractHighlights(fullContent, goalTitle, snippet);

      tips.push({
        text: cleanSnippet(snippet),
        highlights,
        source: extractDomain(item.url),
        sourceUrl: item.url,
      });
    }

    return NextResponse.json({ tips: tips.slice(0, 5) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch tips";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractHighlights(
  markdown: string,
  goalTitle: string,
  fallbackSnippet: string
): string[] {
  if (!markdown || markdown.length < 100) {
    return extractFromSnippet(fallbackSnippet);
  }

  const highlights: string[] = [];
  const lines = markdown.split("\n");

  const goalWords = goalTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Extract bullet points and numbered lists that are relevant
  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed);
    if (!isBullet) continue;

    const clean = trimmed
      .replace(/^[-*•]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    if (clean.length < 20 || clean.length > 200) continue;

    const lower = clean.toLowerCase();
    const isRelevant =
      goalWords.some((w) => lower.includes(w)) ||
      /\b(tip|benefit|help|improve|reduce|increase|recommend|should|try|important|key|essential|daily|avoid|include|eat|drink|exercise|sleep|take)\b/i.test(
        clean
      );

    if (isRelevant && !highlights.some((h) => h === clean)) {
      highlights.push(clean);
    }
    if (highlights.length >= 5) break;
  }

  // If we didn't get enough from bullets, look for strong/bold statements
  if (highlights.length < 3) {
    const boldPattern = /\*\*([^*]{15,120})\*\*/g;
    let match;
    while (
      (match = boldPattern.exec(markdown)) !== null &&
      highlights.length < 5
    ) {
      const text = match[1].trim();
      if (!highlights.includes(text)) {
        highlights.push(text);
      }
    }
  }

  // Last resort: extract key sentences
  if (highlights.length < 2) {
    return extractFromSnippet(fallbackSnippet);
  }

  return highlights.slice(0, 5);
}

function extractFromSnippet(snippet: string): string[] {
  const sentences = snippet
    .replace(/<[^>]*>/g, "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200);

  return sentences.slice(0, 3);
}

function buildGoalQuery(title: string, category?: string): string {
  const categoryHints: Record<string, string> = {
    nutrition: "diet nutrition tips evidence-based",
    exercise: "fitness exercise routine science-backed",
    sleep: "sleep hygiene improvement research",
    supplements: "supplement guidance evidence dosage",
    mental_health: "mental health wellness strategies research",
    hydration: "hydration health water intake guidelines",
    custom: "health wellness tips",
  };

  const hint = categoryHints[category || "custom"] || "health tips";
  return `how to achieve: ${title} ${hint}`;
}

function cleanSnippet(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
