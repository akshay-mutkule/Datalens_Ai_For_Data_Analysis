import React, { useState, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  Terminal,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DatasetState, DataScienceCodePackage } from '../types/dataset';

interface CodeNotebookStudioViewProps {
  dataset: DatasetState;
}

export const CodeNotebookStudioView: React.FC<CodeNotebookStudioViewProps> = ({ dataset }) => {
  const [codePackage, setCodePackage] = useState<DataScienceCodePackage | null>(null);
  const [activeTab, setActiveTab] = useState<'pandas' | 'sklearn' | 'r' | 'jupyter'>('pandas');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const res = await fetch(`/api/dataset/${dataset.id}/notebook-code`);
        if (res.ok) {
          const data = await res.json();
          setCodePackage(data);
        }
      } catch (err) {
        console.error('Code package error:', err);
      }
    };
    fetchCode();
  }, [dataset.id]);

  const getCurrentCode = () => {
    if (!codePackage) return '';
    if (activeTab === 'pandas') return codePackage.pythonPandasEDA;
    if (activeTab === 'sklearn') return codePackage.pythonScikitLearnML;
    if (activeTab === 'r') return codePackage.rTidyverseScript;
    if (activeTab === 'jupyter') return codePackage.jupyterNotebookJson;
    return '';
  };

  const handleCopyCode = () => {
    const code = getCurrentCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const code = getCurrentCode();
    if (!code) return;

    let extension = '.py';
    let mime = 'text/x-python';
    if (activeTab === 'r') {
      extension = '.R';
      mime = 'text/plain';
    } else if (activeTab === 'jupyter') {
      extension = '.ipynb';
      mime = 'application/json';
    }

    const baseName = dataset.profile.fileName.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_${activeTab}${extension}`;

    const blob = new Blob([code], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>Reproducible Data Science & Notebook Export</span>
          </div>
          <h2 className="text-xl font-bold">Python, Scikit-Learn & R Code Generator</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Export production-ready, fully executable Python Pandas pipelines, Scikit-Learn machine learning scripts, R Tidyverse models, and Jupyter Notebooks (.ipynb) configured for your exact dataset schema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownloadScript}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeTab === 'jupyter' ? '.ipynb' : activeTab === 'r' ? '.R' : '.py'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Studio */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('pandas')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'pandas'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Python (Pandas & EDA)</span>
            </button>
            <button
              onClick={() => setActiveTab('sklearn')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sklearn'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python (Scikit-Learn ML)</span>
            </button>
            <button
              onClick={() => setActiveTab('r')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'r'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>R (Tidyverse & ggplot2)</span>
            </button>
            <button
              onClick={() => setActiveTab('jupyter')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'jupyter'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jupyter Notebook (.ipynb)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">
              {activeTab === 'jupyter' ? 'JSON' : activeTab === 'r' ? 'R 4.2' : 'Python 3.10+'}
            </span>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="p-4 overflow-x-auto max-h-[550px] font-mono text-xs leading-relaxed text-slate-200 selection:bg-blue-500 selection:text-white">
          <pre className="whitespace-pre">{getCurrentCode()}</pre>
        </div>
      </div>
    </div>
  );
};
