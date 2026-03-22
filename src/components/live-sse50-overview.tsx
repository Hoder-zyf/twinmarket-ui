"use client";

import { useEffect, useRef, useState } from "react";

import type { MarketQuote, MarketQuoteApiError, MarketQuoteApiResponse } from "@/lib/market/types";

const POLL_INTERVAL_MS = 15_000;

type LiveSse50OverviewProps = {
  initialQuote?: MarketQuote | null;
};

type LiveState = {
  quote: MarketQuote | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function LiveSse50Overview({ initialQuote = null }: LiveSse50OverviewProps) {
  const [state, setState] = useState<LiveState>({
    quote: initialQuote,
    loading: initialQuote === null,
    refreshing: false,
    error: null,
  });
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const refreshQuote = async (background: boolean) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setState((current) => ({
        ...current,
        loading: background ? current.loading : current.quote === null,
        refreshing: background,
        error: null,
      }));

      try {
        const response = await fetch("/api/market/sse50", { cache: "no-store" });
        const payload = (await response.json()) as MarketQuoteApiResponse | MarketQuoteApiError;

        if (!response.ok || !("quote" in payload)) {
          throw new Error("error" in payload ? payload.error : "Quote request failed");
        }

        if (!cancelled) {
          setState({
            quote: payload.quote,
            loading: false,
            refreshing: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            quote: current.quote,
            loading: current.quote === null,
            refreshing: false,
            error: error instanceof Error ? error.message : "Unable to refresh live quote",
          }));
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    void refreshQuote(initialQuote !== null);
    const intervalId = window.setInterval(() => {
      void refreshQuote(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [initialQuote]);

  const quote = state.quote;
  const positive = quote ? quote.change >= 0 : true;
  const toneClass = positive ? "text-emerald-300" : "text-rose-300";
  const badgeClass = positive
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : "border-rose-400/30 bg-rose-400/10 text-rose-300";

  return (
    <section className="overflow-hidden rounded-[28px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(16,27,44,0.96),rgba(6,10,18,0.94))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="border-b border-white/8 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Live benchmark</p>
            <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">SSE 50 / 上证50</h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              Poll {Math.floor(POLL_INTERVAL_MS / 1000)}s
            </span>
            {quote ? (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                {quote.source === "eastmoney" ? "Eastmoney" : "Sina"}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
              {quote?.symbol ?? "sh000016"}
            </span>
            {quote ? <span className={`rounded-full border px-3 py-1 text-sm ${badgeClass}`}>{formatSignedNumber(quote.change)} / {formatSignedPercent(quote.changePercent)}</span> : null}
            <span className="text-xs text-zinc-500">
              {state.refreshing ? "Refreshing" : state.loading ? "Loading live quote" : quote ? `Updated ${formatTimestamp(quote.timestamp)}` : "Waiting for market data"}
            </span>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {quote ? formatPrice(quote.latestPrice) : "--"}
              </div>
              <div className={`mt-3 text-sm ${quote ? toneClass : "text-zinc-500"}`}>
                {quote ? `${quote.name} real-time benchmark snapshot` : "Server-side quote adapter is warming up"}
              </div>
            </div>
            <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.42),transparent_62%)]" />
          </div>

          {state.error ? (
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
              {state.error}
              {quote ? " Showing the last successful snapshot." : ""}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <MetricTile label="Open" value={quote ? formatPrice(quote.open) : "--"} />
          <MetricTile label="Prev close" value={quote ? formatPrice(quote.previousClose) : "--"} />
          <MetricTile label="High" value={quote ? formatPrice(quote.high) : "--"} />
          <MetricTile label="Low" value={quote ? formatPrice(quote.low) : "--"} />
        </div>
      </div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedNumber(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatPrice(value)}`;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
