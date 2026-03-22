import {
  type DashboardAgentCard,
  type DashboardAgentNode,
  type DashboardControls,
  type DashboardEventItem,
  type DashboardOrderLevel,
  type DashboardPost,
  type DashboardTrade,
  type TwinMarketAgentConnection,
  type TwinMarketAgentProfile,
  type TwinMarketDashboardData,
  type TwinMarketForumPost,
  type TwinMarketMarketEvent,
  type TwinMarketOrderLevel,
  type TwinMarketOverviewMetric,
  type TwinMarketReplayControls,
  type TwinMarketSectorPulse,
  type TwinMarketTransaction,
} from "@/types/twinmarket";

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

function toChineseRiskLabel(riskLevel: TwinMarketAgentProfile["riskLevel"]): DashboardAgentNode["risk"] {
  if (riskLevel === "high") return "高";
  if (riskLevel === "medium") return "中";
  return "低";
}

function toChineseStance(post: TwinMarketForumPost): DashboardPost["stance"] {
  if (post.stance === "bullish") return "看多";
  if (post.stance === "bearish") return "看空";
  return "中性";
}

export function adaptProfilesToAgentNodes(profiles: TwinMarketAgentProfile[]): DashboardAgentNode[] {
  return profiles.map((profile) => ({
    id: profile.userId,
    name: profile.displayName,
    strategy: profile.userType ?? profile.strategy,
    risk: toChineseRiskLabel(profile.riskLevel),
    pnl: profile.pnl,
    influence: profile.influenceScore,
    sentiment: profile.sentiment,
    x: profile.network.x,
    y: profile.network.y,
  }));
}

export function adaptConnectionsToAgentEdges(connections: TwinMarketAgentConnection[]): readonly (readonly [string, string])[] {
  return connections.map((connection) => [connection.sourceUserId, connection.targetUserId] as const);
}

export function adaptProfilesToAgentCards(profiles: TwinMarketAgentProfile[]): DashboardAgentCard[] {
  return profiles
    .filter((profile) => profile.socialImpact >= 70 || profile.riskScore >= 70)
    .slice(0, 3)
    .map((profile) => ({
      id: profile.userId,
      name: profile.displayName,
      archetype: profile.archetype,
      strategy: profile.strategy,
      riskScore: profile.riskScore,
      socialImpact: profile.socialImpact,
      pnl: profile.pnl,
      cash: profile.cash,
      positions: profile.portfolio.positions,
    }));
}

export function adaptOrderLevels(levels: TwinMarketOrderLevel[], side: "bid" | "ask"): DashboardOrderLevel[] {
  return levels
    .filter((level) => level.side === side)
    .map((level) => ({
      price: level.price.toFixed(2),
      size: formatCompactNumber(level.size),
      total: formatCompactNumber(level.total),
    }));
}

export function adaptTransactionsToTrades(
  transactions: TwinMarketTransaction[],
  profilesById: Map<string, TwinMarketAgentProfile>,
): DashboardTrade[] {
  return transactions.map((transaction) => ({
    time: new Date(transaction.timestamp).toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    side: transaction.direction === "buy" ? "BUY" : "SELL",
    ticker: transaction.stockCode,
    price: transaction.executedPrice.toFixed(2),
    volume: transaction.executedQuantity.toLocaleString("en-US"),
    agent: profilesById.get(transaction.userId)?.displayName ?? transaction.userId,
  }));
}

export function adaptEventsToDashboardItems(events: TwinMarketMarketEvent[]): DashboardEventItem[] {
  return events.map((event) => ({
    time: new Date(event.occurredAt).toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    title: event.title,
    detail: event.detail,
    tone: event.tone,
  }));
}

export function adaptForumPosts(
  posts: TwinMarketForumPost[],
  profilesById: Map<string, TwinMarketAgentProfile>,
): DashboardPost[] {
  return posts.map((post) => {
    const profile = profilesById.get(post.userId);
    return {
      author: profile?.displayName ?? post.userId,
      role: profile?.userType ?? profile?.archetype ?? "Agent",
      time: new Date(post.createdAt).toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),
      stance: toChineseStance(post),
      content: post.content,
      tickers: post.tickers,
      reactions: [
        { label: "引用", value: post.metrics.references },
        { label: "赞同", value: post.metrics.likes },
        { label: "跟单", value: post.metrics.followTrades },
      ],
    };
  });
}

export function createDashboardData(input: {
  overviewMetrics: TwinMarketOverviewMetric[];
  sectorPulse: TwinMarketSectorPulse[];
  profiles: TwinMarketAgentProfile[];
  connections: TwinMarketAgentConnection[];
  orderBookLevels: TwinMarketOrderLevel[];
  transactions: TwinMarketTransaction[];
  events: TwinMarketMarketEvent[];
  forumPosts: TwinMarketForumPost[];
  controls: TwinMarketReplayControls;
}): TwinMarketDashboardData {
  const profilesById = new Map(input.profiles.map((profile) => [profile.userId, profile]));

  return {
    marketStats: input.overviewMetrics,
    sectorTape: input.sectorPulse,
    agentNodes: adaptProfilesToAgentNodes(input.profiles),
    agentEdges: adaptConnectionsToAgentEdges(input.connections),
    bidLevels: adaptOrderLevels(input.orderBookLevels, "bid"),
    askLevels: adaptOrderLevels(input.orderBookLevels, "ask"),
    trades: adaptTransactionsToTrades(input.transactions, profilesById),
    events: adaptEventsToDashboardItems(input.events),
    agentCards: adaptProfilesToAgentCards(input.profiles),
    posts: adaptForumPosts(input.forumPosts, profilesById),
    controls: input.controls as DashboardControls,
  };
}
