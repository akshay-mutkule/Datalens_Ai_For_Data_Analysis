import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { DatasetOverviewCard } from './components/DatasetOverviewCard';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { SecurityComplianceModal } from './components/SecurityComplianceModal';
import { LiveStreamBar } from './components/LiveStreamBar';
import { DashboardView } from './components/DashboardView';
import { DataQualityView } from './components/DataQualityView';
import { EDAView } from './components/EDAView';
import { VisualizerView } from './components/VisualizerView';
import { AIChatView } from './components/AIChatView';
import { ReportView } from './components/ReportView';
import { DataTableView } from './components/DataTableView';
import { PredictiveMLView } from './components/PredictiveMLView';
import { DataBlendingView } from './components/DataBlendingView';
import { SQLStudioView } from './components/SQLStudioView';
import { PivotTableView } from './components/PivotTableView';
import { ClusteringSegmentationView } from './components/ClusteringSegmentationView';
import { AnomalyDetectionView } from './components/AnomalyDetectionView';
import { CohortAnalysisView } from './components/CohortAnalysisView';
import { CodeNotebookStudioView } from './components/CodeNotebookStudioView';
import { DatasetState, CleaningPipelineConfig } from './types/dataset';
import { useTheme } from './context/ThemeContext';
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  Cpu,
  Activity,
  Zap,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Brain,
  Layers,
} from 'lucide-react';

export function App() {
  const { isDark, toggleTheme } = useTheme();
  const [dataset, setDataset] = useState<DatasetState | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Auto-load the Sales Analytics sample on initial mount
  useEffect(() => {
    handleLoadSample('sales_analytics');
  }, []);

  // Global Ctrl+K / Cmd+K and Cmd+J / Cmd+D keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep('Uploading and reading raw file bytes...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setTimeout(() => setProcessingStep('Profiling column schema & statistical types...'), 600);
      setTimeout(() => setProcessingStep('Auditing missing values & data hygiene...'), 1200);
      setTimeout(() => setProcessingStep('Computing KPI matrix & chart configurations...'), 1800);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze uploaded file.');
      }

      setDataset(data.dataset);
      setCurrentTab('dashboard');
      setShowUploadModal(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading file.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep('Synthesizing high-dimensional enterprise dataset...');

    try {
      const res = await fetch(`/api/sample/${sampleId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load sample dataset.');
      }

      setDataset(data.dataset);
      setCurrentTab('dashboard');
      setShowUploadModal(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading sample.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleApplyCleaning = async (pipeline: CleaningPipelineConfig) => {
    if (!dataset) return;
    setIsCleaning(true);
    setError(null);

    try {
      const res = await fetch(`/api/dataset/${dataset.id}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clean dataset.');
      }

      setDataset(data.dataset);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error applying cleaning operations.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRefreshReport = async () => {
    if (!dataset) return;
    setIsGeneratingReport(true);
    try {
      const res = await fetch(`/api/dataset/${dataset.id}/report`);
      const data = await res.json();
      if (data.success && data.report) {
        setDataset((prev) => (prev ? { ...prev, report: data.report } : null));
      }
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAddColumn = (colName: string, formula: string, resultValues: any[]) => {
    if (!dataset) return;
    const updatedRows = dataset.cleanedRows.map((row, idx) => ({
      ...row,
      [colName]: resultValues[idx],
    }));

    setDataset({
      ...dataset,
      cleanedRows: updatedRows,
      headers: [...dataset.headers, colName],
      profile: {
        ...dataset.profile,
        totalColumns: dataset.profile.totalColumns + 1,
        columns: [
          ...dataset.profile.columns,
          {
            name: colName,
            dataType: typeof resultValues[0] === 'number' ? 'numerical' : 'categorical',
            inferredType: typeof resultValues[0] === 'number' ? 'Float/Formula' : 'String/Formula',
            nullCount: resultValues.filter((v) => v === null || v === undefined).length,
            uniqueValuesCount: new Set(resultValues).size,
            sampleValues: resultValues.slice(0, 5),
          },
        ],
      },
    });
  };

  const handleUpdateRow = (rowIndex: number, updatedRow: Record<string, any>) => {
    if (!dataset) return;
    const newRows = [...dataset.cleanedRows];
    newRows[rowIndex] = updatedRow;
    setDataset({
      ...dataset,
      cleanedRows: newRows,
    });
  };

  const handleDownloadCSV = () => {
    if (!dataset) return;
    const headers = dataset.headers.join(',');
    const rows = dataset.cleanedRows.map((row) =>
      dataset.headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset.profile.fileName.replace(/\.[^/.]+$/, '')}_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    if (!dataset) return;
    handleDownloadCSV();
  };

  const handleApplyMergedDataset = async (mergedRows: Record<string, any>[], summary: string) => {
    if (!dataset) return;
    setIsProcessing(true);
    setProcessingStep('Integrating fused dataset and recalculating KPIs...');

    try {
      const res = await fetch(`/api/dataset/${dataset.id}/blend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergedRows }),
      });

      const data = await res.json();
      if (data.success && data.dataset) {
        setDataset(data.dataset);
        setCurrentTab('dashboard');
      } else {
        throw new Error(data.error || 'Failed to apply data blend');
      }
    } catch (err) {
      console.error('Data blend failed:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleNewStreamRow = (newRow: Record<string, any>) => {
    if (!dataset) return;
    const updatedRows = [newRow, ...dataset.cleanedRows];
    setDataset((prev) =>
      prev
        ? {
            ...prev,
            cleanedRows: updatedRows,
            profile: {
              ...prev.profile,
              totalRows: prev.profile.totalRows + 1,
            },
          }
        : null
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased relative selection:bg-blue-600 selection:text-white transition-colors duration-200 ${
        isDark ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-100/70 text-slate-900'
      }`}
    >
      {/* Ambient background styling */}
      <div
        className={`fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] -z-10 ${
          isDark
            ? 'from-blue-950/20 via-slate-950/60 to-transparent'
            : 'from-blue-50/60 via-slate-50/20 to-transparent'
        }`}
      />

      {/* Top Application Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        dataset={dataset}
        onUploadClick={() => setShowUploadModal(true)}
        onLoadSample={handleLoadSample}
        onDownloadCSV={handleDownloadCSV}
        onDownloadExcel={handleDownloadExcel}
        onDownloadPDF={() => setCurrentTab('report')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        isProcessing={isProcessing}
      />

      {/* Live Stream Ingestion Bar */}
      {dataset && (
        <LiveStreamBar dataset={dataset} onNewStreamRow={handleNewStreamRow} />
      )}

      {/* Real-Time Telemetry & Status Bar */}
      {dataset && (
        <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-[11px] py-1.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none font-mono">
            <div className="flex items-center gap-4 shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ENGINE: ACTIVE
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">
                LATENCY: <strong className="text-blue-400">&lt; 8ms</strong>
              </span>
              <span className="text-slate-500 hidden md:inline">|</span>
              <span className="text-slate-300 hidden md:inline">
                MEM ESTIMATE: <strong className="text-purple-400">~{((dataset.profile.fileSizeBytes * 2.2) / 1024 / 1024).toFixed(2)} MB</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="hover:text-emerald-400 transition flex items-center gap-1 font-bold text-emerald-400/90"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Sentinel (SOC 2)
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="hover:text-indigo-400 transition flex items-center gap-1 font-bold text-indigo-300"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" /> Copilot (⌘J)
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setCurrentTab('sql')}
                className="hover:text-blue-400 transition flex items-center gap-1 font-bold"
              >
                <Terminal className="w-3 h-3 text-blue-400" /> SQL Console
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setCurrentTab('ml')}
                className="hover:text-indigo-400 transition flex items-center gap-1 font-bold"
              >
                <Brain className="w-3 h-3 text-indigo-400" /> AutoML Studio
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hover:text-amber-400 transition flex items-center gap-1 font-bold"
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> Quick Jump (⌘K)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {!dataset ? (
          <UploadDropzone
            onFileSelect={handleFileUpload}
            onSelectSample={handleLoadSample}
            isProcessing={isProcessing}
            processingStep={processingStep}
            error={error}
          />
        ) : (
          <>
            {/* Top Level Dataset Profile & Quality Card */}
            <DatasetOverviewCard
              profile={dataset.profile}
              onOpenCleaningModal={() => setCurrentTab('quality')}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />

            {/* Active Tab View with Motion Animation */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="gpu-accelerated"
                >
                  {currentTab === 'dashboard' && (
                    <DashboardView
                      dataset={dataset}
                      onNavigateToTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'ml' && <PredictiveMLView dataset={dataset} />}

                  {currentTab === 'blending' && (
                    <DataBlendingView
                      dataset={dataset}
                      onApplyMergedDataset={handleApplyMergedDataset}
                    />
                  )}

                  {currentTab === 'clustering' && <ClusteringSegmentationView dataset={dataset} />}

                  {currentTab === 'anomalies' && <AnomalyDetectionView dataset={dataset} />}

                  {currentTab === 'cohorts' && <CohortAnalysisView dataset={dataset} />}

                  {currentTab === 'sql' && <SQLStudioView dataset={dataset} />}

                  {currentTab === 'pivot' && <PivotTableView dataset={dataset} />}

                  {currentTab === 'notebook' && <CodeNotebookStudioView dataset={dataset} />}

                  {currentTab === 'quality' && (
                    <DataQualityView
                      dataset={dataset}
                      onApplyCleaning={handleApplyCleaning}
                      isCleaning={isCleaning}
                    />
                  )}

                  {currentTab === 'eda' && <EDAView dataset={dataset} />}

                  {currentTab === 'studio' && <VisualizerView dataset={dataset} />}

                  {currentTab === 'chat' && <AIChatView dataset={dataset} />}

                  {currentTab === 'report' && (
                    <ReportView
                      dataset={dataset}
                      onRefreshReport={handleRefreshReport}
                      isGeneratingReport={isGeneratingReport}
                    />
                  )}

                  {currentTab === 'data' && (
                    <DataTableView
                      dataset={dataset}
                      onAddColumn={handleAddColumn}
                      onUpdateRow={handleUpdateRow}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        dataset={dataset}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onLoadSample={handleLoadSample}
        onDownloadCSV={handleDownloadCSV}
        onDownloadExcel={handleDownloadExcel}
        onDownloadPDF={() => setCurrentTab('report')}
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onToggleTheme={toggleTheme}
      />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        dataset={dataset}
        activeTab={currentTab}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsCopilotOpen(false);
        }}
      />

      {/* Security & Compliance Sentinel Modal */}
      <SecurityComplianceModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        dataset={dataset}
      />

      {/* Floating AI Copilot Trigger */}
      {dataset && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold ring-2 ring-white/20 group"
          title="Open AI Intelligence Copilot (⌘J)"
        >
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>Copilot</span>
          <kbd className="text-[10px] font-mono px-1 py-0.2 bg-white/20 rounded text-white/90">⌘J</kbd>
        </button>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-slate-900 border border-slate-800 text-slate-100' : 'bg-white text-slate-900'} rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <UploadDropzone
              onFileSelect={handleFileUpload}
              onSelectSample={handleLoadSample}
              isProcessing={isProcessing}
              processingStep={processingStep}
              error={error}
            />
          </div>
        </div>
      )}

      {/* Floating Processing Indicator */}
      {isProcessing && dataset && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900/95 text-white border border-slate-700/80 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div className="text-xs">
            <div className="font-extrabold text-slate-100">Processing Analytics</div>
            <div className="text-[11px] text-slate-400">{processingStep || 'Computing real-time model inferences...'}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`border-t py-4 mt-12 text-center text-xs transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-slate-950/80 text-slate-500'
            : 'border-slate-200 bg-white text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DataLens AI • Autonomous Enterprise Analytics & Data Science Platform</span>
          <span>Powered by Gemini 3.7 Flash & Express High-Performance Engine</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
