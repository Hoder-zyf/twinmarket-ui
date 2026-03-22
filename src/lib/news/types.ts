export type NewsEventSource = "eastmoney-fastnews" | "cninfo" | "sina-roll";

export type NewsEventImportance = "low" | "medium" | "high";

export type NewsEventType = "news" | "announcement" | "macro" | "company";

export type NewsEventItem = {
  id: string;
  source: NewsEventSource;
  importance: NewsEventImportance;
  eventType: NewsEventType;
  publishedAt: string;
  title: string;
  content?: string;
  summary?: string;
  relatedSymbols?: string[];
  url?: string;
};

export type NewsSourceStatus = {
  source: NewsEventSource;
  ok: boolean;
  itemCount: number;
  fetchedAt: string;
  error?: string;
};

export type NewsStreamResponse = {
  items: NewsEventItem[];
  fetchedAt: string;
  sourceStatus: NewsSourceStatus[];
};

export type NewsStreamError = {
  error: string;
  fetchedAt: string;
  sourceStatus: NewsSourceStatus[];
};
