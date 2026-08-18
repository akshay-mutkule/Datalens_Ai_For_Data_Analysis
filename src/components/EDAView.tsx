import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Hash,
  Type,
  Calendar,
  Layers,
  ArrowUpDown,
  Grid,
  Info,
  TrendingUp,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Scissors,
  BarChart2,
} from 'lucide-react';
import { DatasetState, HypothesisTestResult } from '../types/dataset';
import { formatNumber, runHypothesisTests } from '../services/dataEngine';

interface EDAViewProps {
  dataset: DatasetState;
}

export const EDAView: React.FC<EDAViewProps> = ({ dataset }) => {
  const [selectedCorrCell, setSelectedCorrCell] = useState<{ col1: string; col2: string; r: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'hypothesis' | 'outliers'>('stats');

  const numCols = dataset.profile.columns.filter((c) => c.dataType === 'numerical' && c.stats && !c.isIdentifier);
  const catCols = dataset.profile.columns.filter((c) => c.dataType === 'categorical' && !c.isIdentifier);
  const dateCols = dataset.profile.columns.filter((c) => c.dataType === 'date' && c.dateStats);

  // Compute Hypothesis Tests
  const hypothesisTests: HypothesisTestResult[] = useMemo(() => {
    return runHypothesisTests(dataset.cleanedRows, dataset.profile);
  }, [dataset.cleanedRows, dataset.profile]);

  // Correlation heatmap matrix mapping
  const numNames = numCols.map((c) => c.name);
  const corrMap = new Map<string, number>();

  for (const pair of dataset.correlations) {
    corrMap.set(`${pair.col1}:${pair.col2}`, pair.correlation);
    corrMap.set(`${pair.col2}:${pair.col1}`, pair.correlation);
  }

  const getCorrelationColor = (r: number) => {
    if (r === 1) return 'bg-blue-600 text-white font-bold';
    if (r >= 0.7) return 'bg-emerald-600 text-white font-bold';
    if (r >= 0.4) return 'bg-emerald-400 text-slate-900 font-semibold';
    if (r >= 0.1) return 'bg-emerald-100 text-slate-800';
    if (r > -0.1) return 'bg-slate-50 text-slate-600';
    if (r >= -0.4) return 'bg-rose-100 text-slate-800';
    if (r >= -0.7) return 'bg-rose-400 text-white font-semibold';
    return 'bg-rose-600 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Exploratory Data Analysis (EDA) & Statistical Inference
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametric metrics, bivariate correlations, categorical cohorts, and automated statistical hypothesis testing.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'stats' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Summary & Correlations
          </button>
          <button
            onClick={() => setActiveSubTab('hypothesis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeSubTab === 'hypothesis' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Hypothesis Testing ({hypothesisTests.length})
          </button>
          <button
            onClick={() => setActiveSubTab('outliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'outliers' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Outlier Deep-Dive
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* SUB-TAB 1: STATS & CORRELATIONS */}
      {/* -------------------------------------------------- */}
      {activeSubTab === 'stats' && (
        <div className="space-y-8">
          {/* 1. Numerical Descriptive Statistics Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  Descriptive Numerical Statistics
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parametric & non-parametric statistical metrics for continuous attributes
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                {numCols.length} Numerical Variables
              </span>
            </div>

            {numCols.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Column</th>
                      <th className="py-3 px-3">Mean</th>
                      <th className="py-3 px-3">Median</th>
                      <th className="py-3 px-3">Min</th>
                      <th className="py-3 px-3">Max</th>
                      <th className="py-3 px-3">Std Dev</th>
                      <th className="py-3 px-3">Q1 (25%)</th>
                      <th className="py-3 px-3">Q3 (75%)</th>
                      <th className="py-3 px-3">IQR</th>
                      <th className="py-3 px-3">Skewness</th>
                      <th className="py-3 px-3">Outliers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {numCols.map((col) => {
                      const s = col.stats!;
                      return (
                        <tr key={col.name} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{col.name}</td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-900">
                            {formatNumber(s.mean)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-800">
                            {formatNumber(s.median)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.min)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.max)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.stdDev)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.q1)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.q3)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {formatNumber(s.iqr)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            <span className={Math.abs(s.skewness) > 1 ? 'text-amber-600 font-semibold' : ''}>
                              {s.skewness}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {s.outlierCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[11px]">
                                {s.outlierCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No continuous numerical columns detected in this dataset.
              </div>
            )}
          </div>

          {/* 2. Pearson Correlation Heatmap Matrix */}
          {numNames.length >= 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-indigo-600" />
                    Pearson Correlation Heatmap Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bivariate correlation coefficient r ∈ [-1.0, +1.0] across continuous metrics
                  </p>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold">-1.0</span>
                  <span className="px-2 py-0.5 bg-rose-100 rounded">-0.3</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">0.0</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded">+0.3</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">+1.0</span>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="text-center text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-slate-400 font-medium"></th>
                      {numNames.map((name) => (
                        <th key={name} className="p-2 font-semibold text-slate-700 truncate max-w-[100px]" title={name}>
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {numNames.map((rowName) => (
                      <tr key={rowName}>
                        <td className="p-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                          {rowName}
                        </td>
                        {numNames.map((colName) => {
                          const r = rowName === colName ? 1.0 : (corrMap.get(`${rowName}:${colName}`) ?? 0);
                          return (
                            <td
                              key={colName}
                              onClick={() => setSelectedCorrCell({ col1: rowName, col2: colName, r })}
                              className={`p-2.5 m-0.5 rounded cursor-pointer transition hover:opacity-80 font-mono text-xs ${getCorrelationColor(r)}`}
                              title={`${rowName} vs ${colName}: r = ${r}`}
                            >
                              {r.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedCorrCell && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-700">
                  <div>
                    Selected: <span className="font-bold text-slate-900">{selectedCorrCell.col1}</span> vs{' '}
                    <span className="font-bold text-slate-900">{selectedCorrCell.col2}</span> — Pearson r ={' '}
                    <span className="font-bold">{selectedCorrCell.r}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCorrCell(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Categorical Distributions Grid */}
          {catCols.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  Categorical Distributions & Frequency Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unique value cardinality and top proportional cohorts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catCols.map((col) => (
                  <div
                    key={col.name}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={col.name}>
                        {col.name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {col.uniqueCount} unique
                      </span>
                    </div>

                    <div className="space-y-2">
                      {col.topCategories?.slice(0, 5).map((cat) => (
                        <div key={cat.value} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium truncate max-w-[160px]" title={cat.value}>
                              {cat.value}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {cat.count.toLocaleString()} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* SUB-TAB 2: STATISTICAL HYPOTHESIS TESTING */}
      {/* -------------------------------------------------- */}
      {activeSubTab === 'hypothesis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Automated Statistical Hypothesis Testing</h3>
                <p className="text-xs text-slate-500">
                  Rigorous inferential statistics testing for group mean variances, independence, and distribution normality (α = 0.05).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hypothesisTests.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {t.testType}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        t.significant
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.significant ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Statistically Significant
                        </>
                      ) : (
                        'No Significant Effect'
                      )}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Test Statistic ({t.testType.includes('T-Test') ? 't-score' : 'stat'}):</span>
                      <span className="font-mono font-bold text-slate-800">{t.statistic}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>p-value:</span>
                      <span
                        className={`font-mono font-bold ${
                          t.pValue < 0.05 ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {t.pValue < 0.001 ? '< 0.001' : t.pValue}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Significance Threshold (α):</span>
                      <span className="font-mono">{t.alpha}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Analytical Takeaway: </strong>
                    {t.conclusion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* SUB-TAB 3: OUTLIER DEEP-DIVE & CAPPING */}
      {/* -------------------------------------------------- */}
      {activeSubTab === 'outliers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Interquartile Range (IQR) Outlier Profiling</h3>
                <p className="text-xs text-slate-500">
                  Observations beyond 1.5 × IQR [Q1 - 1.5×IQR, Q3 + 1.5×IQR] that may distort parametric analyses.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numCols.map((col) => {
              const s = col.stats!;
              const lowerBound = Number((s.q1 - 1.5 * s.iqr).toFixed(2));
              const upperBound = Number((s.q3 + 1.5 * s.iqr).toFixed(2));
              const outlierPct = ((s.outlierCount / dataset.profile.totalRows) * 100).toFixed(1);

              return (
                <div key={col.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{col.name}</h4>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        s.outlierCount > 0
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {s.outlierCount} Outliers ({outlierPct}%)
                    </span>
                  </div>

                  {/* Visual Quantile Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Min: {formatNumber(s.min)}</span>
                      <span>Q1: {formatNumber(s.q1)}</span>
                      <span>Median: {formatNumber(s.median)}</span>
                      <span>Q3: {formatNumber(s.q3)}</span>
                      <span>Max: {formatNumber(s.max)}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full flex overflow-hidden">
                      <div style={{ width: '25%' }} className="bg-slate-200" title="Q1" />
                      <div style={{ width: '50%' }} className="bg-blue-500" title="IQR (50% Core)" />
                      <div style={{ width: '25%' }} className="bg-slate-200" title="Q3" />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span>Valid Lower Fence:</span>
                      <span className="font-bold text-slate-800">{formatNumber(lowerBound)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid Upper Fence:</span>
                      <span className="font-bold text-slate-800">{formatNumber(upperBound)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
