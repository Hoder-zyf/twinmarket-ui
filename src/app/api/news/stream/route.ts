import type { NextRequest } from "next/server";

import {
  getNewsStream,
  NewsStreamAggregationError,
} from "@/lib/news/stream";
import type { NewsStreamError } from "@/lib/news/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const fetchedAt = new Date().toISOString();
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "12");

  try {
    const stream = await getNewsStream(limit);

    return Response.json(stream, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const body: NewsStreamError = {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch market event stream",
      fetchedAt,
      sourceStatus:
        error instanceof NewsStreamAggregationError ? error.sourceStatus : [],
    };

    return Response.json(body, {
      status: 502,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
