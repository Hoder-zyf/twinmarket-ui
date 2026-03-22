import "server-only";

import {
  SSE50_CONSTITUENTS,
  SSE50_CONSTITUENTS_BY_CODE,
  SSE50_CONSTITUENTS_SNAPSHOT,
} from "@/data/sse50-constituents";
import type {
  MarketConstituent,
  MarketConstituentQuote,
  MarketQuoteSource,
  Sse50MarketOverview,
} from "@/lib/market/types";

const REQUEST_TIMEOUT_MS = 4_500;
const EASTMONEY_BATCH_SIZE = 25;
const SINA_BATCH_SIZE = 30;
const LIST_SNAPSHOT_SIZE = 8;
const MOVERS_SIZE = 5;

type QuoteAdapter = {
  source: MarketQuoteSource;
  fetchQuotes: () => Promise<MarketConstituentQuote[]>;
};

type EastmoneyQuoteRecord = Record<string, string | number | null | undefined>;

class MarketDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataError";
  }
}

const adapters: QuoteAdapter[] = [
  { source: "eastmoney", fetchQuotes: fetchQuotesFromEastmoney },
  { source: "sina", fetchQuotes: fetchQuotesFromSina },
];

export async function getSse50Overview(): Promise<Sse50MarketOverview> {
  const failures: string[] = [];

  for (const adapter of adapters) {
    try {
      const quotes = await adapter.fetchQuotes();
      return buildOverview(quotes, adapter.source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown adapter failure";
      failures.push(`${adapter.source}: ${message}`);
    }
  }

  throw new MarketDataError(`All SSE 50 constituent adapters failed. ${failures.join(" | ")}`);
}

async function fetchQuotesFromEastmoney(): Promise<MarketConstituentQuote[]> {
  const quotes = (
    await Promise.all(
      chunk(SSE50_CONSTITUENTS, EASTMONEY_BATCH_SIZE).map((batch) => fetchEastmoneyBatch(batch)),
    )
  ).flat();

  return ensureCompleteUniverse(quotes, "Eastmoney");
}

async function fetchEastmoneyBatch(
  batch: readonly MarketConstituent[],
): Promise<MarketConstituentQuote[]> {
  const url = new URL("https://push2.eastmoney.com/api/qt/ulist.np/get");
  url.searchParams.set("ut", "fa5fd1943c7b386f172d6893dbfba10b");
  url.searchParams.set("invt", "2");
  url.searchParams.set("fltt", "2");
  url.searchParams.set("fields", "f2,f3,f4,f5,f6,f12,f14,f15,f16,f17,f18,f124");
  url.searchParams.set(
    "secids",
    batch.map((constituent) => constituent.secid).join(","),
  );

  const response = await fetch(url, {
    cache: "no-store",
    headers: defaultRequestHeaders,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MarketDataError(`Eastmoney returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      diff?: EastmoneyQuoteRecord[];
    };
  };

  const diff = payload.data?.diff;

  if (!diff?.length) {
    throw new MarketDataError("Eastmoney payload missing diff quotes");
  }

  return diff.map((item) => {
    const code = requiredString(item.f12, "Eastmoney code");
    const constituent = getConstituent(code);

    return {
      ...constituent,
      name: stringOrFallback(item.f14, constituent.name),
      latestPrice: normalizeEastmoneyPrice(item.f2),
      change: normalizeEastmoneyDelta(item.f4),
      changePercent: normalizeEastmoneyPercent(item.f3),
      open: normalizeEastmoneyPrice(item.f17),
      high: normalizeEastmoneyPrice(item.f15),
      low: normalizeEastmoneyPrice(item.f16),
      previousClose: normalizeEastmoneyPrice(item.f18),
      volume: toFiniteNumber(item.f5, "Eastmoney volume"),
      turnover: toFiniteNumber(item.f6, "Eastmoney turnover"),
      timestamp: parseEastmoneyTimestamp(item.f124),
      source: "eastmoney",
    };
  });
}

async function fetchQuotesFromSina(): Promise<MarketConstituentQuote[]> {
  const quotes = (
    await Promise.all(
      chunk(SSE50_CONSTITUENTS, SINA_BATCH_SIZE).map((batch) => fetchSinaBatch(batch)),
    )
  ).flat();

  return ensureCompleteUniverse(quotes, "Sina");
}

async function fetchSinaBatch(batch: readonly MarketConstituent[]): Promise<MarketConstituentQuote[]> {
  const response = await fetch(
    `https://hq.sinajs.cn/list=${batch.map((constituent) => constituent.sinaSymbol).join(",")}`,
    {
      cache: "no-store",
      headers: defaultRequestHeaders,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new MarketDataError(`Sina returned ${response.status}`);
  }

  const rawText = decodeGbk(await response.arrayBuffer());
  const matches = [...rawText.matchAll(/var hq_str_(sh\d+)="([^"]*)";/g)];

  if (!matches.length) {
    throw new MarketDataError("Unexpected Sina batch response format");
  }

  return matches.map((match) => {
    const symbol = match[1];
    const fields = match[2].split(",").map((field) => field.trim());

    if (fields.length < 10) {
      throw new MarketDataError(`Sina payload is missing expected fields for ${symbol}`);
    }

    const code = symbol.slice(2);
    const constituent = getConstituent(code);
    const open = parseRequiredNumber(fields[1], "open");
    const previousClose = parseRequiredNumber(fields[2], "previousClose");
    const latestPrice = parseRequiredNumber(fields[3], "latestPrice");
    const high = parseRequiredNumber(fields[4], "high");
    const low = parseRequiredNumber(fields[5], "low");
    const change = latestPrice - previousClose;
    const changePercent = previousClose === 0 ? 0 : (change / previousClose) * 100;

    return {
      ...constituent,
      name: fields[0] || constituent.name,
      latestPrice,
      change,
      changePercent,
      open,
      high,
      low,
      previousClose,
      volume: parseRequiredNumber(fields[8], "volume"),
      turnover: parseRequiredNumber(fields[9], "turnover"),
      timestamp: parseSinaTimestamp(fields),
      source: "sina",
    };
  });
}

function buildOverview(
  quotesInConstituentOrder: MarketConstituentQuote[],
  source: MarketQuoteSource,
): Sse50MarketOverview {
  const quotes = [...quotesInConstituentOrder].sort((left, right) => right.turnover - left.turnover);
  const gainers = [...quotes].sort((left, right) => right.changePercent - left.changePercent);
  const losers = [...quotes].sort((left, right) => left.changePercent - right.changePercent);
  const changes = quotes.map((quote) => quote.changePercent).sort((left, right) => left - right);
  const totalTurnover = quotes.reduce((sum, quote) => sum + quote.turnover, 0);
  const totalVolume = quotes.reduce((sum, quote) => sum + quote.volume, 0);
  const advancing = quotes.filter((quote) => quote.changePercent > 0).length;
  const declining = quotes.filter((quote) => quote.changePercent < 0).length;
  const unchanged = quotes.length - advancing - declining;

  return {
    universe: {
      id: "sse50",
      name: "SSE 50 / 上证50",
      constituentCount: SSE50_CONSTITUENTS.length,
      snapshotVersion: SSE50_CONSTITUENTS_SNAPSHOT.version,
      snapshotDate: SSE50_CONSTITUENTS_SNAPSHOT.date,
    },
    source,
    timestamp: getLatestTimestamp(quotes),
    breadth: {
      advancing,
      declining,
      unchanged,
      advanceDeclineSpread: advancing - declining,
      advanceRatio: roundTo((advancing / SSE50_CONSTITUENTS.length) * 100),
    },
    turnover: {
      total: totalTurnover,
      average: totalTurnover / SSE50_CONSTITUENTS.length,
      median: median(quotes.map((quote) => quote.turnover)),
      totalVolume,
    },
    averageChangePercent: roundTo(
      quotes.reduce((sum, quote) => sum + quote.changePercent, 0) / SSE50_CONSTITUENTS.length,
    ),
    medianChangePercent: median(changes),
    movers: {
      gainers: gainers.slice(0, MOVERS_SIZE),
      losers: losers.slice(0, MOVERS_SIZE),
      turnoverLeaders: quotes.slice(0, MOVERS_SIZE),
    },
    listSnapshot: quotes.slice(0, LIST_SNAPSHOT_SIZE),
    quotes,
  };
}

function ensureCompleteUniverse(
  quotes: MarketConstituentQuote[],
  sourceLabel: string,
): MarketConstituentQuote[] {
  const quotesByCode = new Map(quotes.map((quote) => [quote.code, quote]));

  if (quotesByCode.size !== SSE50_CONSTITUENTS.length) {
    const missingCodes = SSE50_CONSTITUENTS.filter(
      (constituent) => !quotesByCode.has(constituent.code),
    ).map((constituent) => constituent.code);

    throw new MarketDataError(
      `${sourceLabel} returned ${quotesByCode.size}/${SSE50_CONSTITUENTS.length} constituents. Missing: ${missingCodes.join(", ")}`,
    );
  }

  return SSE50_CONSTITUENTS.map((constituent) => {
    const quote = quotesByCode.get(constituent.code);

    if (!quote) {
      throw new MarketDataError(`${sourceLabel} is missing constituent ${constituent.code}`);
    }

    return quote;
  });
}

function getConstituent(code: string): MarketConstituent {
  const constituent = SSE50_CONSTITUENTS_BY_CODE.get(code);

  if (!constituent) {
    throw new MarketDataError(`Unexpected non-SSE50 code in quote payload: ${code}`);
  }

  return constituent;
}

const defaultRequestHeaders = {
  Accept: "application/json,text/plain,*/*",
  Referer: "https://quote.eastmoney.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function requiredString(value: string | number | null | undefined, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();

  if (!text) {
    throw new MarketDataError(`${fieldName} is missing`);
  }

  return text;
}

function parseRequiredNumber(value: string, fieldName: string): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new MarketDataError(`Unable to parse ${fieldName}`);
  }

  return numeric;
}

function normalizeEastmoneyPrice(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney price");
  return Math.abs(numeric) > 10_000 ? numeric / 100 : numeric;
}

function normalizeEastmoneyDelta(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney change");
  return Math.abs(numeric) > 1_000 ? numeric / 100 : numeric;
}

function normalizeEastmoneyPercent(value: string | number | null | undefined): number {
  const numeric = toFiniteNumber(value, "Eastmoney percent");
  return Math.abs(numeric) > 25 ? numeric / 100 : numeric;
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

function parseSinaTimestamp(fields: string[]): string {
  const dateIndex = fields.findIndex((field) => /^\d{4}-\d{2}-\d{2}$/.test(field));
  const timeValue = dateIndex >= 0 ? fields[dateIndex + 1] : "";

  if (dateIndex >= 0 && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return new Date(`${fields[dateIndex]}T${timeValue}+08:00`).toISOString();
  }

  return new Date().toISOString();
}

function toFiniteNumber(
  value: string | number | null | undefined,
  fieldName: string,
): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new MarketDataError(`${fieldName} is missing or invalid`);
  }

  return numeric;
}

function stringOrFallback(
  value: string | number | null | undefined,
  fallback: string,
): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function decodeGbk(buffer: ArrayBuffer): string {
  return new TextDecoder("gb18030").decode(buffer);
}

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return roundTo((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return roundTo(sorted[middle]);
}

function getLatestTimestamp(quotes: MarketConstituentQuote[]): string {
  const timestamps = quotes
    .map((quote) => Date.parse(quote.timestamp))
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...timestamps)).toISOString();
}
