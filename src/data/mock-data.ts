import { createDashboardData } from "@/lib/adapters";
import { mockAgentConnections, mockAgentProfiles } from "@/data/fixtures/agents";
import { mockForumPosts } from "@/data/fixtures/forum";
import {
  mockMarketEvents,
  mockOrderBookLevels,
  mockOverviewMetrics,
  mockSectorPulse,
  mockTransactions,
} from "@/data/fixtures/market";
import type {
  DashboardAgentCard as AgentCard,
  DashboardAgentNode as AgentNode,
  DashboardControls,
  DashboardEventItem as EventItem,
  DashboardOrderLevel as OrderLevel,
  DashboardPost as Post,
  DashboardTrade as Trade,
  DashboardMarketStat as MarketStat,
} from "@/types/twinmarket";

const dashboardData = createDashboardData({
  overviewMetrics: mockOverviewMetrics,
  sectorPulse: mockSectorPulse,
  profiles: mockAgentProfiles,
  connections: mockAgentConnections,
  orderBookLevels: mockOrderBookLevels,
  transactions: mockTransactions,
  events: mockMarketEvents,
  forumPosts: mockForumPosts,
  controls: {
    scenario: "Bullish diffusion / 社交扩散增强",
    date: "2026-03-22",
    seed: 240322,
    speed: "12x",
    phase: "Continuous auction",
  },
});

export type { MarketStat, AgentNode, OrderLevel, EventItem, AgentCard, Post, Trade, DashboardControls as Controls };

export const marketStats: MarketStat[] = dashboardData.marketStats;
export const sectorTape = dashboardData.sectorTape.map((item) => ({ name: item.name, value: item.value }));
export const agentNodes: AgentNode[] = dashboardData.agentNodes;
export const agentEdges = dashboardData.agentEdges;
export const bidLevels: OrderLevel[] = dashboardData.bidLevels;
export const askLevels: OrderLevel[] = dashboardData.askLevels;
export const trades: Trade[] = dashboardData.trades;
export const events: EventItem[] = dashboardData.events;
export const agentCards: AgentCard[] = dashboardData.agentCards;
export const posts: Post[] = dashboardData.posts;
export const controls: DashboardControls = dashboardData.controls;
