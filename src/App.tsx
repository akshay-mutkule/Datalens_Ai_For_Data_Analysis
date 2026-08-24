import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { DatasetOverviewCard } from './components/DatasetOverviewCard';
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
import { X, Upload, Sparkles, Loader2 } from 'lucide-react';

export function App() {
  const [dataset, setDataset] = useState<DatasetState | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Auto-load the Sales Analytics sample on initial mount so users get an instant live experience
  useEffect(() => {
    handleLoadSample('sales_analytics');
  }, []);

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
      setShowUploadModal(false);
      setCurrentTab('dashboard');
    } catch (err: any) {
      setError(err.message || 'Error processing dataset.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep(`Loading ${sampleId.replace('_', ' ')} dataset...`);

    try {
      const res = await fetch(`/api/sample/${sampleId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load sample dataset.');
      }

      setDataset(data.dataset);
      setShowUploadModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleApplyCleaning = async (config: CleaningPipelineConfig) => {
    if (!dataset) return;
    setIsCleaning(true);

    try {
      const res = await fetch(`/api/dataset/${dataset.id}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaningConfig: config }),
      });

      const data = await res.json();
      if (data.success && data.dataset) {
        setDataset(data.dataset);
      }
    } catch (err) {
      console.error('Error applying cleaning:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRefreshReport = async () => {
    if (!dataset) return;
    setIsGeneratingReport(true);

    try {
      const res = await fetch(`/api/dataset/${dataset.id}/report`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success && data.report) {
        setDataset((prev) => (prev ? { ...prev, report: data.report } : prev));
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadCSV = () => {
    if (dataset) {
      window.location.href = `/api/dataset/${dataset.id}/export/csv`;
    }
  };

  const handleDownloadExcel = () => {
    if (dataset) {
      window.location.href = `/api/dataset/${dataset.id}/export/excel`;
    }
  };

  const handleAddColumn = async (columnName: string, expression: string, formulaType: string) => {
    if (!dataset) return;
    try {
      const res = await fetch(`/api/dataset/${dataset.id}/add-column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnName, expression, formulaType }),
      });
      const data = await res.json();
      if (data.success && data.dataset) {
        setDataset(data.dataset);
      } else {
        throw new Error(data.error || 'Failed to add column');
      }
    } catch (err) {
      console.error('Error adding calculated column:', err);
      throw err;
    }
  };

  const handleUpdateRow = (rowIndex: number, updatedRow: Record<string, any>) => {
    if (!dataset) return;
    const newCleanedRows = [...dataset.cleanedRows];
    newCleanedRows[rowIndex] = updatedRow;
    setDataset({
      ...dataset,
      cleanedRows: newCleanedRows,
    });
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

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans antialiased relative selection:bg-blue-600 selection:text-white">
      {/* Subtle Ambient Radial Lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/60 via-slate-50/20 to-transparent -z-10" />

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
        isProcessing={isProcessing}
      />

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

      {/* Upload Modal (when user clicks "Upload New" while exploring another dataset) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
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

      {/* Floating Processing Indicator if processing in background */}
      {isProcessing && dataset && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white border border-slate-700/80 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div className="text-xs">
            <div className="font-extrabold text-slate-100">Processing Analytics</div>
            <div className="text-[11px] text-slate-400">{processingStep || 'Computing real-time model inferences...'}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DataLens AI • Autonomous Data Analysis & Dashboard Platform</span>
          <span>Powered by Gemini 3.7 Flash & Express + Vite Analytics Core</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
