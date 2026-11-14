import React, { useState, useMemo } from 'react';
import {
  Hash,
  Type,
  Calendar,
  Sliders,
  Key,
  Search,
  Database,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';
import { DatasetProfile } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface DatasetOverviewCardProps {
  profile: DatasetProfile;
  onOpenCleaningModal?: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const DatasetOverviewCard: React.FC<DatasetOverviewCardProps> = ({
  profile,
  onOpenCleaningModal,
}) => {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [colFilter, setColFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const filteredColumns = useMemo(() => {
    return profile.columns.filter((c) => {
      const matchText =
        c.name.toLowerCase().includes(colFilter.toLowerCase()) ||
        c.inferredType.toLowerCase().includes(colFilter.toLowerCase());
      const matchType = selectedTypeFilter === 'all' || c.dataType === selectedTypeFilter;
      return matchText && matchType;
    });
  }, [profile.columns, colFilter, selectedTypeFilter]);

  const numPct = Math.round((profile.columnTypeCounts.numerical / (profile.totalColumns || 1)) * 100);
  const catPct = Math.round((profile.columnTypeCounts.categorical / (profile.totalColumns || 1)) * 100);
  const datePct = Math.round((profile.columnTypeCounts.date / (profile.totalColumns || 1)) * 100);

  const surfaceBg = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const subSurface = isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-2xl border transition-colors ${surfaceBg}`}>
      {/* Compact Single-Row Summary Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-sm truncate max-w-[240px]" title={profile.fileName}>
                {profile.fileName}
              </span>
              <span className={mutedText} aria-hidden="true">·</span>
              <span className="capitalize font-medium text-blue-500">{profile.domainType}</span>
              <span className={mutedText} aria-hidden="true">·</span>
              <span className={`font-mono tabular-nums ${mutedText}`}>
                {profile.totalRows.toLocaleString()} rows × {profile.totalColumns} cols
              </span>
              <span className={`hidden sm:inline ${mutedText}`} aria-hidden="true">·</span>
              <span className={`hidden sm:inline font-mono tabular-nums ${mutedText}`}>
                {profile.fileSizeFormatted}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <Shield className={`w-3.5 h-3.5 ${getQualityColor(profile.qualityScore)}`} />
            <span className={mutedText}>Quality</span>
            <span className={`font-bold ${getQualityColor(profile.qualityScore)}`}>
              {profile.qualityScore}/100
            </span>
          </div>

          {onOpenCleaningModal && (profile.totalMissingValues > 0 || profile.duplicateRows > 0) && (
            <button
              onClick={onOpenCleaningModal}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Clean ({profile.totalMissingValues + profile.duplicateRows})</span>
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span>Schema &amp; Columns</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Schema Inspector */}
      {expanded && (
        <div className={`px-4 pb-4 pt-3 border-t space-y-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {[
              { label: 'Total Rows', value: profile.totalRows.toLocaleString(), tone: '' },
              { label: 'Columns', value: profile.totalColumns, tone: '' },
              { label: 'Missing Cells', value: profile.totalMissingValues, tone: profile.totalMissingValues > 0 ? 'text-amber-500' : 'text-emerald-500' },
              { label: 'Duplicates', value: profile.duplicateRows, tone: profile.duplicateRows > 0 ? 'text-amber-500' : 'text-emerald-500' },
              { label: 'Numerical', value: profile.columnTypeCounts.numerical, tone: 'text-blue-500' },
              { label: 'Categorical', value: profile.columnTypeCounts.categorical, tone: 'text-indigo-400' },
              { label: 'Temporal', value: profile.columnTypeCounts.date, tone: 'text-purple-400' },
            ].map((m) => (
              <div key={m.label} className={`p-3 rounded-xl border ${subSurface}`}>
                <span className={`text-[11px] font-medium block ${mutedText}`}>{m.label}</span>
                <span className={`text-lg font-bold font-mono tabular-nums mt-0.5 block ${m.tone}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Schema Distribution Ratio */}
          <div className="space-y-1.5">
            <div className={`flex justify-between text-xs font-medium ${mutedText}`}>
              <span>Schema Composition</span>
              <span className="font-mono tabular-nums">
                {numPct}% Numeric · {catPct}% Categorical · {datePct}% Temporal
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div style={{ width: `${numPct}%` }} className="bg-blue-500 h-full" />
              <div style={{ width: `${catPct}%` }} className="bg-indigo-500 h-full" />
              <div style={{ width: `${datePct}%` }} className="bg-purple-500 h-full" />
            </div>
          </div>

          {/* Columns Search & List */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-semibold">
                Detected Attributes{' '}
                <span className={`font-normal ${mutedText}`}>
                  ({filteredColumns.length} of {profile.columns.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className={`text-xs font-medium rounded-lg border px-2.5 py-1 focus:outline-none ${subSurface}`}
                >
                  <option value="all">All Types</option>
                  <option value="numerical">Numerical</option>
                  <option value="categorical">Categorical</option>
                  <option value="date">Date</option>
                </select>

                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${mutedText}`} />
                  <input
                    type="text"
                    placeholder="Filter columns..."
                    value={colFilter}
                    onChange={(e) => setColFilter(e.target.value)}
                    className={`text-xs rounded-lg border pl-7 pr-3 py-1 w-40 sm:w-48 focus:outline-none ${subSurface}`}
                  />
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1`}>
              {filteredColumns.map((col) => (
                <div
                  key={col.name}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${subSurface}`}
                >
                  <span className="flex items-center gap-2 min-w-0 font-medium">
                    {col.dataType === 'numerical' ? (
                      <Hash className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    ) : col.dataType === 'date' ? (
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : col.dataType === 'identifier' ? (
                      <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                    <span className="truncate">{col.name}</span>
                  </span>
                  <span className={`text-[11px] font-mono tabular-nums shrink-0 ml-2 ${mutedText}`}>
                    {col.inferredType}
                    {col.nullCount > 0 ? ` · ${col.nullCount} nulls` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
