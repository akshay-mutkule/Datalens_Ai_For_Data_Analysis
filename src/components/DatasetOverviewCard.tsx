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
  Key,
  Sparkles,
  Database,
  ArrowUpRight,
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
    if (score >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'stroke-emerald-500' };
    if (score >= 70) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'stroke-blue-500' };
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'stroke-amber-500' };
    return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'stroke-rose-500' };
  };

  const quality = getQualityColor(profile.qualityScore);
  const strokeDashoffset = 100 - profile.qualityScore;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden space-y-6">
      {/* Ambient background accent */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-blue-50/70 via-indigo-50/30 to-transparent pointer-events-none -z-0" />

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-5 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight truncate max-w-md" title={profile.fileName}>
                {profile.fileName}
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                {profile.domainType} domain
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {profile.fileSizeFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Automated Data Quality Audit</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready for Live Analysis
              </span>
            </p>
          </div>
        </div>

        {/* Quality Score Ring & Cleaning Review Button */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Circular Score Indicator */}
          <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border ${quality.bg} ${quality.border}`}>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={quality.ring}
                  strokeDasharray="100, 100"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Shield className={`w-3.5 h-3.5 absolute ${quality.text}`} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quality Score</div>
              <div className={`text-sm font-extrabold ${quality.text}`}>
                {profile.qualityScore}<span className="text-[10px] text-slate-400 font-normal">/100</span>
              </div>
            </div>
          </div>

          {onOpenCleaningModal && (profile.totalMissingValues > 0 || profile.duplicateRows > 0) && (
            <button
              onClick={onOpenCleaningModal}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/20 transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Review Cleaning</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rows</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {profile.totalRows.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Columns</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {profile.totalColumns}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Cells</span>
          <span className={`text-xl font-extrabold mt-1 block ${profile.totalMissingValues > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.totalMissingValues}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duplicate Rows</span>
          <span className={`text-xl font-extrabold mt-1 block ${profile.duplicateRows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.duplicateRows}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Numerical</span>
          <span className="text-xl font-extrabold text-blue-600 mt-1 block">
            {profile.columnTypeCounts.numerical}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Categorical</span>
          <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
            {profile.columnTypeCounts.categorical}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition shadow-2xs">
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">Date Dimensions</span>
          <span className="text-xl font-extrabold text-purple-600 mt-1 block">
            {profile.columnTypeCounts.date}
          </span>
        </div>
      </div>

      {/* Schema Columns Badges */}
      <div>
        <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
          <span>Detected Column Schema & Types:</span>
          <span className="text-slate-400 font-normal">{profile.columns.length} attributes profiled</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.columns.map((col) => (
            <div
              key={col.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition text-xs font-semibold text-slate-800 shadow-2xs"
            >
              {col.dataType === 'numerical' ? (
                <Hash className="w-3.5 h-3.5 text-blue-600" />
              ) : col.dataType === 'date' ? (
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
              ) : col.dataType === 'identifier' ? (
                <Key className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Type className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{col.name}</span>
              <span className="text-[10px] text-slate-500 font-normal bg-white px-1.5 py-0.2 rounded-md border border-slate-200">
                {col.inferredType}
              </span>
              {col.nullCount > 0 && (
                <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded-md font-bold" title={`${col.nullCount} nulls`}>
                  {col.nullCount} nulls
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
