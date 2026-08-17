import React, { useState, useMemo } from 'react';
import {
  PieChart,
  BarChart,
  LineChart,
  Activity,
  Sliders,
  Sparkles,
  Download,
  Maximize2,
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
  const numCols = dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier);
  const allCols = dataset.profile.columns;

  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'scatter' | 'pie'>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>(allCols[0]?.name || '');
  const [yAxisKey, setYAxisKey] = useState<string>(numCols[0]?.name || '');
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count' | 'max' | 'min'>('sum');
  const [limit, setLimit] = useState<number>(15);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

  // Dynamically compute aggregated chart data based on user configuration
  const chartData = useMemo(() => {
    if (!xAxisKey || !yAxisKey || dataset.cleanedRows.length === 0) return [];

    if (chartType === 'scatter') {
      return dataset.cleanedRows.slice(0, 150).map((r) => ({
        x: Number(r[xAxisKey]) || 0,
        y: Number(r[yAxisKey]) || 0,
      }));
    }

    const groupMap: Record<string, { total: number; count: number; max: number; min: number }> = {};

    for (const row of dataset.cleanedRows) {
      const xVal = String(row[xAxisKey] || 'Unknown');
      const yVal = Number(row[yAxisKey]) || 0;

      if (!groupMap[xVal]) {
        groupMap[xVal] = { total: 0, count: 0, max: -Infinity, min: Infinity };
      }
      groupMap[xVal].total += yVal;
      groupMap[xVal].count++;
      if (yVal > groupMap[xVal].max) groupMap[xVal].max = yVal;
      if (yVal < groupMap[xVal].min) groupMap[xVal].min = yVal;
    }

    return Object.entries(groupMap)
      .map(([key, val]) => {
        let finalVal = 0;
        if (aggregation === 'sum') finalVal = val.total;
        else if (aggregation === 'avg') finalVal = val.count > 0 ? val.total / val.count : 0;
        else if (aggregation === 'count') finalVal = val.count;
        else if (aggregation === 'max') finalVal = val.max === -Infinity ? 0 : val.max;
        else if (aggregation === 'min') finalVal = val.min === Infinity ? 0 : val.min;

        return {
          [xAxisKey]: key,
          [yAxisKey]: Number(finalVal.toFixed(2)),
          count: val.count,
        };
      })
      .sort((a, b) => (b[yAxisKey] as number) - (a[yAxisKey] as number))
      .slice(0, limit);
  }, [dataset.cleanedRows, xAxisKey, yAxisKey, chartType, aggregation, limit]);

  return (
    <div className="space-y-6">
      {/* Studio Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Interactive Visualization Studio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize dimensions, metrics, aggregations, and visual chart archetypes
            </p>
          </div>

          {/* Chart Type Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            {[
              { id: 'bar', label: 'Bar' },
              { id: 'line', label: 'Line' },
              { id: 'area', label: 'Area' },
              { id: 'pie', label: 'Donut' },
              { id: 'scatter', label: 'Scatter' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setChartType(t.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  chartType === t.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension & Metric Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              X-Axis / Category Dimension
            </label>
            <select
              value={xAxisKey}
              onChange={(e) => setXAxisKey(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {allCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.dataType})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Y-Axis Metric
            </label>
            <select
              value={yAxisKey}
              onChange={(e) => setYAxisKey(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {numCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} (numerical)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Aggregation Function
            </label>
            <select
              value={aggregation}
              onChange={(e: any) => setAggregation(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="sum">SUM (Total Aggregate)</option>
              <option value="avg">AVERAGE (Mean Value)</option>
              <option value="count">COUNT (Frequency)</option>
              <option value="max">MAX (Peak Value)</option>
              <option value="min">MIN (Lowest Value)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Top Data Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>Top 10 categories</option>
              <option value={15}>Top 15 categories</option>
              <option value={25}>Top 25 categories</option>
              <option value={50}>Top 50 categories</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Display Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {aggregation.toUpperCase()} of {yAxisKey} by {xAxisKey}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live computed visualization ({chartData.length} records plotted)
            </p>
          </div>
        </div>

        <div className="h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <RBarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey={yAxisKey} fill="#2563eb" radius={[4, 4, 0, 0]} />
              </RBarChart>
            ) : chartType === 'line' ? (
              <RLineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey={yAxisKey} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              </RLineChart>
            ) : chartType === 'area' ? (
              <RAreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="studio_grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey={yAxisKey} stroke="#2563eb" strokeWidth={2} fill="url(#studio_grad)" />
              </RAreaChart>
            ) : chartType === 'pie' ? (
              <RPieChart>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Pie
                  data={chartData}
                  dataKey={yAxisKey}
                  nameKey={xAxisKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {chartData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </RPieChart>
            ) : (
              <RScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" name={xAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis type="number" dataKey="y" name={yAxisKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Scatter name="Data Distribution" data={chartData} fill="#8b5cf6" />
              </RScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
