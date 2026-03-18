import type { CandleData } from "./mockData";

export interface Dataset {
  id: string;
  name: string;
  data: CandleData[];
  color: string;
}

const DATASET_COLORS = [
  "hsl(200, 85%, 55%)",
  "hsl(280, 70%, 60%)",
  "hsl(38, 90%, 55%)",
  "hsl(165, 80%, 45%)",
  "hsl(340, 75%, 55%)",
  "hsl(120, 60%, 50%)",
];

let colorIndex = 0;
export function getNextColor(): string {
  const color = DATASET_COLORS[colorIndex % DATASET_COLORS.length];
  colorIndex++;
  return color;
}

function parseNumber(val: string): number {
  const cleaned = val.replace(/[^0-9.\-eE]/g, "");
  return parseFloat(cleaned);
}

function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(+(100 - 100 / (1 + rs)).toFixed(2));
  }
  return rsi;
}

function computeEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function computeMACD(closes: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine = ema12.map((v, i) => +(v - ema26[i]).toFixed(2));
  const signalLine = computeEMA(macdLine, 9).map((v) => +v.toFixed(2));
  const histogram = macdLine.map((v, i) => +(v - signalLine[i]).toFixed(2));
  return { macd: macdLine, signal: signalLine, histogram };
}

function computeBollingerBands(closes: number[], period = 20, stdDev = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(closes[i]);
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(+mean.toFixed(2));
    upper.push(+(mean + stdDev * sd).toFixed(2));
    lower.push(+(mean - stdDev * sd).toFixed(2));
  }
  return { upper, middle, lower };
}

export interface EnrichedCandleData extends CandleData {
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  ema20?: number;
  sma50?: number;
}

function computeSMA(data: number[], period: number): number[] {
  return data.map((_, i) => {
    if (i < period - 1) return data[i];
    const slice = data.slice(i - period + 1, i + 1);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
  });
}

export function parseCSV(csvText: string, fileName: string): Dataset {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have at least a header and one data row");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const findCol = (...names: string[]) => {
    for (const n of names) {
      const idx = header.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const timeIdx = findCol("time", "date", "datetime", "timestamp");
  const openIdx = findCol("open");
  const highIdx = findCol("high");
  const lowIdx = findCol("low");
  const closeIdx = findCol("close", "adj close", "adj_close");
  const volumeIdx = findCol("volume", "vol");

  if (closeIdx === -1) throw new Error("CSV must have a 'Close' column");

  const candles: CandleData[] = [];
  const closes: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 2) continue;

    const close = parseNumber(cols[closeIdx]);
    if (isNaN(close)) continue;

    const open = openIdx !== -1 ? parseNumber(cols[openIdx]) : close;
    const high = highIdx !== -1 ? parseNumber(cols[highIdx]) : Math.max(open, close);
    const low = lowIdx !== -1 ? parseNumber(cols[lowIdx]) : Math.min(open, close);
    const volume = volumeIdx !== -1 ? parseNumber(cols[volumeIdx]) : 0;
    const time = timeIdx !== -1 ? cols[timeIdx] : `${i}`;

    closes.push(close);
    candles.push({
      time,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(volume),
      rsi: 50,
      macd: 0,
      signal: 0,
      histogram: 0,
    });
  }

  // Compute indicators
  const rsiValues = computeRSI(closes);
  const { macd, signal, histogram } = computeMACD(closes);
  const bb = computeBollingerBands(closes);
  const ema20 = computeEMA(closes, 20);
  const sma50 = computeSMA(closes, 50);

  for (let i = 0; i < candles.length; i++) {
    candles[i].rsi = rsiValues[i];
    candles[i].macd = macd[i];
    candles[i].signal = signal[i];
    candles[i].histogram = histogram[i];
    (candles[i] as EnrichedCandleData).bb_upper = bb.upper[i];
    (candles[i] as EnrichedCandleData).bb_middle = bb.middle[i];
    (candles[i] as EnrichedCandleData).bb_lower = bb.lower[i];
    (candles[i] as EnrichedCandleData).ema20 = +ema20[i].toFixed(2);
    (candles[i] as EnrichedCandleData).sma50 = sma50[i];
  }

  return {
    id: crypto.randomUUID(),
    name: fileName.replace(/\.csv$/i, ""),
    data: candles,
    color: getNextColor(),
  };
}
