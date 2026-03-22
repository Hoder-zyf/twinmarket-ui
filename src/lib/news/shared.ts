import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import type {
  NewsEventImportance,
  NewsEventItem,
  NewsEventSource,
  NewsEventType,
} from "@/lib/news/types";

export const NEWS_REQUEST_TIMEOUT_MS = 4_500;

export const NEWS_SOURCE_PRIORITY: Record<NewsEventSource, number> = {
  "eastmoney-fastnews": 0,
  cninfo: 1,
  "sina-roll": 2,
};

export const DEFAULT_NEWS_REQUEST_HEADERS = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

const HIGH_IMPORTANCE_KEYWORDS = [
  "停牌",
  "复牌",
  "回购",
  "增持",
  "减持",
  "收购",
  "重大",
  "业绩",
  "预增",
  "预亏",
  "并购",
  "重组",
  "分红",
  "定增",
  "监管",
  "问询",
  "立案",
  "罚款",
  "降准",
  "降息",
  "央行",
  "国务院",
  "财政部",
  "证监会",
  "上交所",
  "深交所",
  "GDP",
  "CPI",
  "PMI",
];

const MACRO_KEYWORDS = [
  "央行",
  "国务院",
  "财政部",
  "证监会",
  "上交所",
  "深交所",
  "降准",
  "降息",
  "利率",
  "GDP",
  "CPI",
  "PMI",
  "社融",
  "信贷",
  "国债",
  "汇率",
  "房地产政策",
  "关税",
];

const COMPANY_KEYWORDS = [
  "公司",
  "股份",
  "集团",
  "银行",
  "证券",
  "保险",
  "能源",
  "科技",
  "药业",
  "公告",
];

export class NewsDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsDataError";
  }
}

export function buildNewsEventItem(input: {
  source: NewsEventSource;
  title: string;
  publishedAt: string;
  content?: string;
  summary?: string;
  relatedSymbols?: string[];
  url?: string;
}): NewsEventItem {
  const title = cleanText(input.title);

  if (!title) {
    throw new NewsDataError("News item title is missing");
  }

  const content = cleanText(input.content);
  const summary = cleanText(input.summary);
  const relatedSymbols = sanitizeSymbols(input.relatedSymbols);
  const body = [title, content, summary].filter(Boolean).join(" ");

  return {
    id: createItemId(input.source, title, input.publishedAt),
    source: input.source,
    importance: inferImportance(input.source, body),
    eventType: inferEventType(input.source, body, relatedSymbols),
    publishedAt: normalizePublishedAt(input.publishedAt),
    title,
    content,
    summary,
    relatedSymbols,
    url: input.url?.trim() || undefined,
  };
}

export function cleanText(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const stripped = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return stripped || undefined;
}

export function buildEastmoneyPublishedAt(showTime: string | null | undefined): string {
  const text = showTime?.trim();

  if (!text || !/^\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(text)) {
    return new Date().toISOString();
  }

  const year = new Date().getFullYear();
  const candidate = new Date(`${year}-${text.replace(" ", "T")}:00+08:00`);

  if (Number.isNaN(candidate.getTime())) {
    return new Date().toISOString();
  }

  if (candidate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    candidate.setFullYear(candidate.getFullYear() - 1);
  }

  return candidate.toISOString();
}

export function buildCninfoDateRange(days: number): string {
  const end = new Date();
  const start = new Date(end.getTime() - Math.max(days - 1, 0) * 24 * 60 * 60 * 1000);
  return `${formatShanghaiDate(start)}~${formatShanghaiDate(end)}`;
}

export function createRequestTrace(): string {
  return randomUUID().replace(/-/g, "");
}

export async function requestJson<T>(input: {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
}): Promise<T> {
  const text = await requestText(input);

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new NewsDataError(
      `Failed to parse JSON from ${input.url}: ${error instanceof Error ? error.message : "unknown parse error"}`,
    );
  }
}

export async function requestText(input: {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
}): Promise<string> {
  const target = new URL(input.url);
  const requester = target.protocol === "http:" ? httpRequest : httpsRequest;

  return await new Promise<string>((resolve, reject) => {
    const request = requester(
      target,
      {
        method: input.method ?? "GET",
        headers: input.headers,
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const statusCode = response.statusCode ?? 0;
          if (statusCode < 200 || statusCode >= 300) {
            reject(new NewsDataError(`${target.hostname} returned ${statusCode}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.setTimeout(NEWS_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new NewsDataError(`Request timed out for ${input.url}`));
    });
    request.on("error", (error) => {
      reject(new NewsDataError(error instanceof Error ? error.message : `Request failed for ${input.url}`));
    });

    if (input.body) {
      request.write(input.body);
    }

    request.end();
  });
}

export function compareNewsItems(left: NewsEventItem, right: NewsEventItem): number {
  const publishedDelta = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);

  if (publishedDelta !== 0) {
    return publishedDelta;
  }

  const importanceDelta = importanceRank(right.importance) - importanceRank(left.importance);

  if (importanceDelta !== 0) {
    return importanceDelta;
  }

  return NEWS_SOURCE_PRIORITY[left.source] - NEWS_SOURCE_PRIORITY[right.source];
}

export function choosePreferredItem(left: NewsEventItem, right: NewsEventItem): NewsEventItem {
  const leftScore = preferenceScore(left);
  const rightScore = preferenceScore(right);

  if (rightScore > leftScore) {
    return right;
  }

  return left;
}

export function buildDedupeKey(item: NewsEventItem): string {
  return item.title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function createItemId(source: NewsEventSource, title: string, publishedAt: string) {
  return createHash("sha1")
    .update(`${source}:${publishedAt}:${title}`)
    .digest("hex")
    .slice(0, 16);
}

function inferImportance(
  source: NewsEventSource,
  text: string,
): NewsEventImportance {
  if (source === "cninfo") {
    return "high";
  }

  if (HIGH_IMPORTANCE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "high";
  }

  if (source === "eastmoney-fastnews") {
    return "medium";
  }

  return "low";
}

function inferEventType(
  source: NewsEventSource,
  text: string,
  relatedSymbols: string[] | undefined,
): NewsEventType {
  if (source === "cninfo" || text.includes("公告")) {
    return "announcement";
  }

  if (MACRO_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "macro";
  }

  if ((relatedSymbols?.length ?? 0) > 0 || COMPANY_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "company";
  }

  return "news";
}

function sanitizeSymbols(symbols: string[] | undefined): string[] | undefined {
  if (!symbols?.length) {
    return undefined;
  }

  const unique = [...new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean))];
  return unique.length ? unique : undefined;
}

function normalizePublishedAt(value: string): string {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return new Date().toISOString();
  }

  return new Date(timestamp).toISOString();
}

function formatShanghaiDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function importanceRank(importance: NewsEventImportance): number {
  if (importance === "high") {
    return 2;
  }

  if (importance === "medium") {
    return 1;
  }

  return 0;
}

function preferenceScore(item: NewsEventItem): number {
  const contentLength = item.content?.length ?? item.summary?.length ?? 0;
  return (
    1000 -
    NEWS_SOURCE_PRIORITY[item.source] * 100 +
    importanceRank(item.importance) * 10 +
    contentLength
  );
}
