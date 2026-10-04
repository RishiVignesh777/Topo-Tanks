import React from 'react';
import { Arena, LatLng, calculateArenaBoundaries } from '../types/game';

interface SatelliteMiniMapProps {
  arena: Arena;
  p1Coords?: LatLng;
  p2Coords?: LatLng;
  p1Health: number;
  p2Health: number;
}

/**
 * Tactical Reconnaissance Satellite MiniMap
 * Renders a high-tech orbital radar recon screen showing combatant positions,
 * real-time battery status, topographic contour rings, and ballistic engagement vector.
 */
export const SatelliteMiniMap: React.FC<SatelliteMiniMapProps> = ({
  arena,
  p1Coords = arena.p1Coords,
  p2Coords = arena.p2Coords,
  p1Health,
  p2Health,
}) => {
  const boundaries = calculateArenaBoundaries(p1Coords, p2Coords, 0.16);

  // Compute coordinate projections relative to the arena bounding box
  const bounds = arena.bounds;
  const latSpan = Math.max(0.001, bounds.north - bounds.south);
  const lngSpan = Math.max(0.001, bounds.east - bounds.west);

  const getPos = (c: LatLng) => {
    const x = Math.max(5, Math.min(95, ((c.lng - bounds.west) / lngSpan) * 100));
    const y = Math.max(10, Math.min(90, ((bounds.north - c.lat) / latSpan) * 100));
    return { x, y };
  };

  const p1Pos = getPos(p1Coords);
  const p2Pos = getPos(p2Coords);
  const b1Pos = getPos(boundaries.boundaryStart);
  const b2Pos = getPos(boundaries.boundaryEnd);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-radial from-slate-900 via-slate-950 to-slate-950">
      {/* Reconnaissance HUD Badge */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none bg-slate-950/90 backdrop-blur-xs border border-slate-700/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 flex items-center gap-1.5 shadow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-100 truncate max-w-[130px] sm:max-w-[180px]">
          {arena.name}
        </span>
        <span className="text-slate-400">• {arena.estimatedDistanceKm} km</span>
      </div>

      {/* Mode Tag */}
      <div className="absolute top-2 right-2 z-20 pointer-events-none bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400/90 shadow">
        TACTICAL RECON
      </div>

      {/* Radar Range Rings and Topographic Contours Canvas/SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Ambient Radar Glow */}
        <rect width="100%" height="100%" fill="url(#radarSweepGlow)" />

        {/* Tactical Concentric Range Rings */}
        {[22, 42, 64, 86].map((pct, idx) => (
          <ellipse
            key={idx}
            cx="50%"
            cy="50%"
            rx={`${pct * 0.8}%`}
            ry={`${pct * 0.48}%`}
            fill="none"
            stroke="#10b981"
            strokeWidth="0.75"
            strokeOpacity={0.16 + idx * 0.02}
            strokeDasharray={idx === 1 ? '3 5' : undefined}
          />
        ))}

        {/* Crosshair Sector Lines */}
        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 4" />

        {/* Flank Boundary Extensions (Orange dashed) */}
        <line
          x1={`${b1Pos.x}%`}
          y1={`${b1Pos.y}%`}
          x2={`${p1Pos.x}%`}
          y2={`${p1Pos.y}%`}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeOpacity="0.45"
        />
        <line
          x1={`${p2Pos.x}%`}
          y1={`${p2Pos.y}%`}
          x2={`${b2Pos.x}%`}
          y2={`${b2Pos.y}%`}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeOpacity="0.45"
        />

        {/* Yellow Tactical Firing Line Between Combatants */}
        <line
          x1={`${p1Pos.x}%`}
          y1={`${p1Pos.y}%`}
          x2={`${p2Pos.x}%`}
          y2={`${p2Pos.y}%`}
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeOpacity="0.9"
        />
      </svg>

      {/* Rotating Radar Sweep Beam Animation */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="w-[180%] h-[180%] rounded-full border border-emerald-500/20 animate-spin [animation-duration:8s] bg-conic from-emerald-500/15 via-transparent to-transparent" />
      </div>

      {/* P1 Marker (Red Battery) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{ left: `${p1Pos.x}%`, top: `${p1Pos.y}%` }}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-mono px-1 py-0.2 rounded shadow border border-red-400 font-bold whitespace-nowrap">
            P1 {p1Health}%
          </div>
          <div className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md animate-ping absolute opacity-75" />
          <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-bold text-white z-10">
            1
          </div>
        </div>
      </div>

      {/* P2 Marker (Sky Blue Battery) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{ left: `${p2Pos.x}%`, top: `${p2Pos.y}%` }}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[9px] font-mono px-1 py-0.2 rounded shadow border border-sky-400 font-bold whitespace-nowrap">
            P2 {p2Health}%
          </div>
          <div className="w-4 h-4 bg-sky-500 rounded-full border border-white shadow-md animate-ping absolute opacity-75" />
          <div className="w-4 h-4 bg-sky-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-bold text-white z-10">
            2
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="absolute bottom-1 right-2 z-20 pointer-events-none text-[8px] font-mono text-slate-500">
        GPS: {arena.p1Coords.lat.toFixed(2)}°N / {arena.p2Coords.lng.toFixed(2)}°E
      </div>
    </div>
  );
};
