import type { CandleData } from "./mockData";
import type { EnrichedCandleData } from "./csvParser";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1D" | "1W" | "1M";

export const TIMEFRAMES: { value: Timeframe; label: string; minutes: number }[] = [
  { value: "1m", label: "1m", minutes: 1 },
  { value: "5m", label: "5m", minutes: 5 },
  { value: "15m", label: "15m", minutes: 15 },
  { value: "30m", label: "30m", minutes: 30 },
  { value: "1h", label: "1H", minutes: 60 },
  { value: "2h", label: "2H", minutes: 120 },
  { value: "4h", label: "4H", minutes: 240 },
  { value: "1D", label: "1D", minutes: 1440 },
  { value: "1W", label: "1W", minutes: 10080 },
  { value: "1M", label: "1M", minutes: 43200 },
];

function parseTime(timeStr: string): Date | null {
  const d = new Date(timeStr);
  return isNaN(d.getTime()) ? null : d;
}

function getBucketKey(date: Date, tf: Timeframe): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const h = date.getHours();
  const min = date.getMinutes();

  switch (tf) {
    case "1m": return `${y}-${m}-${d}-${h}-${min}`;
    case "5m": return `${y}-${m}-${d}-${h}-${Math.floor(min / 5)}`;
    case "15m": return `${y}-${m}-${d}-${h}-${Math.floor(min / 15)}`;
    case "30m": return `${y}-${m}-${d}-${h}-${Math.floor(min / 30)}`;
    case "1h": return `${y}-${m}-${d}-${h}`;
    case "2h": return `${y}-${m}-${d}-${Math.floor(h / 2)}`;
    case "4h": return `${y}-${m}-${d}-${Math.floor(h / 4)}`;
    case "1D": return `${y}-${m}-${d}`;
    case "1W": {
      const start = new Date(y, 0, 1);
      const week = Math.floor((date.getTime() - start.getTime()) / (7 * 86400000));
      return `${y}-W${week}`;
    }
    case "1M": return `${y}-${m}`;
  }
}

function formatBucketTime(date: Date, tf: Timeframe): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());

  if (["1D", "1W", "1M"].includes(tf)) return `${y}-${m}-${d}`;
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function aggregateToTimeframe(data: CandleData[], tf: Timeframe): CandleData[] {
  if (data.length === 0) return [];

  // Check if data has parseable dates
  const firstDate = parseTime(data[0].time);
  if (!firstDate) {
    // Can't aggregate non-date data, return as-is
    return data;
  }

  const buckets = new Map<string, CandleData[]>();
  const bucketOrder: string[] = [];

  for (const candle of data) {
    const date = parseTime(candle.time);
    if (!date) continue;
    const key = getBucketKey(date, tf);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      bucketOrder.push(key);
    }
    buckets.get(key)!.push(candle);
  }

  return bucketOrder.map((key) => {
    const group = buckets.get(key)!;
    const first = group[0];
    const last = group[group.length - 1];
    const date = parseTime(first.time)!;

    return {
      time: formatBucketTime(date, tf),
      open: first.open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: last.close,
      volume: group.reduce((s, c) => s + c.volume, 0),
      rsi: last.rsi,
      macd: last.macd,
      signal: last.signal,
      histogram: last.histogram,
    };
  });
}

/** Detect the base timeframe of the data by looking at intervals between candles */
export function detectBaseTimeframe(data: CandleData[]): Timeframe {
  if (data.length < 2) return "1D";
  const d1 = parseTime(data[0].time);
  const d2 = parseTime(data[1].time);
  if (!d1 || !d2) return "1D";

  const diffMin = Math.abs(d2.getTime() - d1.getTime()) / 60000;

  if (diffMin <= 1) return "1m";
  if (diffMin <= 5) return "5m";
  if (diffMin <= 15) return "15m";
  if (diffMin <= 30) return "30m";
  if (diffMin <= 60) return "1h";
  if (diffMin <= 120) return "2h";
  if (diffMin <= 240) return "4h";
  if (diffMin <= 1440) return "1D";
  if (diffMin <= 10080) return "1W";
  return "1M";
}

/** Get available timeframes (only those >= base timeframe) */
export function getAvailableTimeframes(baseTf: Timeframe): typeof TIMEFRAMES {
  const baseIdx = TIMEFRAMES.findIndex((t) => t.value === baseTf);
  return TIMEFRAMES.slice(baseIdx);
}
