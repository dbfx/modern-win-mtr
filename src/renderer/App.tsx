import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import TraceView from './components/TraceView';
import MapView from './components/MapView';
import LossMonitorView from './components/LossMonitorView';
import { useMtrSession } from './hooks/useMtrSession';
import { useLossMonitor } from './hooks/useLossMonitor';

export default function App() {
  const [activeView, setActiveView] = useState<'trace' | 'map' | 'loss'>('trace');
  const { hops, status, target, resolvedIp, error, start, stop } = useMtrSession();
  const lossMonitor = useLossMonitor();

  const handleStart = useCallback(
    (t: string, interval: number) => {
      start(t, interval);
    },
    [start],
  );

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleMapSelect = useCallback(
    (hostname: string) => {
      setActiveView('trace');
      // Small delay to let the view transition happen
      setTimeout(() => {
        start(hostname, 1000);
      }, 100);
    },
    [start],
  );

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      <AnimatePresence mode="wait">
        {activeView === 'trace' && (
          <motion.div
            key="trace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <TraceView
              hops={hops}
              status={status}
              target={target}
              resolvedIp={resolvedIp}
              error={error}
              onStart={handleStart}
              onStop={handleStop}
            />
          </motion.div>
        )}
        {activeView === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <MapView onSelectTarget={handleMapSelect} />
          </motion.div>
        )}
        {activeView === 'loss' && (
          <motion.div
            key="loss"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <LossMonitorView
              targets={lossMonitor.targets}
              isRunning={lossMonitor.isRunning}
              onStart={lossMonitor.start}
              onStop={lossMonitor.stop}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
