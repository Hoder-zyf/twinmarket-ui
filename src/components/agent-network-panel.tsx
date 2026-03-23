"use client";

import cytoscape, { type Core, type ElementDefinition, type StylesheetJson } from "cytoscape";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { useReplayStore } from "@/lib/state/replay";

import type {
  DashboardAgentEdge,
  DashboardAgentGraph,
  DashboardAgentGraphViewMode,
  DashboardAgentNode,
  TwinMarketSentiment,
} from "@/types/twinmarket";

type AgentNetworkPanelProps = {
  graph: DashboardAgentGraph;
  highlightedAgentIds?: string[];
};

type SentimentFilter = "all" | TwinMarketSentiment;
type RiskFilter = "all" | DashboardAgentNode["risk"];

const VIEW_OPTIONS: { id: DashboardAgentGraphViewMode; label: string; detail: string }[] = [
  { id: "social", label: "Social", detail: "follow / visibility / attention" },
  { id: "belief", label: "Belief", detail: "conviction spread / thesis alignment" },
  { id: "trade", label: "Trade co-movement", detail: "execution overlap / copy pressure" },
];

const SENTIMENT_OPTIONS: { id: SentimentFilter; label: string }[] = [
  { id: "all", label: "All bias" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
];

const RISK_OPTIONS: { id: RiskFilter; label: string }[] = [
  { id: "all", label: "All risk" },
  { id: "高", label: "High risk" },
  { id: "中", label: "Medium risk" },
  { id: "低", label: "Low risk" },
];

const CANVAS_SIZE = {
  width: 980,
  height: 620,
};

const NETWORK_STYLESHEET: StylesheetJson = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      shape: "round-rectangle",
      width: "mapData(influence, 40, 95, 88, 132)",
      height: "mapData(influence, 40, 95, 58, 88)",
      "background-color": "data(color)",
      "background-opacity": 0.88,
      "border-color": "data(borderColor)",
      "border-width": 1.25,
      color: "#f8fafc",
      "font-family": "IBM Plex Sans, sans-serif",
      "font-size": 12,
      "font-weight": 600,
      "text-wrap": "wrap",
      "text-max-width": "90px",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-color": "#08101d",
      "text-outline-width": 2,
      "overlay-padding": 8,
      "transition-property": "opacity, background-opacity, border-width",
      "transition-duration": 140,
    },
  },
  {
    selector: "edge",
    style: {
      width: "mapData(weight, 0.35, 0.9, 1.2, 3.8)",
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.72,
      "curve-style": "bezier",
      opacity: 0.58,
      "line-opacity": 0.58,
      "overlay-padding": 4,
      "transition-property": "opacity, width",
      "transition-duration": 140,
    },
  },
  {
    selector: ".is-neighbor",
    style: {
      opacity: 1,
      "line-opacity": 0.92,
      "border-width": 1.8,
    },
  },
  {
    selector: "node.is-active",
    style: {
      "border-width": 2.6,
      "background-opacity": 1,
      "z-index": 12,
    },
  },
  {
    selector: "node.is-highlighted",
    style: {
      "border-width": 3.2,
      "border-color": "#67e8f9",
      "background-opacity": 1,
      "z-index": 9,
    },
  },
  {
    selector: ".is-faded",
    style: {
      opacity: 0.16,
      "line-opacity": 0.08,
    },
  },
];

function getNodePalette(sentiment: DashboardAgentNode["sentiment"]) {
  if (sentiment === "bullish") {
    return {
      color: "rgba(16, 185, 129, 0.9)",
      borderColor: "rgba(94, 234, 212, 0.72)",
      glowColor: "rgba(45, 212, 191, 0.46)",
    };
  }

  if (sentiment === "bearish") {
    return {
      color: "rgba(244, 63, 94, 0.84)",
      borderColor: "rgba(251, 146, 60, 0.72)",
      glowColor: "rgba(251, 113, 133, 0.5)",
    };
  }

  return {
    color: "rgba(56, 189, 248, 0.84)",
    borderColor: "rgba(167, 139, 250, 0.68)",
    glowColor: "rgba(96, 165, 250, 0.45)",
  };
}

function getEdgeColor(relationship: DashboardAgentEdge["relationship"]) {
  if (relationship === "belief") return "rgba(34, 211, 238, 0.9)";
  if (relationship === "trade") return "rgba(251, 146, 60, 0.88)";
  return "rgba(96, 165, 250, 0.88)";
}

function getVisibleGraph(
  graph: DashboardAgentGraph,
  viewMode: DashboardAgentGraphViewMode,
  sentimentFilter: SentimentFilter,
  riskFilter: RiskFilter,
) {
  const visibleNodes = graph.nodes.filter((node) => {
    const sentimentPass = sentimentFilter === "all" || node.sentiment === sentimentFilter;
    const riskPass = riskFilter === "all" || node.risk === riskFilter;

    return sentimentPass && riskPass;
  });

  const nodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graph.edges.filter(
    (edge) => edge.relationship === viewMode && nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
  };
}

function toElements(graph: DashboardAgentGraph): ElementDefinition[] {
  const nodeElements = graph.nodes.map<ElementDefinition>((node) => {
    const palette = getNodePalette(node.sentiment);

    return {
      data: {
        id: node.id,
        label: `${node.name}\n${node.id}`,
        name: node.name,
        strategy: node.strategy,
        influence: node.influence,
        risk: node.risk,
        pnl: node.pnl,
        sentiment: node.sentiment,
        color: palette.color,
        borderColor: palette.borderColor,
        glowColor: palette.glowColor,
      },
      position: {
        x: (node.x / 100) * CANVAS_SIZE.width,
        y: (node.y / 100) * CANVAS_SIZE.height,
      },
    };
  });

  const edgeElements = graph.edges.map<ElementDefinition>((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      relationship: edge.relationship,
      color: getEdgeColor(edge.relationship),
    },
  }));

  return [...nodeElements, ...edgeElements];
}

function applyFocusState(cy: Core, nodeId: string | null, highlightedAgentIds: string[]) {
  cy.nodes().removeClass("is-active is-neighbor is-faded is-highlighted");
  cy.edges().removeClass("is-neighbor is-faded");

  highlightedAgentIds.forEach((agentId) => {
    cy.getElementById(agentId).addClass("is-highlighted");
  });

  if (!nodeId) return;

  const activeNode = cy.getElementById(nodeId);

  if (activeNode.empty()) return;

  const focusedNodes = activeNode.closedNeighborhood().nodes();
  const focusedEdges = activeNode.connectedEdges();

  cy.nodes().not(focusedNodes).addClass("is-faded");
  cy.edges().not(focusedEdges).addClass("is-faded");
  focusedNodes.addClass("is-neighbor");
  focusedEdges.addClass("is-neighbor");
  activeNode.removeClass("is-neighbor").addClass("is-active");
}

function getRiskTone(risk: DashboardAgentNode["risk"]) {
  if (risk === "高") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (risk === "中") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
}

function getSentimentTone(sentiment: DashboardAgentNode["sentiment"]) {
  if (sentiment === "bullish") return "text-emerald-300";
  if (sentiment === "bearish") return "text-rose-300";
  return "text-sky-300";
}

function getRelationshipTone(viewMode: DashboardAgentGraphViewMode) {
  if (viewMode === "belief") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  if (viewMode === "trade") return "border-orange-300/25 bg-orange-300/10 text-orange-100";
  return "border-sky-300/25 bg-sky-300/10 text-sky-100";
}

function countNodeNeighbors(graph: DashboardAgentGraph, nodeId: string) {
  const neighbors = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.source === nodeId) neighbors.add(edge.target);
    if (edge.target === nodeId) neighbors.add(edge.source);
  }

  return neighbors.size;
}

export function AgentNetworkPanel({ graph, highlightedAgentIds = [] }: AgentNetworkPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [viewMode, setViewMode] = useState<DashboardAgentGraphViewMode>("social");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { selectedAgentId, setSelectedAgentId } = useReplayStore();

  const visibleGraph = useMemo(
    () => getVisibleGraph(graph, viewMode, sentimentFilter, riskFilter),
    [graph, riskFilter, sentimentFilter, viewMode],
  );
  const visibleNodeIds = new Set(visibleGraph.nodes.map((node) => node.id));
  const activeSelectionId = selectedAgentId && visibleNodeIds.has(selectedAgentId) ? selectedAgentId : null;
  const activeHoverId = hoveredNodeId && visibleNodeIds.has(hoveredNodeId) ? hoveredNodeId : null;
  const activeNodeId = activeSelectionId ?? activeHoverId;
  const activeNode = visibleGraph.nodes.find((node) => node.id === activeNodeId) ?? null;
  const activeView = VIEW_OPTIONS.find((option) => option.id === viewMode) ?? VIEW_OPTIONS[0];
  const activeNeighborCount = activeNode ? countNodeNeighbors(visibleGraph, activeNode.id) : 0;

  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: NETWORK_STYLESHEET,
      layout: {
        name: "preset",
        fit: true,
        padding: 56,
      },
      minZoom: 0.7,
      maxZoom: 1.65,
      wheelSensitivity: 0.16,
      textureOnViewport: true,
    });

    cy.on("tap", "node", (event) => {
      const nextId = event.target.id();
      startTransition(() => {
        const current = useReplayStore.getState().selectedAgentId;
        setSelectedAgentId(current === nextId ? null : nextId);
      });
    });

    cy.on("mouseover", "node", (event) => {
      startTransition(() => {
        setHoveredNodeId(event.target.id());
      });
    });

    cy.on("mouseout", "node", () => {
      startTransition(() => {
        setHoveredNodeId(null);
      });
    });

    cy.on("tap", (event) => {
      if (event.target !== cy) return;

      startTransition(() => {
        setSelectedAgentId(null);
      });
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [setSelectedAgentId]);

  useEffect(() => {
    const cy = cyRef.current;

    if (!cy) return;

    cy.batch(() => {
      cy.elements().remove();
      cy.add(toElements(visibleGraph));
    });

    if (visibleGraph.nodes.length || visibleGraph.edges.length) {
      cy.layout({
        name: "preset",
        fit: true,
        padding: 56,
        animate: false,
      }).run();
    }
  }, [visibleGraph]);

  useEffect(() => {
    const cy = cyRef.current;

    if (!cy) return;

    applyFocusState(cy, activeNodeId, highlightedAgentIds);
  }, [activeNodeId, highlightedAgentIds]);

  return (
    <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-black/15 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_OPTIONS.map((option) => {
              const isActive = option.id === viewMode;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const cy = cyRef.current;

                if (!cy || !cy.elements().length) return;

                cy.fit(cy.elements(), 56);
              }}
              className="ml-auto rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
            >
              Reset view
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Bias filter</span>
              {SENTIMENT_OPTIONS.map((option) => {
                const isActive = option.id === sentimentFilter;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSentimentFilter(option.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      isActive
                        ? "border-white/18 bg-white/10 text-zinc-100"
                        : "border-white/10 bg-transparent text-zinc-500 hover:border-white/16 hover:text-zinc-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Risk filter</span>
              {RISK_OPTIONS.map((option) => {
                const isActive = option.id === riskFilter;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRiskFilter(option.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      isActive
                        ? "border-white/18 bg-white/10 text-zinc-100"
                        : "border-white/10 bg-transparent text-zinc-500 hover:border-white/16 hover:text-zinc-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative h-[400px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,15,27,0.96),rgba(6,10,18,0.96))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_32%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
          <div
            ref={containerRef}
            className={`absolute inset-0 transition ${visibleGraph.nodes.length ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />
          {visibleGraph.nodes.length ? (
            null
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-sm rounded-[24px] border border-dashed border-white/12 bg-black/25 px-5 py-6 text-center">
                <div className="text-sm font-medium text-white">No visible nodes for the current filters</div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">
                  Reset the sentiment or risk filters to restore the mock network snapshot.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSentimentFilter("all");
                    setRiskFilter("all");
                  }}
                  className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/12"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 text-[11px] text-zinc-400">
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5">drag / zoom / pan</span>
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5">click to pin</span>
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5">hover to inspect neighborhood</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,25,41,0.92),rgba(8,12,20,0.92))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Visible slice</div>
              <div className="mt-2 text-lg font-semibold text-white">{activeView.label}</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${getRelationshipTone(viewMode)}`}>
              {visibleGraph.edges.length} edges
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{activeView.detail}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Nodes</div>
              <div className="mt-2 text-2xl font-semibold text-white">{visibleGraph.nodes.length}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Filters</div>
              <div className="mt-2 text-sm font-medium text-zinc-200">
                {sentimentFilter === "all" ? "All bias" : sentimentFilter} · {riskFilter === "all" ? "All risk" : `${riskFilter}风险`}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Agent focus</div>
          {activeNode ? (
            <div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-white">{activeNode.name}</div>
                  <div className="mt-1 text-sm text-zinc-500">{activeNode.id}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${getRiskTone(activeNode.risk)}`}>{activeNode.risk}风险</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-300">{activeNode.strategy}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs ${getSentimentTone(activeNode.sentiment)}`}>
                  {activeNode.sentiment}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                  Influence {activeNode.influence}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                  PnL {activeNode.pnl}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Neighbors</div>
                  <div className="mt-2 text-xl font-semibold text-white">{activeNeighborCount}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Interaction</div>
                  <div className="mt-2 text-sm font-medium text-zinc-200">
                    {selectedAgentId ? "Pinned selection" : "Hover preview"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm leading-6 text-zinc-400">
              Hover a node to inspect its local neighborhood. Click a node to pin the focus state without opening the Step 13 detail drawer yet.
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Legend</div>
          <div className="mt-3 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <span>Node size</span>
              <span className="text-zinc-500">Influence score</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <span>Node tone</span>
              <span className="text-zinc-500">Bull / bear / neutral bias</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <span>Edge tone</span>
              <span className="text-zinc-500">View-specific relationship layer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
