import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingDown,
  Users,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DatasetState, CohortAnalysisResult } from '../types/dataset';

interface CohortAnalysisViewProps {
  dataset: DatasetState;
}

export const CohortAnalysisView: React.FC<CohortAnalysisViewProps> = ({ dataset }) => {
  const [result, setResult] = useState<CohortAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dataset/${dataset.id}/cohorts`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        }
      } catch (err) {
        console.error('Cohort error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, [dataset.id]);

  // Color generator for retention rate % (0% to 100%)
  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'bg-blue-700 text-white font-bold';
    if (rate >= 65) return 'bg-blue-600 text-white font-bold';
    if (rate >= 50) return 'bg-blue-500 text-white font-semibold';
    if (rate >= 35) return 'bg-blue-400 text-slate-900 font-medium';
    if (rate >= 20) return 'bg-blue-200 text-blue-950 font-medium';
    if (rate > 0) return 'bg-blue-100 text-blue-900';
    return 'bg-slate-50 text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Temporal Cohort Dynamics & Customer Retention</span>
          </div>
          <h2 className="text-xl font-bold">Longitudinal Cohort Retention Matrix</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Tracks user or record activity over consecutive temporal intervals to evaluate customer lifecycle health, churn curves, and long-term cohort value.
          </p>
        </div>
      </div>

      {result && result.hasCohortData ? (
        <>
          {/* Summary Insight Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-cyan-50 rounded-xl text-cyan-700 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Cohort Lifecycle Synthesis</h4>
              <p className="text-xs text-slate-600 mt-0.5">{result.keyCohortTakeaway}</p>
            </div>
          </div>

          {/* Retention Curve Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Average Longitudinal Retention Decay Curve</h3>
                <p className="text-xs text-slate-500">Cross-cohort average retention rate over subsequent month offsets.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Benchmark
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={result.overallRetentionCurve.map((c) => ({
                    period: c.periodIndex === 0 ? 'Month 0' : `+${c.periodIndex}M`,
                    rate: c.averageRetentionPercent,
                  }))}
                  margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis unit="%" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                    formatter={(val: any) => [`${val}%`, 'Average Retention']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Triangular Cohort Matrix Heatmap Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cohort Activity Matrix (% Retained)</h3>
              <p className="text-xs text-slate-500">
                Each cell denotes active percentage retained from the cohort's initial inception size.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Cohort Month</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Inception Size</th>
                    {Array.from({ length: result.maxPeriods }).map((_, idx) => (
                      <th key={idx} className="py-2.5 px-3 font-semibold text-center">
                        {idx === 0 ? 'Month 0' : `+${idx}M`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.cohortRows.map((cohort) => (
                    <tr key={cohort.cohortLabel} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{cohort.cohortLabel}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {cohort.initialSize.toLocaleString()}
                      </td>
                      {Array.from({ length: result.maxPeriods }).map((_, offset) => {
                        const p = cohort.periods.find((x) => x.periodIndex === offset);
                        if (!p) {
                          return (
                            <td key={offset} className="py-2 px-2 text-center bg-slate-50/30 text-slate-300">
                              -
                            </td>
                          );
                        }
                        return (
                          <td key={offset} className="py-2 px-2 text-center">
                            <div
                              className={`py-1 px-1.5 rounded-lg text-xs transition ${getRetentionColor(
                                p.retentionRatePercent
                              )}`}
                            >
                              {p.retentionRatePercent}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">Date Timestamp Required</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cohort retention analysis requires a recognized date or timestamp column (e.g. Order Date, Signup Date) in your dataset.
          </p>
        </div>
      )}
    </div>
  );
};
