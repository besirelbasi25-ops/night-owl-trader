import { useMemo, useRef, useCallback } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { X, RotateCcw } from "lucide-react";
import type { ChartPanelConfig } from "@/lib/chartTypes";
import type { Dataset, EnrichedCandleData } from "@/lib/csvParser";
import type { Timeframe } from "@/lib/timeframeUtils";
import { useChartInteraction } from "@/hooks/useChartInteraction";

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "6px",
  fontFamily: "JetBrains Mono",
  fontSize: "11px",
};

const gridStroke = "hsl(220, 15%, 14%)";
const axisTickStyle = { fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" };

const CandlestickShape = (props: any) => {
  const { x, width, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)";
  const yScale = props.yScale || ((v: number) => 0);
  const bodyTop = yScale(Math.max(open, close));
  const bodyBottom = yScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const wickTop = yScale(high);
  const wickBottom = yScale(low);
  const center = x + width / 2;
  const wickWidth = width < 3 ? 0.5 : 1;
  const bodyPad = width < 4 ? 0.1 : 0.15;

  return (
    <g>
      <line x1={center} y1={wickTop} x2={center} y2={wickBottom} stroke="hsl(210, 15%, 45%)" strokeWidth={wickWidth} />
      <rect
        x={x + width * bodyPad}
        y={bodyTop}
        width={Math.max(width * (1 - bodyPad * 2), 1)}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={width < 3 ? 0 : 0.5}
        rx={width < 4 ? 0 : 1}
      />
    </g>
  );
};

function getBarSize(dataLength: number, chartWidth: number = 1200): number {
  const available = chartWidth - 90;
  const maxBarWidth = Math.floor((available / dataLength) * 0.8);
  return Math.max(1, Math.min(maxBarWidth, 12));
}

interface ChartPanelProps {
  config: ChartPanelConfig;
  dataset: Dataset;
  onRemove: (id: string) => void;
  overlays?: ChartPanelConfig[];
  timeframe?: Timeframe;
}

export function ChartPanel({ config, dataset, onRemove, overlays = [], timeframe }: ChartPanelProps) {
  const { type } = config;
  const data = dataset.data as EnrichedCandleData[];
  const label = dataset.name;

  if (type === "rsi") return <RSIPanel data={data} label={label} onRemove={() => onRemove(config.id)} />;
  if (type === "macd") return <MACDPanel data={data} label={label} onRemove={() => onRemove(config.id)} />;
  if (type === "volume") return <VolumePanel data={data} label={label} onRemove={() => onRemove(config.id)} />;

  return <MainChartPanel config={config} dataset={dataset} onRemove={() => onRemove(config.id)} overlays={overlays} timeframe={timeframe} />;
}

function MainChartPanel({
  config,
  dataset,
  onRemove,
  overlays,
  timeframe,
}: {
  config: ChartPanelConfig;
  dataset: Dataset;
  onRemove: () => void;
  overlays: ChartPanelConfig[];
  timeframe?: Timeframe;
}) {
  const allData = dataset.data as EnrichedCandleData[];
  const { type } = config;
  const containerRef = useRef<HTMLDivElement>(null);

  const interaction = useChartInteraction({
    dataLength: allData.length,
    minVisibleCandles: 10,
  });

  const visibleData = useMemo(
    () => allData.slice(interaction.visibleStart, interaction.visibleEnd),
    [allData, interaction.visibleStart, interaction.visibleEnd]
  );

  const { minPrice, maxPrice, chartData } = useMemo(() => {
    if (visibleData.length === 0) return { minPrice: 0, maxPrice: 1, chartData: [] };
    const allLows = visibleData.map((d) => d.low);
    const allHighs = visibleData.map((d) => d.high);
    const min = Math.min(...allLows);
    const max = Math.max(...allHighs);
    const range = max - min;
    // Apply price scale factor: higher factor = tighter view
    const scaledPadding = (range * 0.05) / interaction.priceScaleFactor;
    const center = (min + max) / 2;
    const halfRange = (range / 2 + scaledPadding) / interaction.priceScaleFactor;
    return {
      minPrice: center - halfRange,
      maxPrice: center + halfRange,
      chartData: visibleData.map((d) => ({
        ...d,
        range: [Math.min(d.open, d.close), Math.max(d.open, d.close)] as [number, number],
      })),
    };
  }, [visibleData, interaction.priceScaleFactor]);

  const barSize = useMemo(() => getBarSize(visibleData.length), [visibleData.length]);

  const lastCandle = visibleData[visibleData.length - 1];
  const prevCandle = visibleData.length > 1 ? visibleData[visibleData.length - 2] : undefined;
  const priceChange = lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0;
  const pctChange = prevCandle ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  const typeLabels: Record<string, string> = { candlestick: "Candlestick", line: "Line", area: "Area" };
  const tickInterval = Math.max(1, Math.floor(visibleData.length / 10));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      interaction.onMouseMove(e, rect?.width || 1200);
    },
    [interaction]
  );

  const isZoomed = interaction.visibleStart > 0 || interaction.visibleEnd < allData.length || interaction.priceScaleFactor !== 1;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">{dataset.name}</h2>
          <span className="text-xs font-mono text-muted-foreground">{typeLabels[type] || type}</span>
          {timeframe && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{timeframe}</span>
          )}
          {lastCandle && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-foreground">{lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`text-xs font-mono ${isUp ? "text-profit" : "text-loss"}`}>
                {isUp ? "+" : ""}{priceChange.toFixed(2)} ({isUp ? "+" : ""}{pctChange.toFixed(2)}%)
              </span>
            </div>
          )}
          {overlays.length > 0 && (
            <div className="flex items-center gap-2">
              {overlays.map((o) => (
                <span key={o.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{o.type.toUpperCase()}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastCandle && (
            <div className="flex items-center gap-1">
              {(["O", "H", "L", "C"] as const).map((label, i) => {
                const vals = [lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close];
                return (
                  <span key={label} className="text-[10px] font-mono text-muted-foreground">
                    <span className="text-muted-foreground/60">{label}</span>{" "}
                    <span className="text-foreground">{vals[i]?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    {i < 3 && <span className="mx-1 text-border">|</span>}
                  </span>
                );
              })}
            </div>
          )}
          {isZoomed && (
            <button
              onClick={interaction.onDoubleClick}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart with interaction layer */}
      <div className="relative h-[400px] flex" ref={containerRef}>
        {/* Main chart area — handles time panning & zooming */}
        <div
          className="flex-1 pt-2 cursor-grab active:cursor-grabbing select-none"
          onWheel={interaction.onWheel}
          onMouseDown={interaction.onMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={interaction.onMouseUp}
          onMouseLeave={interaction.onMouseUp}
          onDoubleClick={interaction.onDoubleClick}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={axisTickStyle}
                axisLine={{ stroke: "hsl(220, 15%, 18%)" }}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={axisTickStyle}
                axisLine={false}
                tickLine={false}
                orientation="right"
                tickFormatter={(v: number) => v.toLocaleString()}
                width={70}
              />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(210, 20%, 75%)" }} />

              {type === "candlestick" && (
                <Bar dataKey="range" barSize={barSize} shape={<CandlestickShape yScale={undefined} />}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.close >= entry.open ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"} />
                  ))}
                </Bar>
              )}
              {type === "line" && <Line type="monotone" dataKey="close" stroke={dataset.color} strokeWidth={1.5} dot={false} />}
              {type === "area" && <Area type="monotone" dataKey="close" stroke={dataset.color} fill={dataset.color} fillOpacity={0.15} strokeWidth={1.5} />}

              {overlays.some((o) => o.type === "bollinger") && (
                <>
                  <Line type="monotone" dataKey="bb_upper" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="bb_middle" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="bb_lower" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                </>
              )}
              {overlays.some((o) => o.type === "ema20") && <Line type="monotone" dataKey="ema20" stroke="hsl(280, 70%, 60%)" strokeWidth={1.2} dot={false} />}
              {overlays.some((o) => o.type === "sma50") && <Line type="monotone" dataKey="sma50" stroke="hsl(200, 85%, 55%)" strokeWidth={1.2} dot={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Price axis drag zone — right edge overlay */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[70px] cursor-ns-resize select-none z-10"
          onMouseDown={interaction.onPriceAxisMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={interaction.onMouseUp}
          onMouseLeave={interaction.onMouseUp}
          onWheel={interaction.onPriceAxisWheel}
          title="Drag to scale price"
        />
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-secondary/30">
          <span className="text-[10px] font-mono text-muted-foreground">
            Showing {visibleData.length} of {allData.length} candles
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Price zoom: {(interaction.priceScaleFactor * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

function RSIPanel({ data, label, onRemove }: { data: EnrichedCandleData[]; label: string; onRemove: () => void }) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono font-medium text-foreground">RSI (14) — {label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{data[data.length - 1]?.rsi?.toFixed(1)}</span>
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="h-[120px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ ...axisTickStyle, fontSize: 9 }} axisLine={false} tickLine={false} orientation="right" width={30} />
            <ReferenceLine y={70} stroke="hsl(0, 75%, 55%)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={30} stroke="hsl(165, 80%, 45%)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="rsi" stroke="hsl(200, 85%, 55%)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MACDPanel({ data, label, onRemove }: { data: EnrichedCandleData[]; label: string; onRemove: () => void }) {
  const barSize = useMemo(() => getBarSize(data.length), [data.length]);
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono font-medium text-foreground">MACD (12,26,9) — {label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">M: <span className="text-foreground">{data[data.length - 1]?.macd?.toFixed(1)}</span></span>
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="h-[120px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis tick={{ ...axisTickStyle, fontSize: 9 }} axisLine={false} tickLine={false} orientation="right" width={40} />
            <ReferenceLine y={0} stroke="hsl(220, 15%, 25%)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="histogram" barSize={Math.max(1, barSize - 2)}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.histogram >= 0 ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"} fillOpacity={0.7} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="macd" stroke="hsl(200, 85%, 55%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="signal" stroke="hsl(280, 70%, 60%)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VolumePanel({ data, label, onRemove }: { data: EnrichedCandleData[]; label: string; onRemove: () => void }) {
  const barSize = useMemo(() => getBarSize(data.length), [data.length]);
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono font-medium text-foreground">Volume — {label}</span>
        <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="h-[120px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis tick={{ ...axisTickStyle, fontSize: 9 }} axisLine={false} tickLine={false} orientation="right" width={50} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="volume" barSize={barSize}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.close >= entry.open ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"} fillOpacity={0.5} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
