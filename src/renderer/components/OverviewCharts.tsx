import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { HopData } from '../../shared/types';

interface OverviewChartsProps {
  hops: HopData[];
}

const HOP_COLORS = [
  '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#e879f9', '#22d3ee', '#fb923c', '#a78bfa', '#34d399',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10,10,15,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e5e7eb',
};

export default function OverviewCharts({ hops }: OverviewChartsProps) {
  const visibleHops = useMemo(
    () => hops.filter((h) => h.ip && h.ip !== '???'),
    [hops],
  );

  // Build time-series data: each index is a sample number, each hop contributes a column
  const { latencyData, jitterData, lossData } = useMemo(() => {
    if (visibleHops.length === 0) return { latencyData: [], jitterData: [], lossData: [] };

    const maxLen = Math.max(...visibleHops.map((h) => h.history.length));
    const sampleCount = Math.min(maxLen, 60);
    const latency: Record<string, number | null>[] = [];
    const jitter: Record<string, number | null>[] = [];
    const loss: Record<string, number>[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const lRow: Record<string, number | null> = { idx: i };
      const jRow: Record<string, number | null> = { idx: i };
      const losRow: Record<string, number> = { idx: i };

      for (const hop of visibleHops) {
        const offset = Math.max(0, hop.history.length - sampleCount);
        const val = hop.history[offset + i] ?? null;
        const key = `hop${hop.hopNumber}`;
        lRow[key] = val;

        // Compute rolling jitter (stddev of last 5 values up to this point)
        const start = Math.max(0, offset + i - 4);
        const end = offset + i + 1;
        const window = hop.history.slice(start, end).filter((v): v is number => v !== null);
        if (window.length > 1) {
          const mean = window.reduce((a, b) => a + b, 0) / window.length;
          const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
          jRow[key] = Math.round(Math.sqrt(variance) * 10) / 10;
        } else {
          jRow[key] = 0;
        }

        // Rolling loss: count nulls in last 10 samples
        const lossStart = Math.max(0, offset + i - 9);
        const lossEnd = offset + i + 1;
        const lossWindow = hop.history.slice(lossStart, lossEnd);
        const nullCount = lossWindow.filter((v) => v === null).length;
        losRow[key] = Math.round((nullCount / lossWindow.length) * 100 * 10) / 10;
      }

      latency.push(lRow);
      jitter.push(jRow);
      loss.push(losRow);
    }

    return { latencyData: latency, jitterData: jitter, lossData: loss };
  }, [visibleHops]);

  if (visibleHops.length === 0 || latencyData.length === 0) return null;

  const hopKeys = visibleHops.map((h) => ({
    key: `hop${h.hopNumber}`,
    label: `#${h.hopNumber}`,
    color: HOP_COLORS[(h.hopNumber - 1) % HOP_COLORS.length],
  }));

  return (
    <div className="flex-shrink-0 px-4 pb-2">
      <div className="flex gap-3">
        {/* Latency */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Latency (ms)
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="idx" hide />
              <YAxis
                width={40}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'rgba(255,255,255,0.2)' } }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={() => ''} />
              {hopKeys.map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Jitter */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Jitter (ms)
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={jitterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="idx" hide />
              <YAxis
                width={40}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'rgba(255,255,255,0.2)' } }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={() => ''} />
              {hopKeys.map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Packet Loss */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Packet Loss (%)
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={lossData}>
              <defs>
                {hopKeys.map(({ key, color }) => (
                  <linearGradient key={key} id={`loss-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="idx" hide />
              <YAxis
                width={40}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'rgba(255,255,255,0.2)' } }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={() => ''} />
              {hopKeys.map(({ key, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#loss-${key})`}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
