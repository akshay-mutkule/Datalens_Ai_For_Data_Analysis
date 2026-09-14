import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  Sparkles,
  BarChart3,
  Brain,
  GitMerge,
  Users,
  ShieldAlert,
  Calendar,
  Terminal,
  Grid,
  ShieldCheck,
  LineChart,
  PieChart,
  Code,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Hash,
  Type,
  Key,
  Layers,
  Zap,
  CornerDownLeft,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetState | null;
  onNavigateTab: (tabId: string) => void;
  onLoadSample: (sampleId: string) => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onOpenUpload: () => void;
  onOpenCopilot?: () => void;
  onOpenSecurity?: () => void;
  onToggleTheme?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Views & Studios' | 'Dataset Columns' | 'Quick Actions' | 'Sample Datasets';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onNavigateTab,
  onLoadSample,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onOpenUpload,
  onOpenCopilot,
  onOpenSecurity,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct all available command items
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Navigation Views
    const views = [
      { id: 'dashboard', title: 'Executive KPI Dashboard', subtitle: 'High-level business metrics, KPIs, and trend charts', icon: BarChart3, badge: 'Overview' },
      { id: 'ml', title: 'Predictive AutoML & Decision Trees', subtitle: 'Train regression models, random forest, and explore decision trees', icon: Brain, badge: 'ML Engine' },
      { id: 'blending', title: 'Data Blending & Schema Fusion', subtitle: 'Join primary data with external demographics or custom lookup tables', icon: GitMerge, badge: 'Fusion' },
      { id: 'clustering', title: 'K-Means Clustering & PCA 2D/3D', subtitle: 'Unsupervised segmentation, silhouette scoring, and principal components', icon: Users, badge: 'Unsupervised' },
      { id: 'anomalies', title: 'Anomaly Sentinel & Fraud Detector', subtitle: 'Z-score & IQR outlier scans with risk classification', icon: ShieldAlert, badge: 'Sentinel' },
      { id: 'cohorts', title: 'Cohort Retention & Customer LTV', subtitle: 'Monthly cohort heatmaps, churn analysis, and retention curves', icon: Calendar, badge: 'Retention' },
      { id: 'sql', title: 'SQL Studio & Query Engine', subtitle: 'Execute ANSI SQL queries with filter, aggregation, and live export', icon: Terminal, badge: 'SQL' },
      { id: 'pivot', title: 'Multi-Dimensional Pivot Matrix', subtitle: 'Cross-tabulate rows, columns, values with sum, mean, count aggregates', icon: Grid, badge: 'Pivot' },
      { id: 'quality', title: 'Data Cleaning & Quality Pipeline', subtitle: 'Impute missing values, remove duplicates, cap outliers', icon: ShieldCheck, badge: 'Quality' },
      { id: 'eda', title: 'Statistical EDA & Distribution Profiler', subtitle: 'Kurtosis, skewness, variance, quartile distributions, and histograms', icon: LineChart, badge: 'Stats' },
      { id: 'studio', title: 'Custom Chart Builder Studio', subtitle: 'Create bar, line, scatter, radar, area, and compose custom charts', icon: PieChart, badge: 'Studio' },
      { id: 'notebook', title: 'Python, R & Julia Code Studio', subtitle: 'Export ready-to-run Pandas, Scikit-Learn, ggplot2, and Tidyverse scripts', icon: Code, badge: 'Scripts' },
      { id: 'chat', title: 'AI Analyst & Natural Language Query', subtitle: 'Ask questions in plain English with automated answers and charts', icon: Sparkles, badge: 'AI Copilot' },
      { id: 'report', title: 'Automated Executive Report Generator', subtitle: 'Comprehensive audit, automated insights, and executive summaries', icon: FileText, badge: 'Report' },
      { id: 'data', title: 'Interactive Data Explorer & Grid', subtitle: 'Search, sort, filter, add computed columns, and edit records', icon: FileSpreadsheet, badge: 'Raw Data' },
    ];

    views.forEach((v) => {
      items.push({
        id: `view_${v.id}`,
        category: 'Views & Studios',
        title: v.title,
        subtitle: v.subtitle,
        icon: v.icon,
        badge: v.badge,
        action: () => {
          onNavigateTab(v.id);
          onClose();
        },
      });
    });

    // 2. Dataset Columns
    if (dataset) {
      dataset.profile.columns.forEach((col) => {
        const Icon =
          col.dataType === 'numerical'
            ? Hash
            : col.dataType === 'date'
            ? Calendar
            : col.dataType === 'identifier'
            ? Key
            : Type;

        items.push({
          id: `col_${col.name}`,
          category: 'Dataset Columns',
          title: `Inspect Column: ${col.name}`,
          subtitle: `${col.inferredType} (${col.dataType}) • ${col.uniqueValuesCount} distinct • ${col.nullCount} nulls`,
          icon: Icon,
          badge: col.dataType,
          action: () => {
            onNavigateTab('eda');
            onClose();
          },
        });
      });
    }

    if (onOpenCopilot) {
      items.push({
        id: 'action_copilot',
        category: 'Quick Actions',
        title: 'Launch AI Analyst Copilot',
        subtitle: 'Ask natural language statistical and data questions (⌘J)',
        icon: Sparkles,
        badge: 'AI Copilot',
        action: () => {
          onOpenCopilot();
          onClose();
        },
      });
    }

    if (onOpenSecurity) {
      items.push({
        id: 'action_security',
        category: 'Quick Actions',
        title: 'Run Security, PII & Governance Audit',
        subtitle: 'Scan for personal identifiers, SSN, emails, and compliance flags',
        icon: ShieldCheck,
        badge: 'SOC 2',
        action: () => {
          onOpenSecurity();
          onClose();
        },
      });
    }

    if (onToggleTheme) {
      items.push({
        id: 'action_theme',
        category: 'Quick Actions',
        title: 'Toggle Workspace Theme (Dark / Light)',
        subtitle: 'Switch between Obsidian Enterprise Dark and Clean Executive Light',
        icon: Zap,
        badge: 'Theme',
        action: () => {
          onToggleTheme();
          onClose();
        },
      });
    }

    // 3. Quick Actions
    items.push({
      id: 'action_upload',
      category: 'Quick Actions',
      title: 'Upload New CSV / Excel Dataset',
      subtitle: 'Parse local files with automated profiling and data quality audit',
      icon: Upload,
      action: () => {
        onOpenUpload();
        onClose();
      },
    });

    if (dataset) {
      items.push(
        {
          id: 'action_export_pdf',
          category: 'Quick Actions',
          title: 'Export Executive PDF Summary',
          subtitle: 'Generate printable audit report with KPIs and visualizations',
          icon: FileText,
          badge: 'PDF',
          action: () => {
            onDownloadPDF();
            onClose();
          },
        },
        {
          id: 'action_export_excel',
          category: 'Quick Actions',
          title: 'Export Cleaned Excel Workbook',
          subtitle: 'Download complete dataset with formatted sheets (.xlsx)',
          icon: FileSpreadsheet,
          badge: 'XLSX',
          action: () => {
            onDownloadExcel();
            onClose();
          },
        },
        {
          id: 'action_export_csv',
          category: 'Quick Actions',
          title: 'Export Cleaned CSV File',
          subtitle: 'Save processed records with imputed values and transformations',
          icon: Download,
          badge: 'CSV',
          action: () => {
            onDownloadCSV();
            onClose();
          },
        }
      );
    }

    // 4. Sample Datasets
    SAMPLE_DATASETS.forEach((s) => {
      items.push({
        id: `sample_${s.id}`,
        category: 'Sample Datasets',
        title: `Load Sample: ${s.name}`,
        subtitle: `${s.rowsCount} rows • ${s.description}`,
        icon: Layers,
        badge: 'Sample',
        action: () => {
          onLoadSample(s.id);
          onClose();
        },
      });
    });

    return items;
  }, [
    dataset,
    onNavigateTab,
    onLoadSample,
    onDownloadCSV,
    onDownloadExcel,
    onDownloadPDF,
    onOpenUpload,
    onOpenCopilot,
    onOpenSecurity,
    onToggleTheme,
    onClose,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands.slice(0, 18);
    const q = query.toLowerCase().trim();
    return allCommands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.badge && cmd.badge.toLowerCase().includes(q))
      );
    });
  }, [allCommands, query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 text-white">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60 gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, jump to view, or search dataset columns..."
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 font-bold">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Command className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold">No matching commands or attributes found.</p>
              <p className="text-[11px] text-slate-500 mt-1">Try searching for "predictive", "export", "outliers", or a column name.</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition ${
                    isSelected
                      ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-400/30'
                      : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-blue-400 border border-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{cmd.title}</span>
                        {cmd.badge && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] text-white/90 bg-white/20 px-2 py-0.5 rounded-md font-bold">
                        <CornerDownLeft className="w-3 h-3" /> Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>DataLens Command Core</span>
          </div>
        </div>
      </div>
    </div>
  );
};
