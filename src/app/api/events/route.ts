import { youSearch } from "@/lib/you-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_QUERIES: Record<string, string> = {
  all: "upcoming health fitness wellness events conferences 2025 2026",
  health: "upcoming health events medical conferences webinars 2025 2026",
  fitness: "upcoming fitness events runs marathons challenges 2025 2026",
  wellness: "upcoming wellness events mindfulness workshops retreats 2025 2026",
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  favicon_url?: string;
}

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("x-offline-mode") === "true") {
      return NextResponse.json({ events: [], offline: true });
    }
    if (!process.env.YOU_API_KEY) {
      return NextResponse.json(
        { error: "YOU_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const category = req.nextUrl.searchParams.get("category") || "all";
    const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

    const results = await youSearch(query, {
      count: 25,
      freshness: "month",
      livecrawl: "web",
    });

    const events: EventItem[] = [];
    const seen = new Set<string>();

    const push = (item: { title: string; url: string; description?: string; snippets?: string[]; favicon_url?: string }) => {
      if (!item?.url || seen.has(item.url)) return;
      seen.add(item.url);
      events.push({
        id: `evt-${events.length}-${encodeURIComponent(new URL(item.url).hostname)}`,
        title: item.title || "Event",
        description: item.description || item.snippets?.[0] || "",
        url: item.url,
        source: extractDomain(item.url),
        category,
        favicon_url: item.favicon_url,
      });
    };

    if (results.results?.news) {
      for (const item of results.results.news) {
        if (events.length >= 25) break;
        push(item);
      }
    }
    if (results.results?.web) {
      for (const item of results.results.web) {
        if (events.length >= 25) break;
        push(item);
      }
    }

    return NextResponse.json({ events });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch events";
    return NextResponse.json({ error: message, events: [] }, { status: 500 });
  }
}
