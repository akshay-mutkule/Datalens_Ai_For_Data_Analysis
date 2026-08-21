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
  BookmarkPlus,
  Trash2,
  Compass,
  Zap,
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

interface SavedScenario {
  id: string;
  name: string;
  predictedValue: number;
  deltaFromBaseline: number;
  sliderValues: Record<string, number>;
  createdAt: string;
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
  const defaultTarget =
    numCols.find((c) =>
      ['profit', 'revenue', 'sales', 'salary', 'mrr', 'treatment_cost', 'price'].includes(
        c.name.toLowerCase()
      )
    )?.name ||
    numCols[0]?.name ||
    '';

  const [targetCol, setTargetCol] = useState<string>(defaultTarget);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [model, setModel] = useState<MLModelResult | null>(null);

  // What-If Sliders State
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Saved Scenarios for Multi-Scenario Comparison
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState('');

  // Goal Seek State
  const [goalSeekTargetValue, setGoalSeekTargetValue] = useState<number>(100000);
  const [goalSeekLeverCol, setGoalSeekLeverCol] = useState<string>('');
  const [goalSeekResult, setGoalSeekResult] = useState<{
    requiredValue: number;
    isFeasible: boolean;
    minHistorical: number;
    maxHistorical: number;
    leverName: string;
  } | null>(null);

  // Forecasting State
  const [forecastDateCol, setForecastDateCol] = useState<string>(dateCols[0]?.name || '');
  const [forecastValCol, setForecastValCol] = useState<string>(defaultTarget);
  const [forecastHorizon, setForecastHorizon] = useState<number>(6);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'goalseek' | 'automl' | 'forecasting'>('simulator');

  // Initialize features and model when target changes
  useEffect(() => {
    if (!targetCol) return;
    const availableFeatures = numCols.filter((c) => c.name !== targetCol).map((c) => c.name);
    setSelectedFeatures(availableFeatures);

    const trained = trainRegressionModel(dataset.cleanedRows, targetCol, availableFeatures);
    setModel(trained);

    if (availableFeatures.length > 0 && !goalSeekLeverCol) {
      setGoalSeekLeverCol(availableFeatures[0]);
    }

    // Initialize slider values to means
    if (trained) {
      const initialSliders: Record<string, number> = {};
      for (const feat of availableFeatures) {
        const colProfile = numCols.find((c) => c.name === feat);
        initialSliders[feat] = colProfile?.stats?.mean || 0;
      }
      setSliderValues(initialSliders);

      const targetProf = numCols.find((c) => c.name === targetCol);
      if (targetProf?.stats?.mean) {
        setGoalSeekTargetValue(Number((targetProf.stats.mean * 1.25).toFixed(0)));
      }
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
    const prof = numCols.find((c) => c.name === targetCol);
    return prof?.stats?.mean || 0;
  }, [numCols, targetCol]);

  // Delta calculation
  const deltaPercent = useMemo(() => {
    if (!whatIfPrediction || targetBaselineMean === 0) return 0;
    return (
      ((whatIfPrediction.predictedValue - targetBaselineMean) / Math.abs(targetBaselineMean)) * 100
    );
  }, [whatIfPrediction, targetBaselineMean]);

  // Reset Sliders
  const handleResetSliders = () => {
    const initialSliders: Record<string, number> = {};
    for (const feat of selectedFeatures) {
      const colProfile = numCols.find((c) => c.name === feat);
      initialSliders[feat] = colProfile?.stats?.mean || 0;
    }
    setSliderValues(initialSliders);
  };

  // Save Scenario Snapshot
  const handleSaveScenario = () => {
    if (!whatIfPrediction) return;
    const name = scenarioNameInput.trim() || `Scenario ${savedScenarios.length + 1}`;
    const newScenario: SavedScenario = {
      id: 'scen_' + Date.now(),
      name,
      predictedValue: whatIfPrediction.predictedValue,
      deltaFromBaseline: deltaPercent,
      sliderValues: { ...sliderValues },
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSavedScenarios((prev) => [...prev, newScenario]);
    setScenarioNameInput('');
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyScenario = (scenario: SavedScenario) => {
    setSliderValues({ ...scenario.sliderValues });
  };

  // Goal Seek Calculation
  const handleRunGoalSeek = () => {
    if (!model || !goalSeekLeverCol) return;
    const leverCoeff = model.coefficients[goalSeekLeverCol];
    if (!leverCoeff || leverCoeff === 0) {
      return;
    }

    let otherTermsSum = model.intercept;
    for (const [feat, coeff] of Object.entries(model.coefficients)) {
      if (feat !== goalSeekLeverCol) {
        const val = sliderValues[feat] || 0;
        otherTermsSum += coeff * val;
      }
    }

    const requiredVal = (goalSeekTargetValue - otherTermsSum) / leverCoeff;
    const leverProf = numCols.find((c) => c.name === goalSeekLeverCol);
    const minVal = leverProf?.stats?.min || 0;
    const maxVal = leverProf?.stats?.max || 100000;

    const feasible = requiredVal >= minVal * 0.7 && requiredVal <= maxVal * 1.5;

    setGoalSeekResult({
      requiredValue: Number(requiredVal.toFixed(2)),
      isFeasible: feasible,
      minHistorical: minVal,
      maxHistorical: maxVal,
      leverName: goalSeekLeverCol,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration & Sub-Tab Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Predictive AI, What-If Simulation & Goal Seek
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/80">
                AutoML Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multivariate OLS regressions, inverse goal optimization, and time-series projections
            </p>
          </div>
        </div>

        {/* Target Variable Selector & Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-700">Target Outcome:</span>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            >
              {numCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('goalseek');
                handleRunGoalSeek();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'goalseek'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goal Seek</span>
            </button>
            <button
              onClick={() => setActiveTab('automl')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'automl'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Model Diagnostics</span>
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'forecasting'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Time Forecasting</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 1: WHAT-IF SIMULATOR */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'simulator' && model && whatIfPrediction && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Feature Sliders */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Independent Feature Levers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust parameter values to simulate real-time projected outcomes
                </p>
              </div>
              <button
                onClick={handleResetSliders}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Means</span>
              </button>
            </div>

            {/* Sliders List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {selectedFeatures.map((feat) => {
                const prof = numCols.find((c) => c.name === feat);
                const min = prof?.stats?.min ?? 0;
                const max = prof?.stats?.max ?? 100;
                const currentVal = sliderValues[feat] ?? prof?.stats?.mean ?? 0;
                const coeff = model.coefficients[feat] ?? 0;

                return (
                  <div
                    key={feat}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{feat}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            coeff >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {coeff >= 0 ? '+' : ''}
                          {coeff.toFixed(3)}x Impact
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-xs text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        {formatNumber(currentVal, 2)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={(max - min) / 100 || 1}
                      value={currentVal}
                      onChange={(e) =>
                        setSliderValues((prev) => ({
                          ...prev,
                          [feat]: Number(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Min: {formatNumber(min, 1)}</span>
                      <span>Max: {formatNumber(max, 1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Snapshot Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={scenarioNameInput}
                onChange={(e) => setScenarioNameInput(e.target.value)}
                placeholder="Name this scenario (e.g. +15% Marketing, Discount Cut)..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSaveScenario}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Scenario</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Output & Comparative Scenarios */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Projected Outcome Card */}
            <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Live Simulated Outcome
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    deltaPercent >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {deltaPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}% vs Baseline</span>
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400">Projected {targetCol}</div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight mt-1">
                  {formatNumber(whatIfPrediction.predictedValue, 2)}
                </div>
              </div>

              {/* Confidence Interval Cone */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs space-y-1">
                <div className="text-slate-300 font-medium">90% Confidence Interval Range:</div>
                <div className="font-mono text-indigo-200 font-bold">
                  [{formatNumber(whatIfPrediction.lowerBound, 2)} ...{' '}
                  {formatNumber(whatIfPrediction.upperBound, 2)}]
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Historical Mean Baseline: {formatNumber(targetBaselineMean, 2)}
                </div>
              </div>
            </div>

            {/* Saved Scenarios Comparison Matrix */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Scenario Comparison Matrix ({savedScenarios.length})
                </h4>
              </div>

              {savedScenarios.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedScenarios.map((scen) => (
                    <div
                      key={scen.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-slate-800">{scen.name}</div>
                        <div className="text-[10px] text-slate-400">{scen.createdAt}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-indigo-600">
                          {formatNumber(scen.predictedValue, 2)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            scen.deltaFromBaseline >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {scen.deltaFromBaseline >= 0 ? '+' : ''}
                          {scen.deltaFromBaseline.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApplyScenario(scen)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[11px]"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(scen.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No scenarios saved yet. Use "Save Scenario" above to compare multiple What-If hypotheses side-by-side.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 2: GOAL SEEK (INVERSE OPTIMIZER) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'goalseek' && model && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Goal Seek & Inverse Optimization Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify your target desired outcome, choose an adjustable lever, and mathematically solve for the exact required input.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Desired Target Goal for {targetCol}
              </label>
              <input
                type="number"
                value={goalSeekTargetValue}
                onChange={(e) => setGoalSeekTargetValue(Number(e.target.value))}
                className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Adjustable Lever (Independent Variable to Optimize)
              </label>
              <select
                value={goalSeekLeverCol}
                onChange={(e) => setGoalSeekLeverCol(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {selectedFeatures.map((feat) => (
                  <option key={feat} value={feat}>
                    {feat} (Coeff: {model.coefficients[feat]?.toFixed(3) || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunGoalSeek}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Solve for Required {goalSeekLeverCol}</span>
          </button>

          {/* Goal Seek Results Card */}
          {goalSeekResult && (
            <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Optimization Calculation Output
                </span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    goalSeekResult.isFeasible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {goalSeekResult.isFeasible ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {goalSeekResult.isFeasible
                      ? 'Feasible Parameter Value'
                      : 'Outside Historical Range (Extrapolation Alert)'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Required {goalSeekResult.leverName}
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-indigo-600 mt-1 block">
                    {formatNumber(goalSeekResult.requiredValue, 2)}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Historical Observed Range
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-800 mt-1.5 block">
                    [{formatNumber(goalSeekResult.minHistorical, 1)} ...{' '}
                    {formatNumber(goalSeekResult.maxHistorical, 1)}]
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Target Goal
                  </span>
                  <span className="text-sm font-extrabold font-mono text-emerald-600 mt-1.5 block">
                    {targetCol} = {formatNumber(goalSeekTargetValue, 2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 3: MODEL DIAGNOSTICS & FEATURE IMPORTANCE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'automl' && model && (
        <div className="space-y-6">
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">R² (Goodness of Fit)</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {(model.rSquared * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Variance explained by model
              </span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">RMSE (Root Mean Sq Err)</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {formatNumber(model.rmse, 2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Std deviation of residuals
              </span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">MAE (Mean Abs Err)</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {formatNumber(model.mae, 2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Average absolute error
              </span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Features in Model</span>
              <span className="text-2xl font-extrabold font-mono text-indigo-600 mt-1 block">
                {selectedFeatures.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Intercept: {formatNumber(model.intercept, 2)}
              </span>
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Normalized Feature Importance & Sensitivity Rankings
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={model.featureImportance}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 1]} />
                  <YAxis type="category" dataKey="feature" stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 4: TIME-SERIES FORECASTING */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Time-Series Holt-Winters Linear Projection Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extrapolate historical chronological trajectories into future periods with uncertainty cones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Horizon:</span>
                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                >
                  <option value={3}>Next 3 Periods</option>
                  <option value={6}>Next 6 Periods</option>
                  <option value={12}>Next 12 Periods</option>
                </select>
              </div>
            </div>

            {forecastResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Historical Average
                    </span>
                    <span className="text-lg font-extrabold font-mono text-slate-900 mt-1 block">
                      {formatNumber(forecastResult.summary.historicalAverage, 2)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Projected Forecast Average
                    </span>
                    <span className="text-lg font-extrabold font-mono text-indigo-600 mt-1 block">
                      {formatNumber(forecastResult.summary.forecastAverage, 2)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Projected Growth Trajectory
                    </span>
                    <span
                      className={`text-lg font-extrabold font-mono mt-1 block ${
                        forecastResult.growthRatePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {forecastResult.growthRatePercent >= 0 ? '+' : ''}
                      {forecastResult.growthRatePercent}%
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={forecastResult.historyAndForecast}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => formatNumber(v, 0)} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke="none"
                        fill="#cbd5e1"
                        fillOpacity={0.4}
                        name="90% Upper Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                        name="90% Lower Bound"
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#0f172a"
                        strokeWidth={3}
                        name="Observed Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        strokeDasharray="4 4"
                        name="Projected Forecast"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No date column identified for temporal forecasting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
