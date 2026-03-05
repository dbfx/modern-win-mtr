import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { PRESET_TARGETS } from '../../shared/presets';
import type { PresetTarget } from '../../shared/types';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';

interface MapViewProps {
  onSelectTarget: (hostname: string) => void;
}

const REGION_GROUPS: { label: string; prefix: string }[] = [
  { label: 'Americas', prefix: 'aws-us-' },
  { label: 'Americas', prefix: 'aws-ca-' },
  { label: 'Americas', prefix: 'aws-sa-' },
  { label: 'Europe', prefix: 'aws-eu-' },
  { label: 'Middle East', prefix: 'aws-me-' },
  { label: 'Asia Pacific', prefix: 'aws-ap-' },
  { label: 'Africa', prefix: 'aws-af-' },
];

function groupTargets(): { label: string; targets: PresetTarget[] }[] {
  const groups: { label: string; targets: PresetTarget[] }[] = [];
  const seen = new Set<string>();

  for (const rg of REGION_GROUPS) {
    const matching = PRESET_TARGETS.filter(
      (t) => t.id.startsWith(rg.prefix) && !seen.has(t.id)
    );
    matching.forEach((t) => seen.add(t.id));
    if (matching.length === 0) continue;

    const existing = groups.find((g) => g.label === rg.label);
    if (existing) {
      existing.targets.push(...matching);
    } else {
      groups.push({ label: rg.label, targets: [...matching] });
    }
  }

  return groups;
}

const TARGET_GROUPS = groupTargets();

export default function MapView({ onSelectTarget }: MapViewProps) {
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold gradient-accent-text">Global Targets</h2>
        <p className="text-xs text-white/20 mt-1">Click a location to start tracing</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Map */}
        <div className="flex-1 glass-card p-4 relative overflow-hidden">
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{
              scale: 140,
              center: [10, 5],
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Graticule-like grid */}
            {[-120, -60, 0, 60, 120].map((lng) => (
              <Line
                key={`lng-${lng}`}
                from={[lng, -80]}
                to={[lng, 80]}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.4}
              />
            ))}
            {[-60, -30, 0, 30, 60].map((lat) => (
              <Line
                key={`lat-${lat}`}
                from={[-170, lat]}
                to={[170, lat]}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.4}
              />
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
                      hover: { outline: 'none', fill: 'rgba(255,255,255,0.08)' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Target markers */}
            {PRESET_TARGETS.map((target) => {
              const isHovered = hoveredTarget === target.id;
              return (
                <Marker
                  key={target.id}
                  coordinates={target.coordinates}
                  onClick={() => onSelectTarget(target.hostname)}
                  onMouseEnter={() => setHoveredTarget(target.id)}
                  onMouseLeave={() => setHoveredTarget(null)}
                  className="cursor-pointer"
                >
                  {/* Pulse ring */}
                  <circle
                    r={isHovered ? 12 : 8}
                    fill={target.color}
                    opacity={0.15}
                    className="transition-all duration-300"
                  >
                    <animate
                      attributeName="r"
                      values={isHovered ? '12;20;12' : '8;14;8'}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.15;0.03;0.15"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Core dot */}
                  <circle
                    r={isHovered ? 5 : 3.5}
                    fill={target.color}
                    className="transition-all duration-300"
                  />
                  {/* Label */}
                  {isHovered && (
                    <text
                      y={-14}
                      textAnchor="middle"
                      fill="white"
                      fontSize={11}
                      fontFamily="Inter, system-ui"
                      fontWeight={500}
                    >
                      {target.name}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ComposableMap>
        </div>

        {/* Target list - scrollable */}
        <div className="w-56 flex-shrink-0 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
          {TARGET_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25 px-1 mb-1.5">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.targets.map((target, i) => (
                  <TargetCard
                    key={target.id}
                    target={target}
                    index={i}
                    isHovered={hoveredTarget === target.id}
                    onClick={() => onSelectTarget(target.hostname)}
                    onHover={(h) => setHoveredTarget(h ? target.id : null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TargetCard({
  target,
  index,
  isHovered,
  onClick,
  onHover,
}: {
  target: PresetTarget;
  index: number;
  isHovered: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card-hover p-2.5 text-left w-full ${
        isHovered ? 'bg-white/[0.07] border-white/[0.14]' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: target.color }}
        />
        <div className="min-w-0">
          <div className="text-xs font-medium text-white/80">{target.name}</div>
          <div className="text-[9px] text-white/20 font-mono truncate">
            {target.region}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
