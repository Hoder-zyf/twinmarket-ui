import "server-only";

import {
  buildDedupeKey,
  choosePreferredItem,
  compareNewsItems,
} from "@/lib/news/shared";
import { readTodayNewsCache, writeTodayNewsCache } from "@/lib/news/cache";
import { fetchCninfoAnnouncements } from "@/lib/news/cninfo";
import { fetchEastmoneyFastNews } from "@/lib/news/eastmoney-fastnews";
import { fetchSinaRollNews } from "@/lib/news/sina-roll";
import type {
  NewsEventItem,
  NewsEventSource,
  NewsSourceStatus,
  NewsStreamResponse,
} from "@/lib/news/types";

type SourceLoader = {
  source: NewsEventSource;
  load: (limit: number) => Promise<NewsEventItem[]>;
};

const SOURCE_LOADERS: SourceLoader[] = [
  { source: "eastmoney-fastnews", load: fetchEastmoneyFastNews },
  { source: "cninfo", load: fetchCninfoAnnouncements },
  { source: "sina-roll", load: fetchSinaRollNews },
];

export class NewsStreamAggregationError extends Error {
  readonly sourceStatus: NewsSourceStatus[];

  constructor(
    message: string,
    sourceStatus: NewsSourceStatus[],
  ) {
    super(message);
    this.name = "NewsStreamAggregationError";
    this.sourceStatus = sourceStatus;
  }
}

export async function getNewsStream(limit: number): Promise<NewsStreamResponse> {
  const cappedLimit = clampLimit(limit);
  const fetchedAt = new Date().toISOString();
  const sourceStatus: NewsSourceStatus[] = [];
  const collected: NewsEventItem[] = [];

  for (const loader of SOURCE_LOADERS) {
    const sourceFetchedAt = new Date().toISOString();

    try {
      const items = await loader.load(cappedLimit);
      sourceStatus.push({
        source: loader.source,
        ok: true,
        itemCount: items.length,
        fetchedAt: sourceFetchedAt,
      });
      collected.push(...items);
    } catch (error) {
      sourceStatus.push({
        source: loader.source,
        ok: false,
        itemCount: 0,
        fetchedAt: sourceFetchedAt,
        error: error instanceof Error ? error.message : "Unknown news source failure",
      });
    }
  }

  const items = dedupeAndSortItems(collected).slice(0, cappedLimit);

  if (items.length > 0) {
    const payload = {
      items,
      fetchedAt,
      sourceStatus,
    } satisfies NewsStreamResponse;

    await writeTodayNewsCache(payload);
    return payload;
  }

  const cached = await readTodayNewsCache();

  if (cached) {
    return {
      items: cached.items.slice(0, cappedLimit),
      fetchedAt,
      sourceStatus: sourceStatus.map((status) => ({
        ...status,
        error: status.error ?? "Served from same-day cache",
      })),
    };
  }

  throw new NewsStreamAggregationError(
    `All event stream sources failed. ${sourceStatus
      .map((status) => `${status.source}: ${status.error ?? "unknown error"}`)
      .join(" | ")}`,
    sourceStatus,
  );
}

function dedupeAndSortItems(items: NewsEventItem[]) {
  const deduped = new Map<string, NewsEventItem>();

  for (const item of items) {
    const dedupeKey = buildDedupeKey(item);
    const existing = deduped.get(dedupeKey);

    if (!existing) {
      deduped.set(dedupeKey, item);
      continue;
    }

    deduped.set(dedupeKey, choosePreferredItem(existing, item));
  }

  return [...deduped.values()].sort(compareNewsItems);
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return 12;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 20);
}
