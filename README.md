# TwinMarket UI

A polished **Next.js + TypeScript + Tailwind** frontend prototype for a **multi-agent A-share market simulation terminal**.

This project is intentionally frontend-only for now. It uses mock data to demonstrate how a research/demo interface could present:

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

## Project structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    dashboard.tsx
  data/
    mock-data.ts
```

## Current interface blocks

- **Market overview**: CSI300, turnover, active agents, sentiment
- **Sector pulse**: A-share sector tape
- **Agent influence network**: simplified relationship topology for social diffusion
- **Order book & prints**: market microstructure surface
- **Market event stream**: major regime and sentiment changes
- **Agent profiles**: strategy, risk, PnL, positions
- **Forum stream**: simulated posts and reactions
- **Simulation controls**: scenario, seed, date, playback state

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
- The current visual direction aims for a **high-density institutional terminal** with a more futuristic simulation/research feel than a normal dashboard template.
