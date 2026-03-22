export type TwinMarketTone = "up" | "down" | "neutral";

export type TwinMarketSentiment = "bullish" | "bearish" | "neutral";

export type TwinMarketRiskLevel = "low" | "medium" | "high";

export type TwinMarketForumStance = "bullish" | "bearish" | "neutral";

export type TwinMarketReactionType = "repost" | "like" | "unlike";

export type TwinMarketQuoteSource = "eastmoney" | "sina";

export type TwinMarketHolding = {
  ticker: string;
  weight: string;
  bias: string;
};

export type TwinMarketAgentBehavior = {
  dispositionEffect?: string;
  lotteryPreference?: string;
  totalReturnCategory?: string;
  annualTurnoverCategory?: string;
  underdiversificationCategory?: string;
  tradeCountCategory?: string;
};

export type TwinMarketAgentProfile = {
  userId: string;
  displayName: string;
  createdAt: string;
  userType?: string;
  location?: string;
  selfDescription?: string;
  strategy: string;
  archetype: string;
  riskLevel: TwinMarketRiskLevel;
  riskScore: number;
  sentiment: TwinMarketSentiment;
  socialImpact: number;
  influenceScore: number;
  pnl: string;
  cash: string;
  followedIndustries: string[];
  behavior?: TwinMarketAgentBehavior;
  portfolio: {
    initialCash?: number;
    currentCash?: number;
    totalValue?: number;
    totalReturn?: number;
    returnRate?: number;
    positions: TwinMarketHolding[];
  };
  network: {
    x: number;
    y: number;
  };
};

export type TwinMarketAgentConnection = {
  sourceUserId: string;
  targetUserId: string;
  weight?: number;
  relationship?: "social" | "belief" | "trade";
};

export type TwinMarketForumPostMetrics = {
  references: number;
  likes: number;
  followTrades: number;
  reposts?: number;
  unlikes?: number;
};

export type TwinMarketForumPost = {
  id: number;
  userId: string;
  content: string;
  score: number;
  belief?: string;
  stance: TwinMarketForumStance;
  tickers: string[];
  createdAt: string;
  type: "post" | "repost" | "comment";
  metrics: TwinMarketForumPostMetrics;
};

export type TwinMarketReaction = {
  id: number;
  userId: string;
  postId: number;
  type: TwinMarketReactionType;
  createdAt: string;
};

export type TwinMarketOrderLevel = {
  side: "bid" | "ask";
  price: number;
  size: number;
  total: number;
};

export type TwinMarketTransaction = {
  stockCode: string;
  userId: string;
  direction: "buy" | "sell";
  executedPrice: number;
  executedQuantity: number;
  originalQuantity?: number;
  unfilledQuantity?: number;
  timestamp: string;
};

export type TwinMarketMarketEvent = {
  id: string;
  occurredAt: string;
  title: string;
  detail: string;
  tone: TwinMarketTone;
  source: "news" | "forum" | "order-flow" | "simulation";
};

export type TwinMarketOverviewMetric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: TwinMarketTone;
};

export type TwinMarketSectorPulse = {
  id: string;
  name: string;
  value: string;
  tone: TwinMarketTone;
};

export type TwinMarketReplayControls = {
  scenario: string;
  date: string;
  seed: number;
  speed: string;
  phase: string;
};

export type TwinMarketMarketQuote = {
  symbol: string;
  name: string;
  latestPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
  source: TwinMarketQuoteSource;
};

export type TwinMarketMarketQuoteApiResponse = {
  quote: TwinMarketMarketQuote;
  fetchedAt: string;
};

export type TwinMarketMarketQuoteApiError = {
  error: string;
  fetchedAt: string;
};

export type DashboardMarketStat = TwinMarketOverviewMetric;

export type DashboardSectorTapeItem = TwinMarketSectorPulse;

export type DashboardAgentNode = {
  id: string;
  name: string;
  strategy: string;
  risk: "低" | "中" | "高";
  pnl: string;
  influence: number;
  sentiment: TwinMarketSentiment;
  x: number;
  y: number;
};

export type DashboardOrderLevel = {
  price: string;
  size: string;
  total: string;
};

export type DashboardEventItem = {
  time: string;
  title: string;
  detail: string;
  tone: TwinMarketTone;
};

export type DashboardAgentCard = {
  id: string;
  name: string;
  archetype: string;
  strategy: string;
  riskScore: number;
  socialImpact: number;
  pnl: string;
  cash: string;
  positions: TwinMarketHolding[];
};

export type DashboardPostReaction = {
  label: string;
  value: number;
};

export type DashboardPost = {
  author: string;
  role: string;
  time: string;
  stance: "看多" | "看空" | "中性";
  content: string;
  tickers: string[];
  reactions: DashboardPostReaction[];
};

export type DashboardTrade = {
  time: string;
  side: "BUY" | "SELL";
  ticker: string;
  price: string;
  volume: string;
  agent: string;
};

export type DashboardControls = TwinMarketReplayControls;

export type TwinMarketDashboardData = {
  marketStats: DashboardMarketStat[];
  sectorTape: DashboardSectorTapeItem[];
  agentNodes: DashboardAgentNode[];
  agentEdges: readonly (readonly [string, string])[];
  bidLevels: DashboardOrderLevel[];
  askLevels: DashboardOrderLevel[];
  trades: DashboardTrade[];
  events: DashboardEventItem[];
  agentCards: DashboardAgentCard[];
  posts: DashboardPost[];
  controls: DashboardControls;
};
