import React, { useState, useEffect } from 'react';
import {
  Users,
  Brain,
  Sparkles,
  Sliders,
  Layers,
  BarChart3,
  Download,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { DatasetState, ClusterModelResult, ClusterProfile, ClusteredPoint } from '../types/dataset';
import { formatNumber } from '../services/dataEngine';

interface ClusteringSegmentationViewProps {
  dataset: DatasetState;
}

export const ClusteringSegmentationView: React.FC<ClusteringSegmentationViewProps> = ({ dataset }) => {
  const numCols = dataset.profile.columns
    .filter((c) => c.dataType === 'numerical' && !c.isIdentifier)
    .map((c) => c.name);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(numCols.slice(0, 4));
  const [k, setK] = useState<number>(3);
  const [clusteringResult, setClusteringResult] = useState<ClusterModelResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchClustering = async () => {
    if (selectedFeatures.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dataset/${dataset.id}/clustering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureColumns: selectedFeatures, k }),
      });
      if (res.ok) {
        const data = await res.json();
        setClusteringResult(data);
      }
    } catch (err) {
      console.error('Clustering error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClustering();
  }, [dataset.id, k]);

  const toggleFeature = (colName: string) => {
    if (selectedFeatures.includes(colName)) {
      if (selectedFeatures.length > 1) {
        setSelectedFeatures((prev) => prev.filter((f) => f !== colName));
      }
    } else {
      setSelectedFeatures((prev) => [...prev, colName]);
    }
  };

  const filteredPoints = clusteringResult?.points.filter((p) => {
    if (selectedClusterFilter !== 'ALL' && p.clusterId !== selectedClusterFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const match = Object.values(p.attributes).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!match) return false;
    }
    return true;
  }) || [];

  const handleDownloadClusteredCSV = () => {
    if (!clusteringResult) return;
    const headers = ['Cluster_ID', 'Cluster_Name', 'PCA_X', 'PCA_Y', ...Object.keys(dataset.cleanedRows[0] || {})];
    const rows = clusteringResult.points.map((p) => [
      p.clusterId,
      `"${p.clusterName}"`,
      p.pcaX,
      p.pcaY,
      ...Object.values(p.attributes).map((v) => `"${v}"`),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.profile.fileName.replace(/\.[^/.]+$/, '')}_k${k}_segmented.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>Unsupervised Machine Learning & Customer Segmentation</span>
          </div>
          <h2 className="text-xl font-bold">K-Means Cluster Matrix & 2D PCA Engine</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Automatically partitions observations into optimal demographic, behavioral, or performance cohorts using multi-dimensional Lloyd's vector quantization and Principal Component Analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadClusteredCSV}
            disabled={!clusteringResult}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Cohorts CSV</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Feature Selection & K Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Cluster Parameters & Dimensions</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Number of Clusters (k):</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setK(num)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    k === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  k = {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Feature Checkboxes */}
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-2">Select Active Numerical Features for Distance Matrix:</div>
          <div className="flex flex-wrap gap-2">
            {numCols.map((col) => {
              const isSelected = selectedFeatures.includes(col);
              return (
                <button
                  key={col}
                  onClick={() => toggleFeature(col)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}
                  />
                  <span>{col.replace(/_/g, ' ')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={fetchClustering}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-compute Cluster Partitions</span>
          </button>
        </div>
      </div>

      {/* Cluster Persona Cards */}
      {clusteringResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusteringResult.clusters.map((cluster) => (
            <div
              key={cluster.id}
              onClick={() => setSelectedClusterFilter(cluster.id)}
              className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                selectedClusterFilter === cluster.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: cluster.color }}
              />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <h4 className="font-bold text-sm text-slate-900">{cluster.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    {cluster.percentage}% ({cluster.size} rows)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{cluster.summary}</p>

                {/* Key Characteristics Tags */}
                <div className="space-y-1 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Differentiators:</div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keyCharacteristics.map((char, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Centroid Means Breakdown */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Centroid Mean Values:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(cluster.centroid).slice(0, 4).map(([field, val]) => (
                      <div key={field} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 truncate block">{field.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-slate-800">{formatNumber(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2D PCA Scatter Visualization & Cluster Distribution */}
      {clusteringResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PCA Scatter Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>2D Principal Component Projection (PCA)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Dimensionality reduced to orthogonal components PC1 & PC2 with cluster boundaries.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Inertia: <span className="font-bold text-slate-700">{clusteringResult.inertia}</span> | Silhouette: <span className="font-bold text-emerald-600">{clusteringResult.silhouetteScore}</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey="pcaX"
                    name="PC1"
                    stroke="#94a3b8"
                    fontSize={11}
                    label={{ value: 'Principal Component 1 (Primary Variance Axis)', position: 'bottom', offset: 0, fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="pcaY"
                    name="PC2"
                    stroke="#94a3b8"
                    fontSize={11}
                    label={{ value: 'PC2', angle: -90, position: 'left', offset: 0, fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ClusteredPoint;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 max-w-xs space-y-1">
                            <div className="font-bold flex items-center gap-2 text-indigo-300">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.clusterColor }} />
                              <span>{data.clusterName} (ID: #{data.id})</span>
                            </div>
                            <div className="pt-1 text-[11px] text-slate-300 space-y-0.5">
                              {Object.entries(data.attributes).slice(0, 5).map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-2">
                                  <span className="text-slate-400">{k}:</span>
                                  <span className="font-semibold text-white">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Observations" data={filteredPoints}>
                    {filteredPoints.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.clusterColor} fillOpacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Population Breakdown Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Cohort Volume Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500">Distribution of records across assigned segments.</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clusteringResult.clusters.map((c) => ({
                    name: c.name.length > 15 ? `${c.name.slice(0, 14)}...` : c.name,
                    size: c.size,
                    color: c.color,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="size" name="Record Count" radius={[0, 6, 6, 0]}>
                    {clusteringResult.clusters.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Actionable Insight:</strong> Use these clusters to target campaigns, customize product tiering, or detect atypical behavioral profiles.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Records Table */}
      {clusteringResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Segmented Records Directory</h3>
              <p className="text-xs text-slate-500">
                Inspect observations with their assigned cluster persona and PCA coordinates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Cluster Filter Buttons */}
              <button
                onClick={() => setSelectedClusterFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedClusterFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({clusteringResult.points.length})
              </button>
              {clusteringResult.clusters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClusterFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    selectedClusterFilter === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>Cluster {c.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Row #</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Cohort</th>
                  <th className="py-2.5 px-3 font-semibold">PC1</th>
                  <th className="py-2.5 px-3 font-semibold">PC2</th>
                  {selectedFeatures.map((f) => (
                    <th key={f} className="py-2.5 px-3 font-semibold">
                      {f.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPoints.slice(0, 30).map((point) => (
                  <tr key={point.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-400">{point.id}</td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                        style={{ backgroundColor: point.clusterColor }}
                      >
                        {point.clusterName}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono">{point.pcaX}</td>
                    <td className="py-2 px-3 font-mono">{point.pcaY}</td>
                    {selectedFeatures.map((f) => (
                      <td key={f} className="py-2 px-3 font-medium">
                        {String(point.attributes[f] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
