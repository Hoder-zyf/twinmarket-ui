"use client";

import { useEffect, useRef, useState } from "react";

import type {
  MarketApiError,
  MarketConstituentQuote,
  Sse50MarketOverview,
  Sse50OverviewApiResponse,
} from "@/lib/market/types";

const POLL_INTERVAL_MS = 15_000;

type LiveSse50OverviewProps = {
  initialOverview?: Sse50MarketOverview | null;
};

type LiveState = {
  overview: Sse50MarketOverview | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function LiveSse50Overview({
  initialOverview = null,
}: LiveSse50OverviewProps) {
  const [state, setState] = useState<LiveState>({
    overview: initialOverview,
    loading: initialOverview === null,
    refreshing: false,
    error: null,
  });
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const refreshOverview = async (background: boolean) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setState((current) => ({
        ...current,
        loading: background ? current.loading : current.overview === null,
        refreshing: background,
        error: null,
      }));

      try {
        const response = await fetch("/api/market/sse50", { cache: "no-store" });
        const payload = (await response.json()) as
          | Sse50OverviewApiResponse
          | MarketApiError;

        if (!response.ok || !("overview" in payload)) {
          throw new Error(
            "error" in payload ? payload.error : "SSE 50 overview request failed",
          );
        }

        if (!cancelled) {
          setState({
            overview: payload.overview,
            loading: false,
            refreshing: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            overview: current.overview,
            loading: current.overview === null,
            refreshing: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to refresh SSE 50 market overview",
          }));
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    void refreshOverview(initialOverview !== null);
    const intervalId = window.setInterval(() => {
      void refreshOverview(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [initialOverview]);

  const overview = state.overview;
  const breadthTone =
    overview && overview.breadth.advanceDeclineSpread < 0
      ? "text-rose-300"
      : "text-emerald-300";
  const leadingTurnover = overview?.movers.turnoverLeaders[0] ?? null;
  const strongest = overview?.movers.gainers[0] ?? null;
  const weakest = overview?.movers.losers[0] ?? null;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.65fr_repeat(3,minmax(0,1fr))]">
      <div className="md:col-span-2 xl:col-span-1 overflow-hidden rounded-[28px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(16,27,44,0.96),rgba(6,10,18,0.94))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/8 px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                Live constituent overview
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">
                SSE 50 / 上证50
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                50 constituents
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                Poll {Math.floor(POLL_INTERVAL_MS / 1000)}s
              </span>
              {overview ? (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                  {formatSourceLabel(overview.source)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                  Breadth
                </span>
                {overview ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-sm ${
                      overview.breadth.advanceDeclineSpread >= 0
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-rose-400/30 bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    {overview.breadth.advancing}↑ / {overview.breadth.declining}↓
                  </span>
                ) : null}
                <span className="text-xs text-zinc-500">
                  {state.refreshing
                    ? "Refreshing"
                    : state.loading
                      ? "Loading SSE 50 market map"
                      : overview
                        ? `Updated ${formatTimestamp(overview.timestamp)}`
                        : "Waiting for constituent data"}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    {overview ? `${overview.breadth.advanceRatio.toFixed(0)}%` : "--"}
                  </div>
                  <div
                    className={`mt-3 text-sm ${
                      overview ? breadthTone : "text-zinc-500"
                    }`}
                  >
                    {overview
                      ? `${overview.breadth.advancing} of 50 constituents are advancing`
                      : "Server-side constituent batch adapters are warming up"}
                  </div>
                </div>
                <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.42),transparent_62%)]" />
              </div>

              <div className="mt-6">
                <div className="h-2 rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.9),rgba(34,211,238,0.9))]"
                    style={{ width: `${overview?.breadth.advanceRatio ?? 0}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-emerald-200">
                    Advancing {overview?.breadth.advancing ?? "--"}
                  </span>
                  <span className="rounded-full border border-rose-400/20 bg-rose-400/8 px-3 py-1 text-rose-200">
                    Declining {overview?.breadth.declining ?? "--"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    Unchanged {overview?.breadth.unchanged ?? "--"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    Snapshot {overview?.universe.snapshotDate ?? "--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <MetricTile
                label="Avg move"
                value={overview ? formatSignedPercent(overview.averageChangePercent) : "--"}
              />
              <MetricTile
                label="Median move"
                value={overview ? formatSignedPercent(overview.medianChangePercent) : "--"}
              />
              <MetricTile
                label="Turnover total"
                value={overview ? formatMoneyCompact(overview.turnover.total) : "--"}
              />
              <MetricTile
                label="Turnover median"
                value={overview ? formatMoneyCompact(overview.turnover.median) : "--"}
              />
            </div>
          </div>

          {state.error ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
              {state.error}
              {overview ? " Showing the last successful SSE 50 snapshot." : ""}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
            <RankingPanel
              title="Top gainers"
              tone="up"
              items={overview?.movers.gainers ?? []}
            />
            <RankingPanel
              title="Top losers"
              tone="down"
              items={overview?.movers.losers ?? []}
            />
            <SnapshotPanel items={overview?.listSnapshot ?? []} />
          </div>
        </div>
      </div>

      <SummaryCard
        eyebrow="Breadth spread"
        title={
          overview
            ? `${overview.breadth.advanceDeclineSpread >= 0 ? "+" : ""}${overview.breadth.advanceDeclineSpread}`
            : "--"
        }
        subtitle={
          overview
            ? `${overview.breadth.advancing} up / ${overview.breadth.declining} down / ${overview.breadth.unchanged} flat`
            : "Advance-decline spread"
        }
        accent={
          overview && overview.breadth.advanceDeclineSpread < 0
            ? "from-rose-400/45 to-orange-300/30"
            : "from-emerald-400/45 to-cyan-300/30"
        }
        footer={
          overview
            ? `Advance ratio ${overview.breadth.advanceRatio.toFixed(0)}%`
            : "Awaiting data"
        }
      />

      <SummaryCard
        eyebrow="Turnover pulse"
        title={overview ? formatMoneyCompact(overview.turnover.total) : "--"}
        subtitle={
          overview
            ? `Avg ${formatMoneyCompact(overview.turnover.average)} / total vol ${formatVolumeCompact(
                overview.turnover.totalVolume,
              )}`
            : "Total constituent turnover"
        }
        accent="from-cyan-300/45 to-sky-300/30"
        footer={
          leadingTurnover
            ? `${leadingTurnover.name} ${formatMoneyCompact(leadingTurnover.turnover)}`
            : "Turnover leaders"
        }
      />

      <SummaryCard
        eyebrow="Mover tape"
        title={strongest ? strongest.name : "--"}
        subtitle={
          strongest
            ? `${formatSignedPercent(strongest.changePercent)} · ${formatPrice(
                strongest.latestPrice,
              )}`
            : "Strongest constituent"
        }
        accent="from-fuchsia-300/35 to-cyan-300/30"
        footer={
          weakest
            ? `Weakest ${weakest.name} ${formatSignedPercent(weakest.changePercent)}`
            : "Top movers"
        }
      />
    </section>
  );
}

function SummaryCard({
  eyebrow,
  title,
  subtitle,
  footer,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-zinc-400">
          <span>{eyebrow}</span>
          <div className={`h-12 w-20 rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.45),transparent_60%)] bg-gradient-to-r ${accent}`} />
        </div>
        <div className="mt-6 text-3xl font-semibold tracking-tight text-white">{title}</div>
        <div className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</div>
        <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
          {footer}
        </div>
      </div>
    </div>
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

function RankingPanel({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "up" | "down";
  items: MarketConstituentQuote[];
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
        <span>{title}</span>
        <span>{tone === "up" ? "涨幅榜" : "跌幅榜"}</span>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${title}-${item.code}`}
              className="grid grid-cols-[76px_1fr_88px] items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200"
            >
              <div>
                <div className="font-medium text-white">{item.code}</div>
                <div className="text-[11px] text-zinc-500">{formatPrice(item.latestPrice)}</div>
              </div>
              <div>
                <div className="truncate font-medium text-white">{item.name}</div>
                <div className="text-[11px] text-zinc-500">
                  {formatMoneyCompact(item.turnover)}
                </div>
              </div>
              <div
                className={`text-right font-medium ${
                  tone === "up" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatSignedPercent(item.changePercent)}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-sm text-zinc-500">
            Waiting for live rankings
          </div>
        )}
      </div>
    </div>
  );
}

function SnapshotPanel({ items }: { items: MarketConstituentQuote[] }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,26,43,0.92),rgba(8,12,20,0.92))] p-4">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
        <span>Turnover snapshot</span>
        <span>Top 8 by成交额</span>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item, index) => {
            const positive = item.changePercent >= 0;

            return (
              <div
                key={`snapshot-${item.code}`}
                className="grid grid-cols-[28px_72px_1fr_92px_74px] items-center gap-2 rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-sm text-zinc-200"
              >
                <span className="text-zinc-500">{index + 1}</span>
                <div>
                  <div className="font-medium text-white">{item.code}</div>
                  <div className="text-[11px] text-zinc-500">{formatPrice(item.latestPrice)}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{item.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
                <span className="text-right text-zinc-300">
                  {formatMoneyCompact(item.turnover)}
                </span>
                <span
                  className={`text-right font-medium ${
                    positive ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {formatSignedPercent(item.changePercent)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-sm text-zinc-500">
            Waiting for constituent turnover snapshot
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatMoneyCompact(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(2)}亿`;
  }

  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(2)}万`;
  }

  return value.toFixed(0);
}

function formatVolumeCompact(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(2)}亿`;
  }

  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(2)}万`;
  }

  return value.toFixed(0);
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

function formatSourceLabel(source: "eastmoney" | "sina"): string {
  return source === "eastmoney" ? "Eastmoney batch" : "Sina fallback";
}
