import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NewsStreamResponse } from "@/lib/news/types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "news-stream");

function getCacheKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getCachePath(date = new Date()) {
  return path.join(CACHE_DIR, `${getCacheKey(date)}.json`);
}

export async function readTodayNewsCache(): Promise<NewsStreamResponse | null> {
  try {
    const raw = await readFile(getCachePath(), "utf8");
    return JSON.parse(raw) as NewsStreamResponse;
  } catch {
    return null;
  }
}

export async function writeTodayNewsCache(payload: NewsStreamResponse): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(getCachePath(), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
