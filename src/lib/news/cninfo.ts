import "server-only";

import {
  buildCninfoDateRange,
  buildNewsEventItem,
  DEFAULT_NEWS_REQUEST_HEADERS,
  NewsDataError,
  requestJson,
} from "@/lib/news/shared";
import type { NewsEventItem } from "@/lib/news/types";

type CninfoPayload = {
  announcements?: Array<{
    announcementId?: string;
    announcementTitle?: string;
    announcementTime?: number;
    adjunctUrl?: string;
    secCode?: string[] | string;
  }>;
};

export async function fetchCninfoAnnouncements(limit: number): Promise<NewsEventItem[]> {
  const body = new URLSearchParams({
    pageNum: "1",
    pageSize: String(limit),
    tabName: "fulltext",
    column: "sse",
    plate: "",
    stock: "",
    searchkey: "",
    secid: "",
    category: "",
    trade: "",
    seDate: buildCninfoDateRange(3),
    sortName: "",
    sortType: "",
    isHLtitle: "true",
  });

  const payload = await requestJson<CninfoPayload>({
    url: "http://www.cninfo.com.cn/new/hisAnnouncement/query",
    method: "POST",
    headers: {
      ...DEFAULT_NEWS_REQUEST_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "http://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Length": String(Buffer.byteLength(body.toString())),
    },
    body: body.toString(),
  });
  const announcements = payload.announcements;

  if (!announcements?.length) {
    throw new NewsDataError("Cninfo payload missing announcements");
  }

  return announcements
    .filter((item) => item.announcementTitle?.trim())
    .map((item) => {
      const relatedSymbols = Array.isArray(item.secCode)
        ? item.secCode
        : item.secCode
          ? [item.secCode]
          : undefined;

      return buildNewsEventItem({
        source: "cninfo",
        title: item.announcementTitle || "",
        summary: relatedSymbols?.length
          ? `相关证券 ${relatedSymbols.join(", ")}`
          : undefined,
        relatedSymbols,
        publishedAt:
          typeof item.announcementTime === "number" && Number.isFinite(item.announcementTime)
            ? new Date(item.announcementTime).toISOString()
            : new Date().toISOString(),
        url: item.adjunctUrl
          ? `https://static.cninfo.com.cn/${item.adjunctUrl.replace(/^\/+/, "")}`
          : undefined,
      });
    });
}
