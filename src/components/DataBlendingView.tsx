import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Database,
  ArrowRight,
  Sparkles,
  Plus,
  RefreshCw,
  Zap,
  Filter,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { DatasetState, BlendLookupSource, BlendingResult } from '../types/dataset';
import { SAMPLE_LOOKUP_TABLES, executeDataBlend, formatNumber } from '../services/dataEngine';

interface DataBlendingViewProps {
  dataset: DatasetState;
  onApplyMergedDataset: (mergedRows: Record<string, any>[], summary: string) => void;
}

export const DataBlendingView: React.FC<DataBlendingViewProps> = ({
  dataset,
  onApplyMergedDataset,
}) => {
  const primaryCols = useMemo(
    () => dataset.profile.columns.map((c) => c.name),
    [dataset.profile.columns]
  );

  // Selected Secondary Table or Uploaded Custom Source
  const [selectedLookupId, setSelectedLookupId] = useState<string>(SAMPLE_LOOKUP_TABLES[0].id);
  const [customSecondaryRows, setCustomSecondaryRows] = useState<Record<string, any>[] | null>(null);
  const [customSecondaryName, setCustomSecondaryName] = useState<string>('');

  // Active secondary source
  const secondarySource = useMemo(() => {
    if (customSecondaryRows && customSecondaryRows.length > 0) {
      return {
        id: 'custom_upload',
        name: customSecondaryName || 'Custom Uploaded Secondary Table',
        description: `Uploaded dataset containing ${customSecondaryRows.length} records.`,
        category: 'Custom Upload',
        joinKeyOptions: Object.keys(customSecondaryRows[0] || {}),
        rows: customSecondaryRows,
      };
    }
    return SAMPLE_LOOKUP_TABLES.find((t) => t.id === selectedLookupId) || SAMPLE_LOOKUP_TABLES[0];
  }, [selectedLookupId, customSecondaryRows, customSecondaryName]);

  const secondaryCols = useMemo(
    () => (secondarySource?.rows[0] ? Object.keys(secondarySource.rows[0]) : []),
    [secondarySource]
  );

  // Auto-detect optimal join keys
  const autoDetectKey = useMemo(() => {
    for (const p of primaryCols) {
      const pLower = p.toLowerCase();
      for (const s of secondaryCols) {
        const sLower = s.toLowerCase();
        if (pLower === sLower || pLower.includes(sLower) || sLower.includes(pLower)) {
          return { primary: p, secondary: s };
        }
      }
    }
    return { primary: primaryCols[0] || '', secondary: secondaryCols[0] || '' };
  }, [primaryCols, secondaryCols]);

  const [primaryKey, setPrimaryKey] = useState<string>(autoDetectKey.primary);
  const [secondaryKey, setSecondaryKey] = useState<string>(autoDetectKey.secondary);
  const [joinType, setJoinType] = useState<'left' | 'inner' | 'right' | 'full' | 'union'>('left');

  // Compute live blend preview
  const blendResult: BlendingResult = useMemo(() => {
    if (!primaryKey || !secondaryKey || !secondarySource) {
      return {
        joinedRows: dataset.cleanedRows,
        matchRatePercent: 0,
        unmatchedLeftCount: 0,
        unmatchedRightCount: 0,
        newColumnsAdded: [],
        summary: 'Select valid join keys to evaluate blend.',
      };
    }
    return executeDataBlend(
      dataset.cleanedRows,
      secondarySource.rows,
      primaryKey,
      secondaryKey,
      joinType
    );
  }, [dataset.cleanedRows, secondarySource, primaryKey, secondaryKey, joinType]);

  // Handle custom secondary CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rows: Record<string, any>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          const row: Record<string, any> = {};
          headers.forEach((h, idx) => {
            const val = vals[idx] ?? '';
            const num = Number(val);
            row[h] = !isNaN(num) && val !== '' ? num : val;
          });
          rows.push(row);
        }

        setCustomSecondaryRows(rows);
        setCustomSecondaryName(file.name);
        if (headers.length > 0) {
          setSecondaryKey(headers[0]);
        }
      } catch (err) {
        console.error('Failed to parse secondary file', err);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    onApplyMergedDataset(blendResult.joinedRows, blendResult.summary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Data Blending & Multi-Dataset Join Studio
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Schema Fusion
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrich primary dataset with economic demographics, product catalogs, customer tiers, or uploaded secondary tables
            </p>
          </div>
        </div>

        {/* Apply Blend Button */}
        <button
          onClick={handleApply}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-md shadow-indigo-500/20 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Apply Fusion to Active Workspace
        </button>
      </div>

      {/* Primary vs Secondary Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary Dataset Details */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-indigo-600">Left Table (Primary)</span>
              <h3 className="font-extrabold text-sm text-slate-900">{dataset.profile.fileName || 'Active Dataset'}</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
              {formatNumber(dataset.cleanedRows.length)} rows
            </span>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
              Primary Join Key Column:
            </label>
            <select
              value={primaryKey}
              onChange={(e) => setPrimaryKey(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              {primaryCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1.5 text-xs">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Available Attributes</span>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {primaryCols.map((c) => (
                <span
                  key={c}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                    c === primaryKey ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Join Type & Relation Logic */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-extrabold text-purple-600">Fusion Topology</span>
              <span className="text-xs font-mono font-bold text-slate-500">{joinType.toUpperCase()} JOIN</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'left', label: 'Left Outer Join', desc: 'Preserve all primary rows; append matching secondary.' },
                { type: 'inner', label: 'Inner Join', desc: 'Keep only records with matches in both tables.' },
                { type: 'right', label: 'Right Outer Join', desc: 'Preserve all secondary rows; pad primary.' },
                { type: 'full', label: 'Full Outer Join', desc: 'Keep all rows from both tables.' },
                { type: 'union', label: 'Union (Append)', desc: 'Stack secondary rows at bottom of primary.' },
              ].map((j) => (
                <button
                  key={j.type}
                  onClick={() => setJoinType(j.type as any)}
                  className={`p-3 rounded-2xl text-left border transition ${
                    joinType === j.type
                      ? 'bg-indigo-50/80 border-indigo-500/80 shadow-xs'
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-xs text-slate-900">{j.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{j.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Key Matching Health Indicator */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Key Alignment Score:</span>
              <span
                className={`font-mono font-black px-2 py-0.5 rounded-full ${
                  blendResult.matchRatePercent >= 70
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {blendResult.matchRatePercent}% Matched
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  blendResult.matchRatePercent >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${blendResult.matchRatePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Unmatched Left: {blendResult.unmatchedLeftCount}</span>
              <span>Unmatched Right: {blendResult.unmatchedRightCount}</span>
            </div>
          </div>
        </div>

        {/* Right: Secondary Table Selection */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-purple-600">Right Table (Enrichment)</span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate max-w-[200px]">{secondarySource.name}</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-xl">
              {secondarySource.rows.length} rows
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                Select Benchmark Lookup Source:
              </label>
              <select
                value={customSecondaryRows ? 'custom_upload' : selectedLookupId}
                onChange={(e) => {
                  if (e.target.value === 'custom_upload') return;
                  setCustomSecondaryRows(null);
                  setSelectedLookupId(e.target.value);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
              >
                {SAMPLE_LOOKUP_TABLES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
                {customSecondaryRows && (
                  <option value="custom_upload">Custom Uploaded ({customSecondaryName})</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                Secondary Join Key Column:
              </label>
              <select
                value={secondaryKey}
                onChange={(e) => setSecondaryKey(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
              >
                {secondaryCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Secondary CSV Upload Drop */}
            <div className="pt-2">
              <label className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-purple-50/30">
                <Upload className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-slate-700">Or Upload Secondary CSV</span>
                <span className="text-[10px] text-slate-400">Drag & drop file or browse</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* New Attributes Preview Strip */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-purple-500/30 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="font-extrabold text-sm text-white">Schema Fusion Preview</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{blendResult.summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-xl border border-white/10">
              +{blendResult.newColumnsAdded.length} Enriched Columns
            </span>
            <span className="text-xs font-mono font-bold bg-purple-500/30 text-purple-200 px-3 py-1 rounded-xl border border-purple-400/40">
              {formatNumber(blendResult.joinedRows.length)} Total Unified Rows
            </span>
          </div>
        </div>

        {/* List of New Columns */}
        {blendResult.newColumnsAdded.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            {blendResult.newColumnsAdded.map((col) => (
              <span
                key={col}
                className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-mono font-bold px-3 py-1 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                {col}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Live Sample Records Preview Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Merged Dataset Preview (First 8 Records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Highlighting columns with newly enriched lookup data
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {Object.keys(blendResult.joinedRows[0] || {}).slice(0, 10).map((col) => {
                  const isNew = blendResult.newColumnsAdded.includes(col);
                  return (
                    <th
                      key={col}
                      className={`py-2.5 px-3 ${
                        isNew ? 'bg-purple-100 text-purple-900 font-black' : ''
                      }`}
                    >
                      {col} {isNew && '✨'}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {blendResult.joinedRows.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  {Object.keys(row).slice(0, 10).map((col) => {
                    const isNew = blendResult.newColumnsAdded.includes(col);
                    const val = row[col];
                    return (
                      <td
                        key={col}
                        className={`py-2.5 px-3 ${
                          isNew ? 'bg-purple-50/50 text-purple-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {val === null || val === undefined ? (
                          <span className="text-slate-300 italic">null</span>
                        ) : typeof val === 'number' ? (
                          formatNumber(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
