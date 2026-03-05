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
} from 'recharts';
import type { HopData } from '../../shared/types';

interface OverviewChartsProps {
  hops: HopData[];
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10,10,15,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e5e7eb',
};

export default function OverviewCharts({ hops }: OverviewChartsProps) {
  const lastHop = useMemo(
    () => [...hops].reverse().find((h) => h.ip && h.ip !== '???') ?? null,
    [hops],
  );

  // Build time-series data for the last hop (destination) only
  const { latencyData, jitterData, lossData } = useMemo(() => {
    if (!lastHop) return { latencyData: [], jitterData: [], lossData: [] };

    const sampleCount = Math.min(lastHop.history.length, 60);
    const offset = Math.max(0, lastHop.history.length - sampleCount);

    const latency: { idx: number; latency: number | null }[] = [];
    const jitter: { idx: number; jitter: number }[] = [];
    const loss: { idx: number; loss: number }[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const val = lastHop.history[offset + i] ?? null;
      latency.push({ idx: i, latency: val });

      // Rolling jitter (stddev of last 5 values)
      const jStart = Math.max(0, offset + i - 4);
      const jEnd = offset + i + 1;
      const window = lastHop.history.slice(jStart, jEnd).filter((v): v is number => v !== null);
      let jVal = 0;
      if (window.length > 1) {
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
        jVal = Math.round(Math.sqrt(variance) * 10) / 10;
      }
      jitter.push({ idx: i, jitter: jVal });

      // Rolling loss: count nulls in last 50 samples
      const lStart = Math.max(0, offset + i - 49);
      const lEnd = offset + i + 1;
      const lossWindow = lastHop.history.slice(lStart, lEnd);
      const nullCount = lossWindow.filter((v) => v === null).length;
      loss.push({ idx: i, loss: Math.round((nullCount / lossWindow.length) * 100 * 10) / 10 });
    }

    return { latencyData: latency, jitterData: jitter, lossData: loss };
  }, [lastHop]);

  if (!lastHop || latencyData.length === 0) return null;

  const destLabel = lastHop.hostname || lastHop.ip || `Hop #${lastHop.hopNumber}`;

  return (
    <div className="flex-shrink-0 px-4 pb-2">
      <div className="flex gap-3">
        {/* Latency */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Latency — {destLabel}
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
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={() => ''}
                formatter={(value: number) => [`${value} ms`, 'Latency']}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Jitter */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Jitter — {destLabel}
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
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={() => ''}
                formatter={(value: number) => [`${value} ms`, 'Jitter']}
              />
              <Line
                type="monotone"
                dataKey="jitter"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Packet Loss */}
        <div className="flex-1 glass-card p-3" style={{ height: 160 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1 px-1">
            Packet Loss — {destLabel}
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={lossData}>
              <defs>
                <linearGradient id="loss-dest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
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
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={() => ''}
                formatter={(value: number) => [`${value}%`, 'Loss']}
              />
              <Area
                type="monotone"
                dataKey="loss"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#loss-dest)"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
