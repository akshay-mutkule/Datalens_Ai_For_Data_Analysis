import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { DatasetState, AnomalyDetectionResult, AnomalyRecord } from '../types/dataset';
import { formatNumber } from '../services/dataEngine';

interface AnomalyDetectionViewProps {
  dataset: DatasetState;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({ dataset }) => {
  const [result, setResult] = useState<AnomalyDetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'moderate' | 'mild'>('all');
  const [selectedRecord, setSelectedRecord] = useState<AnomalyRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dataset/${dataset.id}/anomalies`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.anomalies && data.anomalies.length > 0) {
          setSelectedRecord(data.anomalies[0]);
        }
      }
    } catch (err) {
      console.error('Anomaly fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [dataset.id]);

  const filteredAnomalies = result?.anomalies.filter((rec) => {
    if (selectedSeverity !== 'all' && rec.severity !== selectedSeverity) {
      return false;
    }
    if (searchQuery.trim()) {
      const match = Object.values(rec.rowData).some((v) =>
        String(v).toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!match) return false;
    }
    return true;
  }) || [];

  const handleDownloadAnomaliesCSV = () => {
    if (!result || result.anomalies.length === 0) return;
    const headers = ['Row_Index', 'Anomaly_Score', 'Severity', 'Primary_Factor', 'Explanation', ...Object.keys(result.anomalies[0].rowData)];
    const rows = result.anomalies.map((a) => [
      a.rowIndex,
      a.anomalyScore,
      a.severity,
      `"${a.primaryFactor}"`,
      `"${a.explanation}"`,
      ...Object.values(a.rowData).map((v) => `"${v}"`),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.profile.fileName.replace(/\.[^/.]+$/, '')}_anomalies.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Automated Outlier Isolation & Multi-Variate Anomaly Audit</span>
          </div>
          <h2 className="text-xl font-bold">Multi-Sigma Anomaly & Data Integrity Sentinel</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Scans every record against joint probability distributions, multi-attribute Z-scores, and IQR interquartile fences to isolate skewed entries, entry errors, or extreme black-swan outliers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadAnomaliesCSV}
            disabled={!result || result.anomalies.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Anomalies CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Rows Analyzed
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {result.totalAnalyzed.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Full dataset sweep</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Flagged Anomalies
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {result.totalAnomalies}
            </div>
            <span className="text-[11px] text-rose-500 mt-1 block">
              {result.anomalyRatePercent}% anomaly frequency
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Critical Severity Count
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {result.anomalies.filter((a) => a.severity === 'critical').length}
            </div>
            <span className="text-[11px] text-amber-600 mt-1 block">Score ≥ 75/100</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Top Skew Driver
            </span>
            <div className="text-lg font-bold text-slate-900 truncate mt-1">
              {result.topDistortedAttributes[0]?.attribute.replace(/_/g, ' ') || 'None'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Triggered {result.topDistortedAttributes[0]?.anomalyContributionCount || 0} breach flags
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Anomaly List & Deep Dive Inspector */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Anomaly Records List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">Flagged Anomalous Records</h3>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {(['all', 'critical', 'moderate', 'mild'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                      selectedSeverity === sev
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredAnomalies.length > 0 ? (
                filteredAnomalies.map((rec) => {
                  const isSelected = selectedRecord?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            Observation #{rec.rowIndex}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                              rec.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : rec.severity === 'moderate'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{rec.explanation}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.flaggedFields.map((f, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700"
                            >
                              {f.field}: {f.deviationDirection === 'high' ? '▲' : '▼'} {f.zScore}σ
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Anomaly Score Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-slate-400">Score</div>
                        <div
                          className={`text-base font-black ${
                            rec.anomalyScore >= 75
                              ? 'text-rose-600'
                              : rec.anomalyScore >= 45
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {rec.anomalyScore}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records match current severity filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Anomaly Record Deep Dive */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Observation #{selectedRecord.rowIndex} Breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Multi-dimensional attribute deviation analysis.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      selectedRecord.severity === 'critical'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    Score: {selectedRecord.anomalyScore}/100
                  </span>
                </div>

                {/* Root Cause Explanation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>Root Cause Diagnostics</span>
                  </div>
                  <p className="text-slate-600">{selectedRecord.explanation}</p>
                </div>

                {/* Flagged Attributes Comparison */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Breached Thresholds:</div>
                  <div className="space-y-2">
                    {selectedRecord.flaggedFields.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-rose-950">
                          <span>{f.field.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-rose-600">
                            {f.deviationDirection === 'high' ? '+' : '-'}
                            {f.zScore}σ Deviation
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-rose-100">
                          <div>
                            Observed: <span className="font-bold text-slate-900">{formatNumber(f.observedValue)}</span>
                          </div>
                          <div>
                            Population Mean: <span className="font-semibold text-slate-700">{formatNumber(f.meanValue)}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-rose-700 font-medium pt-0.5">
                          {f.impactDescription}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Row Data Snapshot */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700">Full Record Snapshot:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs max-h-36 overflow-y-auto">
                    {Object.entries(selectedRecord.rowData).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block truncate">{k}</span>
                        <span className="font-semibold text-slate-800 truncate block">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Select a record from the left panel to inspect deviations.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
