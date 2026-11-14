import React, { useState } from 'react';
import {
  Download,
  Upload,
  Layers,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Search,
  Sun,
  Moon,
  Sparkles,
  PanelLeft,
  Menu,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { useTheme } from '../context/ThemeContext';
import { getStudioMeta } from '../config/navigation';

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
  onToggleSidebar?: () => void;
  onToggleMobileMenu?: () => void;
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
  onToggleSidebar,
  onToggleMobileMenu,
  isProcessing = false,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeStudio = getStudioMeta(currentTab);

  return (
    <header
      className={`sticky top-0 z-40 h-14 border-b backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950/90 border-slate-800/90 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark & Contextual Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {dataset && onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className={`p-1.5 rounded-lg lg:hidden transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
              aria-label="Open studio navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          {dataset && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`hidden lg:flex p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title="Toggle workspace sidebar"
              aria-label="Toggle workspace sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setCurrentTab('dashboard')}
            className="text-base font-extrabold tracking-tight whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
          >
            DataLens AI
          </button>

          {dataset && (
            <div className={`hidden sm:flex items-center gap-2 text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span aria-hidden="true">/</span>
              <span className="truncate">{activeStudio.categoryLabel}</span>
              <span aria-hidden="true">/</span>
              <span className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {activeStudio.label}
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Command Palette Search Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search studios, columns, SQL, actions...</span>
            </span>
            <kbd
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border shrink-0 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Zone 3: Workspace Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className={`p-2 rounded-lg border md:hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Command Palette"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Samples Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSampleMenu(!showSampleMenu);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Samples</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showSampleMenu && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-xl py-1.5 z-50 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className={`px-3.5 py-1.5 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Benchmark Datasets
                </div>
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onLoadSample(sample.id);
                      setShowSampleMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between gap-2">
                      <span className="truncate">{sample.name}</span>
                      <span className="text-[11px] font-mono tabular-nums text-blue-500 shrink-0">
                        {sample.rowsCount} rows
                      </span>
                    </div>
                    <div className={`text-[11px] line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {sample.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{dataset ? 'Upload' : 'Upload Data'}</span>
          </button>

          {/* Export Dropdown */}
          {dataset && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowSampleMenu(false);
                }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showExportMenu && (
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl py-1 z-50 divide-y ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 divide-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 divide-slate-100 text-slate-800'
                  }`}
                >
                  <button
                    onClick={() => {
                      onDownloadPDF();
                      setShowExportMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>Executive PDF Report</span>
                  </button>
                  <button
                    onClick={() => {
                      onDownloadExcel();
                      setShowExportMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Excel Workbook (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      onDownloadCSV();
                      setShowExportMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 font-medium transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Cleaned Dataset (.csv)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copilot Drawer Trigger */}
          {dataset && onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-indigo-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
              }`}
              title="Open AI Intelligence Copilot (⌘J)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copilot</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
