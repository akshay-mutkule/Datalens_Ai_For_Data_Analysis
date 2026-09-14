import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface LiveStreamBarProps {
  dataset: DatasetState | null;
  onNewStreamRow: (newRow: Record<string, any>) => void;
}

export const LiveStreamBar: React.FC<LiveStreamBarProps> = ({ dataset, onNewStreamRow }) => {
  const { isDark } = useTheme();
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  const [streamEvents, setStreamEvents] = useState<
    { id: string; timestamp: string; row: Record<string, any>; summary: string }[]
  >([]);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const intervalRef = useRef<any>(null);

  // Synthesize realistic stream record based on dataset columns
  const generateSyntheticEvent = () => {
    if (!dataset || dataset.cleanedRows.length === 0) return null;

    // Pick random base row to preserve schema and variation
    const baseIndex = Math.floor(Math.random() * dataset.cleanedRows.length);
    const baseRow = dataset.cleanedRows[baseIndex];
    const newRow: Record<string, any> = { ...baseRow };

    // Perturb numerical features slightly (+- 5% to 15%)
    dataset.profile.columns.forEach((col) => {
      if (col.dataType === 'numerical' && typeof newRow[col.name] === 'number') {
        const factor = 1 + (Math.random() * 0.2 - 0.1);
        const val = Number(newRow[col.name]) * factor;
        newRow[col.name] = Number.isInteger(newRow[col.name]) ? Math.round(val) : Number(val.toFixed(2));
      } else if (col.dataType === 'date') {
        newRow[col.name] = new Date().toISOString().split('T')[0];
      }
    });

    // Make summary text
    const sampleNumCol = dataset.profile.columns.find((c) => c.dataType === 'numerical' && !c.isIdentifier);
    const sampleCatCol = dataset.profile.columns.find((c) => c.dataType === 'categorical' && !c.isIdentifier);

    const summary = `${sampleCatCol ? `${newRow[sampleCatCol.name] || 'Active'} • ` : ''}${
      sampleNumCol ? `${sampleNumCol.name}: ${newRow[sampleNumCol.name]}` : 'Record Ingested'
    }`;

    return {
      id: 'stream_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      row: newRow,
      summary,
    };
  };

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        const event = generateSyntheticEvent();
        if (event) {
          setStreamEvents((prev) => [event, ...prev.slice(0, 49)]); // Keep last 50 events
          setEventsCount((prev) => prev + 1);
          onNewStreamRow(event.row);
        }
      }, 2400);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming, dataset]);

  if (!dataset) return null;

  return (
    <div
      className={`border-b transition-colors duration-200 ${
        isDark ? 'bg-slate-950/90 border-slate-800/80 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Streaming Control & Live Pulse Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-xs ${
              isStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Live Stream Simulator</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="font-bold text-slate-300">
              {isStreaming ? 'INGESTION ACTIVE (2.4s interval)' : 'STREAM ENGINE: STANDBY'}
            </span>
          </div>
        </div>

        {/* Center: Latest Ingested Record Ticker */}
        {streamEvents.length > 0 && (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono bg-slate-900/90 border border-slate-800 px-3 py-0.5 rounded-lg text-emerald-300 truncate max-w-md">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Latest Event:</span>
            <span className="font-semibold truncate">{streamEvents[0].summary}</span>
          </div>
        )}

        {/* Right: Event Count & Drawer Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Ingested: <strong className="text-blue-400">+{eventsCount}</strong> rows
          </span>

          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition"
          >
            <span>Live Ticker Log</span>
            {showLogDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Slide-Down Ticker Log Details */}
      {showLogDrawer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-t border-slate-800 bg-slate-950/95 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Live Ingestion Buffer (Last {streamEvents.length} Events)
            </span>
            <button
              onClick={() => {
                setStreamEvents([]);
                setEventsCount(0);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear Buffer
            </button>
          </div>

          {streamEvents.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-xs">
              No live stream events captured yet. Click "Start Live Stream Simulator" above to begin ingestion.
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-none">
              {streamEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500 font-mono text-[10px]">[{evt.timestamp}]</span>
                    <span className="text-emerald-400 font-semibold">{evt.summary}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    hash: {evt.id.substring(evt.id.length - 6)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
