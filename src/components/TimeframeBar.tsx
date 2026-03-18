import { TIMEFRAMES, type Timeframe } from "@/lib/timeframeUtils";

interface TimeframeBarProps {
  activeTimeframe: Timeframe;
  availableTimeframes: typeof TIMEFRAMES;
  onTimeframeChange: (tf: Timeframe) => void;
}

export function TimeframeBar({ activeTimeframe, availableTimeframes, onTimeframeChange }: TimeframeBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border bg-card">
      {availableTimeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onTimeframeChange(tf.value)}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
            activeTimeframe === tf.value
              ? "bg-primary/20 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
