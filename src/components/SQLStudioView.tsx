import React, { useState, useMemo } from 'react';
import {
  Database,
  Play,
  Sparkles,
  Download,
  Code2,
  Clock,
  Table as TableIcon,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Plus,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DatasetState, SQLQueryResult } from '../types/dataset';
import { executeSQLQuery } from '../services/dataEngine';

interface SQLStudioViewProps {
  dataset: DatasetState;
  onAddCalculatedColumn?: (name: string, expression: string) => void;
}

export const SQLStudioView: React.FC<SQLStudioViewProps> = ({ dataset, onAddCalculatedColumn }) => {
  const defaultCol = dataset.headers[0] || 'id';
  const defaultNumCol =
    dataset.profile.columns.find((c) => c.dataType === 'numerical' && !c.isIdentifier)?.name ||
    defaultCol;
  const defaultCatCol =
    dataset.profile.columns.find((c) => c.dataType === 'categorical')?.name || defaultCol;

  const defaultQuery = `SELECT ${defaultCatCol}, SUM(${defaultNumCol}) AS total_${defaultNumCol}, COUNT(*) AS total_records\nFROM dataset\nGROUP BY ${defaultCatCol}\nORDER BY total_${defaultNumCol} DESC\nLIMIT 10;`;

  const [query, setQuery] = useState<string>(defaultQuery);
  const [queryResult, setQueryResult] = useState<SQLQueryResult>(() =>
    executeSQLQuery(dataset.cleanedRows, defaultQuery)
  );
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [nlInput, setNlInput] = useState<string>('');

  // Formula Builder State
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColExpr, setNewColExpr] = useState<string>('');
  const [formulaStatus, setFormulaStatus] = useState<string | null>(null);

  // Pre-configured Query Templates
  const queryTemplates = useMemo(
    () => [
      {
        title: 'Top 10 Grouped Aggregates',
        query: `SELECT ${defaultCatCol}, SUM(${defaultNumCol}) AS total_${defaultNumCol}, COUNT(*) AS total_records\nFROM dataset\nGROUP BY ${defaultCatCol}\nORDER BY total_${defaultNumCol} DESC\nLIMIT 10;`,
      },
      {
        title: 'High-Value Filter (> Average)',
        query: `SELECT *\nFROM dataset\nWHERE ${defaultNumCol} > ${
          dataset.profile.columns.find((c) => c.name === defaultNumCol)?.stats?.mean || 100
        }\nORDER BY ${defaultNumCol} DESC\nLIMIT 25;`,
      },
      {
        title: 'Categorical Breakdown with Min/Max',
        query: `SELECT ${defaultCatCol}, AVG(${defaultNumCol}) AS avg_${defaultNumCol}, MAX(${defaultNumCol}) AS max_val, MIN(${defaultNumCol}) AS min_val\nFROM dataset\nGROUP BY ${defaultCatCol}\nORDER BY avg_${defaultNumCol} DESC;`,
      },
      {
        title: 'Full Raw Table Sample',
        query: `SELECT *\nFROM dataset\nLIMIT 20;`,
      },
    ],
    [defaultCatCol, defaultNumCol, dataset.profile.columns]
  );

  const handleRunQuery = () => {
    const res = executeSQLQuery(dataset.cleanedRows, query);
    setQueryResult(res);
  };

  const handleNLToSQL = () => {
    if (!nlInput.trim()) return;
    const input = nlInput.toLowerCase();

    let generated = `SELECT * FROM dataset LIMIT 20;`;
    if (input.includes('top') || input.includes('highest') || input.includes('group by')) {
      generated = `SELECT ${defaultCatCol}, SUM(${defaultNumCol}) AS total_${defaultNumCol}\nFROM dataset\nGROUP BY ${defaultCatCol}\nORDER BY total_${defaultNumCol} DESC\nLIMIT 10;`;
    } else if (input.includes('average') || input.includes('avg')) {
      generated = `SELECT ${defaultCatCol}, AVG(${defaultNumCol}) AS avg_${defaultNumCol}\nFROM dataset\nGROUP BY ${defaultCatCol};`;
    } else if (input.includes('where') || input.includes('greater than') || input.includes('more than')) {
      generated = `SELECT *\nFROM dataset\nWHERE ${defaultNumCol} > 500\nORDER BY ${defaultNumCol} DESC\nLIMIT 20;`;
    }

    setQuery(generated);
    const res = executeSQLQuery(dataset.cleanedRows, generated);
    setQueryResult(res);
    setNlInput('');
  };

  const handleExportCSV = () => {
    if (!queryResult.rows || queryResult.rows.length === 0) return;
    const headers = Object.keys(queryResult.rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...queryResult.rows.map((r) => headers.map((h) => `"${r[h]}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sql_query_result.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCalculatedColumn = async () => {
    if (!newColName || !newColExpr) return;
    try {
      const res = await fetch(`/api/dataset/${dataset.id}/add-column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnName: newColName.trim().replace(/\s+/g, '_'),
          expression: newColExpr.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormulaStatus('Column created successfully! Refreshed schema.');
        setTimeout(() => {
          setShowFormulaModal(false);
          setFormulaStatus(null);
          window.location.reload();
        }, 1200);
      } else {
        setFormulaStatus(data.error || 'Failed to add column.');
      }
    } catch (err: any) {
      setFormulaStatus(err.message || 'Error occurred.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">SQL & Data Transformation Studio</h2>
                <span className="text-xs bg-cyan-50 text-cyan-700 font-semibold px-2.5 py-0.5 rounded-full border border-cyan-200">
                  Live In-Memory Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute analytical SQL queries, group dimensions, filter observations, and derive custom calculated formulas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition border border-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Calculated Formula Column</span>
            </button>
          </div>
        </div>

        {/* Natural Language to SQL Assistant Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ask in natural language (e.g. 'Show me top 10 categories grouped by total profit')..."
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNLToSQL()}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 transition"
            />
          </div>
          <button
            onClick={handleNLToSQL}
            className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition shadow-xs whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate SQL</span>
          </button>
        </div>
      </div>

      {/* SQL Editor & Pre-Built Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SQL Editor Main */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">SQL Query Console</span>
            </div>
            <button
              onClick={handleRunQuery}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Query (Ctrl+Enter)</span>
            </button>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleRunQuery();
              }
            }}
            rows={6}
            className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Table name: <strong className="text-slate-600 font-semibold">dataset</strong></span>
            <span>Supported: SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, SUM/AVG/COUNT/MIN/MAX</span>
          </div>
        </div>

        {/* Query Library & Schema Reference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Pre-Built Query Templates</span>
          </h3>

          <div className="space-y-2">
            {queryTemplates.map((t, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(t.query);
                  const res = executeSQLQuery(dataset.cleanedRows, t.query);
                  setQueryResult(res);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  {t.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  {t.query.split('\n')[0]}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
              Available Attributes
            </span>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {dataset.headers.map((h) => (
                <button
                  key={h}
                  onClick={() => setQuery((prev) => prev + ` ${h}`)}
                  className="text-[10px] font-mono bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition"
                  title="Click to append"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Query Execution Results */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800">Query Execution Output</h3>
            {queryResult.success ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {queryResult.rowCount} rows
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {queryResult.executionTimeMs}ms
                </span>
              </div>
            ) : (
              <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Query Error
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {queryResult.rows.length > 0 && queryResult.columns.length >= 2 && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 inline mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'chart' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
                  Visual Chart
                </button>
              </div>
            )}

            {queryResult.rows.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Error message display */}
        {!queryResult.success && queryResult.error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-mono space-y-1">
            <strong>Execution Error:</strong>
            <p>{queryResult.error}</p>
          </div>
        )}

        {/* Result Table Display */}
        {queryResult.success && activeTab === 'table' && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  {queryResult.columns.map((col) => (
                    <th key={col} className="py-2.5 px-4 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queryResult.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    {queryResult.columns.map((col) => (
                      <td key={col} className="py-2 px-4 whitespace-nowrap text-slate-700 font-mono">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Result Chart Display */}
        {queryResult.success && activeTab === 'chart' && queryResult.columns.length >= 2 && (
          <div className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queryResult.rows} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={queryResult.columns[0]} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey={queryResult.columns[1]} fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Calculated Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Add Calculated Formula Column</h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  New Column Header:
                </label>
                <input
                  type="text"
                  placeholder="e.g. profit_margin or net_revenue"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Mathematical Expression:
                </label>
                <input
                  type="text"
                  placeholder={`e.g. [${defaultNumCol}] * 0.85 or [sales] - [profit]`}
                  value={newColExpr}
                  onChange={(e) => setNewColExpr(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enclose column names in brackets, e.g. <code className="text-blue-600 font-mono">[{defaultNumCol}] * 1.15</code>
                </span>
              </div>

              {formulaStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs">
                  {formulaStatus}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCalculatedColumn}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs"
              >
                Compute & Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
