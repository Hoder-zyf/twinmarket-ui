import "server-only";

import {
  buildNewsEventItem,
  DEFAULT_NEWS_REQUEST_HEADERS,
  NewsDataError,
  requestJson,
} from "@/lib/news/shared";
import type { NewsEventItem } from "@/lib/news/types";

type SinaRollPayload = {
  result?: {
    status?: {
      code?: number;
      msg?: string;
    };
    data?: Array<{
      title?: string;
      intro?: string;
      url?: string;
      ctime?: string;
    }>;
  };
};

export async function fetchSinaRollNews(limit: number): Promise<NewsEventItem[]> {
  const url = new URL("https://feed.mix.sina.com.cn/api/roll/get");
  url.searchParams.set("pageid", "153");
  url.searchParams.set("lid", "2509");
  url.searchParams.set("k", "");
  url.searchParams.set("num", String(limit));
  url.searchParams.set("page", "1");

  const payload = await requestJson<SinaRollPayload>({
    url: url.toString(),
    headers: {
      ...DEFAULT_NEWS_REQUEST_HEADERS,
      Referer: "https://finance.sina.com.cn/",
    },
  });
  const code = payload.result?.status?.code;
  const items = payload.result?.data;

  if (code !== 0 || !items?.length) {
    throw new NewsDataError(payload.result?.status?.msg || "Sina roll payload missing items");
  }

  return items
    .filter((item) => item.title?.trim())
    .map((item) =>
      buildNewsEventItem({
        source: "sina-roll",
        title: item.title || "",
        summary: item.intro,
        publishedAt:
          item.ctime && Number.isFinite(Number(item.ctime))
            ? new Date(Number(item.ctime) * 1000).toISOString()
            : new Date().toISOString(),
        url: item.url,
      }),
    );
}
