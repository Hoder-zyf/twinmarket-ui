# TwinMarket UI

A polished **Next.js + TypeScript + Tailwind** frontend prototype for a **multi-agent A-share market simulation terminal**.

The dashboard is still mostly mocked, but the top overview now includes a live **SSE 50 / 上证50** quote pulled server-side through a Next.js API route.

The rest of the interface uses mock data to demonstrate how a research/demo interface could present:

- heterogeneous trading agents
- social influence and belief propagation
- order book / recent trades / market events
- simulation playback controls
- forum-style opinion streams

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

The live quote route is available at <http://localhost:3000/api/market/sse50>.

## Project structure

```text
src/
  app/
    api/market/sse50/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    dashboard.tsx
    live-sse50-overview.tsx
  data/
    fixtures/
    mock-data.ts
  lib/
    adapters/
    market/
      sse50.ts
      types.ts
  types/
    twinmarket.ts
```

## Live SSE 50 integration

- The UI polls `/api/market/sse50` every 15 seconds from the client.
- The API route fetches quotes on the server to avoid browser-side cross-origin issues.
- Primary source: Eastmoney `push2.eastmoney.com/api/qt/stock/get` with `secid=1.000016`.
- Fallback source: Sina quote endpoint `hq.sinajs.cn/list=sh000016`.
- The server normalizes both source formats into the same typed shape:
  - `symbol`, `name`, `latestPrice`, `change`, `changePercent`, `open`, `high`, `low`, `previousClose`, `timestamp`, `source`
- If refresh fails, the overview keeps showing the last successful quote and surfaces an error state in the card.

## Data layer notes

- `src/types/twinmarket.ts` now contains the shared frontend domain types.
- `src/data/fixtures/*` stores structured mock fixtures by domain (agents / forum / market).
- `src/lib/adapters/*` is the normalization layer that converts fixtures or future API payloads into the shapes used by the current dashboard.
- `src/data/mock-data.ts` is now a compatibility export layer for the existing UI, built from the typed fixtures + adapters.

## Current interface blocks

- **Market overview**: live SSE 50, turnover, active agents, sentiment
- **Sector pulse**: A-share sector tape
- **Agent influence network**: Cytoscape-powered interactive graph with social / belief / trade layers
- **Unified agent drawer**: click graph nodes, roster cards, or trades/posts to inspect one agent in depth
- **Replay console**: timeline slider, play/pause, speed control, scenario selector, replay signal chart
- **Forum stream**: typed belief posts with metrics, ticker tags, and author-linked drawer entry
- **Trades / prints / summary**: frame-conditioned transaction replay + order book + event synthesis
- **Live event stream**: real Eastmoney / Cninfo / Sina aggregation alongside replay context

## Replay architecture

- `src/data/fixtures/replay.ts` stores ordered replay frames used by the terminal.
- `src/lib/state/replay.ts` uses `zustand` for shared UI state:
  - selected agent
  - current replay tick
  - play/pause
  - speed
  - scenario
- `src/components/replay-control-panel.tsx` renders the timeline controls and replay chart.
- `src/components/agent-detail-drawer.tsx` is the shared drill-down surface.
- `src/components/simulation-panels.tsx` binds forum / trades / event summary to the current replay frame.

## How this can connect to TwinMarket later

This UI was designed so it can be wired to a TwinMarket-like backend with minimal conceptual mismatch.

### Candidate mappings

- `Profiles` / user DB → **agent cards**
- user graph / influence graph → **agent network panel**
- forum DB posts + reactions → **forum / belief stream**
- matching engine outputs → **order book / recent prints / event stream**
- daily summaries / simulation state → **overview metrics + controls**

### Likely next steps

1. Split `dashboard.tsx` into finer components.
2. Add real charts (price, volume, sentiment over time).
3. Add timeline replay for multi-day simulation.
4. Replace mock data with API routes or websocket streams.
5. Add agent detail drawer and scenario comparison mode.

## Notes

- This is a research-demo UI, not a production trading system.
- Public quote endpoints can change response formats, throttle aggressively, or go down without notice. The adapter is intentionally small and includes a fallback, but it is still a demo integration.
- The current visual direction aims for a **high-density institutional terminal** with a more futuristic simulation/research feel than a normal dashboard template.
