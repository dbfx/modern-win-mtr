import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AlertRule, AlertMetric, AlertSource, FiredAlert } from '../../shared/types';

interface AlertsViewProps {
  rules: AlertRule[];
  recentAlerts: FiredAlert[];
  onAddRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  onRemoveRule: (id: string) => void;
  onToggleRule: (id: string) => void;
}

const METRIC_OPTIONS: { value: AlertMetric; label: string; unit: string }[] = [
  { value: 'latency', label: 'Latency', unit: 'ms' },
  { value: 'loss', label: 'Packet Loss', unit: '%' },
  { value: 'jitter', label: 'Jitter', unit: 'ms' },
];

const SOURCE_OPTIONS: { value: AlertSource; label: string }[] = [
  { value: 'trace', label: 'Traceroute' },
  { value: 'loss-monitor', label: 'Loss Monitor' },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AlertsView({
  rules,
  recentAlerts,
  onAddRule,
  onRemoveRule,
  onToggleRule,
}: AlertsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [source, setSource] = useState<AlertSource>('trace');
  const [metric, setMetric] = useState<AlertMetric>('latency');
  const [threshold, setThreshold] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(threshold);
    if (!name.trim() || isNaN(t) || t <= 0) return;

    onAddRule({
      name: name.trim(),
      enabled: true,
      source,
      metric,
      threshold: t,
    });

    setName('');
    setThreshold('100');
    setShowForm(false);
  };

  const selectedUnit = METRIC_OPTIONS.find((m) => m.value === metric)?.unit || '';

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold gradient-accent-text">Alerts & Notifications</h2>
          <p className="text-xs text-white/20 mt-1">
            Get notified when network metrics exceed your thresholds
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </div>

      {/* Add rule form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 mb-4 overflow-hidden"
            onSubmit={handleSubmit}
          >
            <div className="glass-card p-4">
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. High latency alert"
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as AlertSource)}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-500/40"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Metric</label>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as AlertMetric)}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-500/40"
                  >
                    {METRIC_OPTIONS.filter((m) => !(source === 'loss-monitor' && m.value === 'jitter')).map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">
                    Threshold ({selectedUnit})
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    min="0"
                    step="any"
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Create Rule
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Rules list */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-2">
            Rules ({rules.length})
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
            {rules.length === 0 ? (
              <div className="flex items-center justify-center text-white/10 text-sm py-16">
                No alert rules configured. Click "+ New Rule" to get started.
              </div>
            ) : (
              <AnimatePresence>
                {rules.map((rule, i) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className={`glass-card p-3 flex items-center gap-3 ${!rule.enabled ? 'opacity-40' : ''}`}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                        rule.enabled ? 'bg-cyan-500/40' : 'bg-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                          rule.enabled ? 'left-[18px] bg-cyan-400' : 'left-0.5 bg-white/30'
                        }`}
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/80">{rule.name}</div>
                      <div className="text-[10px] text-white/30">
                        {SOURCE_OPTIONS.find((s) => s.value === rule.source)?.label}
                        {' · '}
                        {METRIC_OPTIONS.find((m) => m.value === rule.metric)?.label}
                        {' > '}
                        {rule.threshold}{rule.metric === 'loss' ? '%' : 'ms'}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => onRemoveRule(rule.id)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete rule"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Recent alerts log */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-2">
            Recent Alerts ({recentAlerts.length})
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
            {recentAlerts.length === 0 ? (
              <div className="flex items-center justify-center text-white/10 text-xs py-16">
                No alerts fired yet
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="glass-card p-2.5 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    <span className="text-white/60 font-medium truncate">{alert.ruleName}</span>
                    <span className="text-white/20 ml-auto flex-shrink-0">{formatTime(alert.timestamp)}</span>
                  </div>
                  <div className="text-white/30 pl-3.5">{alert.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
