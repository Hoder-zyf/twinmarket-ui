"use client";

import { useEffect, useMemo } from "react";

import { AgentDetailDrawer } from "@/components/agent-detail-drawer";
import { AgentNetworkPanel } from "@/components/agent-network-panel";
import { LiveEventStream } from "@/components/live-event-stream";
import { LiveSse50Overview } from "@/components/live-sse50-overview";
import { ReplayControlPanel } from "@/components/replay-control-panel";
import { SimulationPanels } from "@/components/simulation-panels";
import { mockReplayFrames } from "@/data/fixtures/replay";
import { sectorTape } from "@/data/mock-data";
import { mockAgentProfiles } from "@/data/fixtures/agents";
import { mockForumPosts } from "@/data/fixtures/forum";
import { mockMarketEvents, mockOrderBookLevels, mockTransactions } from "@/data/fixtures/market";
import { useReplayStore } from "@/lib/state/replay";

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 md:px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">{title}</h2>
      </div>
      {meta ? <div className="text-right text-xs text-zinc-400">{meta}</div> : null}
    </div>
  );
}

function SectorTape() {
  return (
    <Shell className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 md:px-6">
        <span className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Sector pulse</span>
        {sectorTape.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm text-zinc-300">
            <span>{item.name}</span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${item.value.startsWith("-") ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function AgentProfilesStrip({ highlightedAgentIds }: { highlightedAgentIds: string[] }) {
  const { selectedAgentId, setSelectedAgentId } = useReplayStore();

  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Heterogeneity" title="Agent roster" meta="clickable entry points into the unified drawer" />
      <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-4">
        {mockAgentProfiles.map((agent) => {
          const isActive = selectedAgentId === agent.userId;
          const isHighlighted = highlightedAgentIds.includes(agent.userId);

          return (
            <button
              key={agent.userId}
              type="button"
              onClick={() => setSelectedAgentId(agent.userId)}
              className={`rounded-[24px] border p-4 text-left transition ${isActive ? "border-cyan-300/25 bg-cyan-300/[0.06]" : "border-white/8 bg-black/20 hover:border-white/16"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{agent.displayName}</div>
                  <div className="text-sm text-zinc-500">{agent.archetype}</div>
                </div>
                {isHighlighted ? (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    active
                  </span>
                ) : null}
              </div>
              <div className="mt-3 text-sm leading-6 text-zinc-400">{agent.strategy}</div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">{agent.pnl}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">impact {agent.socialImpact}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">risk {agent.riskScore}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

export function Dashboard() {
  const { currentTick, setMaxTick } = useReplayStore();

  useEffect(() => {
    setMaxTick(Math.max(mockReplayFrames.length - 1, 0));
  }, [setMaxTick]);

  const activeFrame = useMemo(
    () => mockReplayFrames[Math.min(currentTick, mockReplayFrames.length - 1)] ?? mockReplayFrames[0],
    [currentTick],
  );

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_26%)]" />

      <header className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,15,27,0.94),rgba(6,10,19,0.92))] px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:px-8 md:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">TwinMarket UI Prototype</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl tracking-tight text-white md:text-5xl lg:text-6xl">
              Multi-agent A-share market replay terminal with live market context and simulation drill-down.
            </h1>
          </div>
          <div className="grid gap-2 text-sm text-zinc-400 md:text-right">
            <span>Research demo · synthetic market replay</span>
            <span>{activeFrame.label} · {activeFrame.phase}</span>
          </div>
        </div>
        <SectorTape />
      </header>

      <LiveSse50Overview />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Shell className="overflow-hidden">
            <SectionHeader eyebrow="Social topology" title="Agent influence network" meta="social / belief / trade view modes with replay highlights" />
            <AgentNetworkPanel
              graph={{
                nodes: mockAgentProfiles.map((agent) => ({
                  id: agent.userId,
                  name: agent.displayName,
                  strategy: agent.userType ?? agent.strategy,
                  risk: agent.riskLevel === "high" ? "高" : agent.riskLevel === "medium" ? "中" : "低",
                  pnl: agent.pnl,
                  influence: agent.influenceScore,
                  sentiment: agent.sentiment,
                  x: agent.network.x,
                  y: agent.network.y,
                })),
                edges: [
                  { id: "A01-A03-belief", source: "A01", target: "A03", weight: 0.88, relationship: "belief" },
                  { id: "A01-A05-social", source: "A01", target: "A05", weight: 0.52, relationship: "social" },
                  { id: "A02-A05-trade", source: "A02", target: "A05", weight: 0.41, relationship: "trade" },
                  { id: "A02-A06-belief", source: "A02", target: "A06", weight: 0.63, relationship: "belief" },
                  { id: "A03-A07-social", source: "A03", target: "A07", weight: 0.75, relationship: "social" },
                  { id: "A04-A05-social", source: "A04", target: "A05", weight: 0.57, relationship: "social" },
                  { id: "A04-A08-belief", source: "A04", target: "A08", weight: 0.38, relationship: "belief" },
                  { id: "A05-A06-trade", source: "A05", target: "A06", weight: 0.44, relationship: "trade" },
                  { id: "A06-A07-belief", source: "A06", target: "A07", weight: 0.48, relationship: "belief" },
                  { id: "A05-A07-social", source: "A05", target: "A07", weight: 0.69, relationship: "social" },
                ],
              }}
              highlightedAgentIds={activeFrame.highlightedAgentIds}
            />
          </Shell>

          <ReplayControlPanel
            frames={mockReplayFrames}
            scenarios={["Bullish diffusion / 社交扩散增强", "Risk-off stress / 防御收缩"]}
            defaultDate="2026-03-22"
            seed={240322}
          />
        </div>

        <AgentDetailDrawer agents={mockAgentProfiles} highlightedAgentIds={activeFrame.highlightedAgentIds} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SimulationPanels
          frame={activeFrame}
          agents={mockAgentProfiles}
          posts={mockForumPosts}
          transactions={mockTransactions}
          events={mockMarketEvents}
          orderBookLevels={mockOrderBookLevels}
        />
        <div className="grid gap-6">
          <AgentProfilesStrip highlightedAgentIds={activeFrame.highlightedAgentIds} />
          <Shell className="overflow-hidden">
            <SectionHeader eyebrow="Regime changes" title="Live market event stream" meta="real news / announcement sources alongside replay" />
            <LiveEventStream />
          </Shell>
        </div>
      </div>
    </main>
  );
}
