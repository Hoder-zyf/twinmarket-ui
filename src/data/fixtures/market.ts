import type {
  TwinMarketMarketEvent,
  TwinMarketOrderLevel,
  TwinMarketOverviewMetric,
  TwinMarketSectorPulse,
  TwinMarketTransaction,
} from "@/types/twinmarket";

export const mockOverviewMetrics: TwinMarketOverviewMetric[] = [
  { id: "csi-300", label: "CSI 300", value: "4,183.72", delta: "+1.28%", tone: "up" },
  { id: "sim-turnover", label: "模拟成交额", value: "¥142.6B", delta: "+9.4%", tone: "up" },
  { id: "active-agents", label: "活跃 Agent", value: "128 / 160", delta: "80% online", tone: "neutral" },
  { id: "market-sentiment", label: "市场情绪", value: "0.64", delta: "risk-on", tone: "up" },
];

export const mockSectorPulse: TwinMarketSectorPulse[] = [
  { id: "tech", name: "科技通信", value: "+2.84%", tone: "up" },
  { id: "finance", name: "金融服务", value: "+0.91%", tone: "up" },
  { id: "energy", name: "能源资源", value: "-0.42%", tone: "down" },
  { id: "consumer", name: "消费品", value: "+1.16%", tone: "up" },
  { id: "manufacturing", name: "制造业", value: "+0.73%", tone: "up" },
  { id: "breadth", name: "沪深情绪扩散", value: "67 / 100", tone: "up" },
];

export const mockOrderBookLevels: TwinMarketOrderLevel[] = [
  { side: "bid", price: 14.62, size: 12_400, total: 181_000 },
  { side: "bid", price: 14.61, size: 18_100, total: 264_000 },
  { side: "bid", price: 14.6, size: 31_500, total: 460_000 },
  { side: "bid", price: 14.59, size: 26_700, total: 390_000 },
  { side: "bid", price: 14.58, size: 15_200, total: 222_000 },
  { side: "ask", price: 14.63, size: 11_900, total: 174_000 },
  { side: "ask", price: 14.64, size: 22_600, total: 331_000 },
  { side: "ask", price: 14.65, size: 17_800, total: 261_000 },
  { side: "ask", price: 14.66, size: 29_400, total: 431_000 },
  { side: "ask", price: 14.67, size: 13_700, total: 201_000 },
];

export const mockTransactions: TwinMarketTransaction[] = [
  {
    stockCode: "TTEI",
    userId: "A01",
    direction: "buy",
    executedPrice: 14.63,
    executedQuantity: 8_000,
    originalQuantity: 8_000,
    unfilledQuantity: 0,
    timestamp: "2026-03-22T14:56:18+08:00",
  },
  {
    stockCode: "FSEI",
    userId: "A08",
    direction: "sell",
    executedPrice: 11.24,
    executedQuantity: 5_600,
    originalQuantity: 6_000,
    unfilledQuantity: 400,
    timestamp: "2026-03-22T14:56:07+08:00",
  },
  {
    stockCode: "CGEI",
    userId: "A03",
    direction: "buy",
    executedPrice: 18.02,
    executedQuantity: 4_100,
    originalQuantity: 4_100,
    unfilledQuantity: 0,
    timestamp: "2026-03-22T14:55:42+08:00",
  },
  {
    stockCode: "TTEI",
    userId: "A07",
    direction: "buy",
    executedPrice: 14.62,
    executedQuantity: 12_000,
    originalQuantity: 12_000,
    unfilledQuantity: 0,
    timestamp: "2026-03-22T14:55:16+08:00",
  },
  {
    stockCode: "EREI",
    userId: "A05",
    direction: "sell",
    executedPrice: 9.38,
    executedQuantity: 9_300,
    originalQuantity: 10_000,
    unfilledQuantity: 700,
    timestamp: "2026-03-22T14:54:59+08:00",
  },
];

export const mockMarketEvents: TwinMarketMarketEvent[] = [
  {
    id: "event-tech-bids",
    occurredAt: "2026-03-22T14:57:00+08:00",
    title: "科技通信买盘放大",
    detail: "高影响力 agent 对 TTEI 的共振买入触发簿内抬价。",
    tone: "up",
    source: "order-flow",
  },
  {
    id: "event-forum-bullish",
    occurredAt: "2026-03-22T14:49:00+08:00",
    title: "论坛情绪偏多",
    detail: "过去 10 分钟看多帖占比升至 63%，社交跟随型 agent 提升仓位。",
    tone: "up",
    source: "forum",
  },
  {
    id: "event-energy-divergence",
    occurredAt: "2026-03-22T14:34:00+08:00",
    title: "能源板块出现分歧",
    detail: "EREI 出现大单卖压，但长期价值型 agent 仍有承接。",
    tone: "down",
    source: "simulation",
  },
  {
    id: "event-macro-cools",
    occurredAt: "2026-03-22T14:12:00+08:00",
    title: "宏观新闻冲击减弱",
    detail: "事件驱动 agent 开始从防御仓位切回高 beta 方向。",
    tone: "neutral",
    source: "news",
  },
];
