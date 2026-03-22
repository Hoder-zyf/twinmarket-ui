"use client";

import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";

import type {
  NewsEventImportance,
  NewsEventItem,
  NewsEventSource,
  NewsEventType,
  NewsSourceStatus,
  NewsStreamError,
  NewsStreamResponse,
} from "@/lib/news/types";

const POLL_INTERVAL_MS = 60_000;

const importanceStyles: Record<NewsEventImportance, string> = {
  high: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  medium: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  low: "border-sky-400/25 bg-sky-400/10 text-sky-200",
};

const sourceLabels: Record<NewsEventSource, string> = {
  "eastmoney-fastnews": "Eastmoney",
  cninfo: "Cninfo",
  "sina-roll": "Sina",
};

const typeLabels: Record<NewsEventType, string> = {
  news: "News",
  announcement: "公告",
  macro: "宏观",
  company: "公司",
};

type LiveEventStreamState = {
  items: NewsEventItem[];
  sourceStatus: NewsSourceStatus[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

class EventStreamRequestError extends Error {
  readonly sourceStatus: NewsSourceStatus[];

  constructor(
    message: string,
    sourceStatus: NewsSourceStatus[],
  ) {
    super(message);
    this.name = "EventStreamRequestError";
    this.sourceStatus = sourceStatus;
  }
}

export function LiveEventStream() {
  const [state, setState] = useState<LiveEventStreamState>({
    items: [],
    sourceStatus: [],
    loading: true,
    refreshing: false,
    error: null,
  });
  const inFlightRef = useRef(false);

  const refreshStream = useEffectEvent(async (background: boolean) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setState((current) => ({
      ...current,
      loading: background ? current.loading : current.items.length === 0,
      refreshing: background,
      error: background ? current.error : null,
    }));

    try {
      const response = await fetch("/api/news/stream?limit=10", { cache: "no-store" });
      const payload = (await response.json()) as NewsStreamResponse | NewsStreamError;

      if (!response.ok || !("items" in payload)) {
        throw new EventStreamRequestError(
          "error" in payload ? payload.error : "Market event stream request failed",
          "sourceStatus" in payload ? payload.sourceStatus : [],
        );
      }

      startTransition(() => {
        setState({
          items: payload.items,
          sourceStatus: payload.sourceStatus,
          loading: false,
          refreshing: false,
          error: null,
        });
      });
    } catch (error) {
      startTransition(() => {
        setState((current) => ({
          items: current.items,
          sourceStatus:
            error instanceof EventStreamRequestError
              ? error.sourceStatus
              : current.sourceStatus,
          loading: false,
          refreshing: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to refresh market event stream",
        }));
      });
    } finally {
      inFlightRef.current = false;
    }
  });

  useEffect(() => {
    void refreshStream(false);
    const intervalId = window.setInterval(() => {
      void refreshStream(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const failedSources = state.sourceStatus.filter((status) => !status.ok);
  const degradedSources =
    failedSources.length > 0
      ? failedSources.map((status) => sourceLabels[status.source]).join(" / ")
      : null;

  return (
    <div className="space-y-3 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            Poll {Math.floor(POLL_INTERVAL_MS / 1000)}s
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            {state.refreshing
              ? "Refreshing"
              : state.loading
                ? "Loading live events"
                : `${state.items.length} live items`}
          </span>
        </div>
        {degradedSources ? (
          <span className="rounded-full border border-amber-300/20 bg-amber-300/8 px-3 py-1 text-amber-100">
            Fallback active: {degradedSources}
          </span>
        ) : null}
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
          {state.error}
          {state.items.length > 0 ? " Showing the last successful event snapshot." : ""}
        </div>
      ) : null}

      {!state.loading && state.items.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-400">
          No live event items were returned by the configured sources.
        </div>
      ) : null}

      {state.items.map((event) => {
        const body = event.summary ?? event.content;

        return (
          <div key={event.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500">{formatTimestamp(event.publishedAt)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-zinc-200">
                {sourceLabels[event.source]}
              </span>
              <span className={`rounded-full border px-2 py-1 ${importanceStyles[event.importance]}`}>
                {event.importance.toUpperCase()}
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2 py-1 text-cyan-100">
                {typeLabels[event.eventType]}
              </span>
            </div>

            <h3 className="mt-3 text-sm font-medium leading-6 text-white">{event.title}</h3>

            {body ? <p className="mt-2 text-sm leading-6 text-zinc-300">{body}</p> : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {event.relatedSymbols?.map((symbol) => (
                <span
                  key={`${event.id}-${symbol}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-zinc-300"
                >
                  {symbol}
                </span>
              ))}
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2 py-1 text-cyan-100 transition hover:border-cyan-300/35 hover:text-cyan-50"
                >
                  Open source
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
