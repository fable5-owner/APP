import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { Button, Card, Input, Select } from "../components/ui";
import type { BacktestRun, Market, Strategy } from "../types";
import { MARKET_LABELS } from "../types";

const METRIC_LABELS: Record<keyof BacktestRun["metrics"], string> = {
  total_return_pct: "총 수익률",
  cagr_pct: "연복리수익률(CAGR)",
  max_drawdown_pct: "최대낙폭(MDD)",
  sharpe_ratio: "샤프비율",
  win_rate_pct: "승률",
  num_trades: "매매 횟수",
  final_equity: "최종 평가금액",
};

export default function Backtest() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [history, setHistory] = useState<BacktestRun[]>([]);
  const [result, setResult] = useState<BacktestRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const [strategyId, setStrategyId] = useState("");
  const [market, setMarket] = useState<Market>("kr_stock");
  const [symbol, setSymbol] = useState("005930");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("");
  const [capital, setCapital] = useState(10_000_000);

  useEffect(() => {
    api.strategies.list().then((list) => {
      setStrategies(list);
      if (list.length > 0) setStrategyId(String(list[0].id));
    });
    api.backtest.list().then(setHistory);
  }, []);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyId) {
      setError("전략을 먼저 선택하세요.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const run = await api.backtest.run({
        strategy_id: Number(strategyId),
        market,
        symbol: symbol.trim(),
        start_date: startDate,
        end_date: endDate || undefined,
        initial_capital: capital,
      });
      setResult(run);
      setHistory((h) => [run, ...h]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">백테스트</h1>

      <Card>
        <form onSubmit={run} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">전략</label>
            <Select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
              {strategies.length === 0 && <option value="">전략 없음</option>}
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">시장</label>
            <Select value={market} onChange={(e) => setMarket(e.target.value as Market)}>
              {Object.entries(MARKET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">종목코드</label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-36" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">시작일</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">종료일 (선택, 기본 오늘)</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">초기자본</label>
            <Input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <Button type="submit" disabled={running || !strategyId}>
            {running ? "실행 중..." : "백테스트 실행"}
          </Button>
        </form>
        {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
      </Card>

      {result && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              {result.symbol} 결과 ({result.start_date} ~ {result.end_date})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(METRIC_LABELS) as (keyof BacktestRun["metrics"])[]).map((key) => (
              <div key={key} className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-xs text-gray-500">{METRIC_LABELS[key]}</div>
                <div className="text-lg font-semibold">
                  {result.metrics[key].toLocaleString()}
                  {key.endsWith("_pct") ? "%" : ""}
                </div>
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.equity_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} minTickGap={40} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => (v / 10000).toLocaleString() + "만"}
                />
                <Tooltip
                  contentStyle={{ background: "#16171d", border: "1px solid #2e303a", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="equity" stroke="#818cf8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs">
                <tr className="text-left">
                  <th className="py-1 pr-4">진입일</th>
                  <th className="py-1 pr-4">청산일</th>
                  <th className="py-1 pr-4">진입가</th>
                  <th className="py-1 pr-4">청산가</th>
                  <th className="py-1 pr-4">수익률</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((t, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-1 pr-4">{t.entry_date.slice(0, 10)}</td>
                    <td className="py-1 pr-4">
                      {t.exit_date.slice(0, 10)} {t.open_at_end ? "(미청산)" : ""}
                    </td>
                    <td className="py-1 pr-4">{t.entry_price.toLocaleString()}</td>
                    <td className="py-1 pr-4">{t.exit_price.toLocaleString()}</td>
                    <td className={`py-1 pr-4 ${t.return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.return_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {result.trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-2 text-gray-500">
                      해당 기간에 매매가 발생하지 않았습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-medium mb-2">백테스트 기록</h2>
        <div className="space-y-1">
          {history.length === 0 && <div className="text-sm text-gray-500">기록이 없습니다.</div>}
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => setResult(h)}
              className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-white/5 flex justify-between"
            >
              <span>
                {MARKET_LABELS[h.market]} · {h.symbol} ({h.start_date} ~ {h.end_date})
              </span>
              <span className={h.metrics.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                {h.metrics.total_return_pct}%
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
