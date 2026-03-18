import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { TradingSidebar } from "@/components/TradingSidebar";
import { ChartPanel } from "@/components/ChartPanels";
import { TimeframeBar } from "@/components/TimeframeBar";
import { StatsBar } from "@/components/StatsBar";
import { parseCSV, type Dataset } from "@/lib/csvParser";
import { type ChartType, type ChartPanelConfig, CHART_TYPE_INFO } from "@/lib/chartTypes";
import { mockCandles, mockStats } from "@/lib/mockData";
import { getNextColor } from "@/lib/csvParser";
import {
  type Timeframe,
  TIMEFRAMES,
  aggregateToTimeframe,
  detectBaseTimeframe,
  getAvailableTimeframes,
} from "@/lib/timeframeUtils";

const Index = () => {
  const [datasets, setDatasets] = useState<Dataset[]>(() => [
    { id: "mock-btc", name: "BTC/USDT (Demo)", data: mockCandles, color: "hsl(165, 80%, 45%)" },
  ]);

  const [chartPanels, setChartPanels] = useState<ChartPanelConfig[]>(() => [
    { id: "default-candle", type: "candlestick", datasetId: "mock-btc" },
    { id: "default-rsi", type: "rsi", datasetId: "mock-btc" },
    { id: "default-macd", type: "macd", datasetId: "mock-btc" },
  ]);

  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1D");

  // Detect base timeframe from first dataset
  const baseTimeframe = useMemo(() => {
    if (datasets.length === 0) return "1D" as Timeframe;
    return detectBaseTimeframe(datasets[0].data);
  }, [datasets]);

  const availableTimeframes = useMemo(() => getAvailableTimeframes(baseTimeframe), [baseTimeframe]);

  // Aggregate datasets for the active timeframe
  const aggregatedDatasets = useMemo(() => {
    return datasets.map((ds) => ({
      ...ds,
      data: aggregateToTimeframe(ds.data, activeTimeframe),
    }));
  }, [datasets, activeTimeframe]);

  const handleUploadCSV = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const dataset = parseCSV(text, file.name);
      setDatasets((prev) => [...prev, dataset]);
    } catch (err: any) {
      console.error("CSV parse error:", err.message);
    }
  }, []);

  const handleRemoveDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    setChartPanels((prev) => prev.filter((p) => p.datasetId !== id));
  }, []);

  const handleAddChart = useCallback((type: ChartType, datasetId: string) => {
    const newPanel: ChartPanelConfig = {
      id: crypto.randomUUID(),
      type,
      datasetId,
    };
    setChartPanels((prev) => [...prev, newPanel]);
  }, []);

  const handleRemoveChart = useCallback((id: string) => {
    setChartPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const mainCharts = chartPanels.filter((p) => CHART_TYPE_INFO[p.type].category === "main");
  const oscillators = chartPanels.filter((p) => CHART_TYPE_INFO[p.type].category === "oscillator");
  const overlays = chartPanels.filter((p) => CHART_TYPE_INFO[p.type].category === "overlay");

  return (
    <div className="flex min-h-screen bg-background">
      <TradingSidebar
        datasets={datasets}
        chartPanels={chartPanels}
        onUploadCSV={handleUploadCSV}
        onRemoveDataset={handleRemoveDataset}
        onAddChart={handleAddChart}
        onRemoveChart={handleRemoveChart}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Charts</span>
            <span className="text-sm font-mono font-medium text-primary">{chartPanels.length} active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{datasets.length} dataset{datasets.length !== 1 ? "s" : ""} loaded</span>
          </div>
        </header>

        {/* Timeframe bar */}
        <TimeframeBar
          activeTimeframe={activeTimeframe}
          availableTimeframes={availableTimeframes}
          onTimeframeChange={setActiveTimeframe}
        />

        {/* Charts area */}
        <motion.div
          className="flex-1 p-3 space-y-2 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {chartPanels.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
              Upload a CSV and add charts to get started
            </div>
          )}

          {mainCharts.map((panel) => {
            const dataset = aggregatedDatasets.find((d) => d.id === panel.datasetId);
            if (!dataset) return null;
            const panelOverlays = overlays.filter((o) => o.datasetId === panel.datasetId);
            return (
              <ChartPanel
                key={panel.id}
                config={panel}
                dataset={dataset}
                onRemove={handleRemoveChart}
                overlays={panelOverlays}
                timeframe={activeTimeframe}
              />
            );
          })}

          {oscillators.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {oscillators.map((panel) => {
                const dataset = aggregatedDatasets.find((d) => d.id === panel.datasetId);
                if (!dataset) return null;
                return (
                  <ChartPanel
                    key={panel.id}
                    config={panel}
                    dataset={dataset}
                    onRemove={handleRemoveChart}
                    timeframe={activeTimeframe}
                  />
                );
              })}
            </div>
          )}
        </motion.div>

        <StatsBar stats={mockStats} />
      </div>
    </div>
  );
};

export default Index;
