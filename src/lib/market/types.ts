export type MarketQuoteSource = "tencent" | "eastmoney" | "sina";

export type MarketConstituent = {
  code: string;
  name: string;
  exchange: "SSE";
  secid: string;
  sinaSymbol: string;
};

export type MarketConstituentQuote = MarketConstituent & {
  latestPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  turnover: number;
  timestamp: string;
  source: MarketQuoteSource;
};

export type Sse50Breadth = {
  advancing: number;
  declining: number;
  unchanged: number;
  advanceDeclineSpread: number;
  advanceRatio: number;
};

export type Sse50TurnoverSummary = {
  total: number;
  average: number;
  median: number;
  totalVolume: number;
};

export type Sse50Movers = {
  gainers: MarketConstituentQuote[];
  losers: MarketConstituentQuote[];
  turnoverLeaders: MarketConstituentQuote[];
};

export type Sse50MarketOverview = {
  universe: {
    id: "sse50";
    name: "SSE 50 / 上证50";
    constituentCount: number;
    snapshotVersion: string;
    snapshotDate: string;
  };
  source: MarketQuoteSource;
  timestamp: string;
  breadth: Sse50Breadth;
  turnover: Sse50TurnoverSummary;
  averageChangePercent: number;
  medianChangePercent: number;
  movers: Sse50Movers;
  listSnapshot: MarketConstituentQuote[];
  quotes: MarketConstituentQuote[];
};

export type Sse50OverviewApiResponse = {
  overview: Sse50MarketOverview;
  fetchedAt: string;
};

export type MarketApiError = {
  error: string;
  fetchedAt: string;
};
