import type { PropsWithChildren } from "react";
import type { SignalType } from "../types";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
>) {
  const base = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
    ghost: "bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${props.className ?? ""}`}
    />
  );
}

export function SignalBadge({ signal }: { signal: SignalType }) {
  const styles: Record<SignalType, string> = {
    buy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    sell: "bg-red-500/15 text-red-300 border-red-500/30",
    hold: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  };
  const label: Record<SignalType, string> = { buy: "매수", sell: "매도", hold: "보유" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[signal]}`}>
      {label[signal]}
    </span>
  );
}
