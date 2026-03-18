export type ChartType =
  | "candlestick"
  | "line"
  | "area"
  | "volume"
  | "rsi"
  | "macd"
  | "bollinger"
  | "ema20"
  | "sma50";

export interface ChartPanelConfig {
  id: string;
  type: ChartType;
  datasetId: string;
  height?: number;
}

export const CHART_TYPE_INFO: Record<ChartType, { label: string; category: "main" | "overlay" | "oscillator" }> = {
  candlestick: { label: "Candlestick", category: "main" },
  line: { label: "Line Chart", category: "main" },
  area: { label: "Area Chart", category: "main" },
  volume: { label: "Volume", category: "oscillator" },
  rsi: { label: "RSI (14)", category: "oscillator" },
  macd: { label: "MACD (12,26,9)", category: "oscillator" },
  bollinger: { label: "Bollinger Bands", category: "overlay" },
  ema20: { label: "EMA (20)", category: "overlay" },
  sma50: { label: "SMA (50)", category: "overlay" },
};
