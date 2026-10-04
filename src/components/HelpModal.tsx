import React from 'react';
import {
  X,
  BookOpen,
  Keyboard,
  Target,
  ShieldAlert,
  Bomb,
  Sparkles,
  Drill,
  Mountain,
  Disc,
  Flame,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-base font-bold text-slate-100">
                Tactical Ballistic Operations Manual
              </h2>
              <p className="text-xs text-slate-400">
                Rules of engagement and ordnance specifications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs leading-relaxed">
          {/* Real Earth Topography */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Live Earth Topography & Destructible Terrain
            </h3>
            <p className="text-slate-300">
              Every battlefield in TopoTanks is sampled live at runtime between real GPS coordinates across Earth via the{' '}
              <strong className="text-white">Google Maps Elevation API</strong>. The canvas heightfield reflects real-world altitudes—from the sheer 1,500-meter chasm of the Grand Canyon to the Himalayan ridges of Mount Everest.
            </p>
            <p className="text-slate-400">
              Explosions permanently blast circular craters out of the earth. When crater walls exceed the natural <strong className="text-slate-300">angle of repose (45°)</strong>, loose soil cascades in realistic sand avalanches. Tanks perched on crater rims will slide down and take severe falling damage!
            </p>
          </div>

          {/* Ordnance Arsenal */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-slate-200">
              Specialized Ordnance Arsenal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-amber-500 text-white shrink-0 mt-0.5">
                  <Bomb className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">HE Shell (Unlimited)</span>
                  <span className="text-slate-400 text-[11px]">
                    40 DMG • R=36px. Dependable medium-blast artillery round for direct bombardment.
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-pink-500 text-white shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">MIRV Cluster (x3)</span>
                  <span className="text-slate-400 text-[11px]">
                    22 DMG x5 • R=22px. Automatically separates at the apex of flight into 5 carpet-bombing sub-munitions.
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-emerald-500 text-white shrink-0 mt-0.5">
                  <Drill className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Mountain Digger (x2)</span>
                  <span className="text-slate-400 text-[11px]">
                    48 DMG • R=40px. Bores subterranean into the hillside before detonating to trigger massive cave-ins.
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-amber-600 text-white shrink-0 mt-0.5">
                  <Mountain className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Dirt Bomb (x3)</span>
                  <span className="text-slate-400 text-[11px]">
                    Constructive ordnance! Deposits a 46px earth mound to build defensive ramparts or bury opponents.
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-cyan-500 text-white shrink-0 mt-0.5">
                  <Disc className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Bouncer / Roller (x3)</span>
                  <span className="text-slate-400 text-[11px]">
                    42 DMG • R=34px. Skips and rolls down mountain ridges and canyon walls up to 3 times before detonating.
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-red-600 text-white shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Tectonic Nuke (x1)</span>
                  <span className="text-slate-400 text-[11px]">
                    80 DMG • R=82px. Devastating strategic warhead that levels entire mountain peaks with screen-shaking seismic fury.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tank Armory & Visual Skins */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <h3 className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Tank Armory &amp; Unlockable Visual Skins
            </h3>
            <p className="text-slate-300">
              Customize each tank's visual chassis, armor plating, track suspension, and cannon barrel in the <strong className="text-white">Tank Armory</strong>. Choose from military camouflage, radar-absorbent obsidian stealth, neon synthwave, heavy siege goliaths, and prestigious 24K imperial gold!
            </p>
            <p className="text-slate-400">
              Unlock special skins by landing direct hits, dealing massive bombardment damage, or achieving match victories.
            </p>
          </div>

          {/* Controls & Keyboard Shortcuts */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div>
                <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">
                  ← / →
                </kbd>{' '}
                Adjust Barrel Angle (-1° / +1°)
              </div>
              <div>
                <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">
                  ↑ / ↓
                </kbd>{' '}
                Adjust Propellant Power (-1% / +1%)
              </div>
              <div>
                <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">
                  SPACE
                </kbd>{' '}
                Fire Active Cannon
              </div>
              <div>
                <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">
                  W
                </kbd>{' '}
                Cycle Ordnance Magazine
              </div>
            </div>
          </div>

          {/* Terms of Service Notice */}
          <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Google Maps Platform Terms of Service Compliance:</strong> TopoTanks stores zero scraped or pre-fetched Google elevation datasets. All cross-sections are queried dynamically in real time via client-side <code className="text-slate-300">ElevationService</code>. If offline or quota-exceeded, a synthetic procedural mathematical curve is synthesized on the fly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
