import { youSearch } from "@/lib/you-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEALTH_QUERIES = [
  "latest medical health research breakthroughs",
  "new drug supplement safety findings",
  "health wellness news today",
];

export async function GET() {
  try {
    if (!process.env.YOU_API_KEY) {
      return NextResponse.json(
        { error: "YOU_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const query =
      HEALTH_QUERIES[Math.floor(Math.random() * HEALTH_QUERIES.length)];

    const results = await youSearch(query, {
      count: 10,
      freshness: "week",
    });

    const articles: {
      title: string;
      url: string;
      description: string;
      thumbnail_url?: string;
      favicon_url?: string;
      source: string;
      age?: string;
    }[] = [];

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
        if (articles.length >= 12) break;
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

    return NextResponse.json({ articles: articles.slice(0, 12) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
