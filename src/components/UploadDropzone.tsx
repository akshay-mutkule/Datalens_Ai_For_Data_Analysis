import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  BarChart,
  BrainCircuit,
  Database,
  TrendingUp,
  Cpu,
  Zap,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  isProcessing: boolean;
  processingStep?: string;
  error?: string | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelect,
  onSelectSample,
  isProcessing,
  processingStep,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    onFileSelect(file);
  };

  const steps = [
    'Parsing dataset headers & schema integrity',
    'Detecting statistical & semantic column types',
    'Auditing missing cells & duplicate rows',
    'Formulating optimal data cleaning pipeline',
    'Computing exploratory summary statistics (EDA)',
    'Synthesizing dataset-aware executive KPIs',
    'Building correlation matrices & smart visualizations',
    'Generating automated natural language insights',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Autonomous AI Data Intelligence & Analytics Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Drop any dataset. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            Get instant KPIs, charts & AutoML.
          </span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Upload CSV or Excel files. DataLens AI automatically executes statistical profiling, missing data remediation, correlation discovery, AutoML forecasting, and executive reporting in seconds.
        </p>
      </div>

      {/* Main Upload Dropzone Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden p-6 sm:p-10 relative">
        {isProcessing ? (
          <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-75" />
              <div className="w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Profiling & Modeling Dataset...
              </h3>
              <p className="text-xs text-blue-600 font-semibold mt-1 animate-pulse">
                {processingStep || 'Running autonomous analytical engine'}
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-2.5 text-left bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium truncate">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60 scale-[1.01] ring-4 ring-blue-500/10'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50/40 hover:bg-blue-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Upload className="w-9 h-9" />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Drag & drop your CSV or Excel dataset here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
              Direct upload for CSV, XLSX, and XLS up to 50MB. Instant automated parsing with zero config required.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all group-hover:shadow-lg"
              >
                Browse Local Files
              </button>
            </div>

            {/* Supported format badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">.CSV</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">.XLSX</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">.XLS</span>
              <span className="text-slate-400">• High-Throughput In-Memory Parser</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Demo Sample Datasets Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Or Explore Instant Pre-Loaded Demo Datasets</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              1-click enterprise datasets with real-world schemas, messy data flags, and domain KPIs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 p-5 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {sample.category}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {sample.rowsCount} rows
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  {sample.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Load Live Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Autonomous Data Hygiene</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Identifies missing cells, duplicate rows, invalid types, and statistical outliers with instant remediation.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BarChart className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Predictive ML & What-If</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Auto-fits regression and classification models, calculates feature importance, and runs live interactive parameter simulations.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">AI Executive Intelligence</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Conversational natural language assistant that writes custom SQL, generates Python scripts, and exports executive PDF reports.
          </p>
        </div>
      </div>
    </div>
  );
};
