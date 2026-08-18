import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Sliders,
  TrendingUp,
  Target,
  BarChart2,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  DatasetState,
  MLModelResult,
  ForecastResult,
  WhatIfVariableConfig,
} from '../types/dataset';
import {
  trainRegressionModel,
  predictWhatIfValue,
  forecastTimeSeries,
  formatNumber,
  formatCurrency,
} from '../services/dataEngine';

interface PredictiveMLViewProps {
  dataset: DatasetState;
}

export const PredictiveMLView: React.FC<PredictiveMLViewProps> = ({ dataset }) => {
  const numCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset.profile.columns]
  );
  const dateCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'date'),
    [dataset.profile.columns]
  );

  // Target Variable & Model State
  const defaultTarget = numCols.find((c) =>
    ['profit', 'revenue', 'sales', 'salary', 'mrr', 'treatment_cost', 'price'].includes(
      c.name.toLowerCase()
    )
  )?.name || numCols[0]?.name || '';

  const [targetCol, setTargetCol] = useState<string>(defaultTarget);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [model, setModel] = useState<MLModelResult | null>(null);

  // What-If Sliders State
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Forecasting State
  const [forecastDateCol, setForecastDateCol] = useState<string>(dateCols[0]?.name || '');
  const [forecastValCol, setForecastValCol] = useState<string>(defaultTarget);
  const [forecastHorizon, setForecastHorizon] = useState<number>(6);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'automl' | 'forecasting'>('simulator');

  // Initialize features and model when target changes
  useEffect(() => {
    if (!targetCol) return;
    const availableFeatures = numCols.filter((c) => c.name !== targetCol).map((c) => c.name);
    setSelectedFeatures(availableFeatures);

    const trained = trainRegressionModel(dataset.cleanedRows, targetCol, availableFeatures);
    setModel(trained);

    // Initialize slider values to means
    if (trained) {
      const initialSliders: Record<string, number> = {};
      for (const feat of availableFeatures) {
        const colProfile = numCols.find((c) => c.name === feat);
        initialSliders[feat] = colProfile?.stats?.mean || 0;
      }
      setSliderValues(initialSliders);
    }
  }, [targetCol, dataset.cleanedRows, numCols]);

  // Train model on feature selection change
  const handleToggleFeature = (feat: string) => {
    let updated: string[];
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length <= 1) return; // Keep at least 1
      updated = selectedFeatures.filter((f) => f !== feat);
    } else {
      updated = [...selectedFeatures, feat];
    }
    setSelectedFeatures(updated);
    const trained = trainRegressionModel(dataset.cleanedRows, targetCol, updated);
    setModel(trained);
  };

  // Run Forecast
  useEffect(() => {
    if (forecastDateCol && forecastValCol) {
      const res = forecastTimeSeries(
        dataset.cleanedRows,
        forecastDateCol,
        forecastValCol,
        forecastHorizon
      );
      setForecastResult(res);
    }
  }, [forecastDateCol, forecastValCol, forecastHorizon, dataset.cleanedRows]);

  // What-If Live Prediction Calculation
  const whatIfPrediction = useMemo(() => {
    if (!model) return null;
    return predictWhatIfValue(model, sliderValues);
  }, [model, sliderValues]);

  // Target Baseline Mean
  const targetBaselineMean = useMemo(() => {
    const col = numCols.find((c) => c.name === targetCol);
    return col?.stats?.mean || 0;
  }, [targetCol, numCols]);

  const deltaPercent = useMemo(() => {
    if (!whatIfPrediction || targetBaselineMean === 0) return 0;
    return ((whatIfPrediction.predictedValue - targetBaselineMean) / targetBaselineMean) * 100;
  }, [whatIfPrediction, targetBaselineMean]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Predictive & Machine Learning Studio</h2>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  AutoML Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate what-if scenarios, inspect feature importance, and project future trends with statistical confidence intervals.
              </p>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'simulator'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('automl')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'automl'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Model & Feature Weights</span>
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'forecasting'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Time-Series Forecasting</span>
            </button>
          </div>
        </div>

        {/* Global Target Variable Selector */}
        {activeTab !== 'forecasting' && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Target Outcome (Y):</span>
              <select
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              >
                {numCols.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.inferredType})
                  </option>
                ))}
              </select>
            </div>

            {model && (
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Model Fit (R²):</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {(model.rSquared * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Root Mean Sq Error:</span>
                  <span className="font-mono text-slate-800">{model.rmse}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* 1. WHAT-IF SCENARIO SIMULATOR */}
      {/* -------------------------------------------------- */}
      {activeTab === 'simulator' && model && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Variable Sliders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Scenario Parameter Controls</h3>
              </div>
              <button
                onClick={() => {
                  const initialSliders: Record<string, number> = {};
                  for (const feat of selectedFeatures) {
                    const colProfile = numCols.find((c) => c.name === feat);
                    initialSliders[feat] = colProfile?.stats?.mean || 0;
                  }
                  setSliderValues(initialSliders);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset to Averages
              </button>
            </div>

            <div className="space-y-4">
              {selectedFeatures.map((feat) => {
                const colProfile = numCols.find((c) => c.name === feat);
                const min = colProfile?.stats?.min || 0;
                const max = colProfile?.stats?.max || 100;
                const mean = colProfile?.stats?.mean || 50;
                const currentVal = sliderValues[feat] !== undefined ? sliderValues[feat] : mean;
                const step = (max - min) / 100 || 1;
                const coeff = model.coefficients[feat] || 0;

                return (
                  <div key={feat} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{feat}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            coeff >= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {coeff >= 0 ? `+${coeff} per unit` : `${coeff} per unit`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                          {formatNumber(currentVal, 2)}
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={currentVal}
                      onChange={(e) =>
                        setSliderValues((prev) => ({
                          ...prev,
                          [feat]: Number(e.target.value),
                        }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Min: {formatNumber(min)}</span>
                      <span>Mean: {formatNumber(mean)}</span>
                      <span>Max: {formatNumber(max)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Live Prediction Result Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                  Predicted Simulation
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  90% Confidence
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-300 mb-1">Estimated {targetCol}</p>
                <div className="text-3xl font-extrabold tracking-tight">
                  {formatNumber(whatIfPrediction?.predictedValue || 0, 2)}
                </div>
              </div>

              {/* Delta comparison against baseline */}
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-300 block">Baseline Historical Mean</span>
                  <span className="text-sm font-semibold">{formatNumber(targetBaselineMean, 2)}</span>
                </div>
                <div
                  className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg ${
                    deltaPercent >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {deltaPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{deltaPercent >= 0 ? `+${deltaPercent.toFixed(1)}%` : `${deltaPercent.toFixed(1)}%`}</span>
                </div>
              </div>

              {/* Confidence interval bounds */}
              <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lower Bound (-1.64σ):</span>
                  <span className="font-mono font-medium">{formatNumber(whatIfPrediction?.lowerBound || 0, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upper Bound (+1.64σ):</span>
                  <span className="font-mono font-medium">{formatNumber(whatIfPrediction?.upperBound || 0, 2)}</span>
                </div>
              </div>
            </div>

            {/* Model Equation Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800">Mathematical Regression Formula</h4>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 font-mono text-[11px] text-slate-700 leading-relaxed overflow-x-auto border border-slate-200">
                <span className="font-bold text-blue-600">{targetCol}</span> = {model.intercept}
                {Object.entries(model.coefficients).map(([feat, coeff]) => (
                  <span key={feat}>
                    {' '}
                    {coeff >= 0 ? '+' : '-'}{' '}
                    <span className="font-semibold text-slate-900">{Math.abs(coeff)}</span>
                    <span className="text-slate-500">×[{feat}]</span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                This linear equation maps input features directly to the target outcome with an empirical R² explanatory power of{' '}
                <strong className="text-slate-700">{(model.rSquared * 100).toFixed(1)}%</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* 2. AUTOML & FEATURE WEIGHTS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'automl' && model && (
        <div className="space-y-6">
          {/* Feature Selection & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">R² (Variance Explained)</span>
              <span className="text-2xl font-bold text-blue-600">{(model.rSquared * 100).toFixed(1)}%</span>
              <p className="text-[10px] text-slate-400 mt-1">High explanatory accuracy</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">Root Mean Sq Error (RMSE)</span>
              <span className="text-2xl font-bold text-slate-800">{model.rmse}</span>
              <p className="text-[10px] text-slate-400 mt-1">Standard error of residuals</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">Mean Absolute Error (MAE)</span>
              <span className="text-2xl font-bold text-slate-800">{model.mae}</span>
              <p className="text-[10px] text-slate-400 mt-1">Average point deviation</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">Active Predictors</span>
              <span className="text-2xl font-bold text-indigo-600">{selectedFeatures.length}</span>
              <p className="text-[10px] text-slate-400 mt-1">Continuous parameters</p>
            </div>
          </div>

          {/* Feature Importance Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Feature Importance Ranking</h3>
                <p className="text-xs text-slate-500">
                  Relative impact of each independent feature on {targetCol}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Toggle Features:</span>
                <div className="flex flex-wrap gap-1.5">
                  {numCols
                    .filter((c) => c.name !== targetCol)
                    .map((col) => {
                      const isSelected = selectedFeatures.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          onClick={() => handleToggleFeature(col.name)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {col.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.featureImportance} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Relative Weight']}
                  />
                  <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                    {model.featureImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actual vs Predicted Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Sample Predictions vs Actual Observations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-2.5 px-4">Observation #</th>
                    <th className="py-2.5 px-4">Actual {targetCol}</th>
                    <th className="py-2.5 px-4">Model Predicted</th>
                    <th className="py-2.5 px-4">Residual Error</th>
                    <th className="py-2.5 px-4">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {model.samplePredictions.map((pred, i) => {
                    const variancePct = pred.actual > 0 ? (pred.residual / pred.actual) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-mono text-slate-400">#{i + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{pred.actual}</td>
                        <td className="py-2.5 px-4 font-semibold text-blue-600">{pred.predicted}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {pred.residual >= 0 ? `+${pred.residual}` : pred.residual}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              Math.abs(variancePct) < 15
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {Math.abs(variancePct).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* 3. TIME-SERIES FORECASTING */}
      {/* -------------------------------------------------- */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date Parameter:</label>
                <select
                  value={forecastDateCol}
                  onChange={(e) => setForecastDateCol(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
                >
                  {dateCols.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Metric:</label>
                <select
                  value={forecastValCol}
                  onChange={(e) => setForecastValCol(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
                >
                  {numCols.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Projection Horizon:</label>
                <div className="flex items-center gap-1">
                  {[3, 6, 12].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${
                        forecastHorizon === h
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {h} Months
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {forecastResult && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Projected Growth</span>
                  <span
                    className={`text-sm font-bold flex items-center justify-end gap-1 ${
                      forecastResult.growthRatePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {forecastResult.growthRatePercent >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {forecastResult.growthRatePercent > 0
                      ? `+${forecastResult.growthRatePercent}%`
                      : `${forecastResult.growthRatePercent}%`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Forecasting Visualization */}
          {forecastResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Holt-Winters Trend Forecast with 90% Confidence Tunnel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historical sequence + {forecastHorizon}-step projected trajectory with upper & lower variance bands
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-0.5 bg-blue-600 rounded" /> Actuals
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-0.5 bg-indigo-500 border-dashed rounded" /> Forecast
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 bg-indigo-100 rounded" /> 90% Confidence
                  </span>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecastResult.historyAndForecast}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        formatNumber(Number(val), 2),
                        name === 'actual'
                          ? 'Historical Value'
                          : name === 'forecast'
                          ? 'Forecast'
                          : name === 'confidenceUpper'
                          ? 'Upper Bound (+90%)'
                          : 'Lower Bound (-90%)',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stroke="none"
                      fill="#e0e7ff"
                      fillOpacity={0.6}
                      name="confidenceUpper"
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      stroke="none"
                      fill="#ffffff"
                      fillOpacity={1}
                      name="confidenceLower"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 4 }}
                      name="forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Historical Baseline Average</span>
                  <span className="text-lg font-bold text-slate-800">
                    {formatNumber(forecastResult.summary.historicalAverage, 2)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Forecast Horizon Average</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {formatNumber(forecastResult.summary.forecastAverage, 2)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Trend Classification</span>
                  <span className="text-lg font-bold text-emerald-600 uppercase">
                    {forecastResult.trendDirection}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No time-series date column detected</p>
              <p className="text-xs text-slate-500">
                Forecasting requires at least one date or timestamp dimension in the dataset.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
