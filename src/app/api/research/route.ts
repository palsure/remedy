import { runHealthResearchAgent } from "@/lib/agent";
import { encodeSSE } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isOfflineMode(request: Request): boolean {
  return request.headers.get("x-offline-mode") === "true";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question?.trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isOfflineMode(request)) {
      const encoder = new TextEncoder();
      const payload = [
        encodeSSE({ type: "error", message: "Offline mode is on. Switch to Online in the header to use You.com research and save your question." }),
        encodeSSE({
          type: "complete",
          report: {
            safety_rating: "unknown",
            evidence_level: "none",
            summary: "Offline mode — no research run.",
            detailed_analysis: "**Offline mode** — You.com API was not called. Switch to **Online** in the header to run research and save You.com API usage when you don't need live data.",
            citations: [],
            disclaimer: "This is not medical advice. Consult your healthcare provider.",
            credits_unavailable: true,
          },
        }),
      ].join("");
      return new Response(encoder.encode(payload), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (!process.env.YOU_API_KEY) {
      return new Response(
        JSON.stringify({ error: "YOU_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();

    runHealthResearchAgent(question, writer, encoder);

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
