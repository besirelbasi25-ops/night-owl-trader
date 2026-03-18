import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, Zap } from "lucide-react";
import type { BacktestStats } from "@/lib/mockData";

interface StatsBarProps {
  stats: BacktestStats;
}

const statItems = [
  {
    key: "winRate" as const,
    label: "Win Rate",
    icon: TrendingUp,
    format: (v: number) => `${v.toFixed(1)}%`,
    good: (v: number) => v >= 50,
  },
  {
    key: "profitFactor" as const,
    label: "Profit Factor",
    icon: Zap,
    format: (v: number) => v.toFixed(2),
    good: (v: number) => v >= 1,
  },
  {
    key: "totalTrades" as const,
    label: "Total Trades",
    icon: Activity,
    format: (v: number) => v.toString(),
    good: () => true,
  },
  {
    key: "netProfit" as const,
    label: "Net Profit",
    icon: DollarSign,
    format: (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    good: (v: number) => v >= 0,
  },
  {
    key: "maxDrawdown" as const,
    label: "Max Drawdown",
    icon: TrendingDown,
    format: (v: number) => `${v.toFixed(1)}%`,
    good: (v: number) => v > -10,
  },
  {
    key: "sharpeRatio" as const,
    label: "Sharpe Ratio",
    icon: BarChart2,
    format: (v: number) => v.toFixed(2),
    good: (v: number) => v >= 1,
  },
];

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-card border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {statItems.map((item, i) => {
          const value = stats[item.key];
          const isGood = item.good(value);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5 px-3 py-1.5"
            >
              <Icon className={`h-3.5 w-3.5 ${isGood ? "text-profit" : "text-loss"}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className={`text-sm font-mono font-semibold ${isGood ? "text-profit" : "text-loss"}`}>
                  {item.format(value)}
                </span>
              </div>
              {i < statItems.length - 1 && (
                <div className="ml-2 h-8 w-px bg-border" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
