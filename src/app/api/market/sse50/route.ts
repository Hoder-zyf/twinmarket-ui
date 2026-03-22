import { getSse50Quote } from "@/lib/market/sse50";
import type { MarketQuoteApiError, MarketQuoteApiResponse } from "@/lib/market/types";

export const runtime = "nodejs";

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const quote = await getSse50Quote();
    const body: MarketQuoteApiResponse = { quote, fetchedAt };

    return Response.json(body, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const body: MarketQuoteApiError = {
      error: error instanceof Error ? error.message : "Failed to fetch SSE 50 quote",
      fetchedAt,
    };

    return Response.json(body, {
      status: 502,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
