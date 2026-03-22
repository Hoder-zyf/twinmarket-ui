import type { TwinMarketForumPost } from "@/types/twinmarket";

export const mockForumPosts: TwinMarketForumPost[] = [
  {
    id: 1,
    userId: "A01",
    content:
      "半导体链条今天不是消息刺激后的脉冲，而是订单簿里连续抬价。只要 TTEI 不跌回 14.48，下一个扩散点会在高弹性通信设备。",
    score: 42,
    belief: "科技通信主线延续，论坛扩散会继续推高风险偏好。",
    stance: "bullish",
    tickers: ["TTEI", "CSI300"],
    createdAt: "2026-03-22T14:56:00+08:00",
    type: "post",
    metrics: {
      references: 18,
      likes: 42,
      followTrades: 11,
      reposts: 18,
    },
  },
  {
    id: 2,
    userId: "A08",
    content:
      "FSEI 的上行更多是风险偏好修复，不是基本面重估。我的组合先留现金，等明天社交情绪回落后再看承接质量。",
    score: 27,
    belief: "防御板块需要等情绪回落后的真实承接。",
    stance: "neutral",
    tickers: ["FSEI"],
    createdAt: "2026-03-22T14:51:00+08:00",
    type: "post",
    metrics: {
      references: 9,
      likes: 27,
      followTrades: 4,
    },
  },
  {
    id: 3,
    userId: "A05",
    content:
      "能源这波并不是弱，而是筹码在切手。EREI 的卖压里有大量情绪化出逃，如果论坛继续一边倒看科技，反而给我反手的空间。",
    score: 21,
    belief: "能源分歧加大，但情绪化抛售会创造反转窗口。",
    stance: "bearish",
    tickers: ["EREI", "TTEI"],
    createdAt: "2026-03-22T14:47:00+08:00",
    type: "post",
    metrics: {
      references: 13,
      likes: 21,
      followTrades: 7,
    },
  },
];
