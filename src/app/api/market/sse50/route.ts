import { getSse50Overview } from "@/lib/market/sse50";
import type { MarketApiError, Sse50OverviewApiResponse } from "@/lib/market/types";

export const runtime = "nodejs";

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const overview = await getSse50Overview();
    const body: Sse50OverviewApiResponse = { overview, fetchedAt };

    return Response.json(body, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const body: MarketApiError = {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch SSE 50 constituent overview",
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
