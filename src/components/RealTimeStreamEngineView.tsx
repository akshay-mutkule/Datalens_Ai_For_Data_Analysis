import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShieldAlert,
  Sliders,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Wifi,
  Download,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface RealTimeStreamEngineViewProps {
  dataset: DatasetState;
}

interface StreamPacket {
  id: string;
  seq: number;
  timestamp: string;
  value: number;
  delta: number;
  ema9: number;
  ema21: number;
  upperBollinger: number;
  lowerBollinger: number;
  rsi: number;
  status: 'nominal' | 'warning' | 'anomaly';
  latencyMicros: number;
  tags: string[];
}

export const RealTimeStreamEngineView: React.FC<RealTimeStreamEngineViewProps> = ({ dataset }) => {
  const { isDark } = useTheme();

  // Find numerical columns
  const numericCols = useMemo(() => {
    return dataset.profile.columns.filter((c) => c.type === 'number');
  }, [dataset]);

  // Selected streaming feed metric
  const [streamColName, setStreamColName] = useState<string>(() => {
    const match = numericCols.find((c) => /rev|sale|amount|transaction|cost|unit/i.test(c.name));
    return match ? match.name : numericCols[0]?.name || 'Metric';
  });

  // Calculate baseline parameters from current dataset
  const baselineStats = useMemo(() => {
    const vals = dataset.data
      .map((r) => Number(r[streamColName]))
      .filter((v) => !isNaN(v) && isFinite(v));

    if (vals.length === 0) {
      return { mean: 100, std: 15 };
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
    return { mean, std: Math.max(1, Math.sqrt(variance)) };
  }, [dataset.data, streamColName]);

  // Stream execution states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [tickIntervalMs, setTickIntervalMs] = useState<number>(300); // 100ms, 300ms, 500ms, 1000ms
  const [sigmaTripwire, setSigmaTripwire] = useState<number>(2.5); // 2.0x, 2.5x, 3.0x
  const [packets, setPackets] = useState<StreamPacket[]>([]);
  const [totalTicks, setTotalTicks] = useState<number>(0);
  const [anomaliesCount, setAnomaliesCount] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'anomalies'>('all');

  // Streaming buffers for chart window (max 60 points)
  const MAX_BUFFER = 60;
  const seqRef = useRef<number>(1);
  const ema9Ref = useRef<number>(baselineStats.mean);
  const ema21Ref = useRef<number>(baselineStats.mean);
  const windowValuesRef = useRef<number[]>([]);
  const gainsRef = useRef<number[]>([]);
  const lossesRef = useRef<number[]>([]);

  // Initialize buffer with warm-up data
  useEffect(() => {
    const initialPackets: StreamPacket[] = [];
    let currentVal = baselineStats.mean;
    let currentEma9 = baselineStats.mean;
    let currentEma21 = baselineStats.mean;
    const historyVals: number[] = [];

    for (let i = 0; i < 40; i++) {
      const noise = (Math.random() - 0.49) * baselineStats.std * 0.8;
      currentVal = Math.max(0, currentVal + noise);
      historyVals.push(currentVal);

      // EMAs
      currentEma9 = currentVal * (2 / (9 + 1)) + currentEma9 * (1 - 2 / (9 + 1));
      currentEma21 = currentVal * (2 / (21 + 1)) + currentEma21 * (1 - 2 / (21 + 1));

      // Rolling Bollinger window (last 20)
      const windowSlice = historyVals.slice(-20);
      const wMean = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
      const wStd = Math.sqrt(windowSlice.reduce((a, b) => a + Math.pow(b - wMean, 2), 0) / windowSlice.length);

      const upperBollinger = wMean + sigmaTripwire * wStd;
      const lowerBollinger = Math.max(0, wMean - sigmaTripwire * wStd);

      const d = new Date(Date.now() - (40 - i) * tickIntervalMs);

      initialPackets.push({
        id: `pkt_${i + 1}`,
        seq: i + 1,
        timestamp: d.toISOString().substring(11, 23),
        value: currentVal,
        delta: noise,
        ema9: currentEma9,
        ema21: currentEma21,
        upperBollinger,
        lowerBollinger,
        rsi: 50 + (Math.sin(i / 5) * 18),
        status: 'nominal',
        latencyMicros: Math.round(38 + Math.random() * 45),
        tags: ['ingest_edge_us_east', 'ok'],
      });
    }

    seqRef.current = 41;
    ema9Ref.current = currentEma9;
    ema21Ref.current = currentEma21;
    windowValuesRef.current = historyVals;
    setPackets(initialPackets);
    setTotalTicks(40);
  }, [baselineStats.mean, baselineStats.std, streamColName]);

  // Streaming Interval Effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setPackets((prev) => {
        const lastPkt = prev[prev.length - 1];
        const lastVal = lastPkt ? lastPkt.value : baselineStats.mean;

        // Random walk with drift and volatility
        const rawNoise = (Math.random() - 0.49) * baselineStats.std * 0.9;
        const newVal = Math.max(0, lastVal + rawNoise);

        // Update EMAs
        const newEma9 = newVal * (2 / 10) + ema9Ref.current * (8 / 10);
        const newEma21 = newVal * (2 / 22) + ema21Ref.current * (20 / 22);
        ema9Ref.current = newEma9;
        ema21Ref.current = newEma21;

        // Rolling Bollinger calculation (last 20 points)
        const newWindow = [...windowValuesRef.current.slice(-19), newVal];
        windowValuesRef.current = newWindow;
        const wMean = newWindow.reduce((a, b) => a + b, 0) / newWindow.length;
        const wStd = Math.max(0.5, Math.sqrt(newWindow.reduce((a, b) => a + Math.pow(b - wMean, 2), 0) / newWindow.length));

        const upperBollinger = wMean + sigmaTripwire * wStd;
        const lowerBollinger = Math.max(0, wMean - sigmaTripwire * wStd);

        // Anomaly tripwire detection
        const isAnomaly = newVal > upperBollinger || newVal < lowerBollinger;
        const status: 'nominal' | 'warning' | 'anomaly' = isAnomaly
          ? 'anomaly'
          : newVal > wMean + 1.8 * wStd || newVal < wMean - 1.8 * wStd
          ? 'warning'
          : 'nominal';

        if (isAnomaly) {
          setAnomaliesCount((c) => c + 1);
        }

        // RSI calculation
        const delta = newVal - lastVal;
        const gain = delta > 0 ? delta : 0;
        const loss = delta < 0 ? Math.abs(delta) : 0;
        const prevRsi = lastPkt ? lastPkt.rsi : 50;
        const newRsi = Math.max(5, Math.min(95, prevRsi + (gain > loss ? 1.5 : -1.5) * Math.random()));

        const currentSeq = seqRef.current++;
        const now = new Date();
        const timestamp = now.toISOString().substring(11, 23);

        const newPkt: StreamPacket = {
          id: `pkt_${currentSeq}`,
          seq: currentSeq,
          timestamp,
          value: newVal,
          delta,
          ema9: newEma9,
          ema21: newEma21,
          upperBollinger,
          lowerBollinger,
          rsi: newRsi,
          status,
          latencyMicros: Math.round(35 + Math.random() * 55),
          tags: isAnomaly ? ['tripwire_breached', 'alert_dispatched'] : ['stream_sync', 'ok'],
        };

        setTotalTicks(currentSeq);
        const updated = [...prev.slice(-(MAX_BUFFER - 1)), newPkt];
        return updated;
      });
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, tickIntervalMs, sigmaTripwire, baselineStats.mean, baselineStats.std]);

  // 1-Click Anomaly Injection Actions
  const handleInjectFlashSpike = () => {
    setPackets((prev) => {
      const lastPkt = prev[prev.length - 1];
      const base = lastPkt ? lastPkt.value : baselineStats.mean;
      const spikeVal = base + baselineStats.std * 4.2; // Massive 4.2 sigma spike
      const currentSeq = seqRef.current++;
      const now = new Date();

      const newPkt: StreamPacket = {
        id: `pkt_${currentSeq}`,
        seq: currentSeq,
        timestamp: now.toISOString().substring(11, 23),
        value: spikeVal,
        delta: spikeVal - base,
        ema9: spikeVal * 0.4 + ema9Ref.current * 0.6,
        ema21: spikeVal * 0.2 + ema21Ref.current * 0.8,
        upperBollinger: base + sigmaTripwire * baselineStats.std,
        lowerBollinger: Math.max(0, base - sigmaTripwire * baselineStats.std),
        rsi: 92.5,
        status: 'anomaly',
        latencyMicros: 142,
        tags: ['synthetic_flash_spike', 'watchdog_critical'],
      };

      setAnomaliesCount((c) => c + 1);
      setTotalTicks(currentSeq);
      return [...prev.slice(-(MAX_BUFFER - 1)), newPkt];
    });
  };

  const handleInjectRegimeShift = () => {
    // Shifts baseline mean upwards by 40%
    setPackets((prev) => {
      const currentSeq = seqRef.current++;
      const now = new Date();
      const shiftedVal = baselineStats.mean * 1.55;

      const newPkt: StreamPacket = {
        id: `pkt_${currentSeq}`,
        seq: currentSeq,
        timestamp: now.toISOString().substring(11, 23),
        value: shiftedVal,
        delta: shiftedVal * 0.35,
        ema9: shiftedVal,
        ema21: shiftedVal * 0.9,
        upperBollinger: shiftedVal * 1.15,
        lowerBollinger: shiftedVal * 0.85,
        rsi: 88,
        status: 'warning',
        latencyMicros: 78,
        tags: ['structural_regime_shift', 'recalibrating'],
      };

      setTotalTicks(currentSeq);
      return [...prev.slice(-(MAX_BUFFER - 1)), newPkt];
    });
  };

  const handleClearBuffer = () => {
    setPackets([]);
    seqRef.current = 1;
    setTotalTicks(0);
    setAnomaliesCount(0);
  };

  // Telemetry KPIs
  const currentPacket = packets[packets.length - 1];
  const tps = Math.round(1000 / tickIntervalMs);
  const avgLatency = useMemo(() => {
    if (packets.length === 0) return 45;
    return Math.round(packets.reduce((a, b) => a + b.latencyMicros, 0) / packets.length);
  }, [packets]);

  // Scaled coordinates for SVG waveform chart
  const chartPoints = useMemo(() => {
    if (packets.length < 2) return null;

    const minVal = Math.min(...packets.map((p) => Math.min(p.value, p.lowerBollinger))) * 0.95;
    const maxVal = Math.max(...packets.map((p) => Math.max(p.value, p.upperBollinger))) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 25, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const pts = packets.map((p, idx) => {
      const x = padding.left + (idx / (packets.length - 1)) * plotW;
      const yVal = padding.top + plotH - ((p.value - minVal) / range) * plotH;
      const yEma9 = padding.top + plotH - ((p.ema9 - minVal) / range) * plotH;
      const yEma21 = padding.top + plotH - ((p.ema21 - minVal) / range) * plotH;
      const yUpper = padding.top + plotH - ((p.upperBollinger - minVal) / range) * plotH;
      const yLower = padding.top + plotH - ((p.lowerBollinger - minVal) / range) * plotH;

      return {
        ...p,
        x,
        yVal,
        yEma9,
        yEma21,
        yUpper,
        yLower,
      };
    });

    // Path strings
    const valPath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yVal}` : `${acc} L ${p.x} ${p.yVal}`), '');
    const ema9Path = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yEma9}` : `${acc} L ${p.x} ${p.yEma9}`), '');
    const ema21Path = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yEma21}` : `${acc} L ${p.x} ${p.yEma21}`), '');
    const upperPath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yUpper}` : `${acc} L ${p.x} ${p.yUpper}`), '');
    const lowerPath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yLower}` : `${acc} L ${p.x} ${p.yLower}`), '');

    // Area fill for Bollinger Bands
    const bandArea = `${upperPath} L ${pts[pts.length - 1].x} ${pts[pts.length - 1].yLower} ` +
      pts.slice().reverse().reduce((acc, p) => `${acc} L ${p.x} ${p.yLower}`, '') + ' Z';

    return {
      pts,
      valPath,
      ema9Path,
      ema21Path,
      upperPath,
      lowerPath,
      bandArea,
      minVal,
      maxVal,
      padding,
      plotW,
      plotH,
    };
  }, [packets]);

  // Filtered packets for packet inspector terminal
  const displayPackets = useMemo(() => {
    if (filterType === 'anomalies') {
      return packets.filter((p) => p.status === 'anomaly');
    }
    return packets;
  }, [packets, filterType]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner HUD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                Live Ingestion Stream & Oscilloscope
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Stream WebSocket Sim (Active)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Real-Time Telemetry & Time Series Waveform
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              High-throughput streaming monitor featuring dynamic Bollinger Bands ($\mu \pm {sigmaTripwire}\sigma$),
              dual Exponential Moving Averages (EMA 9/21), RSI oscillators, and microsecond packet telemetry.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Freeze Buffer' : 'Resume Stream'}
            </button>

            <button
              onClick={handleInjectFlashSpike}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold transition-all"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              Inject Flash Spike
            </button>

            <button
              onClick={handleInjectRegimeShift}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold transition-all"
            >
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Regime Shift
            </button>

            <button
              onClick={handleClearBuffer}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-all"
              title="Reset Buffer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stream Configuration Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Stream Telemetry Feed
            </label>
            <select
              value={streamColName}
              onChange={(e) => setStreamColName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
            >
              {numericCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Stream Velocity (Frequency)
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { val: 100, label: '10Hz' },
                { val: 300, label: '3.3Hz' },
                { val: 500, label: '2Hz' },
                { val: 1000, label: '1Hz' },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setTickIntervalMs(f.val)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    tickIntervalMs === f.val
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Tripwire Sigma Threshold
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { val: 2.0, label: '±2.0σ' },
                { val: 2.5, label: '±2.5σ' },
                { val: 3.0, label: '±3.0σ' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSigmaTripwire(s.val)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    sigmaTripwire === s.val
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Buffer Health
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {packets.length}/{MAX_BUFFER} frames
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${(packets.length / MAX_BUFFER) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Live Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Live Tick Value</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-white">
              {currentPacket ? currentPacket.value.toFixed(2) : '0.00'}
            </span>
            {currentPacket && (
              <span className={`text-xs font-mono font-bold flex items-center ${currentPacket.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentPacket.delta >= 0 ? '+' : ''}{currentPacket.delta.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            EMA9: {currentPacket ? currentPacket.ema9.toFixed(2) : '-'} • EMA21: {currentPacket ? currentPacket.ema21.toFixed(2) : '-'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Throughput & Rate</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-indigo-300">
              {tps}
            </span>
            <span className="text-xs font-mono text-slate-400">ticks/sec (TPS)</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            Total Ingested: <strong className="text-slate-300">{totalTicks.toLocaleString()}</strong> events
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Network Jitter Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-emerald-400">
              {avgLatency}
            </span>
            <span className="text-xs font-mono text-slate-400">µs (microseconds)</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            Sub-millisecond kernel socket transit
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-rose-500/20 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Tripwire Anomalies</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-rose-400">
              {anomaliesCount}
            </span>
            <span className="text-xs font-mono text-rose-500">
              breaches ({((anomaliesCount / (totalTicks || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            Boundary: <span className="text-amber-400 font-bold">&gt; ±{sigmaTripwire}σ deviation</span>
          </p>
        </div>
      </div>

      {/* Main Waveform & Packet Stream Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Oscilloscope Waveform & RSI */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Dynamic Bollinger Waveform Oscilloscope
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Real-time moving window: Value (Cyan), EMA-9 (Amber), EMA-21 (Purple), Bands (Shaded)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isPlaying ? 'STREAMING' : 'FROZEN'}
                </span>
              </div>
            </div>

            {/* SVG Waveform Chart */}
            <div className="relative h-72 w-full bg-slate-950 rounded-2xl border border-slate-800/80 p-2 overflow-hidden">
              {chartPoints ? (
                <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bollingerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  <line x1="55" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="55" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="55" y1="150" x2="780" y2="150" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="55" y1="210" x2="780" y2="210" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Y-Axis tick labels */}
                  <text x="45" y="34" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {chartPoints.maxVal.toFixed(1)}
                  </text>
                  <text x="45" y="124" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {((chartPoints.maxVal + chartPoints.minVal) / 2).toFixed(1)}
                  </text>
                  <text x="45" y="214" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {chartPoints.minVal.toFixed(1)}
                  </text>

                  {/* Shaded Bollinger Band Envelope */}
                  <path d={chartPoints.bandArea} fill="url(#bollingerGradient)" />
                  <path d={chartPoints.upperPath} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <path d={chartPoints.lowerPath} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

                  {/* EMAs */}
                  <path d={chartPoints.ema21Path} fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.7" />
                  <path d={chartPoints.ema9Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />

                  {/* Primary Waveform Value Path */}
                  <path d={chartPoints.valPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                  {/* Anomaly and latest point markers */}
                  {chartPoints.pts.map((p, idx) => {
                    if (p.status === 'anomaly') {
                      return (
                        <g key={p.id}>
                          <circle cx={p.x} cy={p.yVal} r="6" fill="#f43f5e" className="animate-pulse" />
                          <circle cx={p.x} cy={p.yVal} r="10" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.7" />
                        </g>
                      );
                    }
                    if (idx === chartPoints.pts.length - 1) {
                      return (
                        <g key="head">
                          <circle cx={p.x} cy={p.yVal} r="4" fill="#ffffff" />
                          <circle cx={p.x} cy={p.yVal} r="8" fill="none" stroke="#06b6d4" strokeWidth="2" className="animate-ping" />
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Warming up streaming pipeline buffer...
                </div>
              )}

              {/* Chart Legend */}
              <div className="absolute top-3 right-3 flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Live
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> EMA-9
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> EMA-21
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Tripwire
                </span>
              </div>
            </div>

            {/* Sub-Chart: Relative Strength Index (RSI-14) */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  Relative Strength Index (RSI-14)
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Current: {currentPacket ? currentPacket.rsi.toFixed(1) : '50.0'}
                </span>
              </div>

              <div className="relative h-20 w-full bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                  {/* Overbought (70) and Oversold (30) boundary lines */}
                  <line x1="55" y1="18" x2="780" y2="18" stroke="#f43f5e" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="55" y1="42" x2="780" y2="42" stroke="#10b981" strokeDasharray="3 3" opacity="0.4" />
                  <text x="45" y="21" textAnchor="end" fill="#f43f5e" fontSize="8" fontFamily="monospace">70</text>
                  <text x="45" y="45" textAnchor="end" fill="#10b981" fontSize="8" fontFamily="monospace">30</text>

                  {/* RSI Path */}
                  {chartPoints && (
                    <path
                      d={chartPoints.pts.reduce((acc, p, i) => {
                        const y = 60 - (p.rsi / 100) * 60;
                        return i === 0 ? `M ${p.x} ${y}` : `${acc} L ${p.x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Ingestion Terminal & Packet Inspector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white tracking-tight">Packet Inspector</h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  All ({packets.length})
                </button>
                <button
                  onClick={() => setFilterType('anomalies')}
                  className={`px-2 py-0.5 rounded transition-all ${filterType === 'anomalies' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                >
                  Alerts ({anomaliesCount})
                </button>
              </div>
            </div>

            {/* Terminal Feed Scrollbox */}
            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800/80 p-3 font-mono text-[11px] overflow-y-auto max-h-[460px] space-y-2 select-text">
              {displayPackets.length === 0 ? (
                <div className="text-slate-500 text-center py-12">No packets matching filter.</div>
              ) : (
                displayPackets
                  .slice()
                  .reverse()
                  .map((pkt) => {
                    const isTrip = pkt.status === 'anomaly';
                    const isWarn = pkt.status === 'warning';
                    return (
                      <div
                        key={pkt.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isTrip
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : isWarn
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200">
                            #{pkt.seq} <span className="text-slate-500">{pkt.timestamp}</span>
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                              isTrip
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isWarn
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {pkt.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 my-1">
                          <div>Val: <span className="text-white font-bold">{pkt.value.toFixed(2)}</span></div>
                          <div>Δ: <span className={pkt.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{pkt.delta >= 0 ? '+' : ''}{pkt.delta.toFixed(2)}</span></div>
                          <div>Latency: <span className="text-cyan-400">{pkt.latencyMicros}µs</span></div>
                          <div>RSI: <span className="text-purple-300">{pkt.rsi.toFixed(1)}</span></div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-slate-800/60 text-[9px]">
                          {pkt.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
