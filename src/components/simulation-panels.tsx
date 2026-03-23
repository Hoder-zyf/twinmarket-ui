"use client";

import { useMemo } from "react";

import { useReplayStore } from "@/lib/state/replay";
import type { TwinMarketAgentProfile, TwinMarketForumPost, TwinMarketMarketEvent, TwinMarketOrderLevel, TwinMarketReplayFrame, TwinMarketTransaction } from "@/types/twinmarket";

type SimulationPanelsProps = {
  frame: TwinMarketReplayFrame;
  agents: TwinMarketAgentProfile[];
  posts: TwinMarketForumPost[];
  transactions: TwinMarketTransaction[];
  events: TwinMarketMarketEvent[];
  orderBookLevels: TwinMarketOrderLevel[];
};

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SimulationPanels({ frame, agents, posts, transactions, events, orderBookLevels }: SimulationPanelsProps) {
  const { selectedAgentId, setSelectedAgentId } = useReplayStore();

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.userId, agent])), [agents]);
  const visiblePosts = posts.filter((post) => frame.visiblePostIds.includes(post.id));
  const visibleTransactions = frame.visibleTransactionIndices.map((index) => transactions[index]).filter(Boolean);
  const visibleEvents = events.filter((event) => frame.featuredEventIds.includes(event.id));
  const bids = orderBookLevels.filter((level) => level.side === "bid");
  const asks = orderBookLevels.filter((level) => level.side === "ask");
  const selectedAgent = selectedAgentId ? agentById.get(selectedAgentId) : null;
  const highlightedAgents = frame.highlightedAgentIds.map((agentId) => agentById.get(agentId)).filter(Boolean) as TwinMarketAgentProfile[];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Opinion market</p>
              <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">Forum / belief stream</h2>
            </div>
            <div className="text-right text-xs text-zinc-400">frame-conditioned social propagation</div>
          </div>
          <div className="space-y-4 p-5 md:p-6">
            {visiblePosts.map((post) => {
              const agent = agentById.get(post.userId);
              const isSelected = selectedAgentId === post.userId;
              return (
                <div key={post.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedAgentId(post.userId)}
                        className={`text-left text-lg font-semibold transition ${isSelected ? "text-cyan-100" : "text-white hover:text-cyan-100"}`}
                      >
                        {agent?.displayName ?? post.userId}
                      </button>
                      <div className="text-sm text-zinc-500">{agent?.userType ?? agent?.archetype ?? "Agent"} · {formatTime(post.createdAt)}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm ${post.stance === "bullish" ? "bg-emerald-500/12 text-emerald-300" : post.stance === "bearish" ? "bg-rose-500/12 text-rose-300" : "bg-sky-500/12 text-sky-300"}`}>
                      {post.stance}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">{post.content}</p>
                  {post.belief ? <div className="mt-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] px-4 py-3 text-sm text-cyan-50">{post.belief}</div> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tickers.map((ticker) => (
                      <span key={ticker} className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                        {ticker}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2 text-xs text-zinc-500 md:grid-cols-4">
                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">引用 {post.metrics.references}</div>
                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">赞同 {post.metrics.likes}</div>
                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">跟单 {post.metrics.followTrades}</div>
                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">转发 {post.metrics.reposts ?? 0}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Microstructure</p>
              <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">Trades / prints / daily summary</h2>
            </div>
            <div className="text-right text-xs text-zinc-400">order flow replay</div>
          </div>
          <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/12 bg-emerald-400/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                  <span>Bids</span>
                  <span>Depth</span>
                </div>
                <div className="space-y-2 text-sm">
                  {bids.map((level) => (
                    <div key={`bid-${level.price}`} className="grid grid-cols-3 gap-2 rounded-xl bg-black/20 px-3 py-2 text-zinc-200">
                      <span className="font-medium text-emerald-300">{level.price.toFixed(2)}</span>
                      <span>{level.size.toLocaleString()}</span>
                      <span className="text-right text-zinc-400">{level.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-400/12 bg-rose-400/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-rose-200/80">
                  <span>Asks</span>
                  <span>Depth</span>
                </div>
                <div className="space-y-2 text-sm">
                  {asks.map((level) => (
                    <div key={`ask-${level.price}`} className="grid grid-cols-3 gap-2 rounded-xl bg-black/20 px-3 py-2 text-zinc-200">
                      <span className="font-medium text-rose-300">{level.price.toFixed(2)}</span>
                      <span>{level.size.toLocaleString()}</span>
                      <span className="text-right text-zinc-400">{level.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
                <span>Visible prints</span>
                <span>{frame.phase}</span>
              </div>
              {visibleTransactions.map((transaction, index) => {
                const agent = agentById.get(transaction.userId);
                return (
                  <div key={`${transaction.timestamp}-${index}`} className="grid grid-cols-[72px_54px_1fr_72px] items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200">
                    <span className="text-zinc-500">{formatTime(transaction.timestamp)}</span>
                    <span className={transaction.direction === "buy" ? "text-emerald-300" : "text-rose-300"}>{transaction.direction.toUpperCase()}</span>
                    <div>
                      <div className="font-medium text-white">{transaction.stockCode}</div>
                      <button type="button" onClick={() => setSelectedAgentId(transaction.userId)} className="text-xs text-zinc-500 hover:text-cyan-100">
                        {agent?.displayName ?? transaction.userId} · {transaction.executedQuantity.toLocaleString()}
                      </button>
                    </div>
                    <span className="text-right font-medium">{transaction.executedPrice.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-white/8 px-5 py-4 md:px-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Leader cluster</div>
                <div className="mt-2 text-sm font-medium text-white">{highlightedAgents.map((agent) => agent.displayName).join(" · ")}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Imbalance score</div>
                <div className="mt-2 text-sm font-medium text-orange-100">{frame.imbalanceScore > 0 ? "+" : ""}{(frame.imbalanceScore * 100).toFixed(0)}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Selected agent</div>
                <div className="mt-2 text-sm font-medium text-white">{selectedAgent?.displayName ?? "none"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Focused cohort</p>
              <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">Frame-highlighted agents</h2>
            </div>
            <div className="text-right text-xs text-zinc-400">who is moving the market now?</div>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            {highlightedAgents.map((agent) => (
              <button
                key={agent.userId}
                type="button"
                onClick={() => setSelectedAgentId(agent.userId)}
                className="w-full rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{agent.displayName}</div>
                    <div className="text-sm text-zinc-500">{agent.archetype}</div>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-100">
                    Influence {agent.influenceScore}
                  </span>
                </div>
                <div className="mt-3 text-sm leading-6 text-zinc-400">{agent.strategy}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Research summary</p>
              <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">Frame event synthesis</h2>
            </div>
            <div className="text-right text-xs text-zinc-400">ready for demo narration</div>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            {visibleEvents.map((event) => (
              <div key={event.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">{event.title}</div>
                  <span className={`rounded-full px-3 py-1 text-xs ${event.tone === "up" ? "bg-emerald-500/12 text-emerald-300" : event.tone === "down" ? "bg-rose-500/12 text-rose-300" : "bg-sky-500/12 text-sky-300"}`}>
                    {event.source}
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">{event.detail}</div>
                <div className="mt-2 text-xs text-zinc-500">{formatTime(event.occurredAt)}</div>
              </div>
            ))}
            <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.05] px-4 py-4 text-sm leading-7 text-cyan-50">
              {frame.summary}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
