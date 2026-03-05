import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { PRESET_TARGETS } from '../../shared/presets';
import type { HopData, PresetTarget } from '../../shared/types';
import type { SessionStatus } from '../hooks/useMtrSession';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';

interface VisualTraceViewProps {
  hops: HopData[];
  status: SessionStatus;
  target: string;
  resolvedIp: string;
  error: string | null;
  onStart: (target: string, interval: number) => void;
  onStop: () => void;
}

interface GeoHop {
  hopNumber: number;
  ip: string;
  hostname: string;
  geo: string;
  coordinates: [number, number]; // [lon, lat]
  lossPercent: number;
  avg: number;
  jitter: number;
}

function getHopColor(lossPercent: number): string {
  if (lossPercent === 0) return '#10b981';
  if (lossPercent < 5) return '#facc15';
  if (lossPercent < 20) return '#fb923c';
  return '#ef4444';
}

function getLineColor(lossPercent: number): string {
  if (lossPercent === 0) return 'rgba(6,182,212,0.6)';
  if (lossPercent < 5) return 'rgba(250,204,21,0.5)';
  if (lossPercent < 20) return 'rgba(251,146,60,0.5)';
  return 'rgba(239,68,68,0.5)';
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
    const matching = PRESET_TARGETS.filter((t) => t.id.startsWith(rg.prefix) && !seen.has(t.id));
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

export default function VisualTraceView({
  hops,
  status,
  target,
  resolvedIp,
  error,
  onStart,
  onStop,
}: VisualTraceViewProps) {
  const [inputTarget, setInputTarget] = useState('');
  const [hoveredHop, setHoveredHop] = useState<number | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  // Filter hops: skip ??? and LAN, keep only geo-located public IPs
  const geoHops: GeoHop[] = useMemo(() => {
    return hops
      .filter((h) => h.geoLat !== null && h.geoLon !== null && h.ip !== '???' && h.geo !== 'LAN')
      .map((h) => ({
        hopNumber: h.hopNumber,
        ip: h.ip,
        hostname: h.hostname,
        geo: h.geo,
        coordinates: [h.geoLon!, h.geoLat!] as [number, number],
        lossPercent: h.lossPercent,
        avg: h.avg,
        jitter: h.jitter,
      }));
  }, [hops]);

  // Build line segments between consecutive geo hops
  const segments = useMemo(() => {
    const segs: { from: [number, number]; to: [number, number]; lossPercent: number }[] = [];
    for (let i = 0; i < geoHops.length - 1; i++) {
      segs.push({
        from: geoHops[i].coordinates,
        to: geoHops[i + 1].coordinates,
        lossPercent: geoHops[i + 1].lossPercent,
      });
    }
    return segs;
  }, [geoHops]);

  // Compute map center and scale based on hop positions
  const { center, scale } = useMemo(() => {
    if (geoHops.length === 0) return { center: [10, 20] as [number, number], scale: 140 };

    const lons = geoHops.map((h) => h.coordinates[0]);
    const lats = geoHops.map((h) => h.coordinates[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const cLon = (minLon + maxLon) / 2;
    const cLat = (minLat + maxLat) / 2;

    const lonSpan = Math.max(maxLon - minLon, 20);
    const latSpan = Math.max(maxLat - minLat, 15);
    const span = Math.max(lonSpan, latSpan);

    const s = Math.max(80, Math.min(400, 6000 / span));

    return { center: [cLon, cLat] as [number, number], scale: s };
  }, [geoHops]);

  const isRunning = status === 'running' || status === 'discovering';
  const isIdle = status === 'idle' && hops.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTarget.trim()) {
      onStart(inputTarget.trim(), 1000);
    }
  };

  const handlePresetClick = (hostname: string) => {
    setInputTarget(hostname);
    onStart(hostname, 1000);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-4 mb-2">
        <div>
          <h2 className="text-lg font-semibold gradient-accent-text">Visual Traceroute</h2>
          <p className="text-xs text-white/20 mt-0.5">
            {isIdle ? 'Pick a target or enter a hostname to visualize the route' : 'Watch your packets travel across the globe'}
          </p>
        </div>
        <div className="flex-1" />

        {/* Status info inline */}
        {status === 'discovering' && (
          <div className="flex items-center gap-2 text-xs mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400/80">Discovering route...</span>
          </div>
        )}
        {status === 'running' && (
          <div className="flex items-center gap-2 text-xs mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/40">
              <span className="text-white/60 font-mono">{target}</span>
              {' — '}
              <span className="text-cyan-400">{geoHops.length}</span> hops
            </span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-red-400/80">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputTarget}
            onChange={(e) => setInputTarget(e.target.value)}
            placeholder="hostname or IP..."
            disabled={isRunning}
            className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/80 placeholder-white/20 w-56 focus:outline-none focus:border-cyan-500/40 disabled:opacity-50"
          />
          <button
            type={isRunning ? 'button' : 'submit'}
            onClick={isRunning ? onStop : undefined}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {isRunning ? 'Stop' : 'Trace'}
          </button>
        </form>
      </div>

      {/* Full-width map */}
      <div className="flex-1 glass-card p-0 relative overflow-hidden min-h-0">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: isIdle ? 140 : scale, center: isIdle ? [10, 20] : center }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Grid lines */}
          {[-120, -60, 0, 60, 120].map((lng) => (
            <Line key={`g-lng-${lng}`} from={[lng, -80]} to={[lng, 80]} stroke="rgba(255,255,255,0.04)" strokeWidth={0.4} />
          ))}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <Line key={`g-lat-${lat}`} from={[-170, lat]} to={[170, lat]} stroke="rgba(255,255,255,0.04)" strokeWidth={0.4} />
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

          {/* Idle state: show preset target markers */}
          {isIdle && PRESET_TARGETS.map((pt) => {
            const isHovered = hoveredPreset === pt.id;
            return (
              <Marker
                key={pt.id}
                coordinates={pt.coordinates}
                onClick={() => handlePresetClick(pt.hostname)}
                onMouseEnter={() => setHoveredPreset(pt.id)}
                onMouseLeave={() => setHoveredPreset(null)}
                className="cursor-pointer"
              >
                <circle r={isHovered ? 10 : 6} fill={pt.color} opacity={0.15}>
                  <animate attributeName="r" values={isHovered ? '10;18;10' : '6;12;6'} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r={isHovered ? 4.5 : 3} fill={pt.color} className="transition-all duration-300" />
                {isHovered && (
                  <text y={-12} textAnchor="middle" fill="white" fontSize={11} fontFamily="Inter, system-ui" fontWeight={500}>
                    {pt.name}
                  </text>
                )}
              </Marker>
            );
          })}

          {/* Route lines */}
          {segments.map((seg, i) => (
            <Line
              key={`seg-${i}`}
              from={seg.from}
              to={seg.to}
              stroke={getLineColor(seg.lossPercent)}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}

          {/* Animated dashes on route lines */}
          {isRunning && segments.map((seg, i) => (
            <Line
              key={`seg-anim-${i}`}
              from={seg.from}
              to={seg.to}
              stroke="rgba(6,182,212,0.8)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="4 8"
            />
          ))}

          {/* Hop markers — no labels, only tooltip on hover */}
          {geoHops.map((hop, i) => {
            const isFirst = i === 0;
            const isLast = i === geoHops.length - 1;
            const isHovered = hoveredHop === hop.hopNumber;
            const markerColor = getHopColor(hop.lossPercent);
            const radius = isFirst || isLast ? 6 : isHovered ? 5 : 3.5;

            return (
              <Marker
                key={hop.hopNumber}
                coordinates={hop.coordinates}
                onMouseEnter={() => setHoveredHop(hop.hopNumber)}
                onMouseLeave={() => setHoveredHop(null)}
              >
                {/* Pulse ring for first/last */}
                {(isFirst || isLast) && (
                  <circle r={12} fill={markerColor} opacity={0.15}>
                    <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Core dot */}
                <circle
                  r={radius}
                  fill={markerColor}
                  className="transition-all duration-200"
                />

                {/* Tooltip on hover */}
                {isHovered && (
                  <>
                    <rect
                      x={10}
                      y={-30}
                      width={Math.max(160, hop.geo.length * 7 + 20)}
                      height={52}
                      rx={6}
                      fill="rgba(10,10,15,0.92)"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={0.5}
                    />
                    <text x={18} y={-14} fill="white" fontSize={11} fontFamily="Inter, system-ui" fontWeight={600}>
                      Hop {hop.hopNumber} — {hop.geo}
                    </text>
                    <text x={18} y={0} fill="rgba(255,255,255,0.5)" fontSize={10} fontFamily="JetBrains Mono, monospace">
                      {hop.ip}
                    </text>
                    <text x={18} y={14} fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="JetBrains Mono, monospace">
                      {hop.avg > 0 ? `${hop.avg}ms` : '—'} avg · {hop.lossPercent}% loss
                    </text>
                  </>
                )}
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Discovering overlay */}
        {status === 'discovering' && geoHops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <div className="text-white/30 text-sm">Discovering route...</div>
            </div>
          </div>
        )}

        {/* Idle: target list overlay in bottom-right */}
        {isIdle && (
          <div className="absolute bottom-4 right-4 w-52 max-h-[60%] overflow-y-auto custom-scrollbar bg-[rgba(10,10,15,0.85)] backdrop-blur-md rounded-xl border border-white/[0.08] p-3 flex flex-col gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-0.5">
              Quick Targets
            </div>
            {TARGET_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-white/15 mb-1">
                  {group.label}
                </div>
                {group.targets.map((pt) => (
                  <button
                    key={pt.id}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      hoveredPreset === pt.id
                        ? 'bg-white/[0.08] text-white/90'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                    onClick={() => handlePresetClick(pt.hostname)}
                    onMouseEnter={() => setHoveredPreset(pt.id)}
                    onMouseLeave={() => setHoveredPreset(null)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pt.color }} />
                    {pt.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
