import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, ChevronDown, Play, RotateCcw, Settings } from "lucide-react";
import { symbols, timeframes, strategies } from "@/lib/mockData";

interface TradingSidebarProps {
  selectedSymbol: string;
  selectedTimeframe: string;
  selectedStrategy: string;
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (t: string) => void;
  onStrategyChange: (s: string) => void;
  onRunBacktest: () => void;
}

function SelectGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-secondary border border-border text-sm font-mono text-foreground hover:border-primary/50 transition-colors"
        >
          <span>{value}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-xl overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm font-mono hover:bg-secondary transition-colors ${
                  opt === value ? "text-primary bg-secondary" : "text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function TradingSidebar({
  selectedSymbol,
  selectedTimeframe,
  selectedStrategy,
  onSymbolChange,
  onTimeframeChange,
  onStrategyChange,
  onRunBacktest,
}: TradingSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">BacktestPro</h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Engine v2.4</p>
        </div>
      </div>

      {/* Selections */}
      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        <SelectGroup label="Symbol" options={symbols} value={selectedSymbol} onChange={onSymbolChange} />
        <SelectGroup label="Timeframe" options={timeframes} value={selectedTimeframe} onChange={onTimeframeChange} />
        <SelectGroup label="Strategy" options={strategies} value={selectedStrategy} onChange={onStrategyChange} />

        {/* Timeframe chips */}
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Quick TF</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  tf === selectedTimeframe
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <button
          onClick={onRunBacktest}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Play className="h-4 w-4" />
          Run Backtest
        </button>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </aside>
  );
}
