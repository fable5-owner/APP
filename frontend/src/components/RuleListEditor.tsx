import type { Operator, Rule } from "../types";
import OperandEditor from "./OperandEditor";
import { Button, Select } from "./ui";

const OPERATORS: { value: Operator; label: string }[] = [
  { value: "cross_above", label: "위로 교차 (골든크로스)" },
  { value: "cross_below", label: "아래로 교차 (데드크로스)" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
];

const DEFAULT_RULE: Rule = {
  left: { indicator: "RSI", params: { period: 14 } },
  operator: "<",
  right: { value: 30 },
};

export default function RuleListEditor({
  title,
  rules,
  onChange,
}: {
  title: string;
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}) {
  const updateRule = (index: number, rule: Rule) => {
    const next = [...rules];
    next[index] = rule;
    onChange(next);
  };

  const removeRule = (index: number) => onChange(rules.filter((_, i) => i !== index));
  const addRule = () => onChange([...rules, { ...DEFAULT_RULE }]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <Button type="button" variant="ghost" onClick={addRule}>
          + 조건 추가
        </Button>
      </div>
      {rules.length === 0 && (
        <div className="text-xs text-gray-500">조건이 없습니다. 조건을 추가하세요 (모든 조건은 AND로 결합됩니다).</div>
      )}
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 bg-white/[0.02] border border-white/5 rounded-md p-2">
            <OperandEditor operand={rule.left} onChange={(left) => updateRule(i, { ...rule, left })} />
            <Select
              value={rule.operator}
              onChange={(e) => updateRule(i, { ...rule, operator: e.target.value as Operator })}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
            <OperandEditor operand={rule.right} onChange={(right) => updateRule(i, { ...rule, right })} />
            <button
              type="button"
              onClick={() => removeRule(i)}
              className="text-xs text-gray-500 hover:text-red-400 ml-auto"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
