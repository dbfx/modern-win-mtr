import React, { useMemo } from 'react';
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

interface JitterChartProps {
  hop: HopData;
}

export default function JitterChart({ hop }: JitterChartProps) {
  const data = useMemo(() => {
    const history = hop.history.slice(-60);
    return history.map((v, i) => {
      if (i === 0 || v === null || history[i - 1] === null) {
        return { idx: i, jitter: null };
      }
      return { idx: i, jitter: Math.abs(v - (history[i - 1] as number)) };
    });
  }, [hop.history]);

  return (
    <div className="h-full">
      <div className="text-[10px] uppercase tracking-wider text-white/20 mb-2 px-1">
        Jitter (ms)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="jitterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
            formatter={(value: number | null) => [value !== null ? `${value.toFixed(1)}ms` : '-', 'Jitter']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="jitter"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#jitterGrad)"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
