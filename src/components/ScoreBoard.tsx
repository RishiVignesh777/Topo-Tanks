import React from 'react';
import {
  Volume2,
  VolumeX,
  Globe,
  RotateCcw,
  Bot,
  User,
  HelpCircle,
  Palette,
} from 'lucide-react';
import { AiLevel, Arena, Player } from '../types/game';
import { getSkinById } from '../game/skins';
import { audioService } from '../services/audioService';

interface ScoreBoardProps {
  p1: Player;
  p2: Player;
  activePlayerId: 'p1' | 'p2';
  round: number;
  currentArena: Arena;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenArenaSelector: () => void;
  onResetMatch: () => void;
  onToggleAi: () => void;
  onChangeAiLevel: (level: AiLevel) => void;
  onOpenHelp: () => void;
  onOpenSkinSelector: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  p1,
  p2,
  activePlayerId,
  round,
  currentArena,
  isMuted,
  onToggleMute,
  onOpenArenaSelector,
  onResetMatch,
  onToggleAi,
  onChangeAiLevel,
  onOpenHelp,
  onOpenSkinSelector,
}) => {
  const p1HealthPercent = Math.max(0, p1.health / p1.maxHealth);
  const p2HealthPercent = Math.max(0, p2.health / p2.maxHealth);
  const p1Skin = getSkinById(p1.skinId);
  const p2Skin = getSkinById(p2.skinId);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-2 lg:px-4 lg:py-2.5 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* 2. Center Tactical Controls & Match Info (Top on Mobile, Center on Desktop) */}
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-center gap-1.5 sm:gap-2 order-1 lg:order-2 w-full lg:w-auto pb-1 lg:pb-0">
        {/* Round Badge */}
        <div className="bg-slate-950/80 border border-slate-800 px-2 lg:px-3 py-1 min-h-[44px] rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="text-[9px] font-mono text-slate-400 uppercase leading-none hidden lg:block">
            SALVO
          </span>
          <span className="text-[10px] lg:text-xs font-mono font-bold text-amber-400">
            <span className="lg:hidden">R{round}</span>
            <span className="hidden lg:inline">ROUND #{round}</span>
          </span>
        </div>

        {/* Change Arena Button */}
        <button
          onClick={() => {
            audioService.playUiClick();
            onOpenArenaSelector();
          }}
          className="flex items-center justify-center gap-1.5 min-w-[44px] lg:px-3 py-1.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
          title="Switch Battlefield"
        >
          <Globe className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-emerald-400" />
          <span className="truncate max-w-[120px] hidden lg:inline">{currentArena.name}</span>
        </button>

        {/* Tank Armory & Skins Button */}
        <button
          onClick={() => {
            audioService.playUiClick();
            onOpenSkinSelector();
          }}
          className="flex items-center justify-center gap-1.5 min-w-[44px] lg:px-3 py-1.5 min-h-[44px] rounded-lg bg-purple-950/80 hover:bg-purple-900/90 text-xs font-medium text-purple-200 border border-purple-700/60 shadow transition cursor-pointer shrink-0"
          title="Tank Armory: Custom Visual Skins & Camo"
        >
          <Palette className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-purple-400" />
          <span className="hidden lg:inline font-mono font-semibold">Armory</span>
        </button>

        {/* AI Mode Toggle & Difficulty */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => {
              audioService.playUiClick();
              onToggleAi();
            }}
            className={`flex items-center justify-center gap-1 min-w-[44px] lg:px-2 py-1 min-h-[44px] rounded text-xs font-mono transition cursor-pointer ${
              p2.isAi
                ? 'bg-sky-900/60 text-sky-200 border border-sky-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={p2.isAi ? 'Mode: Player vs AI Bot' : 'Mode: 2 Player Pass-and-Play'}
          >
            {p2.isAi ? <Bot className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-sky-400" /> : <User className="w-4 h-4 lg:w-3.5 lg:h-3.5" />}
            <span className="hidden lg:inline">{p2.isAi ? 'VS CPU' : 'PASS & PLAY'}</span>
          </button>

          {p2.isAi && (
            <select
              value={p2.aiLevel}
              onChange={(e) => {
                audioService.playUiClick();
                onChangeAiLevel(e.target.value as AiLevel);
              }}
              className="bg-slate-900 text-sky-300 text-[10px] font-mono border-l border-slate-800 pl-1.5 pr-1 py-1 min-h-[44px] rounded-r focus:outline-none cursor-pointer"
            >
              <option value="cadet">Cadet</option>
              <option value="veteran">Veteran</option>
              <option value="deadeye">Deadeye</option>
            </select>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Reset Match */}
          <button
            onClick={() => {
              audioService.playUiClick();
              onResetMatch();
            }}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Restart Battle"
            aria-label="Restart Battle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* How to play / rules */}
          <button
            onClick={() => {
              audioService.playUiClick();
              onOpenHelp();
            }}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Help & Weapon Manual"
            aria-label="Help & Weapon Manual"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Players Container (Bottom on Mobile, split on Desktop) */}
      <div className="flex w-full lg:w-auto lg:contents items-center justify-between gap-2 order-2 lg:order-none">
        {/* 1. Player 1 Status Card (Red / Commander Alpha) */}
        <div
          onClick={() => {
            audioService.playUiClick();
            onOpenSkinSelector();
          }}
          className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-lg border transition-all flex-1 lg:flex-none lg:order-1 cursor-pointer hover:border-red-400 group ${
            activePlayerId === 'p1'
              ? 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/40'
              : 'bg-slate-950/60 border-slate-800'
          }`}
          title="Click to customize Player 1 tank skin & armory"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold font-mono text-[10px] sm:text-xs shadow shrink-0 group-hover:scale-105 transition">
            P1
          </div>
          <div className="flex flex-col flex-1 min-w-0 lg:min-w-[140px]">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                {p1.name}
              </span>
              <span className="text-[9px] sm:text-[11px] font-mono font-bold text-red-400 shrink-0">
                {p1.health} HP
              </span>
            </div>
            {/* Skin subtitle */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="truncate max-w-[90px] text-red-300/80 group-hover:text-red-200">
                {p1Skin.name}
              </span>
              <span className="text-[8px] text-slate-500 hidden sm:inline">SKIN</span>
            </div>
            {/* Health Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                style={{ width: `${p1HealthPercent * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Player 2 Status Card (Blue / Commander Bravo or CPU) */}
        <div
          onClick={() => {
            audioService.playUiClick();
            onOpenSkinSelector();
          }}
          className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-lg border transition-all flex-1 lg:flex-none lg:order-3 cursor-pointer hover:border-sky-400 group ${
            activePlayerId === 'p2'
              ? 'bg-sky-950/40 border-sky-500/80 shadow-md shadow-sky-950/40'
              : 'bg-slate-950/60 border-slate-800'
          }`}
          title="Click to customize Player 2 tank skin & armory"
        >
          <div className="flex flex-col flex-1 min-w-0 lg:min-w-[140px] text-right">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-[9px] sm:text-[11px] font-mono font-bold text-sky-400 shrink-0">
                {p2.health} HP
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-200 truncate">
                {p2.name}
              </span>
            </div>
            {/* Skin subtitle */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="text-[8px] text-slate-500 hidden sm:inline">SKIN</span>
              <span className="truncate max-w-[90px] text-sky-300/80 group-hover:text-sky-200">
                {p2Skin.name}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-slate-700/60 flex justify-end">
              <div
                className="h-full bg-gradient-to-l from-sky-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${p2HealthPercent * 100}%` }}
              />
            </div>
          </div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold font-mono text-[10px] sm:text-xs shadow shrink-0 group-hover:scale-105 transition">
            {p2.isAi ? <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 'P2'}
          </div>
        </div>
      </div>
    </div>
  );
};
