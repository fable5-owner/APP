import type { IndicatorName, Operand } from "../types";
import { Input, Select } from "./ui";

const INDICATORS: { value: IndicatorName; label: string }[] = [
  { value: "CLOSE", label: "종가" },
  { value: "SMA", label: "SMA (단순이동평균)" },
  { value: "EMA", label: "EMA (지수이동평균)" },
  { value: "RSI", label: "RSI" },
  { value: "MACD", label: "MACD" },
  { value: "MACD_SIGNAL", label: "MACD Signal" },
  { value: "BB_UPPER", label: "볼린저밴드 상단" },
  { value: "BB_MID", label: "볼린저밴드 중단" },
  { value: "BB_LOWER", label: "볼린저밴드 하단" },
];

function needsPeriod(indicator?: IndicatorName) {
  return indicator === "SMA" || indicator === "EMA" || indicator === "RSI" || indicator?.startsWith("BB_");
}

function needsStd(indicator?: IndicatorName) {
  return indicator?.startsWith("BB_");
}

export default function OperandEditor({
  operand,
  onChange,
}: {
  operand: Operand;
  onChange: (next: Operand) => void;
}) {
  const isConstant = operand.value !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select
        value={isConstant ? "__value__" : operand.indicator ?? "CLOSE"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__value__") {
            onChange({ value: 0 });
          } else {
            onChange({ indicator: v as IndicatorName, params: v === "SMA" || v === "EMA" ? { period: 20 } : v === "RSI" ? { period: 14 } : v.startsWith("BB_") ? { period: 20, num_std: 2 } : {} });
          }
        }}
      >
        <option value="__value__">고정값</option>
        {INDICATORS.map((ind) => (
          <option key={ind.value} value={ind.value}>
            {ind.label}
          </option>
        ))}
      </Select>

      {isConstant && (
        <Input
          type="number"
          value={operand.value}
          onChange={(e) => onChange({ value: Number(e.target.value) })}
          className="w-20"
        />
      )}

      {!isConstant && needsPeriod(operand.indicator) && (
        <Input
          type="number"
          value={operand.params?.period ?? 20}
          onChange={(e) =>
            onChange({ ...operand, params: { ...operand.params, period: Number(e.target.value) } })
          }
          className="w-16"
          title="기간"
        />
      )}

      {!isConstant && needsStd(operand.indicator) && (
        <Input
          type="number"
          step="0.1"
          value={operand.params?.num_std ?? 2}
          onChange={(e) =>
            onChange({ ...operand, params: { ...operand.params, num_std: Number(e.target.value) } })
          }
          className="w-16"
          title="표준편차 배수"
        />
      )}
    </div>
  );
}
