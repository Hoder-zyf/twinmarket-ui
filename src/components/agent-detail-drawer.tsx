"use client";

import { useMemo } from "react";

import { useReplayStore } from "@/lib/state/replay";
import type { TwinMarketAgentProfile } from "@/types/twinmarket";

type AgentDetailDrawerProps = {
  agents: TwinMarketAgentProfile[];
  highlightedAgentIds: string[];
};

function toneForSentiment(sentiment: TwinMarketAgentProfile["sentiment"]) {
  if (sentiment === "bullish") return "text-emerald-300 border-emerald-300/25 bg-emerald-300/10";
  if (sentiment === "bearish") return "text-rose-300 border-rose-300/25 bg-rose-300/10";
  return "text-sky-300 border-sky-300/25 bg-sky-300/10";
}

function toneForRisk(risk: TwinMarketAgentProfile["riskLevel"]) {
  if (risk === "high") return "text-rose-200 border-rose-300/25 bg-rose-300/10";
  if (risk === "medium") return "text-amber-100 border-amber-300/25 bg-amber-300/10";
  return "text-emerald-100 border-emerald-300/25 bg-emerald-300/10";
}

export function AgentDetailDrawer({ agents, highlightedAgentIds }: AgentDetailDrawerProps) {
  const { selectedAgentId, setSelectedAgentId } = useReplayStore();

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.userId === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  return (
    <aside className="sticky top-6 h-fit overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,30,0.96),rgba(5,8,15,0.96))] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
      <div className="border-b border-white/8 px-5 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Agent detail drawer</div>
            <div className="mt-2 text-xl font-semibold text-white">{selectedAgent ? selectedAgent.displayName : "Select an agent"}</div>
          </div>
          {selectedAgent ? (
            <button
              type="button"
              onClick={() => setSelectedAgentId(null)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      {selectedAgent ? (
        <div className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs ${toneForSentiment(selectedAgent.sentiment)}`}>
              {selectedAgent.sentiment}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs ${toneForRisk(selectedAgent.riskLevel)}`}>
              {selectedAgent.riskLevel} risk
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
              Influence {selectedAgent.influenceScore}
            </span>
          </div>

          <div>
            <div className="text-sm font-medium text-white">{selectedAgent.archetype}</div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{selectedAgent.selfDescription ?? selectedAgent.strategy}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">PnL</div>
              <div className="mt-2 text-xl font-semibold text-white">{selectedAgent.pnl}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Cash</div>
              <div className="mt-2 text-xl font-semibold text-white">{selectedAgent.cash}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Social impact</div>
              <div className="mt-2 text-xl font-semibold text-cyan-100">{selectedAgent.socialImpact}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Risk score</div>
              <div className="mt-2 text-xl font-semibold text-zinc-100">{selectedAgent.riskScore}</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Behavior bias</div>
            <div className="mt-3 grid gap-2">
              {Object.entries(selectedAgent.behavior ?? {}).length ? (
                Object.entries(selectedAgent.behavior ?? {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                    <span className="text-zinc-400">{key}</span>
                    <span className="font-medium text-zinc-100">{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-500">
                  No explicit behavior annotations in the current fixture.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Current positions</div>
            <div className="mt-3 space-y-2">
              {selectedAgent.portfolio.positions.map((position) => (
                <div key={`${selectedAgent.userId}-${position.ticker}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{position.ticker}</span>
                    <span className="text-sm text-cyan-100">{position.weight}</span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">{position.bias}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Replay context</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {highlightedAgentIds.includes(selectedAgent.userId) ? (
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  highlighted in current frame
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                  passive in current frame
                </span>
              )}
              {selectedAgent.followedIndustries.map((industry) => (
                <span key={industry} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 md:p-6">
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-zinc-400">
            点 graph 节点、profile 卡片，或者 forum 里的作者标签，都能打开统一 agent 详情。当前 frame 高亮 agent：
            <div className="mt-4 flex flex-wrap gap-2">
              {highlightedAgentIds.map((agentId) => (
                <span key={agentId} className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-100">
                  {agentId}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
