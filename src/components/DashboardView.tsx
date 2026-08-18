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
import { formatNumber, formatCurrency } from '../services/dataEngine';

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

  // Palette colors for charts
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Smart Filters Bar */}
      {filterableColumns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Dynamic Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filterableColumns.map((col) => {
              const currentVal = selectedFilters[col.name]?.[0] || 'ALL';
              const options = col.topCategories || [];

              return (
                <div key={col.name} className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 truncate block">
                    {col.name.replace(/_/g, ' ')}
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) => handleFilterChange(col.name, e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredRows.length.toLocaleString()}</span> of{' '}
              {dataset.cleanedRows.length.toLocaleString()} rows based on active filter criteria.
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
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {kpi.category}
                </span>
                <span className="text-xs font-semibold text-slate-600 line-clamp-1 mt-0.5" title={kpi.label}>
                  {kpi.label}
                </span>
              </div>

              <div className="my-2">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
              </div>

              {kpi.changePercent !== undefined ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                    {isPositive ? '+' : ''}
                    {kpi.changePercent}%
                  </span>
                  <span className="text-slate-400 font-normal truncate">
                    {kpi.changeLabel || 'vs prev'}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-normal">Dataset metric</div>
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
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{chart.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{chart.description}</p>
              </div>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
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
                        <stop offset="5%" stopColor={chart.colors?.[0] || '#2563eb'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={chart.colors?.[0] || '#2563eb'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chart.yAxisKeys[0]}
                      stroke={chart.colors?.[0] || '#2563eb'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#grad_${chart.id})`}
                    />
                  </AreaChart>
                ) : chart.chartType === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey={chart.yAxisKeys[0]}
                      fill={chart.colors?.[0] || '#2563eb'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : chart.chartType === 'donut' ? (
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Pie
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {chart.data.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : chart.chartType === 'scatter' ? (
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name={chart.xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis type="number" dataKey="y" name={chart.yAxisKeys[0]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Scatter name="Data Points" data={chart.data} fill={chart.colors?.[0] || '#8b5cf6'} />
                  </ScatterChart>
                ) : (
                  <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chart.yAxisKeys[0]}
                      stroke={chart.colors?.[0] || '#2563eb'}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {chart.recommendationReason && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">{chart.recommendationReason}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Automated Business Insights & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Highlights */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/50 border border-indigo-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI-Calculated Business Insights</h3>
                <p className="text-xs text-indigo-200/70">Empirically derived from dataset statistics</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('chat')}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <span>Ask AI Analyst</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {dataset.insights.slice(0, 4).map((ins) => (
              <div
                key={ins.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5 hover:bg-slate-800/90 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    {ins.category}
                  </span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                      ins.importance === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Top Variable Correlations
              </h3>
              <button
                onClick={() => onNavigateToTab('eda')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                View Heatmap
              </button>
            </div>

            {dataset.correlations.length > 0 ? (
              <div className="space-y-2.5">
                {dataset.correlations.slice(0, 5).map((corr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{corr.col1}</span>
                      <span className="text-slate-400 mx-1">vs</span>
                      <span className="font-semibold text-slate-800">{corr.col2}</span>
                    </div>
                    <div
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        corr.correlation > 0.6
                          ? 'bg-emerald-100 text-emerald-800'
                          : corr.correlation < -0.6
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
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

          <div className="pt-4 border-t border-slate-100 mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">Explore advanced analytical engines:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToTab('ml')}
                className="font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
              >
                AutoML & What-If →
              </button>
              <button
                onClick={() => onNavigateToTab('sql')}
                className="font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 transition"
              >
                SQL Console →
              </button>
              <button
                onClick={() => onNavigateToTab('pivot')}
                className="font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
              >
                Pivot Matrix →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
