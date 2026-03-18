// Mock data generators for the trading backtest dashboard

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number;
  macd: number;
  signal: number;
  histogram: number;
}

function generateCandles(count: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = 42000 + Math.random() * 3000;
  let rsi = 50;
  let macd = 0;
  let signal = 0;

  const startDate = new Date("2024-01-15");

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.008;
    const low = Math.min(open, close) - Math.random() * price * 0.008;
    price = close;

    rsi = Math.max(15, Math.min(85, rsi + (Math.random() - 0.5) * 12));
    macd = macd * 0.9 + (Math.random() - 0.48) * 80;
    signal = signal * 0.85 + macd * 0.15;
    const histogram = macd - signal;

    const date = new Date(startDate);
    date.setHours(date.getHours() + i * 4);

    candles.push({
      time: `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:00`,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(50 + Math.random() * 400),
      rsi: +rsi.toFixed(2),
      macd: +macd.toFixed(2),
      signal: +signal.toFixed(2),
      histogram: +histogram.toFixed(2),
    });
  }
  return candles;
}

export const mockCandles = generateCandles(80);

export interface BacktestStats {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  netProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export const mockStats: BacktestStats = {
  winRate: 63.2,
  profitFactor: 1.87,
  totalTrades: 142,
  netProfit: 12847.53,
  maxDrawdown: -4.2,
  sharpeRatio: 1.54,
};

export const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT"];
export const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D"];
export const strategies = ["EMA Crossover", "RSI Reversal", "MACD Divergence", "Bollinger Bands", "VWAP Mean Revert"];
