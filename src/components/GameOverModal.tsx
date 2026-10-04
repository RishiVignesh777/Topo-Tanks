import React from 'react';
import { Trophy, RotateCcw, Globe, Award, Target, Flame, Layers, Palette } from 'lucide-react';
import { MatchStats, Player } from '../types/game';
import { audioService } from '../services/audioService';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Player | null;
  stats: MatchStats;
  onRematch: () => void;
  onSelectArena: () => void;
  onOpenArmory?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  stats,
  onRematch,
  onSelectArena,
  onOpenArmory,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onSelectArena();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSelectArena]);

  if (!isOpen || !winner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-center">
        {/* Victory Header Banner */}
        <div
          className="py-8 px-6 flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, ${winner.color}33, transparent)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-3 shadow-xl border border-white/20"
            style={{ backgroundColor: winner.color }}
          >
            <Trophy className="w-9 h-9" />
          </div>

          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            VICTORY ACHIEVED
          </span>
          <h2 id="game-over-title" className="text-2xl font-black text-white mt-1">
            {winner.name} WINS!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs">
            Opposing artillery battery completely neutralized and outmaneuvered across the topographic battlefield.
          </p>
        </div>

        {/* Combat Telemetry / After-Action Report */}
        <div className="p-6 bg-slate-950/60 border-y border-slate-800 flex flex-col gap-3">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider text-left">
            After-Action Ballistic Telemetry
          </span>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" /> DIRECT HITS
              </span>
              <span className="text-base font-mono font-bold text-slate-100">
                {stats.p1DirectHits + stats.p2DirectHits}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" /> TOTAL DAMAGE
              </span>
              <span className="text-base font-mono font-bold text-slate-100">
                {stats.p1DamageDealt + stats.p2DamageDealt} HP
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" /> CRATERS CARVED
              </span>
              <span className="text-base font-mono font-bold text-slate-100">
                {stats.terrainDisplacedCraters}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-sky-400" /> ROUNDS FOUGHT
              </span>
              <span className="text-base font-mono font-bold text-slate-100">
                {stats.turnNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              audioService.playUiClick();
              onRematch();
            }}
            className="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-mono font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            REMATCH
          </button>

          {onOpenArmory && (
            <button
              onClick={() => {
                audioService.playUiClick();
                onOpenArmory();
              }}
              className="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-mono font-bold text-xs bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/70 flex items-center justify-center gap-2 shadow transition cursor-pointer"
            >
              <Palette className="w-4 h-4 text-purple-400" />
              ARMORY
            </button>
          )}

          <button
            onClick={() => {
              audioService.playUiClick();
              onSelectArena();
            }}
            className="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-mono font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            NEW THEATER
          </button>
        </div>
      </div>
    </div>
  );
};
