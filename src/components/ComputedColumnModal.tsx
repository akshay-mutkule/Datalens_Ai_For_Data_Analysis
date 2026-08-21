import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calculator,
  X,
  Check,
  AlertCircle,
  Plus,
  Play,
  HelpCircle,
  Hash,
  Type,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface ComputedColumnModalProps {
  dataset: DatasetState;
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (columnName: string, expression: string, formulaType: string) => Promise<void>;
}

export const ComputedColumnModal: React.FC<ComputedColumnModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onAddColumn,
}) => {
  const [columnName, setColumnName] = useState('');
  const [expression, setExpression] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset.profile.columns]
  );
  const catCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'categorical' && !c.isIdentifier),
    [dataset.profile.columns]
  );
  const dateCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'date'),
    [dataset.profile.columns]
  );

  const c1 = numCols[0]?.name || 'Col1';
  const c2 = numCols[1]?.name || numCols[0]?.name || 'Col2';

  const formulaPresets = [
    {
      id: 'difference',
      label: 'Difference / Profit Margin',
      category: 'math',
      template: `[${c1}] - [${c2}]`,
      description: 'Subtract one numerical metric from another',
    },
    {
      id: 'ratio',
      label: 'Ratio / Multiplier',
      category: 'math',
      template: `[${c1}] / ([${c2}] + 0.0001)`,
      description: 'Ratio between two metrics (with zero division safeguard)',
    },
    {
      id: 'percentage',
      label: 'Percentage Ratio (%)',
      category: 'math',
      template: `([${c1}] / ([${c2}] + 0.0001)) * 100`,
      description: 'Calculate relative proportion as a percentage',
    },
    {
      id: 'log',
      label: 'Logarithmic Transform (Log)',
      category: 'stat',
      template: `Math.log(Math.max(1, [${c1}]))`,
      description: 'Log transform to normalize skewed distributions',
    },
    {
      id: 'sqrt',
      label: 'Square Root Transform',
      category: 'stat',
      template: `Math.sqrt(Math.max(0, [${c1}]))`,
      description: 'Variance stabilizing transformation',
    },
    {
      id: 'binning',
      label: 'Conditional Tier / Binning',
      category: 'logic',
      template: `[${c1}] > 500 ? 1 : 0`,
      description: 'Create binary flags or numerical tiers based on condition',
    },
  ];

  // Preview evaluation on first 5 rows
  const previewData = useMemo(() => {
    if (!expression.trim()) return [];
    const sampleRows = dataset.cleanedRows.slice(0, 5);

    return sampleRows.map((row, idx) => {
      try {
        let evalStr = expression.replace(/\[([a-zA-Z0-9_]+)\]/g, (_: string, col: string) => {
          const val = Number(row[col]);
          return isNaN(val) ? '0' : String(val);
        });

        // Test if safe
        if (/^[\d\s+\-*/().Math.sqrt.log.abs.pow.round><=?:!&|]+$/.test(evalStr)) {
          // eslint-disable-next-line no-new-func
          const computed = Function(`"use strict"; return (${evalStr})`)();
          return {
            rowIdx: idx + 1,
            val: typeof computed === 'number' ? Number(computed.toFixed(2)) : String(computed),
            status: 'ok',
          };
        } else {
          return { rowIdx: idx + 1, val: 'Invalid formula syntax', status: 'error' };
        }
      } catch (err: any) {
        return { rowIdx: idx + 1, val: 'Evaluation error', status: 'error' };
      }
    });
  }, [expression, dataset.cleanedRows]);

  const handleApplyPreset = (preset: typeof formulaPresets[0]) => {
    setSelectedTemplate(preset.id);
    setExpression(preset.template);
    if (!columnName) {
      setColumnName(`${preset.id}_metric`);
    }
  };

  const handleInsertColumn = (col: string) => {
    setExpression((prev) => `${prev}[${col}]`);
  };

  const handleInsertOp = (op: string) => {
    setExpression((prev) => `${prev} ${op} `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) {
      setErrorMessage('Please enter a column name.');
      return;
    }
    if (!expression.trim()) {
      setErrorMessage('Please provide a calculation expression.');
      return;
    }

    const cleanColName = columnName.trim().replace(/[^a-zA-Z0-9_]/g, '_');

    // Check if column already exists
    if (dataset.headers.includes(cleanColName)) {
      setErrorMessage(`Column "${cleanColName}" already exists. Choose a unique name.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onAddColumn(cleanColName, expression, selectedTemplate);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add column.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Formula & Calculated Column Studio
              </h2>
              <p className="text-xs text-slate-500">
                Create new derived features, math transforms, and normalized ratios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Presets Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Choose a Quick Formula Template or Build Custom
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {formulaPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedTemplate === preset.id
                      ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{preset.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{preset.description}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/80 truncate">
                    {preset.template}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. New Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g. net_profit_margin, log_revenue, discounted_price"
              className="w-full text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Insert Quick Chips */}
          <div className="space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Click to Insert Dataset Column:</span>
              <span className="text-[11px] text-slate-400 font-normal">Surrounded in [brackets]</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {dataset.profile.columns.map((col) => (
                <button
                  type="button"
                  key={col.name}
                  onClick={() => handleInsertColumn(col.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-xs font-semibold text-slate-700 transition shadow-2xs"
                >
                  {col.dataType === 'numerical' ? (
                    <Hash className="w-3 h-3 text-blue-500" />
                  ) : col.dataType === 'date' ? (
                    <Calendar className="w-3 h-3 text-purple-500" />
                  ) : (
                    <Type className="w-3 h-3 text-indigo-500" />
                  )}
                  <span>{col.name}</span>
                </button>
              ))}
            </div>

            {/* Math Operator Quick Buttons */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Operators:</span>
              {['+', '-', '*', '/', '%', '(', ')', 'Math.log()', 'Math.sqrt()', 'Math.abs()'].map(
                (op) => (
                  <button
                    type="button"
                    key={op}
                    onClick={() => handleInsertOp(op)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 transition"
                  >
                    {op}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Formula Expression Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              3. Calculation Formula Expression
            </label>
            <textarea
              rows={3}
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. [Price] * [Quantity] * (1 - [Discount])"
              className="w-full text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Live Preview Section */}
          {previewData.length > 0 && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Live Preview on Sample Records:
                </span>
                <span className="text-slate-400 text-[10px]">First 5 Rows</span>
              </div>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {previewData.map((p) => (
                  <div
                    key={p.rowIdx}
                    className={`p-2 rounded-xl text-center border ${
                      p.status === 'ok'
                        ? 'bg-slate-800/80 border-slate-700 text-emerald-300 font-mono font-bold text-xs'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300 text-[10px]'
                    }`}
                  >
                    <div className="text-[9px] text-slate-400 font-sans">Row #{p.rowIdx}</div>
                    <div className="truncate mt-0.5">{p.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !columnName.trim() || !expression.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Calculating Column...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Column to Dataset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
