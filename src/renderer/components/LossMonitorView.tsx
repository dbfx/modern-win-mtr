import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import type { TargetStats } from '../hooks/useLossMonitor';
import Sparkline from './Sparkline';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';

interface LossMonitorViewProps {
  targets: TargetStats[];
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

function getLossColor(percent: number): string {
  if (percent === 0) return 'text-emerald-400';
  if (percent < 5) return 'text-yellow-400';
  if (percent < 20) return 'text-orange-400';
  return 'text-red-400';
}

function getLossMarkerColor(percent: number): string {
  if (percent === 0) return '#10b981';
  if (percent < 5) return '#facc15';
  if (percent < 20) return '#fb923c';
  return '#ef4444';
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10,10,15,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e5e7eb',
};

export default function LossMonitorView({ targets, isRunning, onStart, onStop }: LossMonitorViewProps) {
  const chartData = useMemo(() => {
    if (targets.length === 0) return [];

    const maxLen = Math.max(...targets.map((t) => t.lossHistory.length));
    const sampleCount = Math.min(maxLen, 120);
    const data: Record<string, number>[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const row: Record<string, number> = { idx: i };
      for (const t of targets) {
        const offset = Math.max(0, t.lossHistory.length - sampleCount);
        row[t.id] = t.lossHistory[offset + i] ?? 0;
      }
      data.push(row);
    }
    return data;
  }, [targets]);

  const targetMap = useMemo(() => {
    const m = new Map<string, TargetStats>();
    for (const t of targets) m.set(t.id, t);
    return m;
  }, [targets]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Packet Loss Monitor
          </h2>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={isRunning ? onStop : onStart}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isRunning
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Full-width map */}
      <div className="flex-1 min-h-0 px-4 pb-3">
        <div className="glass-card p-3 h-full relative overflow-hidden">
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 220, center: [20, 15] }}
            style={{ width: '100%', height: '100%' }}
          >
            {[-120, -60, 0, 60, 120].map((lng) => (
              <Line key={`lng-${lng}`} from={[lng, -80]} to={[lng, 80]} stroke="rgba(255,255,255,0.04)" strokeWidth={0.4} />
            ))}
            {[-60, -30, 0, 30, 60].map((lat) => (
              <Line key={`lat-${lat}`} from={[-170, lat]} to={[170, lat]} stroke="rgba(255,255,255,0.04)" strokeWidth={0.4} />
            ))}

            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(255,255,255,0.06)"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {targets.map((t) => (
              <Marker key={t.id} coordinates={t.coordinates}>
                <circle r={14} fill={getLossMarkerColor(t.lossPercent)} opacity={0.15}>
                  <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r={6} fill={getLossMarkerColor(t.lossPercent)} />
                <text y={-18} textAnchor="middle" fill="white" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  {t.lossPercent.toFixed(1)}%
                </text>
                <text y={22} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={12} fontFamily="Inter, system-ui" fontWeight={500}>
                  {t.name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </div>

      {/* Full-width packet loss chart */}
      <div className="flex-shrink-0 px-4 pb-3" style={{ height: 160 }}>
        <div className="glass-card p-3 h-full">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="text-[10px] uppercase tracking-wider text-white/20">
              Packet Loss Over Time
            </div>
            <div className="flex gap-3">
              {targets.map((t) => (
                <div key={t.id} className="flex items-center gap-1 text-[10px] text-white/30">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </div>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={chartData}>
                <defs>
                  {targets.map((t) => (
                    <linearGradient key={t.id} id={`loss-fill-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={t.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="idx" hide />
                <YAxis
                  width={40}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={() => ''}
                  formatter={(value: number, name: string) => {
                    const t = targetMap.get(name);
                    return [`${value}%`, t?.name || name];
                  }}
                />
                {targets.map((t) => (
                  <Area
                    key={t.id}
                    type="monotone"
                    dataKey={t.id}
                    stroke={t.color}
                    strokeWidth={2}
                    fill={`url(#loss-fill-${t.id})`}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[85%] flex items-center justify-center text-white/10 text-sm">
              {isRunning ? 'Waiting for data...' : 'Press Start to begin monitoring'}
            </div>
          )}
        </div>
      </div>

      {/* Location cards row */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="grid grid-cols-6 gap-2">
          {targets.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="glass-card p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-medium text-white/80 truncate">{t.name}</span>
              </div>

              <div className={`text-xl font-bold ${getLossColor(t.lossPercent)}`}>
                {t.lossPercent.toFixed(1)}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/20 mb-2">Loss</div>

              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-white/20">Lat</span>
                <span className="text-white/50 font-mono">{t.lastRtt !== null ? `${t.lastRtt}ms` : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-white/20">Avg</span>
                <span className="text-white/50 font-mono">{t.avgRtt > 0 ? `${t.avgRtt}ms` : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/20">
                <span>{t.sent} sent</span>
                <span className={t.lost > 0 ? 'text-red-400' : ''}>{t.lost} lost</span>
              </div>
            </motion.div>
          ))}
        </div>

        {targets.length === 0 && !isRunning && (
          <div className="flex items-center justify-center text-white/10 text-sm py-8">
            Press Start to begin monitoring packet loss worldwide
          </div>
        )}
      </div>
    </div>
  );
}
