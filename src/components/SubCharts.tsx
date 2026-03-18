import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Area,
} from "recharts";
import type { CandleData } from "@/lib/mockData";

interface SubChartProps {
  data: CandleData[];
}

export function RSIChart({ data }: SubChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono font-medium text-foreground">RSI (14)</span>
        <span className="text-xs font-mono text-muted-foreground">
          {data[data.length - 1]?.rsi.toFixed(1)}
        </span>
      </div>
      <div className="h-[120px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="hsl(220, 15%, 14%)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              domain={[0, 100]}
              ticks={[30, 50, 70]}
              tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={30}
            />
            <ReferenceLine y={70} stroke="hsl(0, 75%, 55%)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={30} stroke="hsl(165, 80%, 45%)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 15%, 18%)",
                borderRadius: "6px",
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
              }}
            />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="hsl(200, 85%, 55%)"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MACDChart({ data }: SubChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono font-medium text-foreground">MACD (12, 26, 9)</span>
        <div className="flex gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            M: <span className="text-foreground">{data[data.length - 1]?.macd.toFixed(1)}</span>
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            S: <span style={{ color: "hsl(280, 70%, 60%)" }}>{data[data.length - 1]?.signal.toFixed(1)}</span>
          </span>
        </div>
      </div>
      <div className="h-[120px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="hsl(220, 15%, 14%)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={40}
            />
            <ReferenceLine y={0} stroke="hsl(220, 15%, 25%)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 15%, 18%)",
                borderRadius: "6px",
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
              }}
            />
            <Bar dataKey="histogram" barSize={4}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.histogram >= 0 ? "hsl(165, 80%, 45%)" : "hsl(0, 75%, 55%)"}
                  fillOpacity={0.7}
                />
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
