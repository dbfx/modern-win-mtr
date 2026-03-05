import React from 'react';
import type { HopData } from '../../shared/types';
import HopRow from './HopRow';

interface HopTableProps {
  hops: HopData[];
  selectedHop: number | null;
  onSelectHop: (hopNumber: number | null) => void;
}

const COLUMNS = ['#', 'Host', 'Location', 'Loss%', 'Sent', 'Recv', 'Last', 'Avg', 'Best', 'Worst', 'Jitter', 'Trend'];

export default function HopTable({ hops, selectedHop, onSelectHop }: HopTableProps) {
  // Filter out ??? (unknown) hops
  const visibleHops = hops.filter((h) => h.ip && h.ip !== '???');

  if (hops.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/10 text-sm">
        Enter a target to begin tracing
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-white/20 border-b border-white/[0.06]">
            {COLUMNS.map((col) => (
              <th
                key={col}
                className={`py-2 px-3 font-medium ${
                  col === 'Host' || col === 'Location' ? 'text-left' : 'text-right'
                } ${col === 'Trend' ? 'text-left' : ''}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleHops.map((hop, i) => (
            <HopRow
              key={hop.hopNumber}
              hop={hop}
              index={i}
              selected={selectedHop === hop.hopNumber}
              onClick={() =>
                onSelectHop(selectedHop === hop.hopNumber ? null : hop.hopNumber)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
