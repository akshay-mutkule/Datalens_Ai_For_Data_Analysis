import React from 'react';
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
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dataset: DatasetState | null;
  onUploadClick: () => void;
  onLoadSample: (sampleId: string) => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
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
  isProcessing = false,
}) => {
  const [showSampleMenu, setShowSampleMenu] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'quality', label: 'Data Cleaning', icon: ShieldCheck, badge: dataset?.profile.duplicateRows || dataset?.profile.totalMissingValues ? 'Review' : undefined },
    { id: 'eda', label: 'Statistical EDA', icon: LineChart },
    { id: 'studio', label: 'Chart Studio', icon: PieChart },
    { id: 'chat', label: 'AI Analyst', icon: Sparkles, highlight: true },
    { id: 'report', label: 'Executive Report', icon: FileText },
    { id: 'data', label: 'Data Explorer', icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200">
                  DataLens AI
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                Automated Profiling, Cleaning & Analytics
              </p>
            </div>
          </div>

          {/* Active Dataset Status & Sample Datasets Picker */}
          <div className="flex items-center gap-3">
            {dataset ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200 truncate max-w-[140px] sm:max-w-[200px]" title={dataset.profile.fileName}>
                  {dataset.profile.fileName}
                </span>
                <span className="text-slate-400">
                  ({dataset.profile.totalRows.toLocaleString()} rows)
                </span>
              </div>
            ) : null}

            {/* Sample Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSampleMenu(!showSampleMenu)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Samples</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showSampleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    Instant Demo Datasets
                  </div>
                  {SAMPLE_DATASETS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onLoadSample(sample.id);
                        setShowSampleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700/60 text-xs flex flex-col gap-0.5 transition"
                    >
                      <div className="font-medium text-slate-100 flex items-center justify-between">
                        <span>{sample.name}</span>
                        <span className="text-[10px] text-slate-400">{sample.rowsCount} rows</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">{sample.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload New</span>
            </button>

            {/* Export Dropdown */}
            {dataset && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-600/40 px-3 py-1.5 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                    <button
                      onClick={() => {
                        onDownloadPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>PDF Analytical Report</span>
                    </button>
                    <button
                      onClick={() => {
                        onDownloadExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Excel Workbook (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => {
                        onDownloadCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 text-slate-200"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Cleaned Dataset (.csv)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {dataset && (
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : tab.highlight
                      ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/80 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
