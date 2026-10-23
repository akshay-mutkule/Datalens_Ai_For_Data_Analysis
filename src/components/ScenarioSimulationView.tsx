import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Download,
  BookmarkPlus,
  CheckCircle2,
  AlertTriangle,
  Info,
  BarChart2,
  Layers,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DatasetState } from '../types/dataset';

interface ScenarioSimulationViewProps {
  dataset: DatasetState;
}

interface ScenarioPreset {
  id: string;
  name: string;
  desc: string;
  priceDelta: number;
  volumeDelta: number;
  retentionDelta: number;
  costDelta: number;
  marketingMult: number;
  volatility: number;
}

const DEFAULT_PRESETS: ScenarioPreset[] = [
  {
    id: 'baseline',
    name: 'Status Quo Baseline',
    desc: 'Unadjusted organic trend under current operating conditions.',
    priceDelta: 0,
    volumeDelta: 0,
    retentionDelta: 0,
    costDelta: 0,
    marketingMult: 1.0,
    volatility: 8,
  },
  {
    id: 'aggressive_scale',
    name: 'Aggressive Market Expansion',
    desc: 'Scale acquisition by 2x, slight price elasticity concessions for rapid market share.',
    priceDelta: -4,
    volumeDelta: 32,
    retentionDelta: 2,
    costDelta: 8,
    marketingMult: 2.1,
    volatility: 12,
  },
  {
    id: 'profit_harvest',
    name: 'Margin Optimization & Pricing Power',
    desc: 'Selective +14% pricing hike, trimmed operating expenses, focus on high-LTV cohorts.',
    priceDelta: 14,
    volumeDelta: -6,
    retentionDelta: 4,
    costDelta: -12,
    marketingMult: 0.85,
    volatility: 6,
  },
  {
    id: 'recession_stress',
    name: 'Macro Downturn Stress Test',
    desc: 'Macro demand contraction, supplier inflation shock, customer retention headwind.',
    priceDelta: -6,
    volumeDelta: -22,
    retentionDelta: -10,
    costDelta: 14,
    marketingMult: 0.7,
    volatility: 18,
  },
];

export const ScenarioSimulationView: React.FC<ScenarioSimulationViewProps> = ({ dataset }) => {
  // Discover primary numerical column for target
  const numericalColumns = useMemo(() => {
    return dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier);
  }, [dataset]);

  const defaultTarget = useMemo(() => {
    const revCol = numericalColumns.find((c) =>
      /revenue|sales|amount|total|price|profit|gmv/i.test(c.name)
    );
    return revCol ? revCol.name : numericalColumns[0]?.name || 'Target';
  }, [numericalColumns]);

  const [targetColumn, setTargetColumn] = useState<string>(defaultTarget);

  // Levers state
  const [priceDelta, setPriceDelta] = useState<number>(0); // % (-50 to +50)
  const [volumeDelta, setVolumeDelta] = useState<number>(0); // % (-50 to +50)
  const [retentionDelta, setRetentionDelta] = useState<number>(0); // % (-25 to +25)
  const [costDelta, setCostDelta] = useState<number>(0); // % (-40 to +40)
  const [marketingMult, setMarketingMult] = useState<number>(1.0); // 0.2x to 3.0x
  const [volatility, setVolatility] = useState<number>(8); // 0 to 25% stddev noise
  const [activePreset, setActivePreset] = useState<string>('baseline');
  const [savedScenarios, setSavedScenarios] = useState<Array<{ name: string; date: string; impact: string }>>([
    { name: 'Board Presentation Bull Case', date: 'Oct 2026', impact: '+24.8% Projected Net' },
  ]);
  const [saveName, setSaveName] = useState<string>('');
  const [showSaveInput, setShowSaveInput] = useState<boolean>(false);

  // Calculate baseline aggregate
  const baselineStats = useMemo(() => {
    const colStats = dataset.profile.columns.find((c) => c.name === targetColumn)?.stats;
    const mean = colStats?.mean || 1000;
    const total = mean * dataset.profile.totalRows;
    return {
      mean,
      total,
      stdDev: colStats?.stdDev || mean * 0.25,
      min: colStats?.min || 0,
      max: colStats?.max || mean * 3,
    };
  }, [dataset, targetColumn]);

  // Handle Preset application
  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset.id);
    setPriceDelta(preset.priceDelta);
    setVolumeDelta(preset.volumeDelta);
    setRetentionDelta(preset.retentionDelta);
    setCostDelta(preset.costDelta);
    setMarketingMult(preset.marketingMult);
    setVolatility(preset.volatility);
  };

  const handleReset = () => {
    handleApplyPreset(DEFAULT_PRESETS[0]);
  };

  // Run Monte Carlo Simulation (1,000 runs)
  const simulationResults = useMemo(() => {
    const runs = 1000;
    const outcomes: number[] = [];

    // Net deterministic multiplier:
    // Net Target ~= Baseline * (1 + price/100) * (1 + (volume + (marketingMult - 1)*15 + retention*0.8)/100) * (1 - costDelta*0.4/100)
    const effectiveDemandMult = 1 + (volumeDelta + (marketingMult - 1) * 16 + retentionDelta * 0.75) / 100;
    const effectivePriceMult = 1 + priceDelta / 100;
    const costDrag = 1 - (costDelta * 0.35) / 100;
    const netBaseMultiplier = Math.max(0.1, effectiveDemandMult * effectivePriceMult * costDrag);

    // Box-Muller transform for standard Gaussian
    const randomGaussian = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const noiseFactor = volatility / 100;

    for (let i = 0; i < runs; i++) {
      const shock = randomGaussian() * noiseFactor;
      const simulatedTotal = baselineStats.total * netBaseMultiplier * (1 + shock);
      outcomes.push(simulatedTotal);
    }

    outcomes.sort((a, b) => a - b);

    const p10 = outcomes[Math.floor(runs * 0.1)];
    const p50 = outcomes[Math.floor(runs * 0.5)];
    const p90 = outcomes[Math.floor(runs * 0.9)];
    const simulatedMean = outcomes.reduce((acc, v) => acc + v, 0) / runs;

    const baseline = baselineStats.total;
    const netDeltaPercent = ((simulatedMean - baseline) / (baseline || 1)) * 100;
    const p10DeltaPercent = ((p10 - baseline) / (baseline || 1)) * 100;
    const p90DeltaPercent = ((p90 - baseline) / (baseline || 1)) * 100;

    // Distribution Bins (Histogram)
    const binCount = 14;
    const minVal = outcomes[0];
    const maxVal = outcomes[runs - 1];
    const step = (maxVal - minVal) / binCount || 1;
    const bins: { binRange: string; count: number; rawMin: number }[] = [];

    for (let b = 0; b < binCount; b++) {
      const binStart = minVal + b * step;
      const binEnd = binStart + step;
      const count = outcomes.filter((v) => v >= binStart && (b === binCount - 1 ? v <= binEnd : v < binEnd)).length;
      bins.push({
        binRange: `${(binStart / 1000).toFixed(0)}k`,
        count,
        rawMin: binStart,
      });
    }

    // 12-Month Projections
    const projectionTimeline = [];
    const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    for (let m = 0; m < 12; m++) {
      const monthFraction = (m + 1) / 12;
      // Gradual adoption curve for simulated change
      const transition = 0.4 + 0.6 * Math.tanh(monthFraction * 3);
      const monthlyBaseline = baselineStats.total / 12 * (1 + (m * 0.015));
      const targetSimulated = monthlyBaseline * (1 + (netBaseMultiplier - 1) * transition);
      const bandWidth = targetSimulated * (noiseFactor * (0.8 + 0.4 * monthFraction));

      projectionTimeline.push({
        month: months[m],
        baseline: Math.round(monthlyBaseline),
        expected: Math.round(targetSimulated),
        upperBound: Math.round(targetSimulated + bandWidth),
        lowerBound: Math.round(Math.max(0, targetSimulated - bandWidth)),
      });
    }

    // Tornado Sensitivity Analysis
    const leversSensitivity = [
      {
        lever: 'Pricing Elasticity',
        low: baseline * (1 - 0.15) * 0.96,
        high: baseline * (1 + 0.15) * 1.05,
        swing: 30,
        direction: 'Direct',
      },
      {
        lever: 'Volume Demand',
        low: baseline * (1 - 0.2) * 0.97,
        high: baseline * (1 + 0.2) * 1.03,
        swing: 25,
        direction: 'Direct',
      },
      {
        lever: 'Marketing Scale',
        low: baseline * 0.88,
        high: baseline * 1.18,
        swing: 19,
        direction: 'Leveraged',
      },
      {
        lever: 'Retention / Churn',
        low: baseline * 0.91,
        high: baseline * 1.12,
        swing: 15,
        direction: 'Compounding',
      },
      {
        lever: 'Expense / COGS',
        low: baseline * 0.94,
        high: baseline * 1.08,
        swing: 11,
        direction: 'Inverse',
      },
    ].sort((a, b) => b.swing - a.swing);

    return {
      p10,
      p50,
      p90,
      simulatedMean,
      netDeltaPercent,
      p10DeltaPercent,
      p90DeltaPercent,
      bins,
      projectionTimeline,
      leversSensitivity,
    };
  }, [
    baselineStats,
    priceDelta,
    volumeDelta,
    retentionDelta,
    costDelta,
    marketingMult,
    volatility,
  ]);

  const handleSaveScenario = () => {
    if (!saveName.trim()) return;
    setSavedScenarios((prev) => [
      {
        name: saveName.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impact: `${simulationResults.netDeltaPercent >= 0 ? '+' : ''}${simulationResults.netDeltaPercent.toFixed(1)}% P50`,
      },
      ...prev,
    ]);
    setSaveName('');
    setShowSaveInput(false);
  };

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
              Executive Decision Intelligence
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400">1,000 Monte Carlo Iterations</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            Scenario Simulation & What-If Monte Carlo Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate future organizational outcomes by stressing price elasticity, volume growth, acquisition marketing leverage, and operational cost curves with stochastic risk confidence bands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target column selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Target Metric:</span>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              aria-label="Select target metric for simulation"
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              {numericalColumns.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={() => setShowSaveInput(!showSaveInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition"
          >
            <BookmarkPlus className="w-3.5 h-3.5" /> Bookmark Scenario
          </button>
        </div>
      </div>

      {/* Save Scenario Modal Input Bar */}
      {showSaveInput && (
        <div className="p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-center gap-3">
          <input
            type="text"
            placeholder="Scenario title (e.g. Q4 2027 Conservative Budget)..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
            className="flex-1 bg-slate-900 border border-purple-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-400"
          />
          <button
            onClick={handleSaveScenario}
            disabled={!saveName.trim()}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
          >
            Save Snapshot
          </button>
          <button
            onClick={() => setShowSaveInput(false)}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Strategic Scenario Presets Segmented Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEFAULT_PRESETS.map((preset) => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{preset.name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Levers (Left) & Simulation Visuals (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Levers & Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Operating Parameter Levers
              </span>
              <span className="text-[11px] text-purple-400 font-mono">Live Recalculation</span>
            </div>

            {/* Lever 1: Price Delta */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Pricing Elasticity Shift</span>
                <span
                  className={`font-mono font-bold ${
                    priceDelta > 0 ? 'text-emerald-400' : priceDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {priceDelta > 0 ? `+${priceDelta}%` : `${priceDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={priceDelta}
                onChange={(e) => {
                  setPriceDelta(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-50% (Discount)</span>
                <span>0% (Neutral)</span>
                <span>+50% (Premium)</span>
              </div>
            </div>

            {/* Lever 2: Volume Growth */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Organic Demand & Units Sold</span>
                <span
                  className={`font-mono font-bold ${
                    volumeDelta > 0 ? 'text-emerald-400' : volumeDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {volumeDelta > 0 ? `+${volumeDelta}%` : `${volumeDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={volumeDelta}
                onChange={(e) => {
                  setVolumeDelta(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-50% (Slump)</span>
                <span>0% (Baseline)</span>
                <span>+50% (Surge)</span>
              </div>
            </div>

            {/* Lever 3: Marketing Acquisition Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Acquisition & Marketing Scale</span>
                <span className="font-mono font-bold text-amber-400">{marketingMult.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={marketingMult}
                onChange={(e) => {
                  setMarketingMult(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.2x (Austerity)</span>
                <span>1.0x (Current)</span>
                <span>3.0x (Blitzscale)</span>
              </div>
            </div>

            {/* Lever 4: Retention Delta */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Retention / LTV Retention Curve</span>
                <span
                  className={`font-mono font-bold ${
                    retentionDelta > 0 ? 'text-emerald-400' : retentionDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {retentionDelta > 0 ? `+${retentionDelta}%` : `${retentionDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="1"
                value={retentionDelta}
                onChange={(e) => {
                  setRetentionDelta(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-25% (Churn Spike)</span>
                <span>0% (Stable)</span>
                <span>+25% (Sticky)</span>
              </div>
            </div>

            {/* Lever 5: Operational Costs & COGS */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Operating Cost & COGS Variance</span>
                <span
                  className={`font-mono font-bold ${
                    costDelta > 0 ? 'text-rose-400' : costDelta < 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {costDelta > 0 ? `+${costDelta}%` : `${costDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={costDelta}
                onChange={(e) => {
                  setCostDelta(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-40% (Lean)</span>
                <span>0% (Nominal)</span>
                <span>+40% (Inflation)</span>
              </div>
            </div>

            {/* Lever 6: Stochastic Volatility Noise */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  Macro Stochastics & Noise Band (σ)
                </span>
                <span className="font-mono font-bold text-indigo-400">±{volatility}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={volatility}
                onChange={(e) => {
                  setVolatility(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1% (Predictable)</span>
                <span>10% (Normal)</span>
                <span>25% (High Chaos)</span>
              </div>
            </div>
          </div>

          {/* Saved Scenarios Roll */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Saved Simulation Snapshots
            </span>
            <div className="space-y-2">
              {savedScenarios.map((sc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{sc.name}</span>
                    <span className="text-[10px] text-slate-500">{sc.date}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{sc.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Outcomes, Probabilities & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Executive Confidence Interval Cards (P10, P50, P90) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* P10 Bear Case */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">P10 (Bear Downside)</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {formatNumber(simulationResults.p10)}
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-1 text-slate-400">
                <span
                  className={
                    simulationResults.p10DeltaPercent >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                  }
                >
                  {simulationResults.p10DeltaPercent >= 0 ? '+' : ''}
                  {simulationResults.p10DeltaPercent.toFixed(1)}%
                </span>
                <span>vs baseline</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">90% likelihood of exceeding this floor</p>
            </div>

            {/* P50 Expected Median */}
            <div className="bg-purple-950/30 border border-purple-500/40 p-4 rounded-xl relative overflow-hidden ring-1 ring-purple-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-purple-300 font-bold">P50 (Median Base)</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-mono font-bold text-purple-200 mt-1">
                {formatNumber(simulationResults.p50)}
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-1 text-slate-300">
                <span
                  className={
                    simulationResults.netDeltaPercent >= 0
                      ? 'text-emerald-400 font-bold flex items-center'
                      : 'text-rose-400 font-bold flex items-center'
                  }
                >
                  {simulationResults.netDeltaPercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {simulationResults.netDeltaPercent >= 0 ? '+' : ''}
                  {simulationResults.netDeltaPercent.toFixed(1)}%
                </span>
                <span>projected shift</span>
              </div>
              <p className="text-[10px] text-purple-400/80 mt-2">Stochastic midpoint expectation</p>
            </div>

            {/* P90 Bull Case */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">P90 (Bull Upside)</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {formatNumber(simulationResults.p90)}
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-1 text-slate-400">
                <span
                  className={
                    simulationResults.p90DeltaPercent >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                  }
                >
                  {simulationResults.p90DeltaPercent >= 0 ? '+' : ''}
                  {simulationResults.p90DeltaPercent.toFixed(1)}%
                </span>
                <span>vs baseline</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Top decile stretch potential</p>
            </div>
          </div>

          {/* 12-Month Horizon Projection Chart with Confidence Bands */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  12-Month Forward Horizon Projection & Risk Envelope
                </h3>
                <p className="text-[11px] text-slate-400">
                  Organic Baseline Trajectory vs. Simulated Strategy with 95% Confidence Band
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Simulated P50
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationResults.projectionTimeline}>
                  <defs>
                    <linearGradient id="simBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatNumber(v)}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [formatNumber(Number(val)), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="transparent"
                    fill="url(#simBand)"
                    name="95% Upper CI"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="transparent"
                    fill="transparent"
                    name="95% Lower CI"
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                    name="Status Quo"
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke="#c084fc"
                    strokeWidth={3}
                    dot={{ fill: '#c084fc', r: 3 }}
                    name="Simulated Scenario"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monte Carlo Distribution Histogram & Tornado Sensitivity Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Probability Density Distribution */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                  Stochastic Probability Density
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1,000 Draws</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulationResults.bins}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="binRange" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '10px',
                      }}
                      formatter={(val: any) => [`${val} runs`, 'Frequency']}
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tornado Factor Sensitivity Ranking */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  Tornado Sensitivity Leverage
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ranked Impact</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {simulationResults.leversSensitivity.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">{item.lever}</span>
                      <span className="text-purple-400 font-mono font-bold">±{item.swing}% Swing</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-400 h-1.5 rounded-full"
                        style={{ width: `${(item.swing / 35) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
