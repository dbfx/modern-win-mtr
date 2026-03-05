import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HopData } from '../../shared/types';

interface LatencyChartProps {
  hop: HopData;
}

export default function LatencyChart({ hop }: LatencyChartProps) {
  const data = hop.history.slice(-60).map((v, i) => ({
    idx: i,
    rtt: v,
  }));

  return (
    <div className="h-full">
      <div className="text-[10px] uppercase tracking-wider text-white/20 mb-2 px-1">
        Latency (ms)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="idx" hide />
          <YAxis
            width={35}
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10,10,15,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#e5e7eb',
            }}
            formatter={(value: number | null) => [value !== null ? `${value}ms` : 'timeout', 'RTT']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="rtt"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#latencyGrad)"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
