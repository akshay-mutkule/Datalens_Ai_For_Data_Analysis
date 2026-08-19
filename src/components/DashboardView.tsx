import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Percent,
  Sparkles,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  Lightbulb,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DatasetState, FilterState } from '../types/dataset';

interface DashboardViewProps {
  dataset: DatasetState;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  onNavigateToTab,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({});

  // 1. Identify low-to-medium cardinality columns for Smart Filters
  const filterableColumns = useMemo(() => {
    return dataset.profile.columns.filter(
      (c) =>
        c.dataType === 'categorical' &&
        !c.isIdentifier &&
        c.uniqueCount >= 2 &&
        c.uniqueCount <= 12
    );
  }, [dataset.profile.columns]);

  // 2. Filtered rows computation
  const filteredRows = useMemo(() => {
    let result = dataset.cleanedRows;
    for (const [col, values] of Object.entries(selectedFilters)) {
      if (Array.isArray(values) && values.length > 0) {
        result = result.filter((row) => (values as string[]).includes(String(row[col])));
      }
    }
    return result;
  }, [dataset.cleanedRows, selectedFilters]);

  const handleFilterChange = (colName: string, value: string) => {
    setSelectedFilters((prev) => {
      if (!value || value === 'ALL') {
        const next = { ...prev };
        delete next[colName];
        return next;
      }
      return { ...prev, [colName]: [value] };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  // Modern vibrant palette for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const getKPIIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('sales') || cat.includes('revenue') || cat.includes('monetary') || cat.includes('finance')) {
      return <DollarSign className="w-4 h-4 text-emerald-600" />;
    }
    if (cat.includes('user') || cat.includes('customer') || cat.includes('population') || cat.includes('employee')) {
      return <Users className="w-4 h-4 text-blue-600" />;
    }
    if (cat.includes('rate') || cat.includes('percent') || cat.includes('ratio') || cat.includes('churn')) {
      return <Percent className="w-4 h-4 text-purple-600" />;
    }
    if (cat.includes('volume') || cat.includes('count') || cat.includes('order') || cat.includes('quantity')) {
      return <ShoppingCart className="w-4 h-4 text-amber-600" />;
    }
    return <Activity className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Smart Filters Bar */}
      {filterableColumns.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Smart Dynamic Dimension Slicers</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filterableColumns.map((col) => {
              const currentVal = selectedFilters[col.name]?.[0] || 'ALL';
              const options = col.topCategories || [];

              return (
                <div key={col.name} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate block">
                    {col.name.replace(/_/g, ' ')}
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) => handleFilterChange(col.name, e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="ALL">All ({col.totalCount})</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value} ({opt.count})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {hasActiveFilters && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <div>
                Active slice: <span className="font-extrabold text-slate-900">{filteredRows.length.toLocaleString()}</span> of{' '}
                {dataset.cleanedRows.length.toLocaleString()} rows match selection criteria.
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dataset.kpis.map((kpi, index) => {
          const isPositive = (kpi.changePercent || 0) >= 0;
          return (
            <div
              key={kpi.id || index}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {kpi.category}
                </span>
                <div className="p-1.5 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform">
                  {getKPIIcon(kpi.category)}
                </div>
              </div>

              <div className="my-3">
                <span className="text-xs font-bold text-slate-600 line-clamp-1 block mb-1" title={kpi.label}>
                  {kpi.label}
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
              </div>

              {kpi.changePercent !== undefined ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {kpi.changePercent}%
                    </span>
                  </div>
                  <span className="text-slate-400 font-normal truncate text-[10px]">
                    {kpi.changeLabel || 'vs baseline'}
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-medium">Auto-derived metric</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dataset.charts.map((chart) => (
          <div
            key={chart.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">{chart.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{chart.description}</p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                {chart.chartType}
              </span>
            </div>

            {/* Chart Canvas */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chart.chartType === 'area' ? (
                  <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad_${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.colors?.[0] || '#3b82f6'} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={chart.colors?.[0] || '#3b82f6'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chart.yAxisKeys[0]}
                      stroke={chart.colors?.[0] || '#3b82f6'}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#grad_${chart.id})`}
                    />
                  </AreaChart>
                ) : chart.chartType === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar
                      dataKey={chart.yAxisKeys[0]}
                      fill={chart.colors?.[0] || '#3b82f6'}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                ) : chart.chartType === 'donut' ? (
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                    <Pie
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {chart.data.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : chart.chartType === 'scatter' ? (
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name={chart.xAxisKey} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis type="number" dataKey="y" name={chart.yAxisKeys[0]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Scatter name="Data Points" data={chart.data} fill={chart.colors?.[0] || '#8b5cf6'} />
                  </ScatterChart>
                ) : (
                  <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chart.yAxisKeys[0]}
                      stroke={chart.colors?.[0] || '#3b82f6'}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: chart.colors?.[0] || '#3b82f6' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {chart.recommendationReason && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{chart.recommendationReason}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Automated Business Insights & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Highlights */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Empirical Business Intelligence Synthesis</h3>
                <p className="text-xs text-indigo-200/70">Calculated directly from multi-column statistical distributions</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('chat')}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <span>Ask AI Analyst</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {dataset.insights.slice(0, 4).map((ins) => (
              <div
                key={ins.id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-1.5 hover:bg-slate-800/80 transition shadow-2xs backdrop-blur-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    {ins.category}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      ins.importance === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {ins.importance}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{ins.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Correlation Matrix Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Top Variable Correlations
              </h3>
              <button
                onClick={() => onNavigateToTab('eda')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                View Heatmap →
              </button>
            </div>

            {dataset.correlations.length > 0 ? (
              <div className="space-y-3">
                {dataset.correlations.slice(0, 5).map((corr, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{corr.col1}</span>
                      <span className="text-slate-400 mx-1.5 font-normal">↔</span>
                      <span className="font-bold text-slate-900">{corr.col2}</span>
                    </div>
                    <div
                      className={`font-mono font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                        corr.correlation > 0.6
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : corr.correlation < -0.6
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      r = {corr.correlation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Single or insufficient numerical columns for bivariate correlation.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex flex-col items-start gap-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              Explore advanced analytical engines:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onNavigateToTab('ml')}
                className="font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 transition shadow-2xs"
              >
                AutoML & What-If →
              </button>
              <button
                onClick={() => onNavigateToTab('clustering')}
                className="font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 transition shadow-2xs"
              >
                Clusters & PCA →
              </button>
              <button
                onClick={() => onNavigateToTab('anomalies')}
                className="font-bold text-rose-700 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 transition shadow-2xs"
              >
                Anomaly Sentinel →
              </button>
              <button
                onClick={() => onNavigateToTab('cohorts')}
                className="font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200 transition shadow-2xs"
              >
                Cohorts →
              </button>
              <button
                onClick={() => onNavigateToTab('sql')}
                className="font-bold text-slate-700 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition shadow-2xs"
              >
                SQL Console →
              </button>
              <button
                onClick={() => onNavigateToTab('notebook')}
                className="font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 transition shadow-2xs"
              >
                Python & R Code →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
