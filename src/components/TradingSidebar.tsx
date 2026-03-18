import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, ChevronDown, Upload, Plus, X, Eye, EyeOff, Trash2, Layers } from "lucide-react";
import { CHART_TYPE_INFO, type ChartType, type ChartPanelConfig } from "@/lib/chartTypes";
import type { Dataset } from "@/lib/csvParser";

interface TradingSidebarProps {
  datasets: Dataset[];
  chartPanels: ChartPanelConfig[];
  onUploadCSV: (file: File) => void;
  onRemoveDataset: (id: string) => void;
  onAddChart: (type: ChartType, datasetId: string) => void;
  onRemoveChart: (id: string) => void;
}

function SelectGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-secondary border border-border text-sm font-mono text-foreground hover:border-primary/50 transition-colors"
        >
          <span>{options.find((o) => o.value === value)?.label || value}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-xl overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm font-mono hover:bg-secondary transition-colors ${opt.value === value ? "text-primary bg-secondary" : "text-foreground"}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function TradingSidebar({
  datasets,
  chartPanels,
  onUploadCSV,
  onRemoveDataset,
  onAddChart,
  onRemoveChart,
}: TradingSidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [addChartDataset, setAddChartDataset] = useState<string>("");
  const [addChartType, setAddChartType] = useState<ChartType>("candlestick");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCSV(file);
      e.target.value = "";
    }
  };

  const effectiveDatasetId = addChartDataset || datasets[0]?.id || "";

  const chartTypeOptions = Object.entries(CHART_TYPE_INFO).map(([key, info]) => ({
    value: key,
    label: `${info.label} (${info.category})`,
  }));

  const datasetOptions = datasets.map((d) => ({ value: d.id, label: d.name }));

  return (
    <aside className="w-72 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">BacktestPro</h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Engine v2.4</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* CSV Upload */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Datasets</label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </button>

          {/* Dataset list */}
          <div className="space-y-1">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-secondary group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ds.color }} />
                  <span className="text-xs font-mono text-foreground truncate">{ds.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{ds.data.length}</span>
                </div>
                <button
                  onClick={() => onRemoveDataset(ds.id)}
                  className="text-muted-foreground hover:text-loss transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Chart */}
        {datasets.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Add Chart</label>
            {datasets.length > 1 && (
              <SelectGroup label="Dataset" options={datasetOptions} value={effectiveDatasetId} onChange={setAddChartDataset} />
            )}
            <SelectGroup label="Type" options={chartTypeOptions} value={addChartType} onChange={(v) => setAddChartType(v as ChartType)} />
            <button
              onClick={() => {
                if (effectiveDatasetId) onAddChart(addChartType, effectiveDatasetId);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Chart
            </button>
          </div>
        )}

        {/* Active Charts */}
        {chartPanels.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Active Charts ({chartPanels.length})
            </label>
            <div className="space-y-1">
              {chartPanels.map((panel) => {
                const ds = datasets.find((d) => d.id === panel.datasetId);
                const info = CHART_TYPE_INFO[panel.type];
                return (
                  <div key={panel.id} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-secondary group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: ds?.color || "hsl(215, 15%, 50%)" }} />
                      <span className="text-xs font-mono text-foreground truncate">{info.label}</span>
                      {ds && <span className="text-[10px] font-mono text-muted-foreground truncate">{ds.name}</span>}
                    </div>
                    <button
                      onClick={() => onRemoveChart(panel.id)}
                      className="text-muted-foreground hover:text-loss transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
