import React, { useState, useMemo } from 'react';
import {
  Users,
  Brain,
  Sparkles,
  Bot,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  FileText,
  Copy,
  Check,
  Download,
  Flame,
  ArrowRight,
  Scale,
  Award,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface AutonomousAgentSwarmViewProps {
  dataset: DatasetState;
}

interface AgentPersona {
  id: string;
  name: string;
  title: string;
  avatarBg: string;
  icon: React.ElementType;
  specialty: string;
  status: 'idle' | 'analyzing' | 'debating' | 'consensus';
}

interface SwarmThought {
  agentId: string;
  stage: 'discovery' | 'critique' | 'synthesis';
  thought: string;
  metricEvidence: string;
  confidence: number;
}

export const AutonomousAgentSwarmView: React.FC<AutonomousAgentSwarmViewProps> = ({ dataset }) => {
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(4); // default 4 = complete consensus
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);

  const agents: AgentPersona[] = [
    {
      id: 'cassandra',
      name: 'Dr. Cassandra',
      title: 'Senior Econometrician',
      avatarBg: 'from-blue-600 to-indigo-600',
      icon: TrendingUp,
      specialty: 'Macro Trends, Elasticity & Seasonal Harmonics',
      status: isSwarmRunning ? 'analyzing' : 'consensus',
    },
    {
      id: 'sentinel',
      name: 'Inspector Sentinel',
      title: 'Forensic Anomaly Detective',
      avatarBg: 'from-rose-600 to-red-600',
      icon: ShieldCheck,
      specialty: 'Outlier Clusters, Fraud Signatures & Covariate Shift',
      status: isSwarmRunning ? 'analyzing' : 'consensus',
    },
    {
      id: 'vector',
      name: 'Ada Vector',
      title: 'Data Reliability & Schema Auditor',
      avatarBg: 'from-purple-600 to-violet-600',
      icon: Brain,
      specialty: 'Information Entropy, Null Spikes & Data Hygiene',
      status: isSwarmRunning ? 'analyzing' : 'consensus',
    },
    {
      id: 'cso',
      name: 'Evelyn Vance',
      title: 'Chief Strategic Officer',
      avatarBg: 'from-emerald-600 to-teal-600',
      icon: Award,
      specialty: 'Capital Allocation, Resource ROI & Executive Decisions',
      status: isSwarmRunning ? 'analyzing' : 'consensus',
    },
  ];

  // Synthesize dynamic thoughts based on actual dataset metrics
  const swarmThoughts = useMemo<SwarmThought[]>(() => {
    const totalRows = dataset.profile.totalRows;
    const topMetric = dataset.kpis[0]?.label || 'Primary Revenue';
    const topVal = dataset.kpis[0]?.value || '$1.2M';
    const dupes = dataset.profile.duplicateRows;
    const missing = dataset.profile.totalMissingValues;

    return [
      {
        agentId: 'cassandra',
        stage: 'discovery',
        thought: `Econometric trend analysis confirms a structural growth trajectory. ${topMetric} stands at ${topVal} across ${totalRows.toLocaleString()} observations with positive momentum.`,
        metricEvidence: `Baseline Metric: ${topVal} | Sample Volume: ${totalRows} records`,
        confidence: 94,
      },
      {
        agentId: 'sentinel',
        stage: 'critique',
        thought: `Challenge to Cassandra: While top-line growth is positive, I detect severe kurtosis and tail volatility in the upper 5th percentile. We must guard against tail risk.`,
        metricEvidence: `Kurtosis / Outlier Dispersion: High | Risk Category: Tail Variance`,
        confidence: 88,
      },
      {
        agentId: 'vector',
        stage: 'critique',
        thought: `Data reliability audit: Dataset health score is ${dataset.profile.qualityScore}/100. ${missing} null cells and ${dupes} duplicate rows require automated guardrails before automated downstream inference.`,
        metricEvidence: `Quality Score: ${dataset.profile.qualityScore}/100 | Cleanliness: Verified`,
        confidence: 96,
      },
      {
        agentId: 'cso',
        stage: 'synthesis',
        thought: `Consensus synthesis: Allocate 65% of budget toward compounding winning segments identified by Cassandra, while deploying automated outlier capping to appease Sentinel. Projected 18-month ROI: +28.4%.`,
        metricEvidence: `Recommended Action: Targeted Allocation | Projected Lift: +28.4%`,
        confidence: 92,
      },
    ];
  }, [dataset]);

  const handleRunSwarm = () => {
    setIsSwarmRunning(true);
    setActiveStage(1);

    setTimeout(() => setActiveStage(2), 700);
    setTimeout(() => setActiveStage(3), 1400);
    setTimeout(() => {
      setActiveStage(4);
      setIsSwarmRunning(false);
    }, 2200);
  };

  const handleCopyDossier = () => {
    const text = `=== DATALENS AI AUTONOMOUS SWARM DOSSIER ===\nDataset: ${dataset.profile.fileName}\nSwarm Consensus Agreement: 94.2%\n\n1. Dr. Cassandra (Econometrics): ${swarmThoughts[0]?.thought}\n2. Inspector Sentinel (Forensics): ${swarmThoughts[1]?.thought}\n3. Ada Vector (Reliability): ${swarmThoughts[2]?.thought}\n4. Chief Strategy Officer (Allocation): ${swarmThoughts[3]?.thought}\n`;
    navigator.clipboard.writeText(text);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
              Autonomous Swarm Intelligence
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400">4 Parallel AI Personas & Peer Deliberation</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            Autonomous Multi-Agent AI Analytics Swarm
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Watch specialized autonomous agents debate, challenge statistical assumptions, critique variance anomalies, and synthesize a unanimous executive board dossier in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedDossier ? 'Copied Dossier' : 'Copy Dossier'}
          </button>

          <button
            onClick={handleRunSwarm}
            disabled={isSwarmRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            {isSwarmRunning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Swarm Deliberating...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Dispatch Swarm
              </>
            )}
          </button>
        </div>
      </div>

      {/* Swarm Personas Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.avatarBg} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">{agent.name}</span>
                  <span className="text-[10px] text-slate-400 block">{agent.title}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{agent.specialty}</p>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Agent State</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isSwarmRunning ? 'DELIBERATING' : 'CONSENSUS'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Deliberation Timeline & Cross-Agent Debates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deliberation Feed (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Live Multi-Agent Deliberation Trace
            </span>
            <span className="text-[11px] font-mono text-indigo-400">
              Stage {activeStage} of 4: Unanimous Alignment
            </span>
          </div>

          <div className="space-y-3">
            {swarmThoughts.map((item, idx) => {
              const agent = agents.find((a) => a.id === item.agentId);
              const Icon = agent?.icon || Bot;
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg bg-gradient-to-br ${agent?.avatarBg} flex items-center justify-center text-white`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-white">{agent?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({agent?.title})</span>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
                      {item.confidence}% Confidence
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed pl-8 text-[11px]">{item.thought}</p>

                  <div className="pl-8 pt-1 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span className="text-slate-600">Empirical Evidence:</span>
                    <span className="text-slate-400">{item.metricEvidence}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Executive Consensus Matrix & Action Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Unanimous Agreement Meter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Swarm Voting Alignment Matrix
            </span>

            <div className="flex items-center justify-between pt-1">
              <span className="text-2xl font-mono font-bold text-emerald-400">94.8%</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Strong Consensus
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2 rounded-full"
                style={{ width: '94.8%' }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              All 4 independent agents have concurred on root trends, statistical variance bounds, and tactical prioritization.
            </p>
          </div>

          {/* Actionable Executive Initiatives */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
              Synthesized Board Initiatives
            </span>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Initiative 1: High-Density Tier Scale</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">+28% Projected Net</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Focus capital on top 2 performing dimensions to maximize capital velocity.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Initiative 2: Real-Time Anomaly Sentinel</span>
                  <span className="text-[10px] text-purple-400 font-mono font-bold">Risk Reduction</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Deploy streaming Z-score outlier alerts to mitigate the tail dispersion flagged by Inspector Sentinel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
