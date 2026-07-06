export type Market = "kr_stock" | "us_stock" | "crypto";

export const MARKET_LABELS: Record<Market, string> = {
  kr_stock: "한국주식",
  us_stock: "미국주식",
  crypto: "암호화폐",
};

export type IndicatorName =
  | "CLOSE"
  | "SMA"
  | "EMA"
  | "RSI"
  | "MACD"
  | "MACD_SIGNAL"
  | "BB_UPPER"
  | "BB_MID"
  | "BB_LOWER";

export interface Operand {
  indicator?: IndicatorName;
  params?: Record<string, number>;
  value?: number;
}

export type Operator = ">" | "<" | ">=" | "<=" | "==" | "cross_above" | "cross_below";

export interface Rule {
  left: Operand;
  operator: Operator;
  right: Operand;
}

export interface StrategyRules {
  buy_rules: Rule[];
  sell_rules: Rule[];
}

export interface Strategy {
  id: number;
  name: string;
  rules: StrategyRules;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  market: Market;
  symbol: string;
  display_name: string | null;
  strategy_id: number | null;
  created_at: string;
}

export interface OhlcvBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestMetrics {
  total_return_pct: number;
  cagr_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  win_rate_pct: number;
  num_trades: number;
  final_equity: number;
}

export interface Trade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  return_pct: number;
  open_at_end?: boolean;
}

export interface EquityPoint {
  date: string;
  equity: number;
}

export interface BacktestRun {
  id: number;
  strategy_id: number;
  market: Market;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  metrics: BacktestMetrics;
  equity_curve: EquityPoint[];
  trades: Trade[];
  created_at: string;
}

export type SignalType = "buy" | "sell" | "hold";

export interface TodaySignal {
  watchlist_item_id: number;
  market: Market;
  symbol: string;
  display_name: string | null;
  strategy_id: number | null;
  strategy_name: string | null;
  signal: SignalType;
  last_close: number | null;
  last_date: string | null;
  error: string | null;
}
