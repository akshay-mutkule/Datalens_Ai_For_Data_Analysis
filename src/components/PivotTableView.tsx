import React, { useState, useMemo } from 'react';
import {
  Grid,
  Download,
  Sliders,
  Filter,
  Sparkles,
  Layers,
  ArrowUpDown,
  Flame,
} from 'lucide-react';
import { DatasetState, PivotTableConfig } from '../types/dataset';
import { computePivotTable, formatNumber, formatCurrency } from '../services/dataEngine';

interface PivotTableViewProps {
  dataset: DatasetState;
}

export const PivotTableView: React.FC<PivotTableViewProps> = ({ dataset }) => {
  const catCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'categorical' || c.dataType === 'date' || c.dataType === 'boolean'),
    [dataset.profile.columns]
  );
  const numCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset.profile.columns]
  );

  const [rowField, setRowField] = useState<string>(catCols[0]?.name || dataset.headers[0] || '');
  const [colField, setColField] = useState<string>(catCols[1]?.name || catCols[0]?.name || '');
  const [valField, setValField] = useState<string>(numCols[0]?.name || '');
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count' | 'min' | 'max'>('sum');
  const [enableHeatmap, setEnableHeatmap] = useState<boolean>(true);

  // Compute Pivot Table Data
  const pivotData = useMemo(() => {
    if (!rowField || !colField) {
      return { rows: [], cols: [], matrix: [], rowTotals: [], colTotals: [], grandTotal: 0 };
    }
    return computePivotTable(dataset.cleanedRows, {
      rowField,
      colField,
      valField,
      aggregation,
    });
  }, [dataset.cleanedRows, rowField, colField, valField, aggregation]);

  // Find min and max for heatmap scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of pivotData.matrix) {
      for (const val of row) {
        if (val !== null && !isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 1 : max };
  }, [pivotData.matrix]);

  // Get background color for heatmap cell
  const getCellBgColor = (val: number | null) => {
    if (!enableHeatmap || val === null || maxVal === minVal) return '';
    const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
    // Blue gradient: rgba(37, 99, 235, ratio * 0.4)
    return `rgba(37, 99, 235, ${Math.max(0.08, ratio * 0.35)})`;
  };

  const handleExportCSV = () => {
    if (pivotData.rows.length === 0) return;
    const headerRow = [rowField, ...pivotData.cols, 'Total'];
    const rowsText: string[] = [headerRow.map((h) => `"${h}"`).join(',')];

    for (let i = 0; i < pivotData.rows.length; i++) {
      const rKey = pivotData.rows[i];
      const rValues = pivotData.matrix[i].map((v) => (v !== null ? v : ''));
      const rTotal = pivotData.rowTotals[i];
      rowsText.push([`"${rKey}"`, ...rValues, rTotal].join(','));
    }

    const colTotalsRow = ['"Total"', ...pivotData.colTotals, pivotData.grandTotal];
    rowsText.push(colTotalsRow.join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + rowsText.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pivot_${rowField}_vs_${colField}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Pivot Table Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Multi-Dimensional Pivot Matrix</h2>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Cross-Tabulation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Slice and aggregate metrics across any combination of categorical dimensions, cohorts, and metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnableHeatmap(!enableHeatmap)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition border ${
                enableHeatmap
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap Coloring: {enableHeatmap ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matrix CSV</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Row Dimension (Vertical):
            </label>
            <select
              value={rowField}
              onChange={(e) => setRowField(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            >
              {catCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Column Dimension (Horizontal):
            </label>
            <select
              value={colField}
              onChange={(e) => setColField(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            >
              {catCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Value Metric:</label>
            <select
              value={valField}
              onChange={(e) => setValField(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            >
              {numCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Aggregation Function:
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-blue-700"
            >
              <option value="sum">SUM (Total)</option>
              <option value="avg">AVERAGE (Mean)</option>
              <option value="count">COUNT (Records)</option>
              <option value="max">MAX (Highest)</option>
              <option value="min">MIN (Lowest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Pivot Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Cross-Tabulation: {rowField} × {colField}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({aggregation.toUpperCase()} of {valField})
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Grand Total:{' '}
            <strong className="text-blue-600 font-mono text-sm">
              {formatNumber(pivotData.grandTotal, 2)}
            </strong>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4 font-bold text-slate-800 whitespace-nowrap bg-slate-100">
                  {rowField} \ {colField}
                </th>
                {pivotData.cols.map((col) => (
                  <th
                    key={col}
                    className="py-2.5 px-4 font-bold text-slate-700 text-right whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="py-2.5 px-4 font-extrabold text-blue-900 text-right whitespace-nowrap bg-blue-50/80">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pivotData.rows.map((rKey, rowIdx) => (
                <tr key={rKey} className="hover:bg-slate-50/80">
                  <td className="py-2 px-4 font-semibold text-slate-800 whitespace-nowrap bg-slate-50/50">
                    {rKey}
                  </td>
                  {pivotData.matrix[rowIdx].map((val, colIdx) => (
                    <td
                      key={colIdx}
                      className="py-2 px-4 text-right font-mono text-slate-800 whitespace-nowrap transition-colors"
                      style={{ backgroundColor: getCellBgColor(val) }}
                    >
                      {val !== null ? formatNumber(val, 2) : '—'}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-mono font-bold text-blue-700 bg-blue-50/40 whitespace-nowrap">
                    {formatNumber(pivotData.rowTotals[rowIdx], 2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-100/95 font-bold border-t-2 border-slate-300 z-10">
              <tr>
                <td className="py-2.5 px-4 text-slate-900 bg-slate-100">Total</td>
                {pivotData.colTotals.map((tot, idx) => (
                  <td key={idx} className="py-2.5 px-4 text-right font-mono text-slate-900">
                    {formatNumber(tot, 2)}
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-mono text-blue-700 bg-blue-100/80 font-extrabold">
                  {formatNumber(pivotData.grandTotal, 2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
