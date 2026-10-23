import React, { useState, useMemo } from 'react';
import {
  Wand2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart2,
  Sliders,
  Layers,
  Database,
  Plus,
  Info,
  TrendingUp,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DatasetState } from '../types/dataset';

interface FeatureEngineeringViewProps {
  dataset: DatasetState;
  onAddColumn: (colName: string, formula: string, resultValues: any[]) => void;
  onNavigateToTab?: (tab: string) => void;
}

type TransformType = 'log1p' | 'zscore' | 'minmax' | 'ratio' | 'rolling' | 'quantile_bin';

export const FeatureEngineeringView: React.FC<FeatureEngineeringViewProps> = ({
  dataset,
  onAddColumn,
  onNavigateToTab,
}) => {
  const numericalCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset]
  );

  const [primaryCol, setPrimaryCol] = useState<string>(numericalCols[0]?.name || '');
  const [secondaryCol, setSecondaryCol] = useState<string>(numericalCols[1]?.name || numericalCols[0]?.name || '');
  const [ratioOp, setRatioOp] = useState<'div' | 'mul'>('div');
  const [transformType, setTransformType] = useState<TransformType>('log1p');
  const [rollingWindow, setRollingWindow] = useState<number>(3);
  const [customFeatureName, setCustomFeatureName] = useState<string>('');
  const [lastCommittedFeature, setLastCommittedFeature] = useState<string | null>(null);

  // Generate suggested feature name based on transform
  const suggestedName = useMemo(() => {
    switch (transformType) {
      case 'log1p':
        return `log_${primaryCol}`;
      case 'zscore':
        return `zscore_${primaryCol}`;
      case 'minmax':
        return `norm_${primaryCol}`;
      case 'ratio':
        return ratioOp === 'div' ? `${primaryCol}_per_${secondaryCol}` : `${primaryCol}_x_${secondaryCol}`;
      case 'rolling':
        return `rolling_avg_${rollingWindow}_${primaryCol}`;
      case 'quantile_bin':
        return `tier_${primaryCol}`;
    }
  }, [transformType, primaryCol, secondaryCol, ratioOp, rollingWindow]);

  const activeFeatureName = customFeatureName.trim() || suggestedName;

  // Extract raw rows
  const rawRows = dataset.cleanedRows || dataset.rawData || [];

  // Compute the transformed feature values
  const { transformedValues, originalValues, formulaStr, originalSkewness, newSkewness, originalBins, newBins } =
    useMemo(() => {
      const orig: number[] = [];
      rawRows.forEach((row) => {
        const val = Number(row[primaryCol]);
        orig.push(isNaN(val) ? 0 : val);
      });

      // Calculate stats on original
      const n = orig.length || 1;
      const sum = orig.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const variance = orig.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance) || 1;
      const min = Math.min(...orig);
      const max = Math.max(...orig);

      // Skewness calculation
      const origM3 = orig.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
      const origSkew = origM3 / Math.pow(stdDev, 3) || 0;

      let transformed: any[] = [];
      let formula = '';

      switch (transformType) {
        case 'log1p':
          formula = `log(1 + max(0, ${primaryCol}))`;
          transformed = orig.map((v) => Number(Math.log1p(Math.max(0, v)).toFixed(4)));
          break;

        case 'zscore':
          formula = `(${primaryCol} - ${mean.toFixed(2)}) / ${stdDev.toFixed(2)}`;
          transformed = orig.map((v) => Number(((v - mean) / stdDev).toFixed(4)));
          break;

        case 'minmax':
          formula = `(${primaryCol} - ${min.toFixed(2)}) / ${(max - min || 1).toFixed(2)}`;
          transformed = orig.map((v) => Number(((v - min) / (max - min || 1)).toFixed(4)));
          break;

        case 'ratio': {
          const secVals = rawRows.map((r) => {
            const v = Number(r[secondaryCol]);
            return isNaN(v) ? 1 : v;
          });
          if (ratioOp === 'div') {
            formula = `${primaryCol} / max(0.0001, ${secondaryCol})`;
            transformed = orig.map((v, idx) => {
              const divisor = secVals[idx] === 0 ? 0.0001 : secVals[idx];
              return Number((v / divisor).toFixed(4));
            });
          } else {
            formula = `${primaryCol} * ${secondaryCol}`;
            transformed = orig.map((v, idx) => Number((v * secVals[idx]).toFixed(4)));
          }
          break;
        }

        case 'rolling': {
          formula = `rolling_mean(${primaryCol}, window=${rollingWindow})`;
          transformed = orig.map((_, idx) => {
            const start = Math.max(0, idx - rollingWindow + 1);
            const slice = orig.slice(start, idx + 1);
            const sliceMean = slice.reduce((a, b) => a + b, 0) / slice.length;
            return Number(sliceMean.toFixed(4));
          });
          break;
        }

        case 'quantile_bin': {
          formula = `quantile_bucket(${primaryCol}, 4_tiers)`;
          // Sort a copy for quantiles
          const sorted = [...orig].sort((a, b) => a - b);
          const q25 = sorted[Math.floor(n * 0.25)];
          const q50 = sorted[Math.floor(n * 0.5)];
          const q75 = sorted[Math.floor(n * 0.75)];
          transformed = orig.map((v) => {
            if (v <= q25) return 'Tier 1 (Low)';
            if (v <= q50) return 'Tier 2 (Mid-Low)';
            if (v <= q75) return 'Tier 3 (Mid-High)';
            return 'Tier 4 (High)';
          });
          break;
        }
      }

      // Compute transformed skewness if numerical
      let newSkew = 0;
      if (typeof transformed[0] === 'number') {
        const tVals = transformed as number[];
        const tSum = tVals.reduce((a, b) => a + b, 0);
        const tMean = tSum / n;
        const tVar = tVals.reduce((a, b) => a + Math.pow(b - tMean, 2), 0) / n;
        const tStd = Math.sqrt(tVar) || 1;
        const tM3 = tVals.reduce((a, b) => a + Math.pow(b - tMean, 3), 0) / n;
        newSkew = tM3 / Math.pow(tStd, 3) || 0;
      }

      // Generate bin histograms
      const createBins = (arr: number[], labelPrefix: string) => {
        if (!arr.length || typeof arr[0] !== 'number') return [];
        const aMin = Math.min(...arr);
        const aMax = Math.max(...arr);
        const step = (aMax - aMin) / 10 || 1;
        const bins = [];
        for (let i = 0; i < 10; i++) {
          const bStart = aMin + i * step;
          const bEnd = bStart + step;
          const count = arr.filter((x) => x >= bStart && (i === 9 ? x <= bEnd : x < bEnd)).length;
          bins.push({
            bucket: `${bStart.toFixed(1)}`,
            count,
          });
        }
        return bins;
      };

      const origB = createBins(orig, 'Orig');
      const newB = typeof transformed[0] === 'number' ? createBins(transformed as number[], 'New') : [];

      return {
        transformedValues: transformed,
        originalValues: orig,
        formulaStr: formula,
        originalSkewness: origSkew,
        newSkewness: newSkew,
        originalBins: origB,
        newBins: newB,
      };
    }, [rawRows, primaryCol, secondaryCol, ratioOp, transformType, rollingWindow]);

  const handleCommit = () => {
    onAddColumn(activeFeatureName, formulaStr, transformedValues);
    setLastCommittedFeature(activeFeatureName);
    setCustomFeatureName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              Data Science Feature Store
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400">Zero-Code Mathematical Synthesis</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            Feature Engineering & Mathematical Transformation Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Synthesize high-order features for predictive modeling: normalize heavy tails with logarithmic transforms, standardize variance with Z-scores, create interaction multipliers, and bucket continuous features.
          </p>
        </div>

        {lastCommittedFeature && (
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/50 px-3.5 py-2 rounded-xl text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Committed <strong>{lastCommittedFeature}</strong> to dataset!
            </span>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('ml')}
                className="underline hover:text-white font-semibold ml-1 cursor-pointer"
              >
                Use in AutoML →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feature Synthesis Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-3">
              Feature Transformation Strategy
            </span>

            {/* Transform type options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTransformType('log1p')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'log1p'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Log1p Scale</span>
                <span className="text-[10px] text-slate-400">log(1 + x) Skew Damper</span>
              </button>

              <button
                onClick={() => setTransformType('zscore')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'zscore'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Z-Score Standardize</span>
                <span className="text-[10px] text-slate-400">Mean=0, StdDev=1</span>
              </button>

              <button
                onClick={() => setTransformType('minmax')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'minmax'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Min-Max Normalizer</span>
                <span className="text-[10px] text-slate-400">Rescale into [0, 1]</span>
              </button>

              <button
                onClick={() => setTransformType('ratio')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'ratio'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Interaction Ratio</span>
                <span className="text-[10px] text-slate-400">Col A / Col B Interaction</span>
              </button>

              <button
                onClick={() => setTransformType('rolling')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'rolling'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Rolling Window</span>
                <span className="text-[10px] text-slate-400">Trailing Moving Avg</span>
              </button>

              <button
                onClick={() => setTransformType('quantile_bin')}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  transformType === 'quantile_bin'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold block text-white">Quantile Discretize</span>
                <span className="text-[10px] text-slate-400">4-Tier Bucketization</span>
              </button>
            </div>

            {/* Source Column Input */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-300 font-medium block">Primary Input Column</label>
              <select
                value={primaryCol}
                onChange={(e) => setPrimaryCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              >
                {numericalCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.stats ? `μ: ${c.stats.mean.toFixed(1)}` : 'num'})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Column (for interaction/ratio) */}
            {transformType === 'ratio' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRatioOp('div')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      ratioOp === 'div'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Division (A / B)
                  </button>
                  <button
                    onClick={() => setRatioOp('mul')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      ratioOp === 'mul'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Product (A * B)
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Secondary Interaction Column</label>
                  <select
                    value={secondaryCol}
                    onChange={(e) => setSecondaryCol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    {numericalCols.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Rolling Window Step */}
            {transformType === 'rolling' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Rolling Window Step</span>
                  <span className="font-mono font-bold text-amber-400">{rollingWindow} periods</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="14"
                  step="1"
                  value={rollingWindow}
                  onChange={(e) => setRollingWindow(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            {/* Custom Feature Name Input */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-300 font-medium block">New Feature Identifier</label>
              <input
                type="text"
                placeholder={suggestedName}
                value={customFeatureName}
                onChange={(e) => setCustomFeatureName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-500 font-mono block">Formula: {formulaStr}</span>
            </div>

            {/* Commit Button */}
            <button
              onClick={handleCommit}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Commit Feature to Dataset State
            </button>
          </div>
        </div>

        {/* Right Column: Real-time Profile & Before/After Histogram (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Statistical Shift Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Original Skewness
              </span>
              <div className="text-lg font-mono font-bold text-slate-300 mt-1">
                {originalSkewness.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {Math.abs(originalSkewness) > 1.5 ? 'Heavy tail asymmetry' : 'Moderately normal'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                Post-Transform Skewness
              </span>
              <div className="text-lg font-mono font-bold text-amber-300 mt-1">
                {newSkewness.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                {Math.abs(newSkewness) < Math.abs(originalSkewness) ? 'Normalized distribution' : 'Linear shift'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
                Feature Type
              </span>
              <div className="text-lg font-mono font-bold text-purple-300 mt-1">
                {typeof transformedValues[0] === 'number' ? 'Float (Numeric)' : 'Categorical Tier'}
              </div>
              <span className="text-[10px] text-purple-400/80 mt-1 block">
                {transformedValues.length.toLocaleString()} row instances
              </span>
            </div>
          </div>

          {/* Before vs After Histograms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Histogram */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Original: {primaryCol}
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={originalBins}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '10px',
                      }}
                    />
                    <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transformed Histogram */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Engineered: {activeFeatureName}
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={newBins}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '10px',
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row-Level Preview Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Sample Data Point Previews (First 5 Rows)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">{primaryCol} (Original)</th>
                    {transformType === 'ratio' && (
                      <th className="py-2 px-3">{secondaryCol}</th>
                    )}
                    <th className="py-2 px-3 text-amber-400 font-bold">{activeFeatureName} (New)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rawRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">{originalValues[idx]}</td>
                      {transformType === 'ratio' && (
                        <td className="py-2 px-3">{row[secondaryCol]}</td>
                      )}
                      <td className="py-2 px-3 text-amber-300 font-bold">
                        {String(transformedValues[idx])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
