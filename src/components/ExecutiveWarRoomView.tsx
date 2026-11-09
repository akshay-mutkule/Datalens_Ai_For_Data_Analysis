import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Flame,
  Zap,
  Cpu,
  TrendingUp,
  TrendingDown,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Send,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  Globe,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DatasetState } from '../types/dataset';

interface ExecutiveWarRoomViewProps {
  dataset: DatasetState;
  onNavigateTab?: (tab: string) => void;
}

interface IncidentItem {
  id: string;
  timestamp: string;
  type: 'security' | 'anomaly' | 'drift' | 'system';
  severity: 'p1' | 'p2' | 'p3';
  message: string;
  metricImpact: string;
  resolved: boolean;
}

export const ExecutiveWarRoomView: React.FC<ExecutiveWarRoomViewProps> = ({
  dataset,
  onNavigateTab,
}) => {
  // Voice briefing state
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechProgress, setSpeechProgress] = useState<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fullscreen HUD state
  const [isHudFullscreen, setIsHudFullscreen] = useState<boolean>(false);

  // Operational metrics
  const totalRows = dataset.profile.totalRows;
  const qualityScore = dataset.profile.qualityScore;
  const anomaliesCount = dataset.profile.columns.reduce(
    (acc, col) => acc + (col.stats?.outlierCount || 0),
    0
  );
  const primaryMetric = dataset.kpis[0]?.label || 'Revenue';
  const primaryVal = dataset.kpis[0]?.value || '$1.2M';

  // Threat condition (DEFCON system)
  const defconLevel = useMemo(() => {
    if (qualityScore < 70 || anomaliesCount > 50) return { level: 2, label: 'ELEVATED VOLATILITY', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-600/60' };
    if (qualityScore < 85 || anomaliesCount > 20) return { level: 3, label: 'MODERATE RISK', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-600/60' };
    return { level: 4, label: 'STABLE EQUILIBRIUM', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-600/60' };
  }, [qualityScore, anomaliesCount]);

  // Executive briefing script for Speech Synthesis
  const briefingScript = useMemo(() => {
    return `Executive Intelligence Briefing for ${dataset.profile.fileName}. Operating condition is currently ${defconLevel.label}. Primary target metric ${primaryMetric} is holding at ${primaryVal} across ${totalRows.toLocaleString()} observed instances. System health score is evaluated at ${qualityScore} out of 100. We have flagged ${anomaliesCount} tail variance anomalies across monitored dimensions. Automated sentiment and causal attribution engines recommend prioritizing top growth tiers while maintaining strict outlier guardrails. Mission Control is ready for directive intervention.`;
  }, [dataset, defconLevel, primaryMetric, primaryVal, totalRows, qualityScore, anomaliesCount]);

  // Load available speech voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prioritize English voices
          const enVoices = voices.filter((v) => v.lang.startsWith('en'));
          setAvailableVoices(enVoices.length > 0 ? enVoices : voices);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Voice playback controls
  const handleToggleVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      setSpeechProgress(0);
    } else {
      window.speechSynthesis.cancel(); // Reset
      const utterance = new SpeechSynthesisUtterance(briefingScript);
      if (availableVoices[selectedVoiceIdx]) {
        utterance.voice = availableVoices[selectedVoiceIdx];
      }
      utterance.rate = voiceRate;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => {
        setIsPlayingVoice(false);
        setSpeechProgress(100);
      };
      utterance.onerror = () => setIsPlayingVoice(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Simulated real-time stream velocity chart data
  const velocityData = useMemo(() => {
    const points = [];
    let base = 120;
    for (let i = 0; i < 20; i++) {
      base = Math.max(80, base + (Math.sin(i * 0.8) * 15) + (Math.random() * 10 - 5));
      points.push({
        tick: `T-${20 - i}s`,
        velocity: Math.round(base),
        acceleration: Math.round((Math.sin(i) * 8)),
      });
    }
    return points;
  }, []);

  // Real-time operational incident feed
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'inc-101',
      timestamp: '00:02:14 ago',
      type: 'anomaly',
      severity: 'p2',
      message: 'Tail dispersion surge detected in upper 5th percentile',
      metricImpact: '±4.2% variance impact',
      resolved: false,
    },
    {
      id: 'inc-102',
      timestamp: '00:08:45 ago',
      type: 'drift',
      severity: 'p3',
      message: 'Covariate shift detected across categorical segment boundaries',
      metricImpact: 'Mild distribution tilt',
      resolved: false,
    },
    {
      id: 'inc-103',
      timestamp: '00:15:20 ago',
      type: 'security',
      severity: 'p3',
      message: 'SOC 2 Sentinel verified 0 PII leakages in stream pipeline',
      metricImpact: 'Compliant & masked',
      resolved: true,
    },
  ]);

  const [activeMitigation, setActiveMitigation] = useState<string | null>(null);

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, resolved: true } : inc))
    );
  };

  const handleExecuteMitigation = (actionName: string) => {
    setActiveMitigation(actionName);
    setTimeout(() => {
      setActiveMitigation(null);
      // Auto resolve un-resolved incidents
      setIncidents((prev) => prev.map((inc) => ({ ...inc, resolved: true })));
    }, 1800);
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ${
        isHudFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto'
          : ''
      }`}
    >
      {/* Top War Room HUD Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Radar background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              EXECUTIVE WAR ROOM · NOC LEVEL 1
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400 font-mono">Autonomous Strategic Operations</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-rose-400" />
            Executive War Room & AI Voice Intelligence Mission Control
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live operations bridge for senior leadership: real-time tactical voice briefings, DEFCON threat condition tracking, KPI velocity speedometers, and immediate 1-click incident mitigation.
          </p>
        </div>

        {/* Quick Actions & Fullscreen Toggle */}
        <div className="flex items-center gap-3 relative z-10">
          {/* DEFCON Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 ${defconLevel.bg}`}
          >
            <ShieldAlert className={`w-4 h-4 ${defconLevel.color}`} />
            <span className={defconLevel.color}>
              DEFCON {defconLevel.level}: {defconLevel.label}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsHudFullscreen(!isHudFullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isHudFullscreen ? 'Exit Fullscreen' : 'Enter War Room HUD Mode'}
          >
            {isHudFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice Intelligence Synthesizer Console */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/60 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Synthesized Autonomous Executive Voice Briefing
              </span>
              <span className="text-[11px] text-indigo-300/80 font-mono">
                Real-Time Audio Synthesis & Neural Speech Engine
              </span>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition cursor-pointer ${
                isPlayingVoice
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isPlayingVoice ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" /> Pause Audio Briefing
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" /> Play Voice Briefing
                </>
              )}
            </button>

            {/* Speed Rate Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400">Speed:</span>
              <button
                onClick={() => setVoiceRate((prev) => (prev === 1.0 ? 1.25 : prev === 1.25 ? 1.5 : 1.0))}
                className="text-indigo-400 font-bold hover:text-white"
              >
                {voiceRate}x
              </button>
            </div>

            {/* Voice Persona Selector */}
            {availableVoices.length > 0 && (
              <select
                value={selectedVoiceIdx}
                onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
                aria-label="Select AI Voice Persona"
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none font-medium cursor-pointer max-w-[160px] truncate"
              >
                {availableVoices.slice(0, 6).map((v, idx) => (
                  <option key={idx} value={idx}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Real-time Spectrum Waveform Animation */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-1.5 h-8">
            {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 85, 70, 90, 60, 75, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayingVoice
                    ? 'bg-gradient-to-t from-indigo-500 to-purple-400 animate-pulse'
                    : 'bg-slate-800'
                }`}
                style={{
                  height: isPlayingVoice ? `${Math.max(15, Math.round(h * Math.random()))}%` : '20%',
                }}
              />
            ))}
          </div>

          <p className="flex-1 text-[11px] text-slate-300 italic line-clamp-2 px-3 border-l border-slate-800">
            "{briefingScript}"
          </p>
        </div>
      </div>

      {/* Main War Room Grid: Velocity HUD (Left 7 cols) & Incident Operations (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-Time KPI Velocity & Acceleration Gauges (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tactical Speedometer Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: KPI Velocity */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase font-bold">
                <span>KPI Velocity (dKPI/dt)</span>
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-mono font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                +14.2% / hr
              </div>
              <span className="text-[10px] text-emerald-400 block font-mono">Positive momentum vector</span>
            </div>

            {/* Metric 2: G-Force Acceleration */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase font-bold">
                <span>Acceleration (d²KPI/dt²)</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-mono font-bold text-amber-300">
                +2.4σ
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">Expanding variance envelope</span>
            </div>

            {/* Metric 3: Systemic Resistance Ratio */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase font-bold">
                <span>Friction / Drag Index</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-mono font-bold text-purple-300">
                0.18
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">Low operating friction</span>
            </div>
          </div>

          {/* Live Flight Telemetry Stream Chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Real-Time Ingestion Velocity & Harmonic Vibration (20s Window)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Continuous micro-sampling across primary dimensional feature spaces.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STREAM LOCKED
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="tick" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="velocity"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill="url(#velocityGrad)"
                    name="Stream Velocity (events/sec)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Active Incident Resolution & Emergency Action Dispatcher (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1-Click Autonomous Mitigation Dispatcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
              Autonomous Incident Stabilization Controls
            </span>

            <div className="space-y-2">
              <button
                onClick={() => handleExecuteMitigation('impute_outliers')}
                disabled={activeMitigation !== null}
                className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-blue-300">
                    Protocol 1: Auto-Cap Volatile Outliers
                  </span>
                  <span className="text-[10px] text-slate-400">Winsorize top 1% outliers to restore normal distribution</span>
                </div>
                <Send className="w-4 h-4 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleExecuteMitigation('trigger_alert')}
                disabled={activeMitigation !== null}
                className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-rose-300">
                    Protocol 2: Broadcast PagerDuty P1 Alert
                  </span>
                  <span className="text-[10px] text-slate-400">Emit structured incident payload to incident response team</span>
                </div>
                <Send className="w-4 h-4 text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleExecuteMitigation('rebalance_causal')}
                disabled={activeMitigation !== null}
                className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                    Protocol 3: Enforce Backdoor Causal Balance
                  </span>
                  <span className="text-[10px] text-slate-400">Re-stratify propensity weights to neutralize selection bias</span>
                </div>
                <Send className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {activeMitigation && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
                <Cpu className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Executing protocol mitigation across nodes...</span>
              </div>
            )}
          </div>

          {/* Active Live Incidents Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                Live Flight Incident Register
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {incidents.filter((i) => !i.resolved).length} Unresolved
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                    inc.resolved
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inc.severity === 'p1'
                            ? 'bg-rose-500'
                            : inc.severity === 'p2'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-bold text-white uppercase text-[10px] font-mono">
                        {inc.id} · {inc.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">{inc.timestamp}</span>
                      {!inc.resolved ? (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold hover:bg-emerald-900 transition"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">RESOLVED</span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">{inc.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">Impact: {inc.metricImpact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
