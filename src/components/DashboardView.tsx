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
  ArrowUpRight,
  BarChart3,
  Activity,
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
import { useTheme } from '../context/ThemeContext';
import { generateKPIs, generateSmartCharts } from '../services/dataEngine';

interface DashboardViewProps {
  dataset: DatasetState;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();
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

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  // 3. Recompute KPIs & Charts dynamically when sliced (or streamed)
  const activeKpis = useMemo(() => {
    if (!hasActiveFilters) return dataset.kpis;
    return generateKPIs(filteredRows, dataset.profile);
  }, [hasActiveFilters, filteredRows, dataset.profile, dataset.kpis]);

  const activeCharts = useMemo(() => {
    if (!hasActiveFilters) return dataset.charts;
    return generateSmartCharts(filteredRows, dataset.profile);
  }, [hasActiveFilters, filteredRows, dataset.profile, dataset.charts]);

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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const getKPIIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('sales') || cat.includes('revenue') || cat.includes('monetary') || cat.includes('finance')) {
      return <DollarSign className="w-4 h-4 text-emerald-500" />;
    }
    if (cat.includes('user') || cat.includes('customer') || cat.includes('population') || cat.includes('employee')) {
      return <Users className="w-4 h-4 text-blue-500" />;
    }
    if (cat.includes('rate') || cat.includes('percent') || cat.includes('ratio') || cat.includes('churn')) {
      return <Percent className="w-4 h-4 text-purple-400" />;
    }
    if (cat.includes('volume') || cat.includes('count') || cat.includes('order') || cat.includes('quantity')) {
      return <ShoppingCart className="w-4 h-4 text-amber-500" />;
    }
    return <Activity className="w-4 h-4 text-indigo-400" />;
  };

  const cardBg = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const subSurface = isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200';
  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const axisStroke = isDark ? '#475569' : '#cbd5e1';
  const tickFill = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Smart Dimension Slicers */}
      {filterableColumns.length > 0 && (
        <div className={`rounded-2xl border p-5 transition-colors ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              <span>Dimension Cross-Filters</span>
              {hasActiveFilters && (
                <span className={`font-mono tabular-nums ${mutedText}`}>
                  · {filteredRows.length.toLocaleString()} of {dataset.cleanedRows.length.toLocaleString()} rows
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
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
                  <label className={`text-xs font-medium truncate block capitalize ${mutedText}`}>
                    {col.name.replace(/_/g, ' ')}
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) => handleFilterChange(col.name, e.target.value)}
                    className={`w-full text-xs font-medium rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition ${subSurface} ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
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
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {activeKpis.map((kpi, index) => {
          const isPositive = (kpi.changePercent || 0) >= 0;
          return (
            <div
              key={kpi.id || index}
              className={`rounded-2xl border p-4 transition-colors flex flex-col justify-between ${cardBg}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium ${mutedText}`}>
                  {kpi.category}
                </span>
                {getKPIIcon(kpi.category)}
              </div>

              <div className="my-2.5">
                <span className={`text-xs font-medium line-clamp-1 block mb-1 ${mutedText}`} title={kpi.label}>
                  {kpi.label}
                </span>
                <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
                  {kpi.value}
                </div>
              </div>

              {kpi.changePercent !== undefined ? (
                <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                  <span className={`flex items-center gap-1 font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {isPositive ? '+' : ''}
                    {kpi.changePercent}%
                  </span>
                  <span className={`text-[11px] font-sans truncate ${mutedText}`}>
                    · {kpi.changeLabel || 'vs baseline'}
                  </span>
                </div>
              ) : (
                <div className={`text-[11px] ${mutedText}`}>
                  {hasActiveFilters ? 'Filtered slice' : 'Derived metric'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      {activeCharts.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${cardBg}`}>
          <p className="text-sm font-semibold">No records match the active filter combination</p>
          <p className={`text-xs mt-1 ${mutedText}`}>Reset dimension filters above to restore dashboard visualizations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeCharts.map((chart) => (
            <div
              key={chart.id}
              className={`rounded-2xl border p-5 transition-colors space-y-4 ${cardBg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm tracking-tight">{chart.title}</h3>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>{chart.description}</p>
                </div>
                <span className={`text-xs font-mono capitalize shrink-0 ${mutedText}`}>
                  {chart.chartType}
                </span>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.chartType === 'area' ? (
                    <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad_${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chart.colors?.[0] || '#3b82f6'} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chart.colors?.[0] || '#3b82f6'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <YAxis tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey={chart.yAxisKeys[0]}
                        stroke={chart.colors?.[0] || '#3b82f6'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad_${chart.id})`}
                      />
                    </AreaChart>
                  ) : chart.chartType === 'bar' ? (
                    <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <YAxis tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
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
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: tickFill }} />
                      <Pie
                        data={chart.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {chart.data.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : chart.chartType === 'scatter' ? (
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis type="number" dataKey="x" name={chart.xAxisKey} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <YAxis type="number" dataKey="y" name={chart.yAxisKeys[0]} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      />
                      <Scatter name="Data Points" data={chart.data} fill={chart.colors?.[0] || '#8b5cf6'} />
                    </ScatterChart>
                  ) : (
                    <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <YAxis tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={chart.yAxisKeys[0]}
                        stroke={chart.colors?.[0] || '#3b82f6'}
                        strokeWidth={2}
                        dot={{ r: 3, fill: chart.colors?.[0] || '#3b82f6' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {chart.recommendationReason && (
                <div className={`pt-3 border-t text-xs truncate ${isDark ? 'border-slate-800' : 'border-slate-100'} ${mutedText}`}>
                  {chart.recommendationReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Automated Business Insights & Correlation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-2xl border p-6 space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base">Empirical Business Intelligence Synthesis</h3>
              <p className={`text-xs ${mutedText}`}>
                Derived directly from multi-column statistical distributions
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('chat')}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Analyst</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {dataset.insights.slice(0, 4).map((ins) => (
              <div
                key={ins.id}
                className={`rounded-xl border p-4 space-y-1.5 ${subSurface}`}
              >
                <div className={`flex items-center gap-2 text-xs font-medium ${mutedText}`}>
                  <span className="capitalize text-blue-500 font-semibold">{ins.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`capitalize ${ins.importance === 'high' ? 'text-amber-500 font-semibold' : ''}`}>
                    {ins.importance} priority
                  </span>
                </div>
                <h4 className="text-sm font-semibold">{ins.title}</h4>
                <p className={`text-xs leading-relaxed ${mutedText}`}>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Correlation Matrix Summary & Direct Studio Launchers */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Top Variable Correlations
              </h3>
              <button
                onClick={() => onNavigateToTab('graph')}
                className="text-xs text-blue-500 hover:underline font-semibold"
              >
                Open Graph →
              </button>
            </div>

            {dataset.correlations.length > 0 ? (
              <div className="space-y-2.5">
                {dataset.correlations.slice(0, 5).map((corr, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${subSurface}`}
                  >
                    <div className="truncate font-medium">
                      <span>{corr.col1}</span>
                      <span className={`mx-1.5 ${mutedText}`}>↔</span>
                      <span>{corr.col2}</span>
                    </div>
                    <span
                      className={`font-mono tabular-nums font-bold shrink-0 ${
                        corr.correlation > 0.6
                          ? 'text-emerald-500'
                          : corr.correlation < -0.6
                          ? 'text-rose-500'
                          : mutedText
                      }`}
                    >
                      r = {corr.correlation}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`py-8 text-center text-xs ${mutedText}`}>
                Single or insufficient numerical columns for bivariate correlation.
              </div>
            )}
          </div>

          <div className={`pt-4 border-t mt-4 space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <span className={`text-xs font-semibold block ${mutedText}`}>
              Specialized Analytical Studios
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'optimizer', label: 'Pareto Optimizer' },
                { id: 'graph', label: 'Knowledge Graph' },
                { id: 'risk', label: 'Stress & Risk' },
                { id: 'arena', label: 'Model Arena' },
                { id: 'causal', label: 'Causal AI' },
                { id: 'sql', label: 'SQL Studio' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigateToTab(s.id)}
                  className={`text-left px-3 py-2 rounded-lg border font-medium transition-colors truncate ${subSurface} hover:border-blue-500/50`}
                >
                  {s.label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
