export type MarketQuoteSource = "eastmoney" | "sina";

export type MarketQuote = {
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
  source: MarketQuoteSource;
};

export type MarketQuoteApiResponse = {
  quote: MarketQuote;
  fetchedAt: string;
};

export type MarketQuoteApiError = {
  error: string;
  fetchedAt: string;
};
