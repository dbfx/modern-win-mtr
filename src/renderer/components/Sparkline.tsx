import React from 'react';

interface SparklineProps {
  data: (number | null)[];
  width?: number;
  height?: number;
  color?: string;
}

const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#06b6d4',
}: SparklineProps) {
  const validData = data.filter((v): v is number => v !== null);
  if (validData.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} strokeDasharray="2 4" />
      </svg>
    );
  }

  const padding = 2;
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;

  const points: string[] = [];
  const areaPoints: string[] = [];
  let lastValidIdx = -1;

  data.forEach((v, i) => {
    if (v === null) return;
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    points.push(`${x},${y}`);
    areaPoints.push(`${x},${y}`);
    lastValidIdx = i;
  });

  if (areaPoints.length === 0) return null;

  // Close the area path
  const firstX = padding + (data.findIndex((v) => v !== null)! / (data.length - 1)) * (width - padding * 2);
  const lastX = padding + (lastValidIdx / (data.length - 1)) * (width - padding * 2);
  const areaPath = `M${areaPoints[0]} ${areaPoints.slice(1).map((p) => `L${p}`).join(' ')} L${lastX},${height} L${firstX},${height} Z`;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${color.replace('#', '')})`} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export default Sparkline;
