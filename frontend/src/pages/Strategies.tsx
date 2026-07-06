import { useEffect, useState } from "react";
import { api } from "../api/client";
import RuleListEditor from "../components/RuleListEditor";
import { Button, Card, Input } from "../components/ui";
import type { Rule, Strategy } from "../types";

function summarizeRule(r: Rule): string {
  const side = (o: Rule["left"]) =>
    o.value !== undefined ? o.value : `${o.indicator}${o.params?.period ? `(${o.params.period})` : ""}`;
  return `${side(r.left)} ${r.operator} ${side(r.right)}`;
}

export default function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [name, setName] = useState("");
  const [buyRules, setBuyRules] = useState<Rule[]>([
    { left: { indicator: "SMA", params: { period: 5 } }, operator: "cross_above", right: { indicator: "SMA", params: { period: 20 } } },
  ]);
  const [sellRules, setSellRules] = useState<Rule[]>([
    { left: { indicator: "SMA", params: { period: 5 } }, operator: "cross_below", right: { indicator: "SMA", params: { period: 20 } } },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.strategies.list().then(setStrategies);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.strategies.create(name.trim(), { buy_rules: buyRules, sell_rules: sellRules });
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await api.strategies.remove(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">전략</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {strategies.length === 0 && (
          <Card className="text-gray-400 text-sm sm:col-span-2">아직 만든 전략이 없습니다.</Card>
        )}
        {strategies.map((s) => (
          <Card key={s.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <span className="font-medium">{s.name}</span>
              <button onClick={() => remove(s.id)} className="text-xs text-gray-500 hover:text-red-400">
                삭제
              </button>
            </div>
            <div className="text-xs text-emerald-300">
              매수: {s.rules.buy_rules.map(summarizeRule).join(" AND ")}
            </div>
            <div className="text-xs text-red-300">
              매도: {s.rules.sell_rules.map(summarizeRule).join(" AND ")}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-medium mb-3">새 전략 만들기</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input
            placeholder="전략 이름 (예: SMA 5/20 골든크로스)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full sm:w-80"
          />
          <RuleListEditor title="매수 조건" rules={buyRules} onChange={setBuyRules} />
          <RuleListEditor title="매도 조건" rules={sellRules} onChange={setSellRules} />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "전략 저장"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
