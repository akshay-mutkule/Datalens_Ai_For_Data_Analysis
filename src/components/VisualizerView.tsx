import React, { useState, useMemo, useRef } from 'react';
import {
  PieChart,
  BarChart,
  LineChart,
  Activity,
  Sliders,
  Sparkles,
  Download,
  Maximize2,
  Layers,
  Palette,
  Eye,
  FileSpreadsheet,
  Check,
  RotateCcw,
  TrendingUp,
  Table as TableIcon,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  AreaChart as RAreaChart,
  Area,
  ScatterChart as RScatterChart,
  Scatter,
  PieChart as RPieChart,
  Pie,
  Cell,
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DatasetState } from '../types/dataset';
import { formatNumber } from '../services/dataEngine';

interface VisualizerViewProps {
  dataset: DatasetState;
}

export const VisualizerView: React.FC<VisualizerViewProps> = ({ dataset }) => {
  const numCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset.profile.columns]
  );
  const catCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'categorical' && !c.isIdentifier),
    [dataset.profile.columns]
  );
  const dateCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'date'),
    [dataset.profile.columns]
  );
  const allCols = dataset.profile.columns;

  const [chartType, setChartType] = useState<
    'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar' | 'stacked_bar'
  >('bar');

  const [xAxisKey, setXAxisKey] = useState<string>(
    catCols[0]?.name || dateCols[0]?.name || allCols[0]?.name || ''
  );
  const [selectedYMetrics, setSelectedYMetrics] = useState<string[]>([
    numCols[0]?.name || '',
  ]);
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count' | 'max' | 'min'>('sum');
  const [limit, setLimit] = useState<number>(15);
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'alpha' | 'none'>('value_desc');
  const [colorTheme, setColorTheme] = useState<string>('indigo');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Color Theme Palettes
  const THEMES: Record<string, string[]> = {
    indigo: ['#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
    emerald: ['#059669', '#10b981', '#34d399', '#065f46', '#047857', '#6ee7b7', '#14b8a6'],
    sunset: ['#ea580c', '#f97316', '#fbbf24', '#e11d48', '#be123c', '#fb7185', '#d97706'],
    cyber: ['#8b5cf6', '#a855f7', '#d946ef', '#06b6d4', '#3b82f6', '#ec4899', '#6366f1'],
    slate: ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b', '#0f172a', '#cbd5e1'],
  };

  const currentColors = THEMES[colorTheme] || THEMES.indigo;

  // Toggle multi-metric selection
  const handleToggleYMetric = (metric: string) => {
    if (selectedYMetrics.includes(metric)) {
      if (selectedYMetrics.length <= 1) return; // Keep at least 1
      setSelectedYMetrics(selectedYMetrics.filter((m) => m !== metric));
    } else {
      setSelectedYMetrics([...selectedYMetrics, metric]);
    }
  };

  // Dynamically compute aggregated chart data based on user configuration
  const chartData = useMemo(() => {
    if (!xAxisKey || selectedYMetrics.length === 0 || dataset.cleanedRows.length === 0) return [];

    if (chartType === 'scatter') {
      const yKey = selectedYMetrics[0] || '';
      return dataset.cleanedRows.slice(0, 200).map((r) => ({
        x: Number(r[xAxisKey]) || 0,
        y: Number(r[yKey]) || 0,
        label: String(r[xAxisKey] || ''),
      }));
    }

    const groupMap: Record<
      string,
      { count: number; metrics: Record<string, { total: number; max: number; min: number }> }
    > = {};

    for (const row of dataset.cleanedRows) {
      const rawX = row[xAxisKey];
      const xVal = String(rawX !== null && rawX !== undefined ? rawX : 'Unknown');

      if (!groupMap[xVal]) {
        groupMap[xVal] = { count: 0, metrics: {} };
        for (const m of selectedYMetrics) {
          groupMap[xVal].metrics[m] = { total: 0, max: -Infinity, min: Infinity };
        }
      }

      groupMap[xVal].count++;

      for (const m of selectedYMetrics) {
        const num = Number(row[m]) || 0;
        groupMap[xVal].metrics[m].total += num;
        if (num > groupMap[xVal].metrics[m].max) groupMap[xVal].metrics[m].max = num;
        if (num < groupMap[xVal].metrics[m].min) groupMap[xVal].metrics[m].min = num;
      }
    }

    let result = Object.entries(groupMap).map(([key, val]) => {
      const item: Record<string, any> = {
        [xAxisKey]: key,
        count: val.count,
      };

      for (const m of selectedYMetrics) {
        let finalVal = 0;
        const metricStat = val.metrics[m];
        if (aggregation === 'sum') finalVal = metricStat.total;
        else if (aggregation === 'avg') finalVal = val.count > 0 ? metricStat.total / val.count : 0;
        else if (aggregation === 'count') finalVal = val.count;
        else if (aggregation === 'max') finalVal = metricStat.max === -Infinity ? 0 : metricStat.max;
        else if (aggregation === 'min') finalVal = metricStat.min === Infinity ? 0 : metricStat.min;

        item[m] = Number(finalVal.toFixed(2));
      }

      return item;
    });

    const primaryMetric = selectedYMetrics[0];

    // Sorting
    if (sortBy === 'value_desc') {
      result.sort((a, b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0));
    } else if (sortBy === 'value_asc') {
      result.sort((a, b) => (a[primaryMetric] || 0) - (b[primaryMetric] || 0));
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => String(a[xAxisKey]).localeCompare(String(b[xAxisKey])));
    }

    return result.slice(0, limit);
  }, [
    dataset.cleanedRows,
    xAxisKey,
    selectedYMetrics,
    chartType,
    aggregation,
    sortBy,
    limit,
  ]);

  const handleDownloadCSV = () => {
    if (chartData.length === 0) return;
    const keys = Object.keys(chartData[0]);
    const csvContent = [
      keys.join(','),
      ...chartData.map((row) => keys.map((k) => `"${row[k]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datalens_chart_${xAxisKey}_${selectedYMetrics.join('_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Visualizer Studio Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center font-bold shadow-2xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Custom Visualization & Chart Studio
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compose dynamic multi-metric charts, custom aggregations, and high-contrast archetypes
                </p>
              </div>
            </div>
          </div>

          {/* Chart Archetype Tabs */}
          <div className="flex items-center flex-wrap bg-slate-100/80 p-1 rounded-2xl gap-1 border border-slate-200/60">
            {[
              { id: 'bar', label: 'Bar', icon: BarChart },
              { id: 'stacked_bar', label: 'Stacked Bar', icon: BarChart },
              { id: 'line', label: 'Multi-Line', icon: LineChart },
              { id: 'area', label: 'Area', icon: Activity },
              { id: 'pie', label: 'Donut', icon: PieChart },
              { id: 'radar', label: 'Radar', icon: Layers },
              { id: 'scatter', label: 'Scatter', icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setChartType(t.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                    chartType === t.id
                      ? 'bg-white text-indigo-600 shadow-2xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Controls Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* X-Axis / Grouping Dimension */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              X-Axis / Category Dimension
            </label>
            <select
              value={xAxisKey}
              onChange={(e) => setXAxisKey(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 transition"
            >
              {allCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.dataType})
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation Function */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Aggregation Method
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as any)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="sum">Sum (Total Aggregate)</option>
              <option value="avg">Average (Arithmetic Mean)</option>
              <option value="count">Count (Frequency)</option>
              <option value="max">Maximum Value</option>
              <option value="min">Minimum Value</option>
            </select>
          </div>

          {/* Limit / Top N Categories */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Top Categories / Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value={5}>Top 5 Categories</option>
              <option value={10}>Top 10 Categories</option>
              <option value={15}>Top 15 Categories</option>
              <option value={25}>Top 25 Categories</option>
              <option value={50}>Top 50 Categories</option>
            </select>
          </div>

          {/* Color Palette Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Color Aesthetic Theme
            </label>
            <select
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="indigo">Corporate Indigo</option>
              <option value="emerald">Emerald Forest</option>
              <option value="sunset">Sunset Orange</option>
              <option value="cyber">Cyberpunk Violet</option>
              <option value="slate">Monochrome Slate</option>
            </select>
          </div>
        </div>

        {/* Multi-Metric Selection Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Select Value Metrics (Y-Axes / Multi-Series):</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {selectedYMetrics.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {numCols.map((col) => {
              const isSelected = selectedYMetrics.includes(col.name);
              return (
                <button
                  key={col.name}
                  onClick={() => handleToggleYMetric(col.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Canvas & Presentation Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900 capitalize">
              {aggregation} of {selectedYMetrics.join(', ')} by {xAxisKey}
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/80">
              {chartType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showGrid
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Gridlines
            </button>
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                showDataTable
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Table</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Recharts Render Area */}
        <div ref={chartContainerRef} className="h-[420px] w-full pt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <RBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />}
                  <XAxis
                    dataKey={xAxisKey}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v, 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  {selectedYMetrics.map((metric, idx) => (
                    <Bar
                      key={metric}
                      dataKey={metric}
                      fill={currentColors[idx % currentColors.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </RBarChart>
              ) : chartType === 'stacked_bar' ? (
                <RBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />}
                  <XAxis
                    dataKey={xAxisKey}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v, 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  {selectedYMetrics.map((metric, idx) => (
                    <Bar
                      key={metric}
                      dataKey={metric}
                      stackId="a"
                      fill={currentColors[idx % currentColors.length]}
                      radius={idx === selectedYMetrics.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </RBarChart>
              ) : chartType === 'line' ? (
                <RLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />}
                  <XAxis
                    dataKey={xAxisKey}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v, 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  {selectedYMetrics.map((metric, idx) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={currentColors[idx % currentColors.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  ))}
                </RLineChart>
              ) : chartType === 'area' ? (
                <RAreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <defs>
                    {selectedYMetrics.map((metric, idx) => (
                      <linearGradient
                        key={metric}
                        id={`area_grad_${idx}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={currentColors[idx % currentColors.length]}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={currentColors[idx % currentColors.length]}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />}
                  <XAxis
                    dataKey={xAxisKey}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v, 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  {selectedYMetrics.map((metric, idx) => (
                    <Area
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={currentColors[idx % currentColors.length]}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#area_grad_${idx})`}
                    />
                  ))}
                </RAreaChart>
              ) : chartType === 'pie' ? (
                <RPieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Pie
                    data={chartData}
                    dataKey={selectedYMetrics[0]}
                    nameKey={xAxisKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    label={(entry) => `${entry[xAxisKey]}: ${formatNumber(entry[selectedYMetrics[0]], 0)}`}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={currentColors[index % currentColors.length]}
                      />
                    ))}
                  </Pie>
                </RPieChart>
              ) : chartType === 'radar' ? (
                <RRadarChart cx="50%" cy="50%" outerRadius={110} data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey={xAxisKey} stroke="#64748b" fontSize={11} />
                  <PolarRadiusAxis />
                  <Tooltip />
                  <Legend />
                  {selectedYMetrics.map((metric, idx) => (
                    <Radar
                      key={metric}
                      name={metric}
                      dataKey={metric}
                      stroke={currentColors[idx % currentColors.length]}
                      fill={currentColors[idx % currentColors.length]}
                      fillOpacity={0.35}
                    />
                  ))}
                </RRadarChart>
              ) : (
                <RScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                  <XAxis dataKey="x" name={xAxisKey} stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    dataKey="y"
                    name={selectedYMetrics[0]}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => formatNumber(v, 0)}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Points" data={chartData} fill={currentColors[0]} />
                </RScatterChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No data points available for the chosen configuration.
            </div>
          )}
        </div>

        {/* Aggregated Data Table Inspector */}
        {showDataTable && chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{xAxisKey}</th>
                  {selectedYMetrics.map((m) => (
                    <th key={m} className="py-2.5 px-3">
                      {m} ({aggregation})
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Record Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-800">{row[xAxisKey]}</td>
                    {selectedYMetrics.map((m) => (
                      <td key={m} className="py-2 px-3 font-mono text-slate-900">
                        {formatNumber(row[m], 2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-mono text-slate-500">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
