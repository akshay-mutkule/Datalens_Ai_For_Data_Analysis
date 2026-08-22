import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  Sliders,
  Hash,
  Type,
  Calendar,
  Key,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { ComputedColumnModal } from './ComputedColumnModal';
import { formatNumber } from '../services/dataEngine';

interface DataTableViewProps {
  dataset: DatasetState;
  onAddColumn?: (columnName: string, expression: string, formulaType: string) => Promise<void>;
  onUpdateRow?: (rowIndex: number, updatedRow: Record<string, any>) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  dataset,
  onAddColumn,
  onUpdateRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<'cleaned' | 'raw'>('cleaned');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Selected Column for Quick Inspector Drawer
  const [inspectingColumn, setInspectingColumn] = useState<string | null>(null);

  // Hidden Columns State
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Per-column custom filter values
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Editing Row State
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<Record<string, any> | null>(null);

  const rawRows = viewMode === 'cleaned' ? dataset.cleanedRows : dataset.rawRows;
  const allColumns = dataset.profile.columns;

  const visibleColumns = useMemo(() => {
    return allColumns.filter((c) => !hiddenColumns.has(c.name));
  }, [allColumns, hiddenColumns]);

  // Global search, per-column filtering, and sorting
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rawRows];

    // 1. Global Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val !== null && val !== undefined ? val : '').toLowerCase().includes(q)
        )
      );
    }

    // 2. Per-Column Filters
    for (const [col, filterVal] of Object.entries(columnFilters)) {
      if (filterVal && String(filterVal).trim() !== '') {
        const f = String(filterVal).toLowerCase().trim();
        result = result.filter((row) => {
          const val = row[col];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(f);
        });
      }
    }

    // 3. Sorting
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rawRows, searchTerm, columnFilters, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const paginatedRows = filteredAndSortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
  };

  const handleToggleColumnVisibility = (colName: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colName)) next.delete(colName);
      else next.add(colName);
      return next;
    });
  };

  const handleColumnFilterChange = (colName: string, val: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [colName]: val,
    }));
    setCurrentPage(1);
  };

  const handleStartEdit = (row: Record<string, any>, idx: number) => {
    setEditingRowIndex(idx);
    setEditingRowData({ ...row });
  };

  const handleSaveEdit = (globalIndex: number) => {
    if (editingRowData && onUpdateRow) {
      onUpdateRow(globalIndex, editingRowData);
    }
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleExportCSV = () => {
    const headers = visibleColumns.map((c) => c.name);
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedRows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset.name}_filtered_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredAndSortedRows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset.name}_filtered_export.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    const headers = visibleColumns.map((c) => c.name);
    const text = [
      headers.join('\t'),
      ...filteredAndSortedRows.slice(0, 100).map((row) =>
        headers.map((h) => String(row[h] ?? '')).join('\t')
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Inspecting Column Profile Info
  const inspectedColProfile = allColumns.find((c) => c.name === inspectingColumn);

  return (
    <div className="space-y-4">
      {/* Computed Column Modal */}
      {onAddColumn && (
        <ComputedColumnModal
          dataset={dataset}
          isOpen={showFormulaModal}
          onClose={() => setShowFormulaModal(false)}
          onAddColumn={onAddColumn}
        />
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-5 space-y-4">
        {/* Header Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Data Explorer & Live Table Studio
                </h2>
                {/* Cleaned / Raw Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => {
                      setViewMode('cleaned');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg transition ${
                      viewMode === 'cleaned'
                        ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cleaned ({dataset.cleanedRows.length.toLocaleString()})
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('raw');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg transition ${
                      viewMode === 'raw'
                        ? 'bg-white text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Original Raw ({dataset.rawRows.length.toLocaleString()})
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Showing <span className="font-bold text-slate-900">{filteredAndSortedRows.length.toLocaleString()}</span> matching records • {visibleColumns.length} of {allColumns.length} columns visible
              </p>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Column Button */}
            {onAddColumn && (
              <button
                onClick={() => setShowFormulaModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Calculated Column</span>
              </button>
            )}

            {/* Column Visibility Toggler */}
            <div className="relative">
              <button
                onClick={() => setShowColumnVisibility(!showColumnVisibility)}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns ({visibleColumns.length})</span>
              </button>

              {showColumnVisibility && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 max-h-72 overflow-y-auto">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2 px-1 tracking-wider">
                    Toggle Column Visibility
                  </div>
                  <div className="space-y-1">
                    {allColumns.map((col) => (
                      <label
                        key={col.name}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.has(col.name)}
                          onChange={() => handleToggleColumnVisibility(col.name)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{col.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Copy visible rows to clipboard (TSV)"
            >
              {copiedNotification ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Export Menu */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Search & Quick Column Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search all rows, numbers, or text attributes..."
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Interactive Data Table with Column Headers and Per-Column Filters */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-[580px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 sticky top-0 z-20 border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-slate-400 font-mono text-[10px] text-center border-r border-slate-200/60 bg-slate-50">
                    #
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.name}
                      className="py-3 px-3 font-extrabold whitespace-nowrap border-r border-slate-200/60 last:border-r-0 bg-slate-50 hover:bg-slate-100/80 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => handleSort(col.name)}
                          className="flex items-center gap-1.5 cursor-pointer select-none group"
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
                          <span className="group-hover:text-blue-600 transition">{col.name}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                        </div>

                        {/* Column Inspector trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingColumn(inspectingColumn === col.name ? null : col.name);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition"
                          title="View column distribution & stats"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Per-Column Quick Sub-Filter Input */}
                      <div className="mt-2">
                        <input
                          type="text"
                          value={columnFilters[col.name] || ''}
                          onChange={(e) => handleColumnFilterChange(col.name, e.target.value)}
                          placeholder="Filter..."
                          className="w-full text-[10px] font-normal px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center font-bold text-slate-500 w-16">Edit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx;
                    const isEditing = editingRowIndex === globalIdx;

                    return (
                      <tr
                        key={globalIdx}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          isEditing ? 'bg-blue-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 text-center border-r border-slate-100">
                          {globalIdx + 1}
                        </td>
                        {visibleColumns.map((col) => {
                          const val = row[col.name];
                          const isNull = val === null || val === undefined || val === '';

                          return (
                            <td
                              key={col.name}
                              className="py-2.5 px-3 text-slate-800 whitespace-nowrap border-r border-slate-100 last:border-r-0"
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingRowData?.[col.name] ?? ''}
                                  onChange={(e) =>
                                    setEditingRowData((prev) => ({
                                      ...prev,
                                      [col.name]: e.target.value,
                                    }))
                                  }
                                  className="w-full text-xs font-medium px-2 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                                />
                              ) : isNull ? (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                                  null
                                </span>
                              ) : col.dataType === 'numerical' ? (
                                <span className="font-mono text-slate-900">
                                  {typeof val === 'number' ? formatNumber(val, 2) : String(val)}
                                </span>
                              ) : (
                                <span className="font-medium">{String(val)}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(globalIdx)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                title="Save Row"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(row, globalIdx)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 2}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No records match the active search or column filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span> ({filteredAndSortedRows.length.toLocaleString()} total filtered items)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Column Summary Drawer */}
      {inspectedColProfile && (
        <div className="bg-white rounded-3xl border border-blue-200 shadow-md p-5 space-y-3 animate-in fade-in duration-200 relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                {inspectedColProfile.dataType === 'numerical' ? (
                  <Hash className="w-4 h-4" />
                ) : (
                  <Type className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Column Profiler: {inspectedColProfile.name}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {inspectedColProfile.inferredType} • {inspectedColProfile.uniqueCount} distinct values
                </span>
              </div>
            </div>
            <button
              onClick={() => setInspectingColumn(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {inspectedColProfile.stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Mean</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                  {formatNumber(inspectedColProfile.stats.mean, 2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Median</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                  {formatNumber(inspectedColProfile.stats.median, 2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Min / Max</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block font-mono">
                  {formatNumber(inspectedColProfile.stats.min, 1)} / {formatNumber(inspectedColProfile.stats.max, 1)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Std Dev</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                  {formatNumber(inspectedColProfile.stats.stdDev, 2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">IQR</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                  {formatNumber(inspectedColProfile.stats.iqr, 2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Skewness</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                  {inspectedColProfile.stats.skewness}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Outliers</span>
                <span className="font-extrabold text-rose-600 text-sm mt-0.5 block font-mono">
                  {inspectedColProfile.stats.outlierCount}
                </span>
              </div>
            </div>
          ) : inspectedColProfile.topCategories ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Top Frequency Distribution:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {inspectedColProfile.topCategories.slice(0, 6).map((cat) => (
                  <div
                    key={cat.value}
                    className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800 truncate mr-2">{cat.value}</span>
                    <span className="text-[11px] font-mono text-blue-600 font-semibold shrink-0">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
