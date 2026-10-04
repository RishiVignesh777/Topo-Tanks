import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  X,
  Compass,
  CheckCircle,
  PlusCircle,
  ArrowLeft,
  RotateCcw,
  ArrowRightLeft,
  Rocket,
  Crosshair,
  Zap,
} from 'lucide-react';
import {
  Arena,
  LatLng,
  GeoBounds,
  computeBoundsFromCoords,
  calculateDistanceKm,
  calculateArenaBoundaries,
} from '../types/game';
import { PRESET_ARENAS } from '../data/presetArenas';
import { audioService } from '../services/audioService';
import { DeploymentMap } from './DeploymentMap';

interface ArenaSelectorProps {
  currentArena: Arena;
  isOpen: boolean;
  onClose: () => void;
  onSelectArena: (arena: Arena) => void;
}

function formatCoordSector(bounds: GeoBounds): string {
  const southStr = `${Math.abs(bounds.south).toFixed(2)}°${bounds.south >= 0 ? 'N' : 'S'}`;
  const northStr = `${Math.abs(bounds.north).toFixed(2)}°${bounds.north >= 0 ? 'N' : 'S'}`;
  const westStr = `${Math.abs(bounds.west).toFixed(2)}°${bounds.west >= 0 ? 'E' : 'W'}`;
  const eastStr = `${Math.abs(bounds.east).toFixed(2)}°${bounds.east >= 0 ? 'E' : 'W'}`;
  return `${southStr} - ${northStr}, ${westStr} - ${eastStr}`;
}

export const ArenaSelector: React.FC<ArenaSelectorProps> = ({
  currentArena,
  isOpen,
  onClose,
  onSelectArena,
}) => {
  const [step, setStep] = useState<'theaters' | 'placement'>('theaters');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Selected arena & tactical placement state
  const [selectedArena, setSelectedArena] = useState<Arena>(currentArena);
  const [p1Coords, setP1Coords] = useState<LatLng>(currentArena.p1Coords);
  const [p2Coords, setP2Coords] = useState<LatLng>(currentArena.p2Coords);
  const [p1Label, setP1Label] = useState<string>(currentArena.p1Label);
  const [p2Label, setP2Label] = useState<string>(currentArena.p2Label);

  // Custom Arena form state
  const [customName, setCustomName] = useState('Mount Fuji Ascent');
  const [customLocation, setCustomLocation] = useState('Honshu, Japan');
  const [p1Lat, setP1Lat] = useState('35.3300');
  const [p1Lng, setP1Lng] = useState('138.7000');
  const [p2Lat, setP2Lat] = useState('35.3700');
  const [p2Lng, setP2Lng] = useState('138.7400');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Adjust state during render when dialog opens or currentArena changes
  const [prevProps, setPrevProps] = useState({ isOpen, currentArena });
  if (isOpen !== prevProps.isOpen || currentArena !== prevProps.currentArena) {
    setPrevProps({ isOpen, currentArena });
    if (isOpen) {
      setSelectedArena(currentArena);
      setP1Coords(currentArena.p1Coords);
      setP2Coords(currentArena.p2Coords);
      setP1Label(currentArena.p1Label);
      setP2Label(currentArena.p2Label);
      setStep('theaters');
      setActiveTab(currentArena.id.startsWith('custom') ? 'custom' : 'presets');
    }
  }

  if (!isOpen) return null;

  const handleConfigurePreset = (arena: Arena) => {
    audioService.playUiClick();
    setSelectedArena(arena);
    if (arena.id === currentArena.id) {
      setP1Coords(currentArena.p1Coords);
      setP2Coords(currentArena.p2Coords);
      setP1Label(currentArena.p1Label);
      setP2Label(currentArena.p2Label);
    } else {
      setP1Coords(arena.p1Coords);
      setP2Coords(arena.p2Coords);
      setP1Label(arena.p1Label);
      setP2Label(arena.p2Label);
    }
    setStep('placement');
  };

  const handleQuickDeployPreset = (arena: Arena) => {
    audioService.playUiClick();
    onSelectArena(arena);
    onClose();
  };

  const parseCustomArena = (): Arena | null => {
    const lat1 = parseFloat(p1Lat);
    const lng1 = parseFloat(p1Lng);
    const lat2 = parseFloat(p2Lat);
    const lng2 = parseFloat(p2Lng);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      alert('Please enter valid numeric latitude and longitude coordinates.');
      return null;
    }

    if (lat1 < -85 || lat1 > 85 || lat2 < -85 || lat2 > 85) {
      alert('Latitude coordinates must be between -85° and 85°.');
      return null;
    }

    if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
      alert('Longitude coordinates must be between -180° and 180°.');
      return null;
    }

    const p1 = { lat: lat1, lng: lng1 };
    const p2 = { lat: lat2, lng: lng2 };
    const distKm = calculateDistanceKm(p1, p2);

    if (distKm < 0.3) {
      alert('Player 1 and Player 2 coordinates must be separated by at least 300 meters (0.3 km).');
      return null;
    }

    const bounds = computeBoundsFromCoords(p1, p2);

    return {
      id: `custom_${Date.now()}`,
      name: customName.trim() || 'Custom Earth Cross-Section',
      locationName: customLocation.trim() || 'Earth Coordinates',
      country: 'Custom Coordinates',
      p1Coords: p1,
      p2Coords: p2,
      p1Label: 'Alpha Base',
      p2Label: 'Bravo Outpost',
      description: `Custom live elevation transect spanning ${distKm} kilometers between GPS coordinates.`,
      estimatedDistanceKm: distKm,
      defaultZoom: distKm > 20 ? 9 : distKm > 10 ? 11 : 13,
      cameraCenter: {
        lat: (lat1 + lat2) / 2,
        lng: (lng1 + lng2) / 2,
      },
      bounds,
    };
  };

  const handleConfigureCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const custom = parseCustomArena();
    if (!custom) return;

    audioService.playUiClick();
    setSelectedArena(custom);
    setP1Coords(custom.p1Coords);
    setP2Coords(custom.p2Coords);
    setP1Label(custom.p1Label);
    setP2Label(custom.p2Label);
    setStep('placement');
  };

  const handleQuickDeployCustom = (e: React.MouseEvent) => {
    e.preventDefault();
    const custom = parseCustomArena();
    if (!custom) return;

    audioService.playUiClick();
    onSelectArena(custom);
    onClose();
  };

  const handleUseDefaults = () => {
    audioService.playUiClick();
    const preset = PRESET_ARENAS.find((a) => a.id === selectedArena.id);
    if (preset) {
      setP1Coords(preset.p1Coords);
      setP2Coords(preset.p2Coords);
      setP1Label(preset.p1Label);
      setP2Label(preset.p2Label);
    } else {
      setP1Coords(selectedArena.p1Coords);
      setP2Coords(selectedArena.p2Coords);
      setP1Label(selectedArena.p1Label);
      setP2Label(selectedArena.p2Label);
    }
  };

  const handleSwapP1P2 = () => {
    audioService.playUiClick();
    setP1Coords(p2Coords);
    setP2Coords(p1Coords);
    setP1Label(p2Label);
    setP2Label(p1Label);
  };

  const handleFinalDeploy = () => {
    const distKm = calculateDistanceKm(p1Coords, p2Coords);
    if (distKm < 0.3) {
      alert('Player 1 and Player 2 artillery must be separated by at least 300 meters.');
      return;
    }

    const boundaries = calculateArenaBoundaries(p1Coords, p2Coords, 0.16);

    const deployedArena: Arena = {
      ...selectedArena,
      p1Coords,
      p2Coords,
      boundaryCoords: [boundaries.boundaryStart, boundaries.boundaryEnd],
      p1Label,
      p2Label,
      estimatedDistanceKm: distKm,
      cameraCenter: {
        lat: (p1Coords.lat + p2Coords.lat) / 2,
        lng: (p1Coords.lng + p2Coords.lng) / 2,
      },
    };

    audioService.playUiClick();
    onSelectArena(deployedArena);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arena-selector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* ================================================================= */}
        {/* STEP 1: THEATER SELECTION                                         */}
        {/* ================================================================= */}
        {step === 'theaters' && (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="arena-selector-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    Step 1: Choose Battle Theater
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select a world location to deploy in or define custom coordinates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-4 py-2 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'presets'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" /> CURATED WORLD THEATERS ({PRESET_ARENAS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'custom'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> CUSTOM GPS TRANSECT
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'presets' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_ARENAS.map((arena) => {
                    const isSelected = arena.id === currentArena.id;

                    return (
                      <div
                        key={arena.id}
                        className={`group rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition">
                              {arena.name}
                            </h3>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                                <CheckCircle className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            {arena.locationName}, {arena.country}
                          </span>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {arena.description}
                          </p>
                        </div>

                        {/* Card Footer with 2 Action Buttons */}
                        <div className="flex flex-col gap-2 border-t border-slate-800/70 pt-2.5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="text-sky-400 font-bold">
                              Span: {arena.estimatedDistanceKm} km
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {arena.p1Label.split(' ')[0]} ⚔️ {arena.p2Label.split(' ')[0]}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleConfigurePreset(arena)}
                              className="py-2 px-2.5 rounded-lg text-xs font-mono font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                              title="Customize Player 1 & 2 artillery positions on the tactical map"
                            >
                              <Crosshair className="w-3.5 h-3.5" />
                              <span>Configure Deployment</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickDeployPreset(arena)}
                              className="py-2 px-2.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Start match immediately with curated default positions"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>Quick Deploy (Defaults)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Custom GPS Transect Tab */
                <form
                  onSubmit={handleConfigureCustom}
                  className="flex flex-col gap-4 max-w-xl mx-auto"
                >
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      Define Target Coordinates Anywhere On Earth
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter latitude and longitude coordinates for Player 1 and Player 2 positions.
                      The live Elevation API will sample the real cross-section between them.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Transect Name
                        </label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
                          placeholder="e.g. Matterhorn Pass"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Region / Country
                        </label>
                        <input
                          type="text"
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
                          placeholder="e.g. Swiss Alps"
                        />
                      </div>
                    </div>

                    {/* Player 1 Coordinates */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <span className="text-xs font-mono font-bold text-red-400 block mb-2">
                        Player 1 Battery Location (West)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                            Latitude (deg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={p1Lat}
                            onChange={(e) => setP1Lat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                            Longitude (deg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={p1Lng}
                            onChange={(e) => setP1Lng(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Player 2 Coordinates */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <span className="text-xs font-mono font-bold text-sky-400 block mb-2">
                        Player 2 Battery Location (East)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                            Latitude (deg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={p2Lat}
                            onChange={(e) => setP2Lat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                            Longitude (deg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={p2Lng}
                            onChange={(e) => setP2Lng(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        type="submit"
                        className="py-2.5 px-4 rounded-xl font-bold font-mono text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Configure Placement</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickDeployCustom}
                        className="py-2.5 px-4 rounded-xl font-bold font-mono text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Quick Deploy</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* STEP 2: TACTICAL ARTILLERY PLACEMENT                              */}
        {/* ================================================================= */}
        {step === 'placement' && (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/90">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audioService.playUiClick();
                    setStep('theaters');
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Return to Theater Selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">
                      Step 2: Tactical Artillery Placement &mdash; {selectedArena.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    {selectedArena.locationName}, {selectedArena.country}
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Tactical Sector: {formatCoordSector(selectedArena.bounds)}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Placement Map Body */}
            <div className="p-3 sm:p-4 bg-slate-950 flex-1 overflow-y-auto flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Place <strong className="text-red-400">P1 ({p1Label.split(' ')[0]})</strong> and{' '}
                  <strong className="text-sky-400">P2 ({p2Label.split(' ')[0]})</strong> artillery batteries. Arena boundaries automatically pad outward on each flank.
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Zoom in to inspect terrain ridges, crests & contours
                </span>
              </div>

              {/* Tactical Deployment Map */}
              <DeploymentMap
                arena={selectedArena}
                p1Coords={p1Coords}
                p2Coords={p2Coords}
                p1Label={p1Label}
                p2Label={p2Label}
                onP1CoordsChange={setP1Coords}
                onP2CoordsChange={setP2Coords}
              />
            </div>

            {/* Step 2 Bottom Controls */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 gap-2 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audioService.playUiClick();
                    setStep('theaters');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Theaters
                </button>

                <button
                  type="button"
                  onClick={handleUseDefaults}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset pins back to default curated locations"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Use Defaults
                </button>

                <button
                  type="button"
                  onClick={handleSwapP1P2}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Swap Player 1 and Player 2 battery coordinates"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Swap P1 / P2
                </button>
              </div>

              {(() => {
                const distKm = calculateDistanceKm(p1Coords, p2Coords);
                const isSeparationValid = distKm >= 0.3;

                return (
                  <button
                    type="button"
                    disabled={!isSeparationValid}
                    onClick={handleFinalDeploy}
                    className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition flex items-center gap-2 shadow-lg ${
                      isSeparationValid
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60 cursor-pointer'
                        : 'bg-slate-700 opacity-50 cursor-not-allowed shadow-none'
                    }`}
                    title={
                      isSeparationValid
                        ? 'Deploy to Battlefield'
                        : 'Minimum 300m separation required between batteries'
                    }
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Deploy to Battlefield</span>
                  </button>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
