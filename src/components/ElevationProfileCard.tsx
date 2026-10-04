import React from 'react';
import { Mountain, Compass, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Arena, TerrainProfile } from '../types/game';

interface ElevationProfileCardProps {
  arena: Arena;
  profile: TerrainProfile | null;
  isLoading: boolean;
}

export const ElevationProfileCard: React.FC<ElevationProfileCardProps> = ({
  arena,
  profile,
  isLoading,
}) => {
  if (isLoading || !profile) {
    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg flex items-center justify-center min-h-[100px]">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 animate-pulse">
          <Mountain className="w-4 h-4 text-emerald-400 animate-bounce" />
          Acquiring live topographic elevation profile...
        </div>
      </div>
    );
  }

  const reliefMeters = profile.maxElevationMeters - profile.minElevationMeters;

  // Build SVG path from raw elevations
  const svgWidth = 240;
  const svgHeight = 44;
  const points = profile.normalizedHeights.map((normH, idx) => {
    const x = (idx / (profile.normalizedHeights.length - 1)) * svgWidth;
    const y = svgHeight - normH * (svgHeight - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;
  const strokeD = `M ${points.join(' L ')}`;

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col gap-2">
      {/* Top Bar: Title & API Status Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Mountain className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Topographic Profile
          </span>
        </div>

        {/* Status Disclosure Badge */}
        <div
          className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
          title={profile.attributionText}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[170px]">
            {profile.isProcedural ? 'Topographic DEM' : 'Google Maps Live API'}
          </span>
        </div>
      </div>

      {/* Mini Altitude Graph SVG */}
      <div className="relative w-full h-11 bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800/60 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full preserve-3d"
        >
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={pathD} fill="url(#elevGrad)" />
          <path d={strokeD} fill="none" stroke="#4ade80" strokeWidth="1.5" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-mono text-slate-400 pointer-events-none">
          <span>{arena.p1Label.split(' ')[0]}</span>
          <span>{arena.p2Label.split(' ')[0]}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-slate-950/60 rounded p-1 border border-slate-800/40">
          <span className="text-[9px] font-mono text-slate-400 block">MIN</span>
          <span className="text-xs font-mono font-bold text-slate-200">
            {profile.minElevationMeters}m
          </span>
        </div>
        <div className="bg-slate-950/60 rounded p-1 border border-slate-800/40">
          <span className="text-[9px] font-mono text-slate-400 block">MAX</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {profile.maxElevationMeters}m
          </span>
        </div>
        <div className="bg-slate-950/60 rounded p-1 border border-slate-800/40">
          <span className="text-[9px] font-mono text-slate-400 block">RELIEF</span>
          <span className="text-xs font-mono font-bold text-amber-400">
            {reliefMeters}m
          </span>
        </div>
        <div className="bg-slate-950/60 rounded p-1 border border-slate-800/40">
          <span className="text-[9px] font-mono text-slate-400 block">SPAN</span>
          <span className="text-xs font-mono font-bold text-sky-400">
            {arena.estimatedDistanceKm}km
          </span>
        </div>
      </div>

      {/* Location description snippet */}
      <div className="text-[10px] text-slate-400 flex items-center gap-1">
        <Compass className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="truncate">{arena.locationName}</span>
      </div>
    </div>
  );
};
