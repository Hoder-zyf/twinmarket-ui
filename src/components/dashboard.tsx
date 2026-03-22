import {
  agentCards,
  agentEdges,
  agentNodes,
  askLevels,
  bidLevels,
  controls,
  posts,
  sectorTape,
  trades,
} from "@/data/mock-data";
import { LiveEventStream } from "@/components/live-event-stream";
import { LiveSse50Overview } from "@/components/live-sse50-overview";

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

function OverviewStats() {
  return <LiveSse50Overview />;
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

function AgentNetwork() {
  const map = new Map(agentNodes.map((node) => [node.id, node]));

  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Social topology" title="Agent influence network" meta="belief propagation / herd risk / opinion leaders" />
      <div className="relative h-[420px] overflow-hidden p-4 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%)]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {agentEdges.map(([sourceId, targetId]) => {
            const source = map.get(sourceId)!;
            const target = map.get(targetId)!;
            return (
              <line
                key={`${sourceId}-${targetId}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(96,165,250,0.22)"
                strokeWidth="0.35"
              />
            );
          })}
        </svg>

        {agentNodes.map((node) => {
          const sentimentColor =
            node.sentiment === "bullish"
              ? "from-emerald-400/70 to-cyan-300/60"
              : node.sentiment === "bearish"
                ? "from-rose-400/70 to-orange-300/60"
                : "from-sky-300/70 to-violet-300/60";

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-xl bg-gradient-to-r ${sentimentColor}`} />
                <div className="relative w-28 rounded-2xl border border-white/12 bg-[#09101c]/90 px-3 py-2 shadow-2xl">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <span>{node.id}</span>
                    <span>{node.influence}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{node.name}</div>
                  <div className="mt-1 text-[11px] text-zinc-400">{node.strategy}</div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">PnL {node.pnl}</span>
                    <span className={`rounded-full px-2 py-1 ${node.risk === "高" ? "bg-rose-500/15 text-rose-200" : node.risk === "中" ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}>{node.risk}风险</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-5 left-5 flex gap-3 text-xs text-zinc-400 md:left-6">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">节点大小 ≈ 影响力</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">颜色 ≈ 多空倾向</span>
        </div>
      </div>
    </Shell>
  );
}

function OrderBook() {
  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Microstructure" title="Order book & latest prints" meta="TTEI · closing auction window" />
      <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/12 bg-emerald-400/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-emerald-200/80">
              <span>Bids</span>
              <span>Depth</span>
            </div>
            <div className="space-y-2 text-sm">
              {bidLevels.map((level) => (
                <div key={level.price} className="grid grid-cols-3 gap-2 rounded-xl bg-black/20 px-3 py-2 text-zinc-200">
                  <span className="font-medium text-emerald-300">{level.price}</span>
                  <span>{level.size}</span>
                  <span className="text-right text-zinc-400">{level.total}</span>
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
              {askLevels.map((level) => (
                <div key={level.price} className="grid grid-cols-3 gap-2 rounded-xl bg-black/20 px-3 py-2 text-zinc-200">
                  <span className="font-medium text-rose-300">{level.price}</span>
                  <span>{level.size}</span>
                  <span className="text-right text-zinc-400">{level.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
            <span>Recent prints</span>
            <span>成交回放</span>
          </div>
          {trades.map((trade) => (
            <div key={`${trade.time}-${trade.agent}`} className="grid grid-cols-[72px_54px_1fr_72px] items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200">
              <span className="text-zinc-500">{trade.time}</span>
              <span className={trade.side === "BUY" ? "text-emerald-300" : "text-rose-300"}>{trade.side}</span>
              <div>
                <div className="font-medium text-white">{trade.ticker}</div>
                <div className="text-xs text-zinc-500">{trade.agent} · {trade.volume}</div>
              </div>
              <span className="text-right font-medium">{trade.price}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function MarketEvents() {
  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Regime changes" title="Market event stream" meta="news / forum / order imbalance" />
      <LiveEventStream />
    </Shell>
  );
}

function AgentProfiles() {
  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Heterogeneity" title="Agent profiles" meta="risk / strategy / positions" />
      <div className="space-y-4 p-5 md:p-6">
        {agentCards.map((agent) => (
          <div key={agent.id} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,43,0.92),rgba(8,12,20,0.92))] p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200">{agent.id}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{agent.archetype}</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{agent.name}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{agent.strategy}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-zinc-500">PnL</div>
                  <div className="mt-1 font-semibold text-emerald-300">{agent.pnl}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-zinc-500">Risk</div>
                  <div className="mt-1 font-semibold text-white">{agent.riskScore}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-zinc-500">Impact</div>
                  <div className="mt-1 font-semibold text-cyan-200">{agent.socialImpact}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr]">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cash reserve</div>
                <div className="mt-2 text-xl font-semibold text-white">{agent.cash}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {agent.positions.map((position) => (
                  <div key={`${agent.id}-${position.ticker}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{position.ticker}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{position.weight}</div>
                    <div className="mt-1 text-sm text-zinc-400">{position.bias}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function ForumFeed() {
  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Opinion market" title="Forum / belief stream" meta="social influence → portfolio update" />
      <div className="space-y-4 p-5 md:p-6">
        {posts.map((post) => (
          <div key={`${post.author}-${post.time}`} className="rounded-[24px] border border-white/8 bg-black/20 p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{post.author}</div>
                <div className="text-sm text-zinc-500">{post.role} · {post.time}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm ${post.stance === "看多" ? "bg-emerald-500/12 text-emerald-300" : post.stance === "看空" ? "bg-rose-500/12 text-rose-300" : "bg-sky-500/12 text-sky-300"}`}>{post.stance}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">{post.content}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tickers.map((ticker) => (
                <span key={ticker} className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                  {ticker}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-500">
              {post.reactions.map((reaction) => (
                <span key={reaction.label} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                  {reaction.label} {reaction.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function ControlPanel() {
  return (
    <Shell className="overflow-hidden">
      <SectionHeader eyebrow="Simulation control" title="Playback console" meta="seeded experiment / reproducible replay" />
      <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">▶ Run</button>
            <button className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]">❚❚ Pause</button>
            <button className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]">↺ Reset</button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Scenario</div>
              <div className="mt-2 text-sm font-medium text-white">{controls.scenario}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Simulation phase</div>
              <div className="mt-2 text-sm font-medium text-white">{controls.phase}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Date</div>
              <div className="mt-2 text-sm font-medium text-white">{controls.date}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Seed / speed</div>
              <div className="mt-2 text-sm font-medium text-white">{controls.seed} · {controls.speed}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(12,18,31,0.96),rgba(6,10,18,0.96))] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Experiment note</div>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            当前原型强调三个研究面向：<span className="text-white">agent heterogeneity</span>、<span className="text-white">social influence</span>、<span className="text-white">market microstructure</span>。后续可以把 TwinMarket 的用户画像、论坛帖子、撮合日志和日级 summary 直接接到这些卡片和面板上。
          </p>
          <div className="mt-6 space-y-3 text-sm text-zinc-400">
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Profiles DB → Agent cards</span>
              <span className="text-cyan-200">ready</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Forum DB → Belief stream</span>
              <span className="text-cyan-200">ready</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Matching engine → Order book</span>
              <span className="text-cyan-200">ready</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function Dashboard() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_26%)]" />

      <header className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,15,27,0.94),rgba(6,10,19,0.92))] px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:px-8 md:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">TwinMarket UI Prototype</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl tracking-tight text-white md:text-5xl lg:text-6xl">
              Multi-agent A-share market terminal for simulation, belief flow, and execution.
            </h1>
          </div>
          <div className="grid gap-2 text-sm text-zinc-400 md:text-right">
            <span>Research demo · synthetic market replay</span>
            <span>Shanghai Session · Closing Phase</span>
          </div>
        </div>
        <SectorTape />
      </header>

      <OverviewStats />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AgentNetwork />
        <div className="grid gap-6">
          <OrderBook />
          <MarketEvents />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AgentProfiles />
        <ForumFeed />
      </div>

      <ControlPanel />
    </main>
  );
}
