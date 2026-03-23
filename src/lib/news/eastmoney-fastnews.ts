import "server-only";

import {
  buildEastmoneyPublishedAt,
  buildNewsEventItem,
  createRequestTrace,
  DEFAULT_NEWS_REQUEST_HEADERS,
  NewsDataError,
  requestJson,
} from "@/lib/news/shared";
import type { NewsEventItem } from "@/lib/news/types";

type EastmoneyFastNewsPayload = {
  code?: number | string;
  message?: string;
  result?: {
    items?: Array<{
      title?: string;
      content?: string;
      digest?: string;
      showTime?: string;
    }>;
  };
  data?: {
    fastNewsList?: Array<{
      title?: string;
      summary?: string;
      showTime?: string;
    }>;
  };
};

export async function fetchEastmoneyFastNews(limit: number): Promise<NewsEventItem[]> {
  const url = new URL("https://np-listapi.eastmoney.com/comm/web/getFastNewsList");
  url.searchParams.set("client", "web");
  url.searchParams.set("biz", "web_news_col");
  url.searchParams.set("fastColumn", "102");
  url.searchParams.set("sortEnd", "1");
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("req_trace", createRequestTrace());

  const payload = await requestJson<EastmoneyFastNewsPayload>({
    url: url.toString(),
    headers: {
      ...DEFAULT_NEWS_REQUEST_HEADERS,
      Referer: "https://www.eastmoney.com/",
    },
  });
  const resultItems = payload.result?.items;
  const dataItems = payload.data?.fastNewsList;
  const items = resultItems?.length ? resultItems : dataItems;

  if (!items?.length) {
    throw new NewsDataError(payload.message || "Eastmoney fastnews payload missing items");
  }

  return items
    .filter((item) => item.title?.trim())
    .map((item) =>
      buildNewsEventItem({
        source: "eastmoney-fastnews",
        title: item.title || "",
        content: "content" in item ? item.content : undefined,
        summary: "digest" in item ? item.digest : "summary" in item ? item.summary : undefined,
        publishedAt: buildEastmoneyPublishedAt(item.showTime),
      }),
    );
}
