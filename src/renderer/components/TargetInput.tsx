import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { SessionStatus } from '../hooks/useMtrSession';

interface TargetInputProps {
  status: SessionStatus;
  onStart: (target: string, interval: number) => void;
  onStop: () => void;
}

const INTERVALS = [
  { label: '500ms', value: 500 },
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
];

export default function TargetInput({ status, onStart, onStop }: TargetInputProps) {
  const [target, setTarget] = useState('');
  const [interval, setInterval] = useState(1000);
  const isActive = status === 'discovering' || status === 'running';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    if (isActive) {
      onStop();
    } else {
      onStart(target.trim(), interval);
    }
  };

  const statusDotClass = `status-dot status-dot-${status}`;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4">
      <div className="flex items-center gap-3 flex-1 glass-card px-4 py-2.5">
        <div className={statusDotClass} />

        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Enter hostname or IP address..."
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-white/20 outline-none font-mono"
          disabled={isActive}
        />

        <select
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="bg-transparent text-xs text-white/40 outline-none cursor-pointer border-l border-white/10 pl-3"
          disabled={isActive}
        >
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value} className="bg-surface-100 text-gray-100">
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <motion.button
        type="submit"
        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            : 'gradient-accent text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
        }`}
        whileTap={{ scale: 0.95 }}
        disabled={!target.trim() && !isActive}
      >
        {isActive ? 'Stop' : 'Trace'}
      </motion.button>
    </form>
  );
}
