import React from 'react';
import { motion } from 'framer-motion';
import type { HopData } from '../../shared/types';
import Sparkline from './Sparkline';

interface HopRowProps {
  hop: HopData;
  index: number;
  selected: boolean;
  onClick: () => void;
}

function getLatencyColor(ms: number | null): string {
  if (ms === null) return 'text-white/20';
  if (ms < 30) return 'text-emerald-400';
  if (ms < 80) return 'text-yellow-400';
  if (ms < 150) return 'text-orange-400';
  return 'text-red-400';
}

function getLossColor(percent: number): string {
  if (percent === 0) return 'text-emerald-400';
  if (percent < 5) return 'text-yellow-400';
  if (percent < 20) return 'text-orange-400';
  return 'text-red-400';
}

function formatMs(ms: number | null): string {
  if (ms === null) return '*';
  if (ms === 0) return '<1';
  return String(ms);
}

const HopRow = React.memo(function HopRow({ hop, index, selected, onClick }: HopRowProps) {
  const isTimeout = !hop.ip || hop.ip === '???';
  const displayHost = isTimeout
    ? '???'
    : hop.hostname !== hop.ip
    ? `${hop.hostname} (${hop.ip})`
    : hop.ip;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`group cursor-pointer text-xs font-mono transition-colors ${
        selected
          ? 'bg-cyan-500/[0.08] border-l-2 border-l-cyan-400'
          : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
      }`}
      onClick={onClick}
    >
      <td className="py-2 px-3 text-white/30 text-right w-8">{hop.hopNumber}</td>
      <td className="py-2 px-3 text-white/80 max-w-[240px] truncate" title={displayHost}>
        {isTimeout ? <span className="text-white/20">???</span> : displayHost}
      </td>
      <td className="py-2 px-3 text-white/30 max-w-[140px] truncate text-left" title={hop.geo || ''}>
        {hop.geo || <span className="text-white/10">—</span>}
      </td>
      <td className={`py-2 px-3 text-right ${getLossColor(hop.lossPercent)}`}>
        {hop.lossPercent.toFixed(1)}%
      </td>
      <td className="py-2 px-3 text-right text-white/30">{hop.sent}</td>
      <td className="py-2 px-3 text-right text-white/30">{hop.received}</td>
      <td className={`py-2 px-3 text-right ${getLatencyColor(hop.last)}`}>
        {formatMs(hop.last)}
      </td>
      <td className={`py-2 px-3 text-right ${getLatencyColor(hop.avg)}`}>
        {hop.avg.toFixed(1)}
      </td>
      <td className={`py-2 px-3 text-right ${getLatencyColor(hop.best)}`}>
        {formatMs(hop.best)}
      </td>
      <td className={`py-2 px-3 text-right ${getLatencyColor(hop.worst)}`}>
        {formatMs(hop.worst)}
      </td>
      <td className="py-2 px-3 text-right text-white/40">
        {hop.jitter.toFixed(1)}
      </td>
      <td className="py-2 px-3">
        <Sparkline data={hop.history.slice(-40)} />
      </td>
    </motion.tr>
  );
});

export default HopRow;
