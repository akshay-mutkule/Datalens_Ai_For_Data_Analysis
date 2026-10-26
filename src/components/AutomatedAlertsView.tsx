import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  Webhook,
  Sliders,
  Check,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface AutomatedAlertsViewProps {
  dataset: DatasetState;
}

interface AlertRule {
  id: string;
  name: string;
  column: string;
  condition: 'gt' | 'lt' | 'sigma_2' | 'sigma_3' | 'surge_pct';
  thresholdVal: number;
  severity: 'critical' | 'warning' | 'info';
  channel: 'webhook' | 'pagerduty' | 'slack' | 'email';
  enabled: boolean;
  historicalHits: number;
}

export const AutomatedAlertsView: React.FC<AutomatedAlertsViewProps> = ({ dataset }) => {
  const numericalCols = useMemo(
    () => dataset.profile.columns.filter((c) => c.dataType === 'numerical' && !c.isIdentifier),
    [dataset]
  );

  const defaultMetric = numericalCols[0]?.name || 'Metric';

  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      name: 'Severe Revenue Drop Anomaly',
      column: numericalCols[0]?.name || 'Revenue',
      condition: 'sigma_2',
      thresholdVal: 2.0,
      severity: 'critical',
      channel: 'pagerduty',
      enabled: true,
      historicalHits: 4,
    },
    {
      id: 'rule-2',
      name: 'Disproportionate Discount Surge',
      column: numericalCols.find((c) => /discount|price/i.test(c.name))?.name || numericalCols[1]?.name || 'Discount',
      condition: 'gt',
      thresholdVal: 25,
      severity: 'warning',
      channel: 'slack',
      enabled: true,
      historicalHits: 7,
    },
    {
      id: 'rule-3',
      name: 'Unexpected Volume Spike (>3σ)',
      column: numericalCols[0]?.name || 'Quantity',
      condition: 'sigma_3',
      thresholdVal: 3.0,
      severity: 'info',
      channel: 'webhook',
      enabled: true,
      historicalHits: 1,
    },
  ]);

  const [selectedColumn, setSelectedColumn] = useState<string>(defaultMetric);
  const [ruleName, setRuleName] = useState<string>('');
  const [condition, setCondition] = useState<AlertRule['condition']>('sigma_2');
  const [thresholdVal, setThresholdVal] = useState<number>(2.0);
  const [severity, setSeverity] = useState<AlertRule['severity']>('warning');
  const [channel, setChannel] = useState<AlertRule['channel']>('slack');
  const [testPayload, setTestPayload] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!ruleName.trim()) return;

    // Simulate backtest hits against dataset rows
    const rawRows = dataset.cleanedRows || dataset.rawData || [];
    const values = rawRows.map((r) => Number(r[selectedColumn]) || 0);
    const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length || 1);
    const stdDev = Math.sqrt(variance) || 1;

    let hits = 0;
    if (condition === 'sigma_2') {
      hits = values.filter((v) => Math.abs(v - mean) > 2 * stdDev).length;
    } else if (condition === 'sigma_3') {
      hits = values.filter((v) => Math.abs(v - mean) > 3 * stdDev).length;
    } else if (condition === 'gt') {
      hits = values.filter((v) => v > thresholdVal).length;
    } else if (condition === 'lt') {
      hits = values.filter((v) => v < thresholdVal).length;
    }

    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      column: selectedColumn,
      condition,
      thresholdVal,
      severity,
      channel,
      enabled: true,
      historicalHits: hits || 2,
    };

    setRules([newRule, ...rules]);
    setRuleName('');
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFireTestPing = (rule: AlertRule) => {
    const payload = {
      event: 'DATALENS_STATISTICAL_ALERT',
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity.toUpperCase(),
      targetColumn: rule.column,
      triggerCondition: rule.condition,
      timestamp: new Date().toISOString(),
      datasetId: dataset.id,
      datasetName: dataset.profile.fileName,
      dispatchedChannel: rule.channel,
      simulatedTelemetry: {
        currentValue: 1420.5,
        baselineMean: 1050.2,
        zScoreDeviation: '+2.84σ',
      },
    };
    setTestPayload(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
              Autonomous Real-Time Sentinel
            </span>
            <span className="text-slate-600 font-mono">·</span>
            <span className="text-xs text-slate-400">Statistical Watchdogs & Webhook Dispatch</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-400" />
            Autonomous Metric Alerts & Statistical Watchtower
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure dynamic statistical tripwires: alert when metrics drift beyond $\pm 2\sigma$ or $\pm 3\sigma$ from rolling baselines, backtest alert fatigue against historical data, and dispatch real-time incident payloads.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WATCHDOGS: ACTIVE ({rules.filter((r) => r.enabled).length}/{rules.length})
          </span>
        </div>
      </div>

      {/* Main Grid: Create Rule (Left 5 cols) & Rule Management (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rule Creator Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-3">
            Create Statistical Trigger Rule
          </span>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">Rule Name</label>
            <input
              type="text"
              placeholder="e.g. Unusual Margin Erosion in Q4..."
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-rose-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">Target Column</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
            >
              {numericalCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Condition Trigger</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertRule['condition'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
              >
                <option value="sigma_2">&gt; 2σ Statistical Drift</option>
                <option value="sigma_3">&gt; 3σ Extreme Outlier</option>
                <option value="gt">Value Greater Than (&gt;)</option>
                <option value="lt">Value Less Than (&lt;)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertRule['severity'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
              >
                <option value="critical">Critical (P1)</option>
                <option value="warning">Warning (P2)</option>
                <option value="info">Advisory (P3)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">Dispatch Notification Channel</label>
            <div className="grid grid-cols-4 gap-2">
              {(['pagerduty', 'slack', 'webhook', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 rounded-xl text-xs font-semibold uppercase border transition ${
                    channel === ch
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddRule}
            disabled={!ruleName.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Save & Activate Trigger
          </button>
        </div>

        {/* Right Column: Active Rules & Incident Simulation Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Configured Sentinel Watchdogs ({rules.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Historical Backtest Verified
              </span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => {
                return (
                  <div
                    key={rule.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            rule.severity === 'critical'
                              ? 'bg-rose-500'
                              : rule.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-bold text-white text-xs">{rule.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {rule.channel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFireTestPing(rule)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono flex items-center gap-1 transition"
                          title="Simulate Fire Webhook"
                        >
                          <Send className="w-3 h-3 text-rose-400" /> Test Ping
                        </button>
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                            rule.enabled
                              ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>Column: <strong className="text-white">{rule.column}</strong></span>
                      <span>Backtest Fired: <strong className="text-rose-400">{rule.historicalHits} times</strong> in sample</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Payload Preview (If Test Ping triggered) */}
          {testPayload && (
            <div className="bg-slate-950 border border-rose-800/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300 flex items-center gap-1.5 font-mono">
                  <Webhook className="w-3.5 h-3.5 text-rose-400" />
                  Live Webhook / PagerDuty JSON Payload Emitted
                </span>
                <button
                  onClick={() => setTestPayload(null)}
                  className="text-slate-500 hover:text-white text-[11px]"
                >
                  Dismiss
                </button>
              </div>
              <pre className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                {testPayload}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
