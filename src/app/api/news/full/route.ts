import { youSearch, youAgent } from "@/lib/you-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_QUERIES: Record<string, string> = {
  all: "latest health medical fitness diet wellness news",
  medical: "latest medical research breakthroughs clinical trials",
  fitness: "latest fitness exercise workout training news",
  diet: "latest diet nutrition food healthy eating news",
  wellness: "latest mental health wellness mindfulness sleep news",
};

type Freshness = "day" | "week" | "month" | "year";

function freshnesFromDays(days: number): Freshness {
  if (days <= 1) return "day";
  if (days <= 7) return "week";
  if (days <= 30) return "month";
  return "year";
}

interface RawArticle {
  title: string;
  url: string;
  description: string;
  thumbnail_url?: string;
  favicon_url?: string;
  source: string;
  age?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.YOU_API_KEY) {
      return NextResponse.json(
        { error: "YOU_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") || "all";
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 365);
    const withSummary = searchParams.get("summary") === "true";

    const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
    const freshness = freshnesFromDays(days);

    const results = await youSearch(query, {
      count: 20,
      freshness,
    });

    const articles: RawArticle[] = [];

    if (results.results?.news) {
      for (const item of results.results.news) {
        articles.push({
          title: item.title,
          url: item.url,
          description: item.description || item.snippets?.[0] || "",
          thumbnail_url: item.thumbnail_url,
          favicon_url: item.favicon_url,
          source: extractDomain(item.url),
          age: item.page_age,
        });
      }
    }

    if (results.results?.web) {
      for (const item of results.results.web) {
        if (articles.length >= 20) break;
        if (articles.some((a) => a.url === item.url)) continue;
        articles.push({
          title: item.title,
          url: item.url,
          description: item.snippets?.[0] || item.description || "",
          thumbnail_url: item.thumbnail_url,
          favicon_url: item.favicon_url,
          source: extractDomain(item.url),
          age: item.page_age,
        });
      }
    }

    const sorted = articles.sort((a, b) => {
      if (!a.age && !b.age) return 0;
      if (!a.age) return 1;
      if (!b.age) return -1;
      return new Date(b.age).getTime() - new Date(a.age).getTime();
    });

    if (!withSummary) {
      return NextResponse.json({ articles: sorted });
    }

    const titles = sorted
      .slice(0, 15)
      .map((a, i) => `${i + 1}. "${a.title}" — ${a.description.slice(0, 120)}`)
      .join("\n");

    let summary = "";
    try {
      const agentRes = await youAgent(
        `You are a health news editor. Summarize the following health news headlines into a concise 3-4 sentence overview of the most important health developments. Focus on what matters most to a general audience. Be factual and neutral.\n\nHeadlines:\n${titles}`,
        { maxSteps: 1, timeoutMs: 20000 }
      );
      const answerItem = agentRes.output.find(
        (o) => o.type === "message.answer" && o.text
      );
      summary = answerItem?.text || "";
    } catch {
      summary = "";
    }

    return NextResponse.json({ articles: sorted, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
