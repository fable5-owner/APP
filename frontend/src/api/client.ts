import type {
  BacktestRun,
  Market,
  OhlcvBar,
  Strategy,
  StrategyRules,
  TodaySignal,
  WatchlistItem,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  strategies: {
    list: () => request<Strategy[]>("/strategies"),
    create: (name: string, rules: StrategyRules) =>
      request<Strategy>("/strategies", {
        method: "POST",
        body: JSON.stringify({ name, rules }),
      }),
    remove: (id: number) => request<void>(`/strategies/${id}`, { method: "DELETE" }),
  },
  watchlist: {
    list: () => request<WatchlistItem[]>("/watchlist"),
    add: (market: Market, symbol: string, display_name: string, strategy_id: number | null) =>
      request<WatchlistItem>("/watchlist", {
        method: "POST",
        body: JSON.stringify({ market, symbol, display_name, strategy_id }),
      }),
    remove: (id: number) => request<void>(`/watchlist/${id}`, { method: "DELETE" }),
  },
  data: {
    ohlcv: (market: Market, symbol: string, start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const qs = params.toString();
      return request<OhlcvBar[]>(`/data/${market}/${symbol}${qs ? `?${qs}` : ""}`);
    },
  },
  backtest: {
    run: (payload: {
      strategy_id: number;
      market: Market;
      symbol: string;
      start_date: string;
      end_date?: string;
      initial_capital?: number;
    }) =>
      request<BacktestRun>("/backtest", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    list: () => request<BacktestRun[]>("/backtest"),
    get: (id: number) => request<BacktestRun>(`/backtest/${id}`),
  },
  signals: {
    today: () => request<TodaySignal[]>("/signals/today"),
  },
};
