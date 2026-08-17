import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sliders,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { DatasetState, CleaningPipelineConfig } from '../types/dataset';

interface DataQualityViewProps {
  dataset: DatasetState;
  onApplyCleaning: (config: CleaningPipelineConfig) => void;
  isCleaning?: boolean;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  dataset,
  onApplyCleaning,
  isCleaning = false,
}) => {
  const [config, setConfig] = useState<CleaningPipelineConfig>(dataset.appliedCleaning);
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const handleApply = () => {
    onApplyCleaning(config);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3500);
  };

  const handleRecommendedDefaults = () => {
    const recommended: CleaningPipelineConfig = {
      imputeMissingNumerical: 'median',
      imputeMissingCategorical: 'unknown',
      removeDuplicates: true,
      handleOutliers: 'cap',
      standardizeDates: true,
      dropConstantColumns: true,
      fixNegativeValues: false,
    };
    setConfig(recommended);
    onApplyCleaning(recommended);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3500);
  };

  const profile = dataset.profile;
  const missingCols = profile.columns.filter((c) => c.nullCount > 0);
  const outlierCols = profile.columns.filter((c) => c.stats && c.stats.outlierCount > 0 && !c.isIdentifier);
  const constantCols = profile.columns.filter((c) => c.isConstant);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showAppliedToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold">Data Cleaning Pipeline Executed</div>
            <div className="text-[11px] text-slate-300">Cleaned dataset recalculated with updated statistics & KPIs.</div>
          </div>
        </div>
      )}

      {/* Quality Audit Top Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Data Quality & Hygiene Audit
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Score: {profile.qualityScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated detection of missing cells, duplicates, outliers, and data type inconsistencies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRecommendedDefaults}
              disabled={isCleaning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Recommended Cleaning</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Missing Values</span>
              <AlertTriangle className={`w-4 h-4 ${profile.totalMissingValues > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {profile.totalMissingValues}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {missingCols.length} columns ({profile.missingPercentage}% total cells)
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Duplicate Rows</span>
              <Copy className={`w-4 h-4 ${profile.duplicateRows > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {profile.duplicateRows}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {profile.duplicatePercentage}% of row population
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Statistical Outliers</span>
              <Sliders className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {outlierCols.reduce((sum, c) => sum + (c.stats?.outlierCount || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Detected in {outlierCols.length} numerical columns (1.5×IQR)
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Cleaned State</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">
              {dataset.cleanedRows.length.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Verified active records ready for modeling
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cleaning Pipeline Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Automated Cleaning Pipeline Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how DataLens AI handles missing data, outliers, and formatting
            </p>
          </div>
          <button
            onClick={handleApply}
            disabled={isCleaning}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Execute Custom Cleaning</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Missing Numerical Values Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Missing Numerical Values
            </label>
            <p className="text-[11px] text-slate-500">
              Strategy to replace null or empty numbers in numerical columns.
            </p>
            <select
              value={config.imputeMissingNumerical}
              onChange={(e: any) =>
                setConfig({ ...config, imputeMissingNumerical: e.target.value })
              }
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="median">Impute with Column Median (Recommended)</option>
              <option value="mean">Impute with Column Mean (Average)</option>
              <option value="zero">Fill with Zero (0)</option>
              <option value="none">Do Not Impute (Keep nulls)</option>
            </select>
          </div>

          {/* Missing Categorical Values Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Missing Categorical Entries
            </label>
            <p className="text-[11px] text-slate-500">
              Handling of blank or undefined categorical label cells.
            </p>
            <select
              value={config.imputeMissingCategorical}
              onChange={(e: any) =>
                setConfig({ ...config, imputeMissingCategorical: e.target.value })
              }
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="unknown">Fill with 'Unknown' Label</option>
              <option value="mode">Impute with Mode (Most Frequent)</option>
              <option value="none">Do Not Modify</option>
            </select>
          </div>

          {/* Outliers Handling */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Statistical Outlier Handling
            </label>
            <p className="text-[11px] text-slate-500">
              Treatment for extreme values beyond 1.5×IQR bounds.
            </p>
            <select
              value={config.handleOutliers}
              onChange={(e: any) =>
                setConfig({ ...config, handleOutliers: e.target.value })
              }
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Retain Outliers (Standard)</option>
              <option value="cap">Cap at 1.5×IQR Boundary (Winsorize)</option>
            </select>
          </div>

          {/* Duplicates Checkbox */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="chk_dups"
              checked={config.removeDuplicates}
              onChange={(e) => setConfig({ ...config, removeDuplicates: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="chk_dups" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-900 block">Deduplicate Identical Records</span>
              <span className="text-[11px] text-slate-500">
                Removes {profile.duplicateRows} exact duplicate row instances to prevent double-counting.
              </span>
            </label>
          </div>

          {/* Date Standardization */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="chk_dates"
              checked={config.standardizeDates}
              onChange={(e) => setConfig({ ...config, standardizeDates: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="chk_dates" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-900 block">Standardize Date Formats</span>
              <span className="text-[11px] text-slate-500">
                Converts mixed timestamps and date strings into unified ISO YYYY-MM-DD format.
              </span>
            </label>
          </div>

          {/* Constant Columns */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="chk_const"
              checked={config.dropConstantColumns}
              onChange={(e) => setConfig({ ...config, dropConstantColumns: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="chk_const" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-900 block">Drop Constant Columns</span>
              <span className="text-[11px] text-slate-500">
                Removes columns with zero variance (identical value in every single row).
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Column-by-Column Missing & Quality Details Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Column Hygiene & Missingness Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of data completeness and distributions per column
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Inferred Type</th>
                <th className="py-3 px-4">Missing Count</th>
                <th className="py-3 px-4">Missing %</th>
                <th className="py-3 px-4">Unique Values</th>
                <th className="py-3 px-4">Outliers (IQR)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {profile.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <span>{col.name}</span>
                    {col.isIdentifier && (
                      <span className="text-[10px] text-slate-400 font-normal">[ID]</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {col.inferredType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {col.nullCount > 0 ? (
                      <span className="text-amber-600 font-bold">{col.nullCount}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${col.nullPercentage > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, col.nullPercentage * 2)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500">{col.nullPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {col.uniqueCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {col.stats && col.stats.outlierCount > 0 ? (
                      <span className="text-purple-600 font-semibold">{col.stats.outlierCount} outliers</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {col.nullCount === 0 && !col.isConstant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Clean
                      </span>
                    ) : col.isConstant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Constant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Remediated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
