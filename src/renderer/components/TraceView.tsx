import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HopData } from '../../shared/types';
import type { SessionStatus } from '../hooks/useMtrSession';
import TargetInput from './TargetInput';
import HopTable from './HopTable';
import LatencyChart from './LatencyChart';
import JitterChart from './JitterChart';
import PacketLossChart from './PacketLossChart';
import OverviewCharts from './OverviewCharts';

interface TraceViewProps {
  hops: HopData[];
  status: SessionStatus;
  target: string;
  resolvedIp: string;
  error: string | null;
  onStart: (target: string, interval: number) => void;
  onStop: () => void;
}

export default function TraceView({
  hops,
  status,
  target,
  resolvedIp,
  error,
  onStart,
  onStop,
}: TraceViewProps) {
  const [selectedHop, setSelectedHop] = useState<number | null>(null);

  const selectedHopData = useMemo(
    () => hops.find((h) => h.hopNumber === selectedHop) ?? null,
    [hops, selectedHop],
  );

  return (
    <div className="h-full flex flex-col">
      <TargetInput status={status} onStart={onStart} onStop={onStop} />

      {/* Status bar */}
      {(target || error) && (
        <div className="px-4 pb-2 flex items-center gap-3 text-xs">
          {target && (
            <span className="text-white/20">
              Target: <span className="text-white/40 font-mono">{target}</span>
              {resolvedIp && (
                <span className="text-white/20"> ({resolvedIp})</span>
              )}
            </span>
          )}
          {status === 'discovering' && (
            <span className="text-blue-400 animate-pulse">Discovering hops...</span>
          )}
          {status === 'running' && (
            <span className="text-emerald-400">{hops.length} hops</span>
          )}
          {error && (
            <span className="text-red-400">{error}</span>
          )}
        </div>
      )}

      {/* Overview charts — always visible when we have data */}
      {hops.length > 0 && <OverviewCharts hops={hops} />}

      {/* Hop table */}
      <HopTable hops={hops} selectedHop={selectedHop} onSelectHop={setSelectedHop} />

      {/* Charts panel */}
      <AnimatePresence>
        {selectedHopData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-shrink-0 border-t border-white/[0.06] overflow-hidden"
          >
            <div className="h-full p-4 flex gap-4">
              <div className="flex-1 glass-card p-3">
                <LatencyChart hop={selectedHopData} />
              </div>
              <div className="flex-1 glass-card p-3">
                <JitterChart hop={selectedHopData} />
              </div>
              <div className="flex-1 glass-card p-3">
                <PacketLossChart hop={selectedHopData} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
