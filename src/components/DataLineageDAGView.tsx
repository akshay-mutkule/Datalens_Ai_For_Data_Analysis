import React, { useState, useMemo } from 'react';
import {
  GitFork,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Clock,
  Layers,
  Database,
  ShieldCheck,
  Cpu,
  Brain,
  BarChart3,
  Terminal,
  Search,
  ArrowRight,
  Filter,
  Activity,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface DataLineageDAGViewProps {
  dataset: DatasetState;
}

interface PipelineNode {
  id: string;
  label: string;
  layer: 'ingest' | 'governance' | 'transform' | 'features' | 'consumption';
  status: 'healthy' | 'running' | 'idle' | 'warning';
  latencyMs: number;
  inputRows: number;
  outputRows: number;
  description: string;
  columnsIn: string[];
  columnsOut: string[];
  downstreamIds: string[];
  upstreamIds: string[];
}

export const DataLineageDAGView: React.FC<DataLineageDAGViewProps> = ({ dataset }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-transform');
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>('all');
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    '[2026-10-23 03:50:12] [DAG] Engine initialized in high-throughput streaming mode.',
    '[2026-10-23 03:50:13] [INGEST] Source partition verified: 100% byte integrity.',
    '[2026-10-23 03:50:14] [GOVERNANCE] Sentinel PII scanner passed 0 fatal breaches.',
    '[2026-10-23 03:50:15] [TRANSFORM] Column type inferencing complete (0 type drift).',
    '[2026-10-23 03:50:16] [FEATURES] Standardized feature vectors generated.',
    '[2026-10-23 03:50:17] [CONSUMPTION] Downstream BI materialized views synced.',
  ]);

  const totalRows = dataset.profile.totalRows;
  const colNames = dataset.profile.columns.map((c) => c.name);

  // Construct DAG nodes based on real dataset profile
  const nodes = useMemo<PipelineNode[]>(() => {
    return [
      {
        id: 'node-source',
        label: dataset.profile.fileName || 'Primary Ingestion Source',
        layer: 'ingest',
        status: 'healthy',
        latencyMs: 14,
        inputRows: totalRows,
        outputRows: totalRows,
        description: `Direct raw stream & batch ingestion from ${dataset.profile.domainType} source partition.`,
        columnsIn: colNames,
        columnsOut: colNames,
        upstreamIds: [],
        downstreamIds: ['node-governance'],
      },
      {
        id: 'node-governance',
        label: 'Security & PII Sentinel',
        layer: 'governance',
        status: 'healthy',
        latencyMs: 8,
        inputRows: totalRows,
        outputRows: totalRows,
        description: 'Automated PII scrubbing, hashing sensitive tokens, and SOC 2 / GDPR compliance enforcement.',
        columnsIn: colNames,
        columnsOut: colNames,
        upstreamIds: ['node-source'],
        downstreamIds: ['node-transform'],
      },
      {
        id: 'node-transform',
        label: 'ETL Sanitizer & Schema Profiler',
        layer: 'transform',
        status: 'healthy',
        latencyMs: 22,
        inputRows: totalRows,
        outputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        description: `Deduplication (-${dataset.profile.duplicateRows} rows), null imputation, and data type inferencing.`,
        columnsIn: colNames,
        columnsOut: colNames,
        upstreamIds: ['node-governance'],
        downstreamIds: ['node-features', 'node-sql'],
      },
      {
        id: 'node-features',
        label: 'Feature Store & PCA Scaler',
        layer: 'features',
        status: 'healthy',
        latencyMs: 18,
        inputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        outputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        description: 'Z-score normalization, log transforms, one-hot encoding, and correlation matrix synthesis.',
        columnsIn: colNames,
        columnsOut: [...colNames, '_zscore_norm', '_segment_pca'],
        upstreamIds: ['node-transform'],
        downstreamIds: ['node-automl', 'node-bi'],
      },
      {
        id: 'node-automl',
        label: 'Predictive AutoML Engine',
        layer: 'consumption',
        status: 'healthy',
        latencyMs: 45,
        inputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        outputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        description: 'Trains Random Forest, Ridge Regression, and Gradient Boosted trees for target forecasting.',
        columnsIn: colNames,
        columnsOut: ['prediction_y', 'residual_error', 'shapley_val'],
        upstreamIds: ['node-features'],
        downstreamIds: [],
      },
      {
        id: 'node-bi',
        label: 'Executive KPI Materialized View',
        layer: 'consumption',
        status: 'healthy',
        latencyMs: 12,
        inputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        outputRows: 1,
        description: 'Caches real-time KPI metrics, sparkline summaries, and interactive multidimensional pivots.',
        columnsIn: colNames,
        columnsOut: ['kpi_matrix', 'chart_cache'],
        upstreamIds: ['node-features'],
        downstreamIds: [],
      },
      {
        id: 'node-sql',
        label: 'DuckDB/ANSI SQL Query Cache',
        layer: 'consumption',
        status: 'healthy',
        latencyMs: 6,
        inputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        outputRows: Math.max(0, totalRows - dataset.profile.duplicateRows),
        description: 'Instant zero-copy in-memory columnar query index for Ad-Hoc SQL exploration.',
        columnsIn: colNames,
        columnsOut: colNames,
        upstreamIds: ['node-transform'],
        downstreamIds: [],
      },
    ];
  }, [dataset, totalRows, colNames]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || nodes[0],
    [nodes, selectedNodeId]
  );

  // Filter nodes if a specific column is highlighted for column-level lineage
  const highlightedNodeIds = useMemo(() => {
    if (selectedColumnFilter === 'all') return nodes.map((n) => n.id);
    return nodes
      .filter((n) => n.columnsIn.includes(selectedColumnFilter) || n.columnsOut.includes(selectedColumnFilter))
      .map((n) => n.id);
  }, [nodes, selectedColumnFilter]);

  const handleTriggerRun = () => {
    setIsRunningPipeline(true);
    setPipelineProgress(0);

    const logMessages = [
      `[${new Date().toLocaleTimeString()}] Pipeline run initiated: DAG root triggered.`,
      `[${new Date().toLocaleTimeString()}] Ingesting ${totalRows} records from source adapter...`,
      `[${new Date().toLocaleTimeString()}] Running Sentinel PII compliance audit (0 leaks detected)...`,
      `[${new Date().toLocaleTimeString()}] Executing deduplication and median imputation...`,
      `[${new Date().toLocaleTimeString()}] Building feature vectors and normalizing variance...`,
      `[${new Date().toLocaleTimeString()}] Materializing downstream analytics views (Status: 200 OK).`,
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setPipelineProgress(Math.min(100, step * 18));
      if (step < logMessages.length) {
        setExecutionLogs((prev) => [logMessages[step], ...prev.slice(0, 8)]);
      }
      if (step >= 6) {
        clearInterval(interval);
        setIsRunningPipeline(false);
        setPipelineProgress(100);
      }
    }, 450);
  };

  const getLayerBadge = (layer: PipelineNode['layer']) => {
    switch (layer) {
      case 'ingest':
        return { label: 'INGESTION', bg: 'bg-blue-950/60 text-blue-400 border-blue-800/60' };
      case 'governance':
        return { label: 'GOVERNANCE', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' };
      case 'transform':
        return { label: 'TRANSFORM', bg: 'bg-purple-950/60 text-purple-400 border-purple-800/60' };
      case 'features':
        return { label: 'FEATURE STORE', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/60' };
      case 'consumption':
        return { label: 'CONSUMPTION', bg: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
              Data Lineage & Orchestration
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400">Directed Acyclic Graph (DAG) Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-blue-400" />
            Interactive Data Pipeline & Lineage Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect end-to-end data provenance from ingestion adapters and SOC 2 security masking to transformation stages, feature engineering, and downstream AI consumption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Column-level lineage picker */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">Trace Column:</span>
            <select
              value={selectedColumnFilter}
              onChange={(e) => setSelectedColumnFilter(e.target.value)}
              aria-label="Trace column lineage through the pipeline"
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Columns (Complete DAG)
              </option>
              {colNames.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger pipeline execution */}
          <button
            onClick={handleTriggerRun}
            disabled={isRunningPipeline}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            {isRunningPipeline ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Running Pipeline ({pipelineProgress}%)...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Trigger Pipeline Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar when running */}
      {isRunningPipeline && (
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1.5 transition-all duration-300"
            style={{ width: `${pipelineProgress}%` }}
          />
        </div>
      )}

      {/* Interactive Visual DAG Canvas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-x-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Directed Acyclic Graph Topology</span>
            <span className="text-slate-600">·</span>
            <span>Click any node to inspect telemetry, transformation steps, and column-level schema</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: HEALTHY
            </span>
            <span className="text-slate-600">·</span>
            <span>TOTAL LATENCY: ~107ms</span>
          </div>
        </div>

        {/* DAG Stages Columns */}
        <div className="min-w-[840px] grid grid-cols-5 gap-6 pt-4 pb-2 items-start relative">
          {/* Layer 1: Ingest */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 border-b border-blue-500/20 pb-1 flex items-center justify-between">
              <span>01. Ingestion</span>
              <Database className="w-3 h-3" />
            </div>
            {nodes
              .filter((n) => n.layer === 'ingest')
              .map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40 text-white shadow-lg'
                        : isHighlighted
                        ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                        : 'opacity-40 bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-blue-400">
                        {node.latencyMs}ms
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-bold text-xs block text-white truncate">{node.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      {node.outputRows.toLocaleString()} rows
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Layer 2: Governance */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-emerald-500/20 pb-1 flex items-center justify-between">
              <span>02. Governance</span>
              <ShieldCheck className="w-3 h-3" />
            </div>
            {nodes
              .filter((n) => n.layer === 'governance')
              .map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : isHighlighted
                        ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                        : 'opacity-40 bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {node.latencyMs}ms
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-bold text-xs block text-white truncate">{node.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      SOC 2 Enforced
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Layer 3: Transform */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 border-b border-purple-500/20 pb-1 flex items-center justify-between">
              <span>03. Transformation</span>
              <Cpu className="w-3 h-3" />
            </div>
            {nodes
              .filter((n) => n.layer === 'transform')
              .map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/40 text-white shadow-lg'
                        : isHighlighted
                        ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                        : 'opacity-40 bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-purple-400">
                        {node.latencyMs}ms
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-bold text-xs block text-white truncate">{node.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      {node.outputRows.toLocaleString()} rows
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Layer 4: Features */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 border-b border-amber-500/20 pb-1 flex items-center justify-between">
              <span>04. Feature Store</span>
              <Layers className="w-3 h-3" />
            </div>
            {nodes
              .filter((n) => n.layer === 'features')
              .map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/40 text-white shadow-lg'
                        : isHighlighted
                        ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                        : 'opacity-40 bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        {node.latencyMs}ms
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-bold text-xs block text-white truncate">{node.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      {node.columnsOut.length} Features
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Layer 5: Consumption */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-indigo-500/20 pb-1 flex items-center justify-between">
              <span>05. Consumption</span>
              <Brain className="w-3 h-3" />
            </div>
            {nodes
              .filter((n) => n.layer === 'consumption')
              .map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 text-white shadow-lg'
                        : isHighlighted
                        ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                        : 'opacity-40 bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">
                        {node.latencyMs}ms
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-bold text-xs block text-white truncate">{node.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      Consumer Node
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Selected Node Inspector & Live Execution Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Node Inspector Details (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    getLayerBadge(selectedNode.layer).bg
                  }`}
                >
                  {getLayerBadge(selectedNode.layer).label}
                </span>
                <span className="font-bold text-white text-sm">{selectedNode.label}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Healthy
            </span>
          </div>

          {/* Node Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Latency</span>
              <span className="text-base font-mono font-bold text-white mt-0.5 block">
                {selectedNode.latencyMs} ms
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Input Volume</span>
              <span className="text-base font-mono font-bold text-blue-400 mt-0.5 block">
                {selectedNode.inputRows.toLocaleString()} rows
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Output Volume</span>
              <span className="text-base font-mono font-bold text-emerald-400 mt-0.5 block">
                {selectedNode.outputRows.toLocaleString()} rows
              </span>
            </div>
          </div>

          {/* Column In / Column Out Lineage Breakdown */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Active Schema Lineage Attributes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.columnsOut.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Live Execution Logs Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Pipeline Execution Terminal
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">STREAM LIVE</span>
          </div>

          <div className="space-y-2 text-[11px] leading-relaxed max-h-56 overflow-y-auto scrollbar-thin text-slate-300">
            {executionLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2 text-slate-300">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={idx === 0 ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Orchestration: Autonomous</span>
            <span>Sync Interval: Continuous</span>
          </div>
        </div>
      </div>
    </div>
  );
};
