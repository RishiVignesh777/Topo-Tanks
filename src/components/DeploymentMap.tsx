import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crosshair,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
} from 'lucide-react';
import {
  Arena,
  GeoBounds,
  LatLng,
  calculateDistanceKm,
  calculateArenaBoundaries,
} from '../types/game';
import {
  fetchElevationsForLocations,
  getArenaElevationAt,
  isGoogleMapsEnabled,
} from '../services/elevationService';
import { audioService } from '../services/audioService';

interface DeploymentMapProps {
  arena: Arena;
  p1Coords: LatLng;
  p2Coords: LatLng;
  p1Label?: string;
  p2Label?: string;
  onP1CoordsChange: (coords: LatLng) => void;
  onP2CoordsChange: (coords: LatLng) => void;
}

// Initial bearing (azimuth) from p1 to p2 in degrees (0 - 360)
function calculateBearing(p1: LatLng, p2: LatLng): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

function getCardinalDirection(angle: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(angle / 45) % 8;
  return directions[index];
}

// Clamps coordinates to stay within the arena's defined tactical bounds
function clampToBounds(coords: LatLng, bounds: GeoBounds): LatLng {
  const minLat = Math.min(bounds.south, bounds.north);
  const maxLat = Math.max(bounds.south, bounds.north);
  const minLng = Math.min(bounds.west, bounds.east);
  const maxLng = Math.max(bounds.west, bounds.east);
  return {
    lat: Math.min(maxLat, Math.max(minLat, coords.lat)),
    lng: Math.min(maxLng, Math.max(minLng, coords.lng)),
  };
}

/**
 * Tactical Topographic Deployment Map
 * Provides an interactive vector & contour battlefield positioning system
 * that operates offline with zero external map API dependencies.
 */
export const DeploymentMap: React.FC<DeploymentMapProps> = ({
  arena,
  p1Coords,
  p2Coords,
  p1Label,
  p2Label,
  onP1CoordsChange,
  onP2CoordsChange,
}) => {
  const [p1Elevation, setP1Elevation] = useState<number | null>(null);
  const [p2Elevation, setP2Elevation] = useState<number | null>(null);
  const [isLoadingElevations, setIsLoadingElevations] = useState<boolean>(false);
  const [hoverCoords, setHoverCoords] = useState<LatLng | null>(null);

  // Zoom & Pan state for tactical map navigation
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingPin, setDraggingPin] = useState<'p1' | 'p2' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const p1Title = p1Label || arena.p1Label;
  const p2Title = p2Label || arena.p2Label;

  // Immediate or real-time elevation update for placed battery pins
  useEffect(() => {
    setIsLoadingElevations(true);
    const update = async () => {
      try {
        const results = await fetchElevationsForLocations([p1Coords, p2Coords], arena);
        setP1Elevation(results[0] ?? getArenaElevationAt(p1Coords, arena));
        setP2Elevation(results[1] ?? getArenaElevationAt(p2Coords, arena));
      } catch {
        setP1Elevation(getArenaElevationAt(p1Coords, arena));
        setP2Elevation(getArenaElevationAt(p2Coords, arena));
      } finally {
        setIsLoadingElevations(false);
      }
    };
    void update();
  }, [p1Coords, p2Coords, arena]);

  // Coordinate projections between GPS and Tactical Container %
  const bounds = arena.bounds;
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;

  const coordToPercent = useCallback(
    (coord: LatLng) => {
      const xPct = ((coord.lng - bounds.west) / lngSpan) * 100;
      const yPct = ((bounds.north - coord.lat) / latSpan) * 100;
      return { x: xPct, y: yPct };
    },
    [bounds, latSpan, lngSpan]
  );

  const percentToCoord = useCallback(
    (xPct: number, yPct: number): LatLng => {
      const lng = bounds.west + (xPct / 100) * lngSpan;
      const lat = bounds.north - (yPct / 100) * latSpan;
      return clampToBounds({ lat, lng }, bounds);
    },
    [bounds, latSpan, lngSpan]
  );

  // Convert mouse or pointer event coordinates to GPS LatLng
  const getEventCoord = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | PointerEvent): LatLng | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;

      // Adjust for zoom and pan
      const centerX = 0.5 + panOffset.x;
      const centerY = 0.5 + panOffset.y;
      const normX = (rawX - centerX) / zoomLevel + 0.5;
      const normY = (rawY - centerY) / zoomLevel + 0.5;

      const clampedX = Math.max(0.01, Math.min(0.99, normX)) * 100;
      const clampedY = Math.max(0.01, Math.min(0.99, normY)) * 100;

      return percentToCoord(clampedX, clampedY);
    },
    [percentToCoord, zoomLevel, panOffset]
  );

  // Pointer event handlers for dragging markers or clicking to reposition
  const handlePointerDownPin = (pin: 'p1' | 'p2', e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingPin(pin);
    audioService.playUiClick();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getEventCoord(e);
    if (coords) {
      setHoverCoords(coords);
      if (draggingPin === 'p1') {
        onP1CoordsChange(coords);
      } else if (draggingPin === 'p2') {
        onP2CoordsChange(coords);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingPin) {
      setDraggingPin(null);
      audioService.playUiClick();
    }
  };

  // Click on map to place or relocate nearest battery
  const handleMapClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingPin) return;
    const clickedCoord = getEventCoord(e);
    if (!clickedCoord) return;

    // Determine whether P1 or P2 is closer to clicked location
    const d1 = calculateDistanceKm(clickedCoord, p1Coords);
    const d2 = calculateDistanceKm(clickedCoord, p2Coords);

    audioService.playUiClick();
    if (d1 <= d2) {
      onP1CoordsChange(clickedCoord);
    } else {
      onP2CoordsChange(clickedCoord);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    audioService.playUiClick();
    setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.3) * 10) / 10));
  };

  const handleZoomOut = () => {
    audioService.playUiClick();
    setZoomLevel((z) => {
      const next = Math.max(1, Math.round((z - 0.3) * 10) / 10);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    audioService.playUiClick();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Telemetry values
  const distanceKm = calculateDistanceKm(p1Coords, p2Coords);
  const bearing = calculateBearing(p1Coords, p2Coords);
  const cardinal = getCardinalDirection(bearing);
  const boundaries = calculateArenaBoundaries(p1Coords, p2Coords, 0.16);

  const p1Pos = coordToPercent(p1Coords);
  const p2Pos = coordToPercent(p2Coords);
  const b1Pos = coordToPercent(boundaries.boundaryStart);
  const b2Pos = coordToPercent(boundaries.boundaryEnd);

  // Generate tactical grid lines (3 horizontal, 4 vertical)
  const gridLats = [
    bounds.south + latSpan * 0.25,
    bounds.south + latSpan * 0.5,
    bounds.south + latSpan * 0.75,
  ];
  const gridLngs = [
    bounds.west + lngSpan * 0.2,
    bounds.west + lngSpan * 0.4,
    bounds.west + lngSpan * 0.6,
    bounds.west + lngSpan * 0.8,
  ];

  return (
    <div className="relative w-full h-[300px] md:h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col select-none shrink-0 shadow-2xl">
      {/* Interactive Tactical Battlefield Viewport */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setDraggingPin(null);
          setHoverCoords(null);
        }}
        onClick={handleMapClick}
        className="relative flex-1 w-full h-full overflow-hidden bg-radial from-slate-900 via-slate-950 to-slate-950 cursor-crosshair touch-none"
      >
        {/* Dynamic Zoom & Pan Container */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-75"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x * 100}%, ${panOffset.y * 100}%)`,
            transformOrigin: 'center center',
          }}
        >
          {/* 1. Tactical Grid Pattern Overlay */}
          <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none" />

          {/* 2. Topographic Elevation Contour Bands & Shaded Relief Simulation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
            <defs>
              <linearGradient id="tacticalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#052e16" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#0f172a" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
              </linearGradient>
              <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotPattern)" />

            {/* Concentric Elevation Contours centered around theater mid-point */}
            {[18, 32, 46, 62, 78].map((radius, idx) => (
              <ellipse
                key={idx}
                cx="50%"
                cy="50%"
                rx={`${radius * 0.9}%`}
                ry={`${radius * 0.55}%`}
                fill="none"
                stroke={idx % 2 === 0 ? '#10b981' : '#0ea5e9'}
                strokeWidth="1"
                strokeDasharray={idx === 1 || idx === 3 ? '4 6' : undefined}
                strokeOpacity={0.25 - idx * 0.03}
              />
            ))}

            {/* Latitude & Longitude Tactical Coordinate Grid Lines */}
            {gridLats.map((lat, idx) => {
              const yPct = ((bounds.north - lat) / latSpan) * 100;
              return (
                <line
                  key={`lat-${idx}`}
                  x1="0%"
                  y1={`${yPct}%`}
                  x2="100%"
                  y2={`${yPct}%`}
                  stroke="#38bdf8"
                  strokeWidth="0.75"
                  strokeDasharray="2 6"
                  strokeOpacity="0.3"
                />
              );
            })}

            {gridLngs.map((lng, idx) => {
              const xPct = ((lng - bounds.west) / lngSpan) * 100;
              return (
                <line
                  key={`lng-${idx}`}
                  x1={`${xPct}%`}
                  y1="0%"
                  x2={`${xPct}%`}
                  y2="100%"
                  stroke="#38bdf8"
                  strokeWidth="0.75"
                  strokeDasharray="2 6"
                  strokeOpacity="0.3"
                />
              );
            })}

            {/* Outer Flank Boundary Extensions (Orange dashed) */}
            <line
              x1={`${b1Pos.x}%`}
              y1={`${b1Pos.y}%`}
              x2={`${p1Pos.x}%`}
              y2={`${p1Pos.y}%`}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />
            <line
              x1={`${p2Pos.x}%`}
              y1={`${p2Pos.y}%`}
              x2={`${b2Pos.x}%`}
              y2={`${b2Pos.y}%`}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />

            {/* Yellow Tactical Artillery Engagement Line */}
            <line
              x1={`${p1Pos.x}%`}
              y1={`${p1Pos.y}%`}
              x2={`${p2Pos.x}%`}
              y2={`${p2Pos.y}%`}
              stroke="#fbbf24"
              strokeWidth="3"
              strokeOpacity="0.95"
            />

            {/* Subtle Distance Pill in the Center of Transect Line */}
            <g transform={`translate(${((p1Pos.x + p2Pos.x) / 2) * 5}, ${((p1Pos.y + p2Pos.y) / 2) * 3})`}>
              {/* rendered natively in HTML below for sharp font */}
            </g>
          </svg>

          {/* Center Transect Distance Badge */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 border border-amber-500/80 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow pointer-events-none z-10 flex items-center gap-1"
            style={{
              left: `${(p1Pos.x + p2Pos.x) / 2}%`,
              top: `${(p1Pos.y + p2Pos.y) / 2}%`,
            }}
          >
            <span>{distanceKm} km</span>
            <span className="text-[9px] text-amber-400/80">({bearing}°)</span>
          </div>

          {/* Tactical Space Boundary: Red Box with Dashed Lines */}
          <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-red-500/50 rounded-lg pointer-events-none shadow-[inset_0_0_20px_rgba(239,68,68,0.06)]" />

          {/* Player 1 (Red) Artillery Placement Marker */}
          <div
            onPointerDown={(e) => handlePointerDownPin('p1', e)}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group p-2"
            style={{ left: `${p1Pos.x}%`, top: `${p1Pos.y}%` }}
            title={`${p1Title} (Player 1 Red Artillery) - Drag to position battery`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-ping absolute opacity-70 pointer-events-none" />
              <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white group-hover:scale-110 group-active:scale-125 transition z-10">
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-950/95 border border-red-500 text-red-200 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold whitespace-nowrap shadow-md pointer-events-none">
                P1: {p1Title.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Player 2 (Blue) Artillery Placement Marker */}
          <div
            onPointerDown={(e) => handlePointerDownPin('p2', e)}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group p-2"
            style={{ left: `${p2Pos.x}%`, top: `${p2Pos.y}%` }}
            title={`${p2Title} (Player 2 Blue Artillery) - Drag to position battery`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 bg-sky-500 rounded-full border-2 border-white shadow-lg animate-ping absolute opacity-70 pointer-events-none" />
              <div className="w-8 h-8 bg-sky-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white group-hover:scale-110 group-active:scale-125 transition z-10">
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sky-950/95 border border-sky-500 text-sky-200 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold whitespace-nowrap shadow-md pointer-events-none">
                P2: {p2Title.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* TOP HUD: Map Controls (Zoom In, Zoom Out, Reset, Mode Badge) */}
        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 p-1 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-400 px-1 border-l border-slate-700">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        {/* TOP RIGHT HUD: Tactical Status & Cursor Lat/Lng Telemetry */}
        <div className="absolute top-2.5 right-2.5 z-30 flex flex-col items-end gap-1">
          <div className="bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">TACTICAL TOPOGRAPHIC MAP</span>
          </div>

          {hoverCoords && (
            <div className="bg-slate-950/80 backdrop-blur-xs border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-mono shadow">
              {hoverCoords.lat.toFixed(4)}°N, {hoverCoords.lng.toFixed(4)}°E
            </div>
          )}
        </div>

        {/* BOTTOM LEFT COMPASS & SCALE */}
        <div className="absolute bottom-2 left-2 z-30 pointer-events-none flex items-center gap-2">
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 flex items-center gap-1 shadow">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>N ↑</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 shadow">
            GRID: {arena.locationName}
          </div>
        </div>
      </div>

      {/* Geospatial Telemetry HUD Bottom Bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 text-xs font-mono">
        {/* Left Cluster: Distance, Bounds, Bearing */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">BATTERY SPAN:</span>
            <span
              className={`font-bold text-sm ${
                distanceKm < 0.3 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {distanceKm} km
            </span>
            {distanceKm < 0.3 && (
              <span className="text-[10px] text-rose-400 font-semibold">
                (Min 0.3 km)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="text-slate-400 text-[11px]">ARENA:</span>
            <span className="font-semibold text-slate-200">
              {boundaries.totalSpanKm} km
            </span>
            <span className="text-[10px] text-amber-500/80">(+16%)</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-slate-200">
              {bearing}° {cardinal}
            </span>
          </div>
        </div>

        {/* Right Cluster: P1 and P2 Relative Altitude Information */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-red-400 font-bold">P1:</span>
              <span className="text-slate-300">
                {isLoadingElevations
                  ? '...'
                  : p1Elevation !== null
                  ? `${p1Elevation.toLocaleString()}m`
                  : '---'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-sky-400 font-bold">P2:</span>
              <span className="text-slate-300">
                {isLoadingElevations
                  ? '...'
                  : p2Elevation !== null
                  ? `${p2Elevation.toLocaleString()}m`
                  : '---'}
              </span>
            </div>

            {p1Elevation !== null && p2Elevation !== null && (
              <div className="text-[10px] text-slate-400 border-l border-slate-800 pl-2">
                Δ {Math.abs(p1Elevation - p2Elevation)}m (
                {p1Elevation > p2Elevation
                  ? 'P1 High'
                  : p1Elevation < p2Elevation
                  ? 'P2 High'
                  : 'Level'}
                )
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
