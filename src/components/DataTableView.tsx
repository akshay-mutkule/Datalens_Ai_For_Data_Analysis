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
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface DataTableViewProps {
  dataset: DatasetState;
}

export const DataTableView: React.FC<DataTableViewProps> = ({ dataset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<'cleaned' | 'raw'>('cleaned');

  const rows = viewMode === 'cleaned' ? dataset.cleanedRows : dataset.rawRows;
  const columns = dataset.profile.columns;

  // Global search and sorting
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val !== null && val !== undefined ? val : '').toLowerCase().includes(q)
        )
      );
    }

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
  }, [rows, searchTerm, sortCol, sortDir]);

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Dataset Explorer & Inspector
              </h2>
              {/* Toggle Cleaned / Raw Mode */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => {
                    setViewMode('cleaned');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    viewMode === 'cleaned'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cleaned Data ({dataset.cleanedRows.length})
                </button>
                <button
                  onClick={() => {
                    setViewMode('raw');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    viewMode === 'raw'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original Raw ({dataset.rawRows.length})
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredAndSortedRows.length.toLocaleString()} matching records
            </p>
          </div>
        </div>

        {/* Global Search & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search all columns..."
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>

          <a
            href={`/api/dataset/${dataset.id}/export/csv`}
            download
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200 sticky top-0">
            <tr>
              <th className="py-3 px-3 w-12 text-slate-400">#</th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.name}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    {sortCol === col.name && (
                      <span className="text-blue-600 font-bold">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {paginatedRows.map((row, idx) => {
              const rowNum = (currentPage - 1) * pageSize + idx + 1;
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {rowNum}
                  </td>
                  {columns.map((col) => {
                    const cellVal = row[col.name];
                    const isNull = cellVal === null || cellVal === undefined || cellVal === '';

                    return (
                      <td
                        key={col.name}
                        className={`py-2.5 px-4 max-w-[240px] truncate ${
                          isNull ? 'text-slate-300 italic' : ''
                        }`}
                      >
                        {isNull ? 'null' : String(cellVal)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400 ml-2">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedRows.length)} of{' '}
            {filteredAndSortedRows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
