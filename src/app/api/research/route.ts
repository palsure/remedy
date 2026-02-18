import { runHealthResearchAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
