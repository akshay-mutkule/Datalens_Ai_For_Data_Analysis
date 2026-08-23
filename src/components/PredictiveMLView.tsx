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
  Trophy,
  GitBranch,
  Gauge,
  HelpCircle,
  TrendingDown,
  Cpu,
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
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  DatasetState,
  MLModelResult,
  ForecastResult,
  TournamentModelItem,
  DecisionTreeNode,
  KeyDriverDecomposition,
} from '../types/dataset';
import {
  trainRegressionModel,
  predictWhatIfValue,
  forecastTimeSeries,
  runAutoMLTournament,
  TournamentResult,
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

  // Tournament State
  const [tournamentResult, setTournamentResult] = useState<TournamentResult | null>(null);
  const [selectedTournamentModel, setSelectedTournamentModel] = useState<TournamentModelItem | null>(null);

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
  const [activeTab, setActiveTab] = useState<'tournament' | 'simulator' | 'goalseek' | 'drivers' | 'tree' | 'forecasting'>('tournament');

  // Initialize features, baseline model and tournament when target changes
  useEffect(() => {
    if (!targetCol) return;
    const availableFeatures = numCols.filter((c) => c.name !== targetCol).map((c) => c.name);
    setSelectedFeatures(availableFeatures);

    const trained = trainRegressionModel(dataset.cleanedRows, targetCol, availableFeatures);
    setModel(trained);

    // Run AutoML tournament
    if (availableFeatures.length > 0) {
      const tourney = runAutoMLTournament(dataset.cleanedRows, targetCol, availableFeatures);
      setTournamentResult(tourney);
      setSelectedTournamentModel(tourney.championModel);
    }

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

  // Re-run tournament when feature selection changes
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

    if (updated.length > 0) {
      const tourney = runAutoMLTournament(dataset.cleanedRows, targetCol, updated);
      setTournamentResult(tourney);
      setSelectedTournamentModel(tourney.championModel);
    }
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
        otherTermsSum += Number(coeff) * val;
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

  // Recursive Decision Tree Node Component
  const renderTreeNode = (node: DecisionTreeNode) => {
    if (node.isLeaf) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-2xs text-center min-w-[140px]">
          <div className="text-[10px] uppercase font-extrabold text-emerald-700">Leaf Node (Outcome)</div>
          <div className="text-base font-black text-emerald-950 mt-1">{formatNumber(node.prediction || 0)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            n = {node.sampleCount} rows | MSE: {node.mse}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        {/* Current Decision Split Box */}
        <div className="bg-white border-2 border-indigo-500/80 rounded-2xl p-3.5 shadow-sm text-center min-w-[180px]">
          <div className="text-[10px] uppercase font-extrabold text-indigo-600 flex items-center justify-center gap-1">
            <GitBranch className="w-3 h-3" /> Split Condition
          </div>
          <div className="text-xs font-black text-slate-900 mt-1">
            {node.feature?.replace(/_/g, ' ')} &le; {formatNumber(node.threshold || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sub-samples: {node.sampleCount} | Mean: {formatNumber(node.prediction || 0)}
          </div>
        </div>

        {/* Branch Lines and Children */}
        <div className="flex items-start gap-8 mt-4 relative pt-4">
          <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-300" />
          <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-slate-300 -translate-x-1/2" />

          {/* Left Branch (True / <=) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mb-2 border border-indigo-200">
              YES (&le; {formatNumber(node.threshold || 0)})
            </span>
            {node.left && renderTreeNode(node.left)}
          </div>

          {/* Right Branch (False / >) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mb-2 border border-amber-200">
              NO (&gt; {formatNumber(node.threshold || 0)})
            </span>
            {node.right && renderTreeNode(node.right)}
          </div>
        </div>
      </div>
    );
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
                Predictive AI, AutoML Tournament & Goal Seek
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/80">
                AutoML Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare 5 algorithms, simulate what-if outcomes, solve inverse levers & inspect decision trees
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

          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('tournament')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tournament'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Model Tournament</span>
            </button>
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
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'drivers'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Key Drivers & Shapley</span>
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tree'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Decision Tree (CART)</span>
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

      {/* Feature Selection Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Active Regressor Features:</span>
          <div className="flex flex-wrap gap-1.5">
            {numCols
              .filter((c) => c.name !== targetCol)
              .map((c) => {
                const isSelected = selectedFeatures.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => handleToggleFeature(c.name)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3 h-3 text-indigo-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                    {c.name}
                  </button>
                );
              })}
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {selectedFeatures.length} features active in training set
        </span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 1: AUTOML TOURNAMENT & MULTI-MODEL LEADERBOARD */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tournament' && tournamentResult && (
        <div className="space-y-6">
          {/* Champion Model Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Tournament Champion
                  </span>
                  <span className="text-xs text-indigo-200">5 Candidate Algorithms Evaluated</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">{tournamentResult.championModel.name}</h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {tournamentResult.championModel.notes} Best generalizability on {targetCol} with minimal residual dispersion.
                </p>
              </div>

              {/* Champion Quick Metric Pills */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-300 font-bold uppercase">R² Score</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {(tournamentResult.championModel.rSquared * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-300 font-bold uppercase">RMSE</div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {formatNumber(tournamentResult.championModel.rmse)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-300 font-bold uppercase">Latency</div>
                  <div className="text-xl font-black text-indigo-300 mt-0.5">
                    {tournamentResult.championModel.trainingTimeMs}ms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Leaderboard Table & Model Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Leaderboard Matrix */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-indigo-600" />
                    AutoML Algorithm Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked by Coefficient of Determination (R²) and Root Mean Squared Error (RMSE)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">Rank & Model</th>
                      <th className="py-2.5 px-2 text-right">R² Fit</th>
                      <th className="py-2.5 px-2 text-right">RMSE</th>
                      <th className="py-2.5 px-2 text-right">MAE</th>
                      <th className="py-2.5 px-2 text-right">Train Time</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tournamentResult.models.map((m, idx) => {
                      const isSelected = selectedTournamentModel?.id === m.id;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedTournamentModel(m)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50/80 font-bold text-indigo-950'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  idx === 0
                                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-extrabold text-slate-900 block">{m.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{m.algorithm}</span>
                              </div>
                              {m.isChampion && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                  Champion
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">
                            {(m.rSquared * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                            {formatNumber(m.rmse)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-600">
                            {formatNumber(m.mae)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-500">
                            {m.trainingTimeMs}ms
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTournamentModel(m);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? 'Active' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Model Deep-Dive Inspector */}
            {selectedTournamentModel && (
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-indigo-600">Model Inspection</span>
                    <h4 className="font-black text-sm text-slate-900">{selectedTournamentModel.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-200">
                    R² = {(selectedTournamentModel.rSquared * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Actual vs Predicted Scatter Chart */}
                <div>
                  <div className="text-xs font-extrabold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Actual vs. Predicted Residual Dispersion</span>
                    <span className="text-[10px] text-slate-400 font-normal">30 sample validations</span>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          dataKey="actual"
                          name="Actual"
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                        />
                        <YAxis
                          type="number"
                          dataKey="predicted"
                          name="Predicted"
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(v: any) => formatNumber(Number(v))}
                        />
                        <Scatter
                          name="Predictions"
                          data={selectedTournamentModel.predictions}
                          fill="#6366f1"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Hyperparameter Settings */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                  <div className="text-[10px] uppercase font-extrabold text-slate-400">Hyperparameters & Config</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(selectedTournamentModel.hyperparameters).map(([k, v]) => (
                      <div key={k} className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block">{k}</span>
                        <span className="font-bold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 2: WHAT-IF SIMULATOR */}
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
                Reset Baselines
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {selectedFeatures.map((feat) => {
                const colProfile = numCols.find((c) => c.name === feat);
                const min = colProfile?.stats?.min || 0;
                const max = colProfile?.stats?.max || 100;
                const mean = colProfile?.stats?.mean || 50;
                const currentVal = sliderValues[feat] ?? mean;
                const step = max - min > 1000 ? Math.round((max - min) / 100) : (max - min) / 50 || 1;
                const coeff = model.coefficients[feat] || 0;

                return (
                  <div key={feat} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{feat}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            coeff >= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          Coeff: {coeff >= 0 ? '+' : ''}
                          {coeff.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentVal}
                          onChange={(e) =>
                            setSliderValues((prev) => ({
                              ...prev,
                              [feat]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-24 text-right font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Slider Input */}
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={currentVal}
                      onChange={(e) =>
                        setSliderValues((prev) => ({
                          ...prev,
                          [feat]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Min: {formatNumber(min)}</span>
                      <span className="text-slate-500 font-semibold">Baseline: {formatNumber(mean)}</span>
                      <span>Max: {formatNumber(max)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Projected Outcome & 95% Confidence Bounds */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Live Projected Outcome
                </span>
                <span className="text-xs font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                  Target: {targetCol}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-4xl font-black tracking-tight">
                  {formatNumber(whatIfPrediction.predictedValue)}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      deltaPercent >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {deltaPercent >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {deltaPercent >= 0 ? '+' : ''}
                    {deltaPercent.toFixed(1)}% vs. Historical Average
                  </span>
                </div>
              </div>

              {/* Confidence Interval (95%) */}
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-2 backdrop-blur-md">
                <div className="flex justify-between text-xs text-indigo-200">
                  <span className="font-bold">95% Confidence Interval:</span>
                  <span className="font-mono">
                    [{formatNumber(whatIfPrediction.confidenceLower)} – {formatNumber(whatIfPrediction.confidenceUpper)}]
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                  <div className="bg-emerald-400 h-full rounded-full w-2/3 mx-auto" />
                </div>
              </div>

              {/* Save Scenario Snapshot */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Scenario name (e.g. Q3 Growth)..."
                  value={scenarioNameInput}
                  onChange={(e) => setScenarioNameInput(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs rounded-xl px-3 py-2 flex-1 focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleSaveScenario}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* Saved Scenarios Comparison Matrix */}
            {savedScenarios.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
                    Saved Simulation Scenarios ({savedScenarios.length})
                  </h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedScenarios.map((scen) => (
                    <div
                      key={scen.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{scen.name}</span>
                        <span className="text-[10px] text-slate-400">{scen.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            {formatNumber(scen.predictedValue)}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              scen.deltaFromBaseline >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {scen.deltaFromBaseline >= 0 ? '+' : ''}
                            {scen.deltaFromBaseline.toFixed(1)}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplyScenario(scen)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(scen.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 3: INVERSE GOAL SEEK OPTIMIZER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'goalseek' && model && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Inverse Goal Seek Formulation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set a desired business target and calculate the exact required input lever
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                  1. Desired Target Outcome for <span className="text-indigo-600 font-mono">[{targetCol}]</span>
                </label>
                <input
                  type="number"
                  value={goalSeekTargetValue}
                  onChange={(e) => setGoalSeekTargetValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                  2. Select Adjustable Lever Feature
                </label>
                <select
                  value={goalSeekLeverCol}
                  onChange={(e) => setGoalSeekLeverCol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500"
                >
                  {selectedFeatures.map((f) => (
                    <option key={f} value={f}>
                      {f} (Coeff: {model.coefficients[f]?.toFixed(2) || '0.00'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunGoalSeek}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Calculate Required Lever Value
              </button>
            </div>
          </div>

          {/* Goal Seek Outcome Card */}
          <div className="lg:col-span-6">
            {goalSeekResult ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-700">Optimization Result</span>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      goalSeekResult.isFeasible
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {goalSeekResult.isFeasible ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {goalSeekResult.isFeasible ? 'Feasible Target' : 'Out-of-Range Risk'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold">
                    To achieve {targetCol} = {formatNumber(goalSeekTargetValue)}, you must set:
                  </div>
                  <div className="text-3xl font-black text-indigo-600 font-mono">
                    {goalSeekResult.leverName} = {formatNumber(goalSeekResult.requiredValue)}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Historical Minimum:</span>
                    <span className="font-mono font-bold">{formatNumber(goalSeekResult.minHistorical)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Historical Maximum:</span>
                    <span className="font-mono font-bold">{formatNumber(goalSeekResult.maxHistorical)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSliderValues((prev) => ({
                      ...prev,
                      [goalSeekResult.leverName]: goalSeekResult.requiredValue,
                    }));
                    setActiveTab('simulator');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Load into What-If Simulator
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <Target className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No Goal Seek Calculation Yet</p>
                <p className="text-[11px]">Click "Calculate Required Lever Value" to solve.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 4: KEY DRIVERS & SHAPLEY DECOMPOSITION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'drivers' && tournamentResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Key Driver Shapley Decomposition & Elasticity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Percentage variance contribution and sensitivity elasticity for {targetCol}
                </p>
              </div>
            </div>

            {/* Drivers Chart */}
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tournamentResult.keyDrivers}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" unit="%" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    stroke="#64748b"
                  />
                  <Tooltip formatter={(v: any) => `${v}% Shapley Share`} />
                  <Bar dataKey="shapleyPercent" radius={[0, 8, 8, 0]}>
                    {tournamentResult.keyDrivers.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.impactDirection === 'positive' ? '#4f46e5' : '#e11d48'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Driver Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {tournamentResult.keyDrivers.map((kd) => (
                <div key={kd.feature} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{kd.feature}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        kd.impactDirection === 'positive'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {kd.shapleyPercent}% Impact
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{kd.interpretation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 5: DECISION TREE CART VISUALIZER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tree' && tournamentResult?.decisionTreeRoot && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Interactive CART Decision Tree Graph
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recursive splitting logic based on Mean Squared Error (MSE) minimization
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              Target: {targetCol}
            </span>
          </div>

          <div className="overflow-x-auto py-4 flex justify-center">
            {renderTreeNode(tournamentResult.decisionTreeRoot)}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 6: TIME SERIES FORECASTING */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {dateCols.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-800">No Date Column Detected</h3>
              <p className="text-xs text-slate-500">
                Time-series forecasting requires at least one date or timestamp column.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Forecast Controls */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Date Dimension:</span>
                    <select
                      value={forecastDateCol}
                      onChange={(e) => setForecastDateCol(e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    >
                      {dateCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Value Metric:</span>
                    <select
                      value={forecastValCol}
                      onChange={(e) => setForecastValCol(e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    >
                      {numCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Horizon:</span>
                    <select
                      value={forecastHorizon}
                      onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    >
                      <option value={3}>3 Periods</option>
                      <option value={6}>6 Periods</option>
                      <option value={12}>12 Periods</option>
                    </select>
                  </div>
                </div>
              </div>

              {forecastResult && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Historical Trend & Future Projections
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Linear trend projection with 95% confidence cone
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastResult.historyAndForecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip formatter={(v: any) => formatNumber(Number(v))} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.1}
                          strokeWidth={2.5}
                          name="Historical Actuals"
                        />
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stroke="#10b981"
                          strokeDasharray="5 5"
                          fill="#10b981"
                          fillOpacity={0.1}
                          strokeWidth={2.5}
                          name="Projected Forecast"
                        />
                        <Area
                          type="monotone"
                          dataKey="confidenceUpper"
                          stroke="transparent"
                          fill="#10b981"
                          fillOpacity={0.05}
                          name="Upper Bound"
                        />
                        <Area
                          type="monotone"
                          dataKey="confidenceLower"
                          stroke="transparent"
                          fill="#10b981"
                          fillOpacity={0.05}
                          name="Lower Bound"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
