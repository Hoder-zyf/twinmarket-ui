import "server-only";

import type { MarketQuote, MarketQuoteSource } from "@/lib/market/types";

const SSE50_SYMBOL = "sh000016";
const SSE50_NAME = "上证50";
const REQUEST_TIMEOUT_MS = 4500;

type QuoteAdapter = {
  source: MarketQuoteSource;
  fetchQuote: () => Promise<MarketQuote>;
};

class MarketDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataError";
  }
}

const adapters: QuoteAdapter[] = [
  { source: "eastmoney", fetchQuote: fetchFromEastmoney },
  { source: "sina", fetchQuote: fetchFromSina },
];

export async function getSse50Quote(): Promise<MarketQuote> {
  const failures: string[] = [];

  for (const adapter of adapters) {
    try {
      return await adapter.fetchQuote();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown adapter failure";
      failures.push(`${adapter.source}: ${message}`);
    }
  }

  throw new MarketDataError(`All SSE 50 quote adapters failed. ${failures.join(" | ")}`);
}

async function fetchFromEastmoney(): Promise<MarketQuote> {
  const url = new URL("https://push2.eastmoney.com/api/qt/stock/get");
  url.searchParams.set("ut", "fa5fd1943c7b386f172d6893dbfba10b");
  url.searchParams.set("invt", "2");
  url.searchParams.set("fltt", "2");
  url.searchParams.set("fields", "f43,f44,f45,f46,f57,f58,f60,f124,f169,f170");
  url.searchParams.set("secid", "1.000016");

  const response = await fetch(url, {
    cache: "no-store",
    headers: defaultRequestHeaders,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MarketDataError(`Eastmoney returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: Record<string, string | number | null>;
  };

  if (!payload.data) {
    throw new MarketDataError("Eastmoney payload missing data");
  }

  const latestPrice = normalizeEastmoneyPrice(payload.data.f43);
  const previousClose = normalizeEastmoneyPrice(payload.data.f60);
  const change = normalizeEastmoneyDelta(payload.data.f169);
  const changePercent = normalizeEastmoneyPercent(payload.data.f170);

  return {
    symbol: SSE50_SYMBOL,
    name: stringOrFallback(payload.data.f58, SSE50_NAME),
    latestPrice,
    change,
    changePercent,
    open: normalizeEastmoneyPrice(payload.data.f46),
    high: normalizeEastmoneyPrice(payload.data.f44),
    low: normalizeEastmoneyPrice(payload.data.f45),
    previousClose,
    timestamp: parseEastmoneyTimestamp(payload.data.f124),
    source: "eastmoney",
  };
}

async function fetchFromSina(): Promise<MarketQuote> {
  const response = await fetch(`https://hq.sinajs.cn/list=${SSE50_SYMBOL}`, {
    cache: "no-store",
    headers: defaultRequestHeaders,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MarketDataError(`Sina returned ${response.status}`);
  }

  const rawText = decodeGbk(await response.arrayBuffer());
  const fields = parseSinaFields(rawText);

  if (fields.length < 6) {
    throw new MarketDataError("Sina payload is missing expected quote fields");
  }

  const name = fields[0] || SSE50_NAME;
  const open = parseRequiredNumber(fields[1], "open");
  const previousClose = parseRequiredNumber(fields[2], "previousClose");
  const latestPrice = parseRequiredNumber(fields[3], "latestPrice");
  const high = parseRequiredNumber(fields[4], "high");
  const low = parseRequiredNumber(fields[5], "low");
  const change = latestPrice - previousClose;
  const changePercent = previousClose === 0 ? 0 : (change / previousClose) * 100;

  return {
    symbol: SSE50_SYMBOL,
    name,
    latestPrice,
    change,
    changePercent,
    open,
    high,
    low,
    previousClose,
    timestamp: parseSinaTimestamp(fields),
    source: "sina",
  };
}

const defaultRequestHeaders = {
  Accept: "application/json,text/plain,*/*",
  Referer: "https://quote.eastmoney.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

function parseRequiredNumber(value: string, fieldName: string): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new MarketDataError(`Unable to parse ${fieldName}`);
  }

  return numeric;
}

function normalizeEastmoneyPrice(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney price");
  return Math.abs(numeric) > 10000 ? numeric / 100 : numeric;
}

function normalizeEastmoneyDelta(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney change");
  return Math.abs(numeric) > 1000 ? numeric / 100 : numeric;
}

function normalizeEastmoneyPercent(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney percent");
  return Math.abs(numeric) > 20 ? numeric / 100 : numeric;
}

function parseEastmoneyTimestamp(value: string | number | null | undefined): string {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return new Date().toISOString();
  }

  if (numeric > 1_000_000_000_000) {
    return new Date(numeric).toISOString();
  }

  return new Date(numeric * 1000).toISOString();
}

function parseSinaFields(rawText: string): string[] {
  const match = rawText.match(/="([^"]*)"/);

  if (!match) {
    throw new MarketDataError("Unexpected Sina response format");
  }

  return match[1].split(",").map((field) => field.trim());
}

function parseSinaTimestamp(fields: string[]): string {
  const dateIndex = fields.findIndex((field) => /^\d{4}-\d{2}-\d{2}$/.test(field));
  const timeValue = dateIndex >= 0 ? fields[dateIndex + 1] : "";

  if (dateIndex >= 0 && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return new Date(`${fields[dateIndex]}T${timeValue}+08:00`).toISOString();
  }

  return new Date().toISOString();
}

function toFiniteNumber(value: string | number | null | undefined, fieldName: string): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new MarketDataError(`${fieldName} is missing or invalid`);
  }

  return numeric;
}

function stringOrFallback(value: string | number | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function decodeGbk(buffer: ArrayBuffer): string {
  return new TextDecoder("gb18030").decode(buffer);
}
