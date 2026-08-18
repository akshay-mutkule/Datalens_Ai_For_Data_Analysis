import React, { useState, useEffect } from 'react';
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
import { SQLStudioView } from './components/SQLStudioView';
import { PivotTableView } from './components/PivotTableView';
import { DatasetState, CleaningPipelineConfig } from './types/dataset';
import { X, Upload } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
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

            {/* Active Tab View */}
            <div className="pt-2">
              {currentTab === 'dashboard' && (
                <DashboardView
                  dataset={dataset}
                  onNavigateToTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'ml' && <PredictiveMLView dataset={dataset} />}

              {currentTab === 'sql' && <SQLStudioView dataset={dataset} />}

              {currentTab === 'pivot' && <PivotTableView dataset={dataset} />}

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

              {currentTab === 'data' && <DataTableView dataset={dataset} />}
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
