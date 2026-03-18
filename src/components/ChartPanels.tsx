import { useMemo } from "react";
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
import { X } from "lucide-react";
import type { ChartPanelConfig, ChartType } from "@/lib/chartTypes";
import type { Dataset, EnrichedCandleData } from "@/lib/csvParser";

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "6px",
  fontFamily: "JetBrains Mono",
  fontSize: "11px",
};

const gridStroke = "hsl(220, 15%, 14%)";
const axisTickStyle = { fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" };

// Candlestick shape
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

  return (
    <g>
      <line x1={center} y1={wickTop} x2={center} y2={wickBottom} stroke="hsl(210, 15%, 45%)" strokeWidth={1} />
      <rect x={x + width * 0.15} y={bodyTop} width={width * 0.7} height={bodyHeight} fill={color} stroke={color} strokeWidth={0.5} rx={1} />
    </g>
  );
};

interface ChartPanelProps {
  config: ChartPanelConfig;
  dataset: Dataset;
  onRemove: (id: string) => void;
  overlays?: ChartPanelConfig[];
}

export function ChartPanel({ config, dataset, onRemove, overlays = [] }: ChartPanelProps) {
  const { type } = config;
  const data = dataset.data as EnrichedCandleData[];
  const label = dataset.name;

  if (type === "rsi") return <RSIPanel data={data} label={label} onRemove={() => onRemove(config.id)} />;
  if (type === "macd") return <MACDPanel data={data} label={label} onRemove={() => onRemove(config.id)} />;
  if (type === "volume") return <VolumePanel data={data} label={label} onRemove={() => onRemove(config.id)} />;

  return <MainChartPanel config={config} dataset={dataset} onRemove={() => onRemove(config.id)} overlays={overlays} />;
}

function MainChartPanel({
  config,
  dataset,
  onRemove,
  overlays,
}: {
  config: ChartPanelConfig;
  dataset: Dataset;
  onRemove: () => void;
  overlays: ChartPanelConfig[];
}) {
  const data = dataset.data as EnrichedCandleData[];
  const { type } = config;

  const { minPrice, maxPrice, chartData } = useMemo(() => {
    const allLows = data.map((d) => d.low);
    const allHighs = data.map((d) => d.high);
    const min = Math.min(...allLows);
    const max = Math.max(...allHighs);
    const padding = (max - min) * 0.05;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      chartData: data.map((d) => ({
        ...d,
        range: [Math.min(d.open, d.close), Math.max(d.open, d.close)] as [number, number],
      })),
    };
  }, [data]);

  const lastCandle = data[data.length - 1];
  const prevCandle = data[data.length - 2];
  const priceChange = lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0;
  const pctChange = prevCandle ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  const typeLabels: Record<string, string> = { candlestick: "Candlestick", line: "Line", area: "Area" };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">{dataset.name}</h2>
          <span className="text-xs font-mono text-muted-foreground">{typeLabels[type] || type}</span>
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
                <span key={o.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  {o.type.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[350px] px-2 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={axisTickStyle} axisLine={{ stroke: "hsl(220, 15%, 18%)" }} tickLine={false} interval={Math.floor(data.length / 8)} />
            <YAxis domain={[minPrice, maxPrice]} tick={axisTickStyle} axisLine={false} tickLine={false} orientation="right" tickFormatter={(v: number) => v.toLocaleString()} width={70} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(210, 20%, 75%)" }} />

            {type === "candlestick" && (
              <Bar dataKey="range" barSize={8} shape={<CandlestickShape yScale={undefined} />}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.close >= entry.open ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"} />
                ))}
              </Bar>
            )}
            {type === "line" && (
              <Line type="monotone" dataKey="close" stroke={dataset.color} strokeWidth={1.5} dot={false} />
            )}
            {type === "area" && (
              <Area type="monotone" dataKey="close" stroke={dataset.color} fill={dataset.color} fillOpacity={0.15} strokeWidth={1.5} />
            )}

            {/* Overlays */}
            {overlays.some((o) => o.type === "bollinger") && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="bb_middle" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="bb_lower" stroke="hsl(38, 90%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </>
            )}
            {overlays.some((o) => o.type === "ema20") && (
              <Line type="monotone" dataKey="ema20" stroke="hsl(280, 70%, 60%)" strokeWidth={1.2} dot={false} />
            )}
            {overlays.some((o) => o.type === "sma50") && (
              <Line type="monotone" dataKey="sma50" stroke="hsl(200, 85%, 55%)" strokeWidth={1.2} dot={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
            <Bar dataKey="histogram" barSize={4}>
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
            <Bar dataKey="volume" barSize={6}>
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
