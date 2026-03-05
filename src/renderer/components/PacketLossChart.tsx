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

interface PacketLossChartProps {
  hop: HopData;
}

export default function PacketLossChart({ hop }: PacketLossChartProps) {
  const data = useMemo(() => {
    const history = hop.history.slice(-60);
    const windowSize = 10;
    return history.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const window = history.slice(start, i + 1);
      const total = window.length;
      const lost = window.filter((v) => v === null).length;
      return { idx: i, loss: (lost / total) * 100 };
    });
  }, [hop.history]);

  return (
    <div className="h-full">
      <div className="text-[10px] uppercase tracking-wider text-white/20 mb-2 px-1">
        Packet Loss (%)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="idx" hide />
          <YAxis
            width={35}
            domain={[0, 100]}
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
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Loss']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="loss"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#lossGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
