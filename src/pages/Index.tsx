import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TradingSidebar } from "@/components/TradingSidebar";
import { CandlestickChart } from "@/components/CandlestickChart";
import { RSIChart, MACDChart } from "@/components/SubCharts";
import { StatsBar } from "@/components/StatsBar";
import { mockCandles, mockStats, symbols, timeframes, strategies } from "@/lib/mockData";

const Index = () => {
  const [symbol, setSymbol] = useState(symbols[0]);
  const [timeframe, setTimeframe] = useState(timeframes[4]);
  const [strategy, setStrategy] = useState(strategies[0]);

  const handleRunBacktest = useCallback(() => {
    // In a real app, this would trigger a backtest run
    console.log(`Running backtest: ${symbol} ${timeframe} ${strategy}`);
  }, [symbol, timeframe, strategy]);

  return (
    <div className="flex min-h-screen bg-background">
      <TradingSidebar
        selectedSymbol={symbol}
        selectedTimeframe={timeframe}
        selectedStrategy={strategy}
        onSymbolChange={setSymbol}
        onTimeframeChange={setTimeframe}
        onStrategyChange={setStrategy}
        onRunBacktest={handleRunBacktest}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Strategy</span>
            <span className="text-sm font-mono font-medium text-primary">{strategy}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono text-muted-foreground">Backtest Complete</span>
          </div>
        </header>

        {/* Charts area */}
        <motion.div
          className="flex-1 p-3 space-y-2 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CandlestickChart data={mockCandles} symbol={symbol} timeframe={timeframe} />
          <div className="grid grid-cols-2 gap-2">
            <RSIChart data={mockCandles} />
            <MACDChart data={mockCandles} />
          </div>
        </motion.div>

        {/* Stats bar */}
        <StatsBar stats={mockStats} />
      </div>
    </div>
  );
};

export default Index;
