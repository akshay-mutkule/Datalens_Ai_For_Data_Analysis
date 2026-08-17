import React from 'react';
import {
  FileText,
  Layers,
  Hash,
  Type,
  Calendar,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Sliders,
  Shield,
} from 'lucide-react';
import { DatasetProfile } from '../types/dataset';

interface DatasetOverviewCardProps {
  profile: DatasetProfile;
  onOpenCleaningModal?: () => void;
}

export const DatasetOverviewCard: React.FC<DatasetOverviewCardProps> = ({
  profile,
  onOpenCleaningModal,
}) => {
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate max-w-sm" title={profile.fileName}>
                {profile.fileName}
              </h2>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {profile.domainType} domain
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Size: {profile.fileSizeFormatted} • Analyzed by DataLens Engine
            </p>
          </div>
        </div>

        {/* Quality Score Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${getQualityColor(profile.qualityScore)}`}>
            <Shield className="w-4 h-4" />
            <span>Quality Score: {profile.qualityScore}/100</span>
          </div>

          {onOpenCleaningModal && (profile.totalMissingValues > 0 || profile.duplicateRows > 0) && (
            <button
              onClick={onOpenCleaningModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Review Cleaning</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Overview Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Rows</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">
            {profile.totalRows.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Columns</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">
            {profile.totalColumns}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Missing Values</span>
          <span className={`text-lg font-bold mt-0.5 block ${profile.totalMissingValues > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.totalMissingValues}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Duplicates</span>
          <span className={`text-lg font-bold mt-0.5 block ${profile.duplicateRows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.duplicateRows}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Numerical</span>
          <span className="text-lg font-bold text-blue-600 mt-0.5 block">
            {profile.columnTypeCounts.numerical}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Categorical</span>
          <span className="text-lg font-bold text-indigo-600 mt-0.5 block">
            {profile.columnTypeCounts.categorical}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Date Columns</span>
          <span className="text-lg font-bold text-purple-600 mt-0.5 block">
            {profile.columnTypeCounts.date}
          </span>
        </div>
      </div>

      {/* Detected Column Types Tags */}
      <div className="pt-2">
        <div className="text-xs font-semibold text-slate-700 mb-2">Detected Column Schema:</div>
        <div className="flex flex-wrap gap-2">
          {profile.columns.map((col) => (
            <div
              key={col.name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-800"
            >
              {col.dataType === 'numerical' ? (
                <Hash className="w-3.5 h-3.5 text-blue-600" />
              ) : col.dataType === 'date' ? (
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
              ) : col.dataType === 'identifier' ? (
                <KeyIcon className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Type className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{col.name}</span>
              <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200/80">
                {col.inferredType}
              </span>
              {col.nullCount > 0 && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-semibold" title={`${col.nullCount} nulls`}>
                  {col.nullCount} null
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);
