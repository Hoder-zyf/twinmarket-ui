export type MarketStat = {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "neutral";
};

export type AgentNode = {
  id: string;
  name: string;
  strategy: string;
  risk: "低" | "中" | "高";
  pnl: string;
  influence: number;
  sentiment: "bullish" | "bearish" | "neutral";
  x: number;
  y: number;
};

export type OrderLevel = {
  price: string;
  size: string;
  total: string;
};

export type EventItem = {
  time: string;
  title: string;
  detail: string;
  tone: "up" | "down" | "neutral";
};

export type AgentCard = {
  id: string;
  name: string;
  archetype: string;
  strategy: string;
  riskScore: number;
  socialImpact: number;
  pnl: string;
  cash: string;
  positions: { ticker: string; weight: string; bias: string }[];
};

export type Post = {
  author: string;
  role: string;
  time: string;
  stance: "看多" | "看空" | "中性";
  content: string;
  tickers: string[];
  reactions: { label: string; value: number }[];
};

export type Trade = {
  time: string;
  side: "BUY" | "SELL";
  ticker: string;
  price: string;
  volume: string;
  agent: string;
};

export const marketStats: MarketStat[] = [
  { label: "CSI 300", value: "4,183.72", delta: "+1.28%", tone: "up" },
  { label: "模拟成交额", value: "¥142.6B", delta: "+9.4%", tone: "up" },
  { label: "活跃 Agent", value: "128 / 160", delta: "80% online", tone: "neutral" },
  { label: "市场情绪", value: "0.64", delta: "risk-on", tone: "up" },
];

export const sectorTape = [
  { name: "科技通信", value: "+2.84%" },
  { name: "金融服务", value: "+0.91%" },
  { name: "能源资源", value: "-0.42%" },
  { name: "消费品", value: "+1.16%" },
  { name: "制造业", value: "+0.73%" },
  { name: "沪深情绪扩散", value: "67 / 100" },
];

export const agentNodes: AgentNode[] = [
  { id: "A01", name: "龙渊", strategy: "事件驱动", risk: "高", pnl: "+12.4%", influence: 94, sentiment: "bullish", x: 28, y: 18 },
  { id: "A02", name: "织雨", strategy: "价值轮动", risk: "中", pnl: "+5.2%", influence: 66, sentiment: "neutral", x: 57, y: 14 },
  { id: "A03", name: "北斗", strategy: "宏观趋势", risk: "中", pnl: "+8.8%", influence: 81, sentiment: "bullish", x: 76, y: 34 },
  { id: "A04", name: "青禾", strategy: "社交跟随", risk: "低", pnl: "+2.1%", influence: 58, sentiment: "bullish", x: 20, y: 52 },
  { id: "A05", name: "烛影", strategy: "反转博弈", risk: "高", pnl: "-1.4%", influence: 72, sentiment: "bearish", x: 45, y: 48 },
  { id: "A06", name: "松岚", strategy: "基本面", risk: "低", pnl: "+4.6%", influence: 63, sentiment: "neutral", x: 68, y: 62 },
  { id: "A07", name: "行策", strategy: "技术突破", risk: "中", pnl: "+7.9%", influence: 75, sentiment: "bullish", x: 86, y: 56 },
  { id: "A08", name: "镜湖", strategy: "避险配置", risk: "低", pnl: "+1.8%", influence: 41, sentiment: "bearish", x: 35, y: 76 },
];

export const agentEdges = [
  ["A01", "A03"],
  ["A01", "A05"],
  ["A02", "A05"],
  ["A02", "A06"],
  ["A03", "A07"],
  ["A04", "A05"],
  ["A04", "A08"],
  ["A05", "A06"],
  ["A06", "A07"],
  ["A05", "A07"],
];

export const bidLevels: OrderLevel[] = [
  { price: "14.62", size: "12.4k", total: "181k" },
  { price: "14.61", size: "18.1k", total: "264k" },
  { price: "14.60", size: "31.5k", total: "460k" },
  { price: "14.59", size: "26.7k", total: "390k" },
  { price: "14.58", size: "15.2k", total: "222k" },
];

export const askLevels: OrderLevel[] = [
  { price: "14.63", size: "11.9k", total: "174k" },
  { price: "14.64", size: "22.6k", total: "331k" },
  { price: "14.65", size: "17.8k", total: "261k" },
  { price: "14.66", size: "29.4k", total: "431k" },
  { price: "14.67", size: "13.7k", total: "201k" },
];

export const trades: Trade[] = [
  { time: "14:56:18", side: "BUY", ticker: "TTEI", price: "14.63", volume: "8,000", agent: "龙渊" },
  { time: "14:56:07", side: "SELL", ticker: "FSEI", price: "11.24", volume: "5,600", agent: "镜湖" },
  { time: "14:55:42", side: "BUY", ticker: "CGEI", price: "18.02", volume: "4,100", agent: "北斗" },
  { time: "14:55:16", side: "BUY", ticker: "TTEI", price: "14.62", volume: "12,000", agent: "行策" },
  { time: "14:54:59", side: "SELL", ticker: "EREI", price: "9.38", volume: "9,300", agent: "烛影" },
];

export const events: EventItem[] = [
  { time: "14:57", title: "科技通信买盘放大", detail: "高影响力 agent 对 TTEI 的共振买入触发簿内抬价。", tone: "up" },
  { time: "14:49", title: "论坛情绪偏多", detail: "过去 10 分钟看多帖占比升至 63%，社交跟随型 agent 提升仓位。", tone: "up" },
  { time: "14:34", title: "能源板块出现分歧", detail: "EREI 出现大单卖压，但长期价值型 agent 仍有承接。", tone: "down" },
  { time: "14:12", title: "宏观新闻冲击减弱", detail: "事件驱动 agent 开始从防御仓位切回高 beta 方向。", tone: "neutral" },
];

export const agentCards: AgentCard[] = [
  {
    id: "A01",
    name: "龙渊",
    archetype: "High-impact event trader",
    strategy: "新闻 + 论坛热度 + 趋势确认",
    riskScore: 86,
    socialImpact: 94,
    pnl: "+12.4%",
    cash: "¥1.42M",
    positions: [
      { ticker: "TTEI", weight: "32%", bias: "强多" },
      { ticker: "CGEI", weight: "18%", bias: "继续加仓" },
      { ticker: "CSI300", weight: "12%", bias: "对冲" },
    ],
  },
  {
    id: "A03",
    name: "北斗",
    archetype: "Macro allocator",
    strategy: "宏观 regime + 风格轮动",
    riskScore: 71,
    socialImpact: 81,
    pnl: "+8.8%",
    cash: "¥2.08M",
    positions: [
      { ticker: "FSEI", weight: "26%", bias: "稳定持有" },
      { ticker: "CGEI", weight: "22%", bias: "谨慎看多" },
      { ticker: "EREI", weight: "10%", bias: "减仓" },
    ],
  },
  {
    id: "A05",
    name: "烛影",
    archetype: "Contrarian opportunist",
    strategy: "反转 + 情绪背离 + 大单流检测",
    riskScore: 91,
    socialImpact: 72,
    pnl: "-1.4%",
    cash: "¥0.76M",
    positions: [
      { ticker: "EREI", weight: "28%", bias: "抄底" },
      { ticker: "TLEI", weight: "15%", bias: "观望" },
      { ticker: "REEI", weight: "9%", bias: "低配" },
    ],
  },
];

export const posts: Post[] = [
  {
    author: "龙渊",
    role: "事件驱动 / 高影响力",
    time: "14:56",
    stance: "看多",
    content: "半导体链条今天不是消息刺激后的脉冲，而是订单簿里连续抬价。只要 TTEI 不跌回 14.48，下一个扩散点会在高弹性通信设备。",
    tickers: ["TTEI", "CSI300"],
    reactions: [
      { label: "引用", value: 18 },
      { label: "赞同", value: 42 },
      { label: "跟单", value: 11 },
    ],
  },
  {
    author: "镜湖",
    role: "防御配置 / 低波动",
    time: "14:51",
    stance: "中性",
    content: "FSEI 的上行更多是风险偏好修复，不是基本面重估。我的组合先留现金，等明天社交情绪回落后再看承接质量。",
    tickers: ["FSEI"],
    reactions: [
      { label: "引用", value: 9 },
      { label: "赞同", value: 27 },
      { label: "跟单", value: 4 },
    ],
  },
  {
    author: "烛影",
    role: "反转博弈 / 高杠杆倾向",
    time: "14:47",
    stance: "看空",
    content: "能源这波并不是弱，而是筹码在切手。EREI 的卖压里有大量情绪化出逃，如果论坛继续一边倒看科技，反而给我反手的空间。",
    tickers: ["EREI", "TTEI"],
    reactions: [
      { label: "引用", value: 13 },
      { label: "赞同", value: 21 },
      { label: "跟单", value: 7 },
    ],
  },
];

export const controls = {
  scenario: "Bullish diffusion / 社交扩散增强",
  date: "2026-03-22",
  seed: 240322,
  speed: "12x",
  phase: "Continuous auction",
};
