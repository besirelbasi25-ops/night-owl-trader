import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { CandleData } from "@/lib/mockData";

// Custom candlestick shape
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)";

  const yScale = props.yScale || ((v: number) => y);

  const bodyTop = yScale(Math.max(open, close));
  const bodyBottom = yScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const wickTop = yScale(high);
  const wickBottom = yScale(low);
  const center = x + width / 2;

  return (
    <g>
      <line x1={center} y1={wickTop} x2={center} y2={wickBottom} stroke="hsl(210, 15%, 45%)" strokeWidth={1} />
      <rect
        x={x + width * 0.15}
        y={bodyTop}
        width={width * 0.7}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
      />
    </g>
  );
};

interface CandlestickChartProps {
  data: CandleData[];
  symbol: string;
  timeframe: string;
}

export function CandlestickChart({ data, symbol, timeframe }: CandlestickChartProps) {
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
        // For the bar chart we need a range
        range: [Math.min(d.open, d.close), Math.max(d.open, d.close)] as [number, number],
      })),
    };
  }, [data]);

  const lastCandle = data[data.length - 1];
  const prevCandle = data[data.length - 2];
  const priceChange = lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0;
  const pctChange = prevCandle ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">{symbol}</h2>
          <span className="text-xs font-mono text-muted-foreground">{timeframe}</span>
          {lastCandle && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-foreground">
                {lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono ${isUp ? "text-profit" : "text-loss"}`}>
                {isUp ? "+" : ""}{priceChange.toFixed(2)} ({isUp ? "+" : ""}{pctChange.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {["O", "H", "L", "C"].map((label, i) => {
            const vals = lastCandle ? [lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close] : [0, 0, 0, 0];
            return (
              <span key={label} className="text-[10px] font-mono text-muted-foreground">
                <span className="text-muted-foreground/60">{label}</span>{" "}
                <span className="text-foreground">{vals[i]?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                {i < 3 && <span className="mx-1.5 text-border">|</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] px-2 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="hsl(220, 15%, 14%)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "hsl(220, 15%, 18%)" }}
              tickLine={false}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              tickFormatter={(v: number) => v.toLocaleString()}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 15%, 18%)",
                borderRadius: "6px",
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
              }}
              labelStyle={{ color: "hsl(210, 20%, 75%)" }}
            />
            <Bar dataKey="range" barSize={8} shape={<CandlestickShape yScale={undefined} />}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.close >= entry.open ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
