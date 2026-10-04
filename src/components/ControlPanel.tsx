import React from 'react';
import {
  Bomb,
  Sparkles,
  Drill,
  Mountain,
  Disc,
  Flame,
  Wind as WindIcon,
  Crosshair,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Arena, GameStatus, Player, TerrainProfile, Wind } from '../types/game';
import { WEAPON_LIST } from '../game/weapons';
import { audioService } from '../services/audioService';
import { SatelliteMiniMap } from './SatelliteMiniMap';

interface ControlPanelProps {
  player: Player;
  opponent: Player;
  wind: Wind;
  gameStatus: GameStatus;
  onAngleChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onSelectWeapon: (weaponId: string) => void;
  onFire: () => void;
  arena: Arena;
  terrainProfile: TerrainProfile | null;
  isLoadingTerrain: boolean;
  p1Health: number;
  p2Health: number;
  isCadetAimActive: boolean;
  onActivateCadetAimGuide: () => void;
}

const WEAPON_ICONS: Record<string, React.ReactNode> = {
  standard: <Bomb className="w-4 h-4" />,
  mirv: <Sparkles className="w-4 h-4" />,
  digger: <Drill className="w-4 h-4" />,
  dirt: <Mountain className="w-4 h-4" />,
  bouncer: <Disc className="w-4 h-4" />,
  nuke: <Flame className="w-4 h-4" />,
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  player,
  opponent,
  wind,
  gameStatus,
  onAngleChange,
  onPowerChange,
  onSelectWeapon,
  onFire,
  arena,
  terrainProfile,
  isLoadingTerrain,
  p1Health,
  p2Health,
  isCadetAimActive,
  onActivateCadetAimGuide,
}) => {
  const isAiming = gameStatus === 'aiming';
  const isAiTurn = player.isAi;
  const canFire = isAiming && !isAiTurn;

  const handleAngleStep = (delta: number) => {
    if (!canFire) return;
    audioService.playUiClick();
    const newAngle = Math.max(0, Math.min(180, player.angle + delta));
    onAngleChange(newAngle);
  };

  const handlePowerStep = (delta: number) => {
    if (!canFire) return;
    audioService.playUiClick();
    const newPower = Math.max(1, Math.min(100, player.power + delta));
    onPowerChange(newPower);
  };

  const handleWeaponClick = (weaponId: string) => {
    if (!canFire) return;
    const ammo = player.inventory[weaponId];
    if (ammo === 0) return; // Out of ammo
    audioService.playUiClick();
    onSelectWeapon(weaponId);
  };

  // Determine wind arrow direction
  const windAbs = Math.abs(wind.speed);
  const windDir = wind.speed > 0 ? 'EAST (→)' : wind.speed < 0 ? 'WEST (←)' : 'CALM';
  const reliefMeters = terrainProfile
    ? terrainProfile.maxElevationMeters - terrainProfile.minElevationMeters
    : 0;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col lg:flex-row gap-3 items-stretch">
      {/* LEFT COLUMN: Telemetry Banner & Gunner Firing Console */}
      <div className="flex-1 flex flex-col justify-between gap-2.5 min-w-0">
        {/* Top Banner: Turn Status, Topographic Metrics, Wind Meter & Phase Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          {/* Active Battery */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <div
              className="w-3.5 h-3.5 rounded-full animate-pulse shadow-sm shrink-0"
              style={{ backgroundColor: player.color }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 hidden sm:block">
                Active Battery
              </span>
              <span className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-1 sm:gap-1.5">
                {player.name}
                {player.isAi ? (
                  <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-700/50 px-1.5 py-0.2 rounded font-mono">
                    CPU <span className="hidden sm:inline">{player.aiLevel?.toUpperCase()}</span>
                  </span>
                ) : null}
                <span className="text-[10px] font-mono text-slate-400 ml-0 sm:ml-1 hidden lg:inline">
                  vs {opponent.name} ({opponent.health} HP)
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Topographic Profile Metrics (Numeric telemetry & API badge, no graphical curve) */}
            {terrainProfile ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2 lg:px-2.5 py-1 rounded-lg">
                <div className="flex items-center gap-1 lg:gap-1.5 pr-0 lg:pr-2 lg:border-r border-slate-800/80">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono font-semibold text-slate-300 uppercase tracking-wider hidden lg:inline">
                    TOPOGRAPHY
                  </span>
                </div>

                <div className="hidden xl:flex items-center gap-2 text-center text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400">MIN</span>
                    <span className="font-bold text-slate-200">{terrainProfile.minElevationMeters}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400">MAX</span>
                    <span className="font-bold text-emerald-400">{terrainProfile.maxElevationMeters}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400">RELIEF</span>
                    <span className="font-bold text-amber-400">{reliefMeters}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400">SPAN</span>
                    <span className="font-bold text-sky-400">{arena.estimatedDistanceKm}km</span>
                  </div>
                </div>

                {/* Topographic Status Badge */}
                <div
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border lg:ml-1 bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                  title={terrainProfile.attributionText || arena.locationName}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[110px] hidden md:inline">
                    Topographic DEM
                  </span>
                </div>
              </div>
            ) : isLoadingTerrain ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 animate-pulse">
                <Mountain className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span className="hidden sm:inline">Acquiring topographic elevation...</span>
              </div>
            ) : null}

            {/* Tactical Wind Gauge */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2 lg:px-2.5 py-1 rounded-lg">
              <WindIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 leading-none hidden sm:inline">
                  CROSSWIND
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-sky-300">
                  {windAbs.toFixed(0)} <span className="hidden sm:inline">m/s {windDir}</span>
                </span>
              </div>
              {/* Visual Wind Vector Arrow */}
              <div className="w-8 sm:w-14 h-2 bg-slate-800 rounded-full relative overflow-hidden ml-1">
                <div
                  className={`absolute top-0 bottom-0 transition-all duration-300 ${
                    wind.speed >= 0 ? 'bg-sky-400 left-1/2' : 'bg-amber-400 right-1/2'
                  }`}
                  style={{
                    width: `${Math.min(50, (windAbs / 50) * 50)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Console: Angle, Power, Weapons, Fire */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch flex-1">
          {/* Left Column: Sliders */}
          <div className="flex flex-col gap-2 flex-1 sm:max-w-[200px]">
            {/* 1. Angle Control */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden sm:inline">ELEVATION</span> ANGLE
                </span>
                <span className="text-sm font-mono font-bold text-amber-300">
                  {player.angle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={player.angle}
                disabled={!canFire}
                onChange={(e) => onAngleChange(Number(e.target.value))}
                aria-label="Elevation Angle"
                className="w-full h-8 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
              />
            </div>

            {/* 2. Power Control */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">PROPELLANT</span> POWER
                </span>
                <span className="text-sm font-mono font-bold text-emerald-300">
                  {player.power}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={player.power}
                disabled={!canFire}
                onChange={(e) => onPowerChange(Number(e.target.value))}
                aria-label="Propellant Power"
                className="w-full h-8 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Right Column: Weapons & Fire */}
          <div className="flex flex-col gap-2 flex-[2]">
            {/* Weapon Selector (Icons Only, 1 Row) */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:block">
                ORDNANCE MAGAZINE
              </span>
              <div className="grid grid-cols-6 lg:grid-cols-3 gap-1.5 w-full">
                {WEAPON_LIST.map((wpn) => {
                  const ammo = player.inventory[wpn.id] ?? 0;
                  const isSelected = player.activeWeaponId === wpn.id;
                  const isDepleted = ammo === 0;

                  return (
                    <button
                      key={wpn.id}
                      type="button"
                      disabled={!canFire || isDepleted}
                      onClick={() => handleWeaponClick(wpn.id)}
                      className={`flex items-center justify-center lg:justify-start lg:gap-1.5 p-1.5 lg:px-2 py-1 rounded transition relative border cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400/80 shadow-sm'
                          : isDepleted
                          ? 'bg-slate-950/50 border-slate-800/40 opacity-35 cursor-not-allowed'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                      title={`${wpn.name} (${ammo === -1 ? 'Unlimited' : ammo})`}
                    >
                      <div
                        className="p-1 rounded text-white shrink-0"
                        style={{ backgroundColor: isDepleted ? '#475569' : wpn.color }}
                      >
                        {WEAPON_ICONS[wpn.id] || <Bomb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </div>
                      {/* Floating Ammo Badge (Mobile Only) */}
                      <div className="lg:hidden absolute -top-1 -right-1 bg-slate-950 text-slate-300 text-[9px] font-mono px-1 rounded-sm border border-slate-700 leading-tight shadow-sm z-10">
                        {ammo === -1 ? '∞' : ammo}
                      </div>
                      {/* Full Text (Desktop Only) */}
                      <div className="hidden lg:flex flex-col min-w-0 leading-tight text-left">
                        <span className="text-[11px] font-semibold truncate text-slate-200">
                          {wpn.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 text-left">
                          {ammo === -1 ? '∞' : `x${ammo}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIRE & AIM ASSIST Controls */}
            <div className="flex gap-2 shrink-0">
              {/* Cadet Level Aiming Guide Activation Button (3 Uses per match) */}
              {!player.isAi && (
                <button
                  type="button"
                  disabled={!canFire || (player.cadetUsesRemaining <= 0 && !isCadetAimActive)}
                  onClick={() => {
                    if (!isCadetAimActive) {
                      audioService.playUiClick();
                    }
                    onActivateCadetAimGuide();
                  }}
                  className={`flex-1 sm:max-w-[140px] py-2 px-2 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border min-h-[44px] ${
                    isCadetAimActive
                      ? 'bg-emerald-600 border-emerald-300 text-white shadow-md shadow-emerald-950/60 animate-pulse ring-2 ring-emerald-400'
                      : player.cadetUsesRemaining > 0 && canFire
                      ? 'bg-slate-900 hover:bg-slate-800 border-emerald-500/50 text-emerald-400 hover:text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    isCadetAimActive
                      ? 'Cadet Aim Guide active'
                      : player.cadetUsesRemaining > 0
                      ? `Cadet Aim Guide (${player.cadetUsesRemaining} uses left)`
                      : 'Cadet Aim Guide: 0 uses remaining'
                  }
                >
                  <Crosshair className={`w-3.5 h-3.5 shrink-0 ${isCadetAimActive ? 'animate-spin' : ''}`} />
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px]">
                      {isCadetAimActive ? 'GUIDE ON' : 'AIM GUIDE'}
                    </span>
                  </div>
                </button>
              )}

              {/* FIRE Button */}
              <button
                type="button"
                onClick={() => {
                  if (canFire) {
                    onFire();
                  }
                }}
                disabled={!canFire}
                className={`flex-[2] py-2 px-2 min-h-[44px] rounded-xl font-bold font-mono tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-150 ${
                  canFire
                    ? 'bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white cursor-pointer active:scale-95 shadow-red-950/50'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Bomb className={`w-4 h-4 sm:w-5 sm:h-5 ${canFire ? 'animate-bounce' : ''}`} />
                <span>FIRE!</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Large Orbital Recon Satellite MiniMap (Matching Red Box Dimensions) */}
      <div className="w-full lg:w-[350px] xl:w-[410px] 2xl:w-[460px] shrink-0 h-32 md:h-48 lg:h-auto min-h-[128px] md:min-h-[175px] rounded-xl overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950 relative">
        <SatelliteMiniMap
          arena={arena}
          p1Coords={arena.p1Coords}
          p2Coords={arena.p2Coords}
          p1Health={p1Health}
          p2Health={p2Health}
        />
      </div>
    </div>
  );
};
