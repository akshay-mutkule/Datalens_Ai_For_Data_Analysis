import React, { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  ShieldCheck,
  LineChart,
  PieChart,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Database,
  ChevronDown,
  RefreshCw,
  FileText,
  Brain,
  Terminal,
  Grid,
  Users,
  ShieldAlert,
  Calendar,
  Code,
  Zap,
  GitMerge,
  Search,
  SlidersHorizontal,
  Cpu,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dataset: DatasetState | null;
  onUploadClick: () => void;
  onLoadSample: (sampleId: string) => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onOpenCommandPalette: () => void;
  onOpenCopilot?: () => void;
  onOpenSecurity?: () => void;
  isProcessing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  dataset,
  onUploadClick,
  onLoadSample,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onOpenCommandPalette,
  onOpenCopilot,
  onOpenSecurity,
  isProcessing = false,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'exec' | 'ml' | 'bi' | 'dev'>('all');

  const tabs = [
    // Executive & Overview
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, category: 'exec' },
    { id: 'report', label: 'Executive Report', icon: FileText, category: 'exec' },

    // Predictive & AI
    { id: 'ml', label: 'Predictive & ML', icon: Brain, badge: 'AutoML', category: 'ml' },
    { id: 'blending', label: 'Data Blending', icon: GitMerge, badge: 'Fusion', category: 'ml' },
    { id: 'clustering', label: 'Clusters & PCA', icon: Users, badge: 'K-Means', category: 'ml' },
    { id: 'anomalies', label: 'Anomaly Sentinel', icon: ShieldAlert, category: 'ml' },
    { id: 'cohorts', label: 'Cohort Retention', icon: Calendar, category: 'ml' },
    { id: 'chat', label: 'AI Analyst', icon: Sparkles, highlight: true, category: 'ml' },

    // Business Intelligence & Exploration
    { id: 'eda', label: 'Statistical EDA', icon: LineChart, category: 'bi' },
    { id: 'studio', label: 'Chart Studio', icon: PieChart, category: 'bi' },
    { id: 'data', label: 'Data Explorer', icon: FileSpreadsheet, category: 'bi' },
    { id: 'pivot', label: 'Pivot Matrix', icon: Grid, category: 'bi' },

    // Engineering & Ops
    { id: 'sql', label: 'SQL Studio', icon: Terminal, category: 'dev' },
    { id: 'notebook', label: 'Python & R Code', icon: Code, category: 'dev' },
    { id: 'quality', label: 'Data Cleaning', icon: ShieldCheck, badge: dataset?.profile.duplicateRows || dataset?.profile.totalMissingValues ? 'Audit' : undefined, category: 'dev' },
  ];

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'exec', label: 'Executive' },
    { id: 'ml', label: 'Machine Learning & AI' },
    { id: 'bi', label: 'Exploration & BI' },
    { id: 'dev', label: 'SQL & Engineering' },
  ];

  const filteredTabs = activeCategory === 'all'
    ? tabs
    : tabs.filter((t) => t.category === activeCategory);

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 text-white sticky top-0 z-40 shadow-xl shadow-black/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier Header */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-300">
                  DataLens AI
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                High-Performance Autonomous Analytics Engine
              </p>
            </div>
          </div>

          {/* Center: Command Palette Trigger Search Bar */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition shadow-inner group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition" />
                <span className="font-medium text-slate-400">Search views, columns, actions, SQL...</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 font-bold">
                  ⌘K
                </kbd>
              </div>
            </button>
          </div>

          {/* Right: Controls & Data Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <button
              onClick={onOpenCommandPalette}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white md:hidden"
              title="Command Palette"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Active Dataset Status Indicator */}
            {dataset ? (
              <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
                <span className="font-bold text-slate-200 truncate max-w-[130px]" title={dataset.profile.fileName}>
                  {dataset.profile.fileName}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({dataset.profile.totalRows.toLocaleString()} rows)
                </span>
              </div>
            ) : null}

            {/* Sample Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSampleMenu(!showSampleMenu)}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Samples</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showSampleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                  <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Benchmark Datasets
                  </div>
                  {SAMPLE_DATASETS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onLoadSample(sample.id);
                        setShowSampleMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-xs flex flex-col gap-0.5 transition"
                    >
                      <div className="font-bold text-slate-100 flex items-center justify-between">
                        <span>{sample.name}</span>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {sample.rowsCount} rows
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{sample.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={onUploadClick}
              disabled={isProcessing}
              className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{dataset ? 'Upload New' : 'Upload Data'}</span>
            </button>

            {/* Export Dropdown */}
            {dataset && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 text-emerald-200" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl divide-y divide-slate-800">
                    <button
                      onClick={() => {
                        onDownloadPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 font-medium transition"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>Executive PDF Report</span>
                    </button>
                    <button
                      onClick={() => {
                        onDownloadExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 font-medium transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Excel Workbook (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => {
                        onDownloadCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 font-medium transition"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Cleaned Dataset (.csv)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Security & PII Compliance Sentinel Button */}
            {dataset && (
              <button
                onClick={onOpenSecurity}
                className="hidden sm:flex items-center gap-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition shadow-2xs group"
                title="Security & PII Governance Sentinel"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SOC 2
                </span>
              </button>
            )}

            {/* AI Copilot Drawer Trigger Button */}
            {dataset && (
              <button
                onClick={onOpenCopilot}
                className="flex items-center gap-1.5 text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-500/40 px-3 py-1.5 rounded-xl transition shadow-md shadow-indigo-500/15 group"
                title="Open AI Analyst Copilot (⌘J)"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Copilot</span>
                <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] font-mono rounded bg-indigo-900/60 border border-indigo-700/60 text-indigo-300">
                  ⌘J
                </kbd>
              </button>
            )}

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition flex items-center gap-1.5 shadow-2xs"
              title={isDark ? 'Switch to Executive Light Mode' : 'Switch to Obsidian Dark Mode'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold hidden xl:inline text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold hidden xl:inline text-slate-300">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Ribbon with Category Switcher */}
        {dataset && (
          <div className="flex flex-col gap-1 py-2 border-t border-slate-800/80">
            {/* Category Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mr-1 hidden sm:inline">
                Scope:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40'
                        : tab.highlight
                        ? 'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white' : tab.highlight ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
