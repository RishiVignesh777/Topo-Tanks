import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  Palette,
  Crosshair,
  Award,
  Zap,
} from 'lucide-react';
import { Player } from '../types/game';
import {
  TANK_SKINS,
  TankSkin,
  SkinRarity,
  getUnlockedSkinIds,
  unlockSkin,
  unlockAllSkins,
  getSkinById,
} from '../game/skins';
import { drawTankSprite } from '../game/tankRenderer';
import { audioService } from '../services/audioService';

interface SkinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: [Player, Player];
  onSelectSkin: (playerId: 'p1' | 'p2', skinId: string) => void;
}

const RARITY_COLORS: Record<SkinRarity, { border: string; bg: string; text: string; badge: string }> = {
  common: {
    border: 'border-slate-600',
    bg: 'bg-slate-800/60',
    text: 'text-slate-300',
    badge: 'bg-slate-700 text-slate-200 border-slate-600',
  },
  rare: {
    border: 'border-sky-500/70',
    bg: 'bg-sky-950/30',
    text: 'text-sky-300',
    badge: 'bg-sky-900/80 text-sky-200 border-sky-600',
  },
  epic: {
    border: 'border-purple-500/70',
    bg: 'bg-purple-950/30',
    text: 'text-purple-300',
    badge: 'bg-purple-900/80 text-purple-200 border-purple-600',
  },
  legendary: {
    border: 'border-amber-400',
    bg: 'bg-amber-950/30',
    text: 'text-amber-300',
    badge: 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold border-amber-300',
  },
};

export const SkinSelectorModal: React.FC<SkinSelectorModalProps> = ({
  isOpen,
  onClose,
  players,
  onSelectSkin,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<'p1' | 'p2'>('p1');
  const [previewSkinId, setPreviewSkinId] = useState<string>(players[0].skinId || 'classic');
  const [unlockedIds, setUnlockedIds] = useState<string[]>(getUnlockedSkinIds());
  const [previewAngle, setPreviewAngle] = useState<number>(45);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state when dialog opens or active player changes
  useEffect(() => {
    if (isOpen) {
      setUnlockedIds(getUnlockedSkinIds());
      const curPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];
      setPreviewSkinId(curPlayer.skinId || 'classic');
    }
  }, [isOpen, selectedPlayerId, players]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live 2D Tank Preview Loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localTime = 0;

    const render = () => {
      localTime += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle tactical grid background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Decorative ground ridge under tank
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 24);
      ctx.lineTo(canvas.width, canvas.height - 24);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 24);
      ctx.lineTo(canvas.width, canvas.height - 24);
      ctx.stroke();

      // Current player customized model
      const targetPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];
      const previewPlayer: Player = {
        ...targetPlayer,
        position: { x: canvas.width / 2, y: canvas.height - 25 },
        tiltAngle: 0,
        angle: previewAngle,
        skinId: previewSkinId,
      };

      // Draw custom animated tank sprite
      drawTankSprite({
        ctx,
        player: previewPlayer,
        isActive: true,
        customScale: 2.2,
        overrideAngle: previewAngle,
        overrideTilt: 0,
        showHealthBar: false,
        timeMs: localTime,
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, previewSkinId, selectedPlayerId, previewAngle, players]);

  if (!isOpen) return null;

  const targetPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];
  const activeEquippedId = targetPlayer.skinId || 'classic';
  const previewSkin = getSkinById(previewSkinId);
  const isPreviewUnlocked = unlockedIds.includes(previewSkinId);
  const isPreviewEquipped = activeEquippedId === previewSkinId;

  const handleEquip = (skinId: string) => {
    audioService.playUiClick();
    onSelectSkin(selectedPlayerId, skinId);
    setPreviewSkinId(skinId);
  };

  const handleUnlockAndEquip = (skinId: string) => {
    audioService.playUiClick();
    unlockSkin(skinId);
    setUnlockedIds(getUnlockedSkinIds());
    onSelectSkin(selectedPlayerId, skinId);
    setPreviewSkinId(skinId);
  };

  const handleUnlockAll = () => {
    audioService.playUiClick();
    unlockAllSkins();
    setUnlockedIds(getUnlockedSkinIds());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/85">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60 shadow">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="skin-modal-title" className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Tank Armory &amp; Camouflage
              </h2>
              <p className="text-xs text-slate-400">
                Customize battle chassis, camo patterns, track suspensions, and cannon barrels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUnlockAll}
              className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              title="Instantly unlock all special tank skins"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unlock All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Armory"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Switcher Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              audioService.playUiClick();
              setSelectedPlayerId('p1');
              setPreviewSkinId(players[0].skinId || 'classic');
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              selectedPlayerId === 'p1'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>PLAYER 1: {players[0].name.toUpperCase()}</span>
            <span className="text-[10px] text-slate-500">
              ({getSkinById(players[0].skinId).name})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playUiClick();
              setSelectedPlayerId('p2');
              setPreviewSkinId(players[1].skinId || 'classic');
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              selectedPlayerId === 'p2'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>PLAYER 2: {players[1].name.toUpperCase()}</span>
            <span className="text-[10px] text-slate-500">
              ({getSkinById(players[1].skinId).name})
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
          {/* LEFT: Live Interactive 2D Tank Preview & Lore */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3">
            {/* 2D Canvas Stage */}
            <div className="relative w-full h-[180px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={320}
                height={180}
                className="w-full h-full block"
              />

              {/* Rarity & Category floating pill */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
                    RARITY_COLORS[previewSkin.rarity].badge
                  }`}
                >
                  {previewSkin.rarity}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300 uppercase">
                  {previewSkin.category}
                </span>
              </div>

              {/* Angle rotation control */}
              <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-xs border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>{previewAngle}°</span>
              </div>
            </div>

            {/* Elevation Angle Slider */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>CANNON ELEVATION</span>
                <span className="text-amber-400 font-bold">{previewAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={previewAngle}
                onChange={(e) => setPreviewAngle(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Skin Metadata & Lore */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {previewSkin.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    {previewSkin.tagline}
                  </p>
                </div>

                {isPreviewEquipped ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> EQUIPPED
                  </span>
                ) : isPreviewUnlocked ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/60 text-sky-300 font-semibold flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> UNLOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {previewSkin.description}
              </p>

              <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Unlock Requirement
                </span>
                <span className="text-xs text-amber-300/90 font-mono">
                  {previewSkin.unlockCondition}
                </span>
              </div>

              {/* Action Equip / Unlock Button */}
              <div className="pt-2">
                {isPreviewEquipped ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 flex items-center justify-center gap-1.5 opacity-80 cursor-default"
                  >
                    <Check className="w-4 h-4" /> Already Equipped
                  </button>
                ) : isPreviewUnlocked ? (
                  <button
                    type="button"
                    onClick={() => handleEquip(previewSkinId)}
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Equip {previewSkin.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnlockAndEquip(previewSkinId)}
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Unlock &amp; Equip Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Grid of All Armory Skins */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Armory Bays ({unlockedIds.length} / {TANK_SKINS.length} Unlocked)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Click any skin to preview &amp; equip
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TANK_SKINS.map((skin) => {
                const isUnlocked = unlockedIds.includes(skin.id);
                const isEquipped = activeEquippedId === skin.id;
                const isSelected = previewSkinId === skin.id;
                const rarityStyle = RARITY_COLORS[skin.rarity];

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      audioService.playUiClick();
                      setPreviewSkinId(skin.id);
                    }}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 border-emerald-500 bg-slate-800/90'
                        : isEquipped
                        ? 'border-emerald-500/80 bg-slate-900/90 shadow'
                        : `${rarityStyle.border} ${rarityStyle.bg} hover:border-slate-500`
                    }`}
                  >
                    {/* Top Row: Name & Badges */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-100 flex items-center gap-1">
                          {skin.name}
                          {isEquipped && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 py-0.2 rounded font-mono font-semibold">
                              EQUIPPED
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {skin.tagline}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${rarityStyle.badge}`}
                        >
                          {skin.rarity}
                        </span>
                        {!isUnlocked && (
                          <div className="p-1 rounded bg-slate-900 border border-slate-700 text-rose-400">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Feature highlights */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="bg-slate-950/70 border border-slate-800 px-1.5 py-0.5 rounded">
                        {skin.visuals.chassisStyle.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-950/70 border border-slate-800 px-1.5 py-0.5 rounded">
                        {skin.visuals.barrelStyle.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Bottom Row: Quick Select / Equip */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                      <span className="text-slate-400 truncate max-w-[170px]">
                        {skin.unlockCondition}
                      </span>

                      {isEquipped ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquip(skin.id);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 transition font-bold cursor-pointer"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockAndEquip(skin.id);
                          }}
                          className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-700/60 transition font-bold cursor-pointer"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/90 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Skins automatically sync to tactical canvas and artillery firing mechanics.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            Close Armory
          </button>
        </div>
      </div>
    </div>
  );
};
