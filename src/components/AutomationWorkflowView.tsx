import React, { useState, useMemo } from 'react';
import {
  Workflow,
  Play,
  RotateCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  Send,
  Sliders,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Lock,
  GitBranch,
  Settings,
  Flame,
  FileText,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface AutomationWorkflowViewProps {
  dataset: DatasetState;
}

interface WorkflowNode {
  id: string;
  name: string;
  category: 'trigger' | 'condition' | 'inference' | 'action' | 'sink';
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  executionDurationMs: number;
  outputPayload?: Record<string, any>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  nodeIds: string[];
}

export const AutomationWorkflowView: React.FC<AutomationWorkflowViewProps> = ({ dataset }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-circuit-breaker');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Workflow Orchestrator initialized. Active listener connected to live stream.`,
  ]);

  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-1',
      name: 'Trigger: Anomaly Surge (>2.5σ)',
      category: 'trigger',
      description: 'Monitors real-time ingestion stream for sudden tail dispersion or volume spike.',
      status: 'idle',
      executionDurationMs: 4,
      outputPayload: { metric: 'Stream Anomaly', threshold: '+2.5σ', detected: true },
    },
    {
      id: 'node-2',
      name: 'Condition: Confounder Conditioning',
      category: 'condition',
      description: 'Applies Pearlian backdoor check to distinguish true causal shocks from self-selection.',
      status: 'idle',
      executionDurationMs: 14,
      outputPayload: { backdoorBlocked: true, confounders: ['Region', 'Tier'] },
    },
    {
      id: 'node-3',
      name: 'AI Model: Random Forest & AutoML Scoring',
      category: 'inference',
      description: 'Executes forward projection inference to evaluate 90-day downside impact.',
      status: 'idle',
      executionDurationMs: 28,
      outputPayload: { projectedRiskExposure: '-3.8% Net', r2Score: 0.94 },
    },
    {
      id: 'node-4',
      name: 'Action: Auto-Winsorize Tail Outliers',
      category: 'action',
      description: 'Applies automated statistical capping to preserve core model stability.',
      status: 'idle',
      executionDurationMs: 8,
      outputPayload: { cappedRowsCount: 14, variancePreservedPct: 98.4 },
    },
    {
      id: 'node-5',
      name: 'Sink: Dispatch PagerDuty & Slack Incident',
      category: 'sink',
      description: 'Dispatches structured telemetry payload and executive markdown dossier.',
      status: 'idle',
      executionDurationMs: 12,
      outputPayload: { channel: 'PagerDuty P1', status: 'Delivered (200 OK)' },
    },
  ]);

  const templates: WorkflowTemplate[] = [
    {
      id: 'tpl-circuit-breaker',
      name: 'High-Volatility Circuit Breaker',
      description: 'Autonomous trigger on tail volatility, de-biasing, outlier mitigation, and executive alerting.',
      triggerType: 'Streaming Variance Surge (>2.5σ)',
      nodeIds: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'],
    },
    {
      id: 'tpl-daily-briefing',
      name: 'Autonomous Daily Executive Briefing',
      description: 'Runs scheduled AutoML model updates, generates PDF dossier, and updates materialized views.',
      triggerType: 'Scheduled Cron (08:00 UTC Daily)',
      nodeIds: ['node-1', 'node-3', 'node-5'],
    },
    {
      id: 'tpl-pii-sentinel',
      name: 'SOC 2 & GDPR Privacy Compliance Sentinel',
      description: 'Continuous PII scanning on raw ingestion, automated token hashing, and compliance audit logging.',
      triggerType: 'Every New File / Batch Ingestion',
      nodeIds: ['node-1', 'node-4', 'node-5'],
    },
  ];

  // Execute workflow step by step
  const handleExecuteWorkflow = () => {
    setIsExecuting(true);
    setActiveStepIndex(0);

    // Reset node statuses
    setWorkflowNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' })));

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < workflowNodes.length) {
        const stepNode = workflowNodes[currentStep];

        // Update executing status
        setWorkflowNodes((prev) =>
          prev.map((n, idx) => (idx === currentStep ? { ...n, status: 'running' } : n))
        );

        setExecutionLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] RUNNING [${stepNode.category.toUpperCase()}]: ${stepNode.name}...`,
          ...prev.slice(0, 10),
        ]);

        setTimeout(() => {
          setWorkflowNodes((prev) =>
            prev.map((n, idx) => (idx === currentStep ? { ...n, status: 'success' } : n))
          );
          setExecutionLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] COMPLETED: ${stepNode.name} in ${stepNode.executionDurationMs}ms`,
            ...prev.slice(0, 10),
          ]);
        }, 300);

        setActiveStepIndex(currentStep);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsExecuting(false);
        setActiveStepIndex(-1);
        setExecutionLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Workflow completed across all 5 nodes. Zero errors.`,
          ...prev.slice(0, 10),
        ]);
      }
    }, 600);
  };

  const getCategoryColor = (cat: WorkflowNode['category']) => {
    switch (cat) {
      case 'trigger':
        return { border: 'border-blue-500/50', badge: 'bg-blue-950/60 text-blue-400', icon: Activity };
      case 'condition':
        return { border: 'border-amber-500/50', badge: 'bg-amber-950/60 text-amber-400', icon: GitBranch };
      case 'inference':
        return { border: 'border-purple-500/50', badge: 'bg-purple-950/60 text-purple-400', icon: Cpu };
      case 'action':
        return { border: 'border-emerald-500/50', badge: 'bg-emerald-950/60 text-emerald-400', icon: Settings };
      case 'sink':
        return { border: 'border-rose-500/50', badge: 'bg-rose-950/60 text-rose-400', icon: Send };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
              Autonomous AI Decision Engine
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400 font-mono">Event-Driven Directed Acyclic Orchestration</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-purple-400" />
            Autonomous Decision Logic & Workflow Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Design, simulate, and execute autonomous trigger-action chains: tie real-time streaming anomalies into causal inference, automated ML mitigation, and multi-channel incident dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition cursor-pointer"
          >
            {isExecuting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Executing Pipeline Steps...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Simulate Trigger & Run Flow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workflow Template Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/30 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{tpl.name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{tpl.description}</p>
              <span className="text-[10px] font-mono text-purple-400/90 block mt-2">
                Trigger: {tpl.triggerType}
              </span>
            </button>
          );
        })}
      </div>

      {/* Visual Workflow Node DAG Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white uppercase tracking-wider">Active Workflow DAG Pipeline</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono">5 Sequenced Autonomous Stages</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: READY
            </span>
          </div>
        </div>

        {/* Step Nodes Flow Layout */}
        <div className="flex items-center justify-between gap-3 min-w-[900px] py-4 relative">
          {workflowNodes.map((node, idx) => {
            const conf = getCategoryColor(node.category);
            const Icon = conf.icon;
            const isRunning = node.status === 'running';
            const isSuccess = node.status === 'success';

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div
                  className={`flex-1 p-4 rounded-xl border bg-slate-950 relative transition-all duration-200 ${
                    isRunning
                      ? 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-105'
                      : isSuccess
                      ? 'border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${conf.badge}`}
                    >
                      {node.category}
                    </span>

                    {isRunning ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono">{idx + 1}</span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-white block mb-1 truncate">{node.name}</span>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {node.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Latency</span>
                    <span className="text-slate-300 font-bold">{node.executionDurationMs}ms</span>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < workflowNodes.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-slate-600">
                    <ArrowRight
                      className={`w-4 h-4 transition-colors ${
                        idx < activeStepIndex ? 'text-emerald-400' : 'text-slate-700'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Live Execution Console & Output Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Execution Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Live Workflow Execution Console
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">EVENT BUS CONNECTED</span>
          </div>

          <div className="space-y-1.5 text-[11px] max-h-56 overflow-y-auto scrollbar-thin text-slate-300 leading-relaxed">
            {executionLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2 text-slate-300">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={idx === 0 ? 'text-purple-300 font-semibold' : 'text-slate-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Output Telemetry Payloads (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
            Node Payload Snapshot (Simulated)
          </span>

          <pre className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
            {JSON.stringify(
              {
                workflowId: selectedTemplateId,
                status: isExecuting ? 'IN_PROGRESS' : 'COMPLETED',
                timestamp: new Date().toISOString(),
                datasetId: dataset.id,
                metrics: {
                  anomaliesMitigated: 14,
                  causalLiftSecured: '+4.2%',
                  pagerDutyIncident: 'RESOLVED',
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
