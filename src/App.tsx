import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { DatasetOverviewCard } from './components/DatasetOverviewCard';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { SecurityComplianceModal } from './components/SecurityComplianceModal';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
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
import { ScenarioSimulationView } from './components/ScenarioSimulationView';
import { RootCauseAnalysisView } from './components/RootCauseAnalysisView';
import { DataLineageDAGView } from './components/DataLineageDAGView';
import { FeatureEngineeringView } from './components/FeatureEngineeringView';
import { CausalInferenceView } from './components/CausalInferenceView';
import { AutonomousAgentSwarmView } from './components/AutonomousAgentSwarmView';
import { AutomatedAlertsView } from './components/AutomatedAlertsView';
import { ExecutiveWarRoomView } from './components/ExecutiveWarRoomView';
import { AutomationWorkflowView } from './components/AutomationWorkflowView';
import { ExplainableAIView } from './components/ExplainableAIView';
import { GeoSpatialIntelligenceView } from './components/GeoSpatialIntelligenceView';
import { SyntheticTwinStudioView } from './components/SyntheticTwinStudioView';
import { ModelArenaView } from './components/ModelArenaView';
import { StressTestRiskMatrixView } from './components/StressTestRiskMatrixView';
import { RealTimeStreamEngineView } from './components/RealTimeStreamEngineView';
import { GraphKnowledgeView } from './components/GraphKnowledgeView';
import { BayesianOptimizationView } from './components/BayesianOptimizationView';
import { DatasetState, CleaningPipelineConfig } from './types/dataset';
import { useTheme } from './context/ThemeContext';
import {
  X,
  Sparkles,
  Loader2,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamEventsCount, setStreamEventsCount] = useState<number>(0);

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

  // Background stream simulation controlled cleanly from WorkspaceSidebar
  useEffect(() => {
    if (!isStreaming || !dataset) return;
    const timer = setInterval(() => {
      setDataset((prev) => {
        if (!prev || prev.cleanedRows.length === 0) return prev;
        const baseIndex = Math.floor(Math.random() * prev.cleanedRows.length);
        const newRow: Record<string, any> = { ...prev.cleanedRows[baseIndex] };
        prev.profile.columns.forEach((col) => {
          if (col.dataType === 'numerical' && typeof newRow[col.name] === 'number') {
            const factor = 1 + (Math.random() * 0.2 - 0.1);
            const val = Number(newRow[col.name]) * factor;
            newRow[col.name] = Number.isInteger(newRow[col.name]) ? Math.round(val) : Number(val.toFixed(2));
          } else if (col.dataType === 'date') {
            newRow[col.name] = new Date().toISOString().split('T')[0];
          }
        });
        return {
          ...prev,
          cleanedRows: [newRow, ...prev.cleanedRows],
          profile: {
            ...prev.profile,
            totalRows: prev.profile.totalRows + 1,
          },
        };
      });
      setStreamEventsCount((c) => c + 1);
    }, 2400);
    return () => clearInterval(timer);
  }, [isStreaming, Boolean(dataset)]);

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

      {/* Top Application Navbar (3-zone contract) */}
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
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        isProcessing={isProcessing}
      />

      {/* Workspace Body: Left Categorized Sidebar + Main Studio Canvas */}
      <div className="flex-1 flex min-w-0">
        {dataset && (
          <WorkspaceSidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            dataset={dataset}
            isStreaming={isStreaming}
            onToggleStream={() => setIsStreaming((s) => !s)}
            streamEventsCount={streamEventsCount}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {!dataset ? (
            <div className="max-w-5xl mx-auto">
              <UploadDropzone
                onFileSelect={handleFileUpload}
                onSelectSample={handleLoadSample}
                isProcessing={isProcessing}
                processingStep={processingStep}
                error={error}
              />
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto space-y-5">
              {/* Collapsible Dataset Summary Strip */}
              <DatasetOverviewCard
                profile={dataset.profile}
                onOpenCleaningModal={() => setCurrentTab('quality')}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />

              {/* Active Tab View with Motion Animation */}
              <div>
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

                  {currentTab === 'warroom' && (
                    <ExecutiveWarRoomView
                      dataset={dataset}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'risk' && <StressTestRiskMatrixView dataset={dataset} />}

                  {currentTab === 'streaming' && <RealTimeStreamEngineView dataset={dataset} />}

                  {currentTab === 'graph' && <GraphKnowledgeView dataset={dataset} />}

                  {currentTab === 'optimizer' && <BayesianOptimizationView dataset={dataset} />}

                  {currentTab === 'arena' && <ModelArenaView dataset={dataset} />}

                  {currentTab === 'twin' && (
                    <SyntheticTwinStudioView
                      dataset={dataset}
                      onApplySyntheticDataset={handleApplyMergedDataset}
                    />
                  )}

                  {currentTab === 'xai' && <ExplainableAIView dataset={dataset} />}

                  {currentTab === 'geospatial' && <GeoSpatialIntelligenceView dataset={dataset} />}

                  {currentTab === 'workflows' && (
                    <AutomationWorkflowView dataset={dataset} />
                  )}

                  {currentTab === 'causal' && <CausalInferenceView dataset={dataset} />}

                  {currentTab === 'swarm' && <AutonomousAgentSwarmView dataset={dataset} />}

                  {currentTab === 'alerts' && <AutomatedAlertsView dataset={dataset} />}

                  {currentTab === 'simulation' && <ScenarioSimulationView dataset={dataset} />}

                  {currentTab === 'rca' && <RootCauseAnalysisView dataset={dataset} />}

                  {currentTab === 'features' && (
                    <FeatureEngineeringView
                      dataset={dataset}
                      onAddColumn={handleAddColumn}
                      onNavigateToTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'pipeline' && <DataLineageDAGView dataset={dataset} />}

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
            </div>
          )}
        </main>
      </div>

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
        className={`border-t py-3 text-xs transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-slate-950 text-slate-500'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <div className="px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DataLens AI · Enterprise Analytics &amp; Decision Engineering</span>
          <span>⌘K Command Palette · ⌘J AI Copilot · ⌘D Theme</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
