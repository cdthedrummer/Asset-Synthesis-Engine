import React from 'react';

type SeriesPoint = { x: string; y: number; projected?: boolean };

export function trajectoryGeometry(series: SeriesPoint[], width: number, height: number) {
  const padTop = 12;
  const padBottom = 8;
  const ys = series.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const points = series.map((p, i) => ({
    x: series.length > 1 ? (i / (series.length - 1)) * width : width / 2,
    y: height - padBottom - ((p.y - min) / span) * (height - padTop - padBottom),
    projected: !!p.projected,
  }));
  const lastSolidIdx = points.reduce((acc, p, i) => (!p.projected ? i : acc), 0);
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const solid = points.slice(0, lastSolidIdx + 1);
  const dashed = points.slice(lastSolidIdx);
  const fill = `${toPath(points)} L ${width},${height} L 0,${height} Z`;
  return { points, solidPath: toPath(solid), dashedPath: toPath(dashed), fillPath: fill, lastSolidIdx };
}

export const TrajectoryChart = ({ series, width = 350, height = 100, fillId }: { series: SeriesPoint[]; width?: number; height?: number; fillId: string }) => {
  if (!series || series.length < 2) return null;
  const geo = trajectoryGeometry(series, width, height);
  // Dots: solid/dashed junction, a few projected midpoints, and the endpoint.
  const last = geo.points.length - 1;
  const dotIdxs = new Set<number>([geo.lastSolidIdx, last]);
  for (let i = geo.lastSolidIdx + 1; i < last; i++) {
    if ((i - geo.lastSolidIdx) % 2 === 0) dotIdxs.add(i);
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        {/* The fill opacity is baked into the token, not set here. Moss is ~3.6x
            darker than the emerald it replaced, so the old 0.15 rendered as a
            grey-green smear rather than a tint. */}
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-fill-top)" />
          <stop offset="100%" stopColor="var(--chart-fill-bottom)" />
        </linearGradient>
      </defs>
      <path d={geo.fillPath} fill={`url(#${fillId})`} />
      <path d={geo.solidPath} stroke="var(--moss)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={geo.dashedPath} stroke="var(--moss)" strokeWidth="2.5" strokeDasharray="5,5" fill="none" strokeLinecap="round" />
      {[...dotIdxs].sort((a, b) => a - b).map((i) => {
        const p = geo.points[i];
        return i === last ? (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--moss)" />
        ) : (
          // Not hardcoded white: the expanded view grounds this chart on paper,
          // where a white dot would halo.
          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="var(--surface)" stroke="var(--moss)" strokeWidth="2.5" />
        );
      })}
    </svg>
  );
};
