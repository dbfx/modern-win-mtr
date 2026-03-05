import { useState, useEffect, useCallback, useRef } from 'react';
import type { LossMonitorState } from '../../shared/types';
import { LOSS_MONITOR_TARGETS } from '../../shared/presets';

export interface TargetStats {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number];
  sent: number;
  lost: number;
  lossPercent: number;
  lastRtt: number | null;
  avgRtt: number;
  history: (number | null)[];
  lossHistory: number[];
}

const HISTORY_SIZE = 200;

export interface UseLossMonitorReturn {
  targets: TargetStats[];
  isRunning: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function useLossMonitor(): UseLossMonitorReturn {
  const [isRunning, setIsRunning] = useState(false);
  const statsRef = useRef<Map<string, TargetStats>>(new Map());
  const [targets, setTargets] = useState<TargetStats[]>([]);

  // Initialize stats for all targets
  useEffect(() => {
    for (const t of LOSS_MONITOR_TARGETS) {
      if (!statsRef.current.has(t.id)) {
        statsRef.current.set(t.id, {
          id: t.id,
          name: t.name,
          color: t.color,
          coordinates: t.coordinates,
          sent: 0,
          lost: 0,
          lossPercent: 0,
          lastRtt: null,
          avgRtt: 0,
          history: [],
          lossHistory: [],
        });
      }
    }
  }, []);

  useEffect(() => {
    const unsub = window.mtrApi.onLossData((state: LossMonitorState) => {
      for (const sample of state.samples) {
        const stats = statsRef.current.get(sample.targetId);
        if (!stats) continue;

        stats.sent++;
        stats.lastRtt = sample.rtt;

        if (sample.rtt === null) {
          stats.lost++;
        }

        // Update history
        stats.history.push(sample.rtt);
        if (stats.history.length > HISTORY_SIZE) stats.history.shift();

        // Compute loss %
        stats.lossPercent = stats.sent > 0
          ? Math.round(((stats.lost) / stats.sent) * 1000) / 10
          : 0;

        // Compute average RTT (from non-null values)
        const validRtts = stats.history.filter((v): v is number => v !== null);
        stats.avgRtt = validRtts.length > 0
          ? Math.round((validRtts.reduce((a, b) => a + b, 0) / validRtts.length) * 10) / 10
          : 0;

        // Rolling loss history (loss % computed over last 10 samples window)
        const windowSize = 10;
        const recentWindow = stats.history.slice(-windowSize);
        const recentLoss = recentWindow.filter((v) => v === null).length;
        const rollingLoss = Math.round((recentLoss / recentWindow.length) * 100 * 10) / 10;
        stats.lossHistory.push(rollingLoss);
        if (stats.lossHistory.length > HISTORY_SIZE) stats.lossHistory.shift();
      }

      // Snapshot to trigger re-render
      setTargets(
        LOSS_MONITOR_TARGETS.map((t) => ({ ...statsRef.current.get(t.id)! })),
      );
    });

    return unsub;
  }, []);

  const start = useCallback(async () => {
    // Reset stats
    for (const t of LOSS_MONITOR_TARGETS) {
      statsRef.current.set(t.id, {
        id: t.id,
        name: t.name,
        color: t.color,
        coordinates: t.coordinates,
        sent: 0,
        lost: 0,
        lossPercent: 0,
        lastRtt: null,
        avgRtt: 0,
        history: [],
        lossHistory: [],
      });
    }
    setTargets([]);
    setIsRunning(true);
    await window.mtrApi.startLossMonitor();
  }, []);

  const stop = useCallback(async () => {
    setIsRunning(false);
    await window.mtrApi.stopLossMonitor();
  }, []);

  return { targets, isRunning, start, stop };
}
