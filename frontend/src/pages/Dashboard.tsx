import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button, Card, Input, Select, SignalBadge } from "../components/ui";
import type { Market, Strategy, TodaySignal, WatchlistItem } from "../types";
import { MARKET_LABELS } from "../types";

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [signals, setSignals] = useState<TodaySignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [market, setMarket] = useState<Market>("kr_stock");
  const [symbol, setSymbol] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [strategyId, setStrategyId] = useState<string>("");

  const loadWatchlist = () => api.watchlist.list().then(setWatchlist);
  const loadStrategies = () => api.strategies.list().then(setStrategies);

  useEffect(() => {
    loadWatchlist();
    loadStrategies();
  }, []);

  const refreshSignals = async () => {
    setLoadingSignals(true);
    setError(null);
    try {
      const result = await api.signals.today();
      setSignals(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingSignals(false);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    try {
      await api.watchlist.add(market, symbol.trim(), displayName.trim(), strategyId ? Number(strategyId) : null);
      setSymbol("");
      setDisplayName("");
      await loadWatchlist();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const removeItem = async (id: number) => {
    await api.watchlist.remove(id);
    await loadWatchlist();
  };

  const signalFor = (itemId: number) => signals.find((s) => s.watchlist_item_id === itemId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">오늘의 신호</h1>
        <Button onClick={refreshSignals} disabled={loadingSignals}>
          {loadingSignals ? "불러오는 중..." : "오늘 신호 새로고침"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5 text-red-300 text-sm">{error}</Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {watchlist.length === 0 && (
          <Card className="text-gray-400 text-sm sm:col-span-2 lg:col-span-3">
            관심 종목이 아직 없습니다. 아래에서 추가해보세요.
          </Card>
        )}
        {watchlist.map((item) => {
          const sig = signalFor(item.id);
          return (
            <Card key={item.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{item.display_name || item.symbol}</div>
                  <div className="text-xs text-gray-500">
                    {MARKET_LABELS[item.market]} · {item.symbol}
                  </div>
                </div>
                {sig ? <SignalBadge signal={sig.signal} /> : null}
              </div>
              {sig?.error ? (
                <div className="text-xs text-red-400">{sig.error}</div>
              ) : sig ? (
                <div className="text-sm text-gray-300">
                  종가 {sig.last_close?.toLocaleString()} · {sig.last_date}
                </div>
              ) : (
                <div className="text-xs text-gray-500">신호 새로고침을 눌러 확인하세요</div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">
                  전략: {strategies.find((s) => s.id === item.strategy_id)?.name || "미지정"}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  삭제
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="font-medium mb-3">관심 종목 추가</h2>
        <form onSubmit={addItem} className="flex flex-wrap gap-2 items-center">
          <Select value={market} onChange={(e) => setMarket(e.target.value as Market)}>
            {Object.entries(MARKET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            placeholder="종목코드 (예: 005930, AAPL, BTC/USDT)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-56"
          />
          <Input
            placeholder="표시 이름 (선택)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-40"
          />
          <Select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
            <option value="">전략 미지정</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button type="submit">추가</Button>
        </form>
      </Card>
    </div>
  );
}
