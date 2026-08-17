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
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    if (!isValid) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    onFileSelect(file);
  };

  const steps = [
    'Parsing dataset & headers',
    'Detecting statistical & semantic data types',
    'Auditing data quality & missing values',
    'Generating data cleaning remediation pipeline',
    'Calculating descriptive exploratory statistics (EDA)',
    'Computing dataset-aware executive KPIs',
    'Synthesizing smart charts & correlation matrices',
    'Formulating automated business insights',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Business Intelligence & Analytics Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upload any dataset. Get instant analysis, cleaning & dashboards.
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Drag & drop your CSV or Excel file. DataLens AI automatically profiles schemas, cleans anomalies, calculates KPIs, constructs interactive visualizations, and generates executive reports.
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        {isProcessing ? (
          <div className="py-12 px-4 max-w-md mx-auto text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-75" />
              <div className="w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Analyzing & Modeling Dataset...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {processingStep || 'Running autonomous pipeline algorithms'}
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{step}</span>
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
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Drop your CSV or Excel file here
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports CSV, XLSX, and XLS files up to 50MB. All data stays secure and private.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Browse Files
              </button>
            </div>

            {/* Supported format badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">.CSV</span>
              <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">.XLSX</span>
              <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">.XLS</span>
              <span>• Auto-profiling & Cleaning</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Demo Sample Datasets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Or Test Instantly with Sample Datasets
            </h2>
            <p className="text-xs text-slate-500">
              1-click pre-configured enterprise datasets for immediate exploration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition p-4 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {sample.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {sample.rowsCount} rows
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  {sample.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition">
                <span>Load Dataset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Automated Data Cleaning</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Identifies missing values, duplicate rows, invalid types, and statistical outliers with user approvals.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BarChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Dataset-Aware KPI & Visuals</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Decides optimal charts (Time Series, Category Bars, Scatter, Donut) based on dimensions and data types.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">AI Data Analyst & Reports</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ask deep questions and export executive PDF reports and multi-sheet Excel workbooks in seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
