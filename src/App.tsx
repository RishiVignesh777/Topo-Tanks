import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  AiLevel,
  Arena,
  Explosion,
  FloatingText,
  GameStatus,
  MatchStats,
  Particle,
  Player,
  Projectile,
  TerrainProfile,
  Wind,
  calculateArenaBoundaries,
} from './types/game';
import { PRESET_ARENAS } from './data/presetArenas';
import {
  fetchLiveElevationProfile,
  isGoogleMapsEnabled,
  MAPS_API_KEY,
} from './services/elevationService';
import { audioService } from './services/audioService';
import { createDefaultInventory, WEAPONS } from './game/weapons';
import {
  findGentleSlopePosition,
  getInterpolatedTerrainHeight,
  getTerrainSlopeAngle,
  initHeightfieldFromProfile,
  stabilizeTerrainSlopes,
  TERRAIN_HEIGHT,
  TERRAIN_WIDTH,
} from './game/terrain';
import { calculateLaunchVelocity, stepPhysics } from './game/physics';
import { calculateAiShot } from './game/ai';

import { ScoreBoard } from './components/ScoreBoard';
import { GameCanvas } from './components/GameCanvas';
import { ControlPanel } from './components/ControlPanel';
import { ArenaSelector } from './components/ArenaSelector';
import { GameOverModal } from './components/GameOverModal';
import { HelpModal } from './components/HelpModal';

export function App() {
  // Current Arena & Topographic Profile
  const [currentArena, setCurrentArena] = useState<Arena>(PRESET_ARENAS[0]);
  const [terrainProfile, setTerrainProfile] = useState<TerrainProfile | null>(null);
  const [heights, setHeights] = useState<number[]>([]);
  const [isLoadingTerrain, setIsLoadingTerrain] = useState<boolean>(true);

  // Match State
  const [round, setRound] = useState<number>(1);
  const [activePlayerId, setActivePlayerId] = useState<'p1' | 'p2'>('p1');
  const [gameStatus, setGameStatus] = useState<GameStatus>('loading_terrain');
  const [wind, setWind] = useState<Wind>({ speed: 12 });
  const [screenShake, setScreenShake] = useState<number>(0);
  const [isCadetAimActive, setIsCadetAimActive] = useState<boolean>(false);
  const isCadetAimActiveRef = useRef<boolean>(false);

  // Players
  const [players, setPlayers] = useState<[Player, Player]>([
    {
      id: 'p1',
      name: 'Commander Alpha',
      color: '#ef4444',
      secondaryColor: '#991b1b',
      health: 100,
      maxHealth: 100,
      angle: 45,
      power: 60,
      position: { x: 140, y: 380 },
      tiltAngle: 0,
      activeWeaponId: 'standard',
      inventory: createDefaultInventory(),
      score: 0,
      isAi: false,
      aiLevel: 'veteran',
      cadetUsesRemaining: 3,
    },
    {
      id: 'p2',
      name: 'General CPU',
      color: '#38bdf8',
      secondaryColor: '#0369a1',
      health: 100,
      maxHealth: 100,
      angle: 135,
      power: 60,
      position: { x: 860, y: 380 },
      tiltAngle: 0,
      activeWeaponId: 'standard',
      inventory: createDefaultInventory(),
      score: 0,
      isAi: true,
      aiLevel: 'veteran',
      cadetUsesRemaining: 3,
    },
  ]);

  // Dynamic Objects
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Match Telemetry & Modals
  const [matchStats, setMatchStats] = useState<MatchStats>({
    turnNumber: 1,
    p1DirectHits: 0,
    p2DirectHits: 0,
    p1DamageDealt: 0,
    p2DamageDealt: 0,
    terrainDisplacedCraters: 0,
  });
  const [winner, setWinner] = useState<Player | null>(null);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isArenaSelectorOpen, setIsArenaSelectorOpen] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(audioService.getIsMuted());

  // Refs for requestAnimationFrame loop to access latest mutable state
  const stateRef = useRef({
    currentArena,
    terrainProfile,
    heights,
    players,
    projectiles,
    explosions,
    particles,
    floatingTexts,
    wind,
    gameStatus,
    activePlayerId,
    screenShake,
    round,
    matchStats,
    isCadetAimActive,
  });

  useEffect(() => {
    stateRef.current = {
      currentArena,
      terrainProfile,
      heights,
      players,
      projectiles,
      explosions,
      particles,
      floatingTexts,
      wind,
      gameStatus,
      activePlayerId,
      screenShake,
      round,
      matchStats,
      isCadetAimActive,
    };
  });

  // -------------------------------------------------------------------------
  // 1. Load Live Topographic Elevation & Initialize Battlefield
  // -------------------------------------------------------------------------
  const loadBattlefield = useCallback(async (arena: Arena) => {
    setIsLoadingTerrain(true);
    setGameStatus('loading_terrain');
    setProjectiles([]);
    setExplosions([]);
    setParticles([]);
    setFloatingTexts([]);

    try {
      const boundaries = calculateArenaBoundaries(
        arena.p1Coords,
        arena.p2Coords,
        0.16
      );

      const profile = await fetchLiveElevationProfile(
        boundaries.boundaryStart,
        boundaries.boundaryEnd,
        arena
      );
      setTerrainProfile(profile);

      const newHeights = initHeightfieldFromProfile(
        profile,
        TERRAIN_WIDTH,
        TERRAIN_HEIGHT
      );
      setHeights(newHeights);

      // Settle initial slopes
      stabilizeTerrainSlopes(newHeights, 2.2, 5);

      // Find gentle launch positions for tanks at the exact artillery locations (p1TerrainRatio and p2TerrainRatio)
      const p1X = findGentleSlopePosition(boundaries.p1TerrainRatio, newHeights, 15);
      const p2X = findGentleSlopePosition(boundaries.p2TerrainRatio, newHeights, 15);

      const p1Y = getInterpolatedTerrainHeight(p1X, newHeights);
      const p2Y = getInterpolatedTerrainHeight(p2X, newHeights);

      const p1Tilt = getTerrainSlopeAngle(p1X, newHeights);
      const p2Tilt = getTerrainSlopeAngle(p2X, newHeights);

      setPlayers((prev) => [
        {
          ...prev[0],
          health: 100,
          position: { x: p1X, y: p1Y },
          tiltAngle: p1Tilt,
          angle: 45,
          power: 60,
          inventory: createDefaultInventory(),
          activeWeaponId: 'standard',
          cadetUsesRemaining: 3,
        },
        {
          ...prev[1],
          health: 100,
          position: { x: p2X, y: p2Y },
          tiltAngle: p2Tilt,
          angle: 135,
          power: 60,
          inventory: createDefaultInventory(),
          activeWeaponId: 'standard',
          cadetUsesRemaining: 3,
        },
      ]);
      isCadetAimActiveRef.current = false;
      setIsCadetAimActive(false);

      // Fresh wind (-35 to +35 m/s)
      setWind({ speed: Math.round(Math.random() * 70 - 35) });
      setActivePlayerId('p1');
      setRound(1);
      setWinner(null);
      setIsGameOverOpen(false);
      setGameStatus('aiming');
    } catch (err) {
      console.error('Failed to load battlefield elevation:', err);
    } finally {
      setIsLoadingTerrain(false);
    }
  }, []);

  // Initial mount load
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      void loadBattlefield(currentArena);
    }
  }, [currentArena, loadBattlefield]);

  const handleSelectArena = useCallback(
    (arena: Arena) => {
      setCurrentArena(arena);
      void loadBattlefield(arena);
    },
    [loadBattlefield]
  );

  // -------------------------------------------------------------------------
  // 2. Cannon Fire Execution
  // -------------------------------------------------------------------------
  const handleFire = useCallback(() => {
    const { gameStatus: currentStatus, activePlayerId: curId, players: curPlayers } =
      stateRef.current;
    if (currentStatus !== 'aiming') return;

    const activePlayer = curPlayers.find((p) => p.id === curId);
    if (!activePlayer) return;

    const weapon = WEAPONS[activePlayer.activeWeaponId] || WEAPONS.standard;
    const currentAmmo = activePlayer.inventory[weapon.id];
    if (currentAmmo === 0) return; // Out of ammo

    // Play cannon blast audio
    audioService.playFireSound(weapon.specialType);

    // Consume ammo (if not infinite)
    if (currentAmmo > 0) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === curId
            ? {
                ...p,
                inventory: {
                  ...p.inventory,
                  [weapon.id]: p.inventory[weapon.id] - 1,
                },
              }
            : p
        ) as [Player, Player]
      );
    }

    // Launch coordinates from cannon barrel tip
    // The turret pivot in tank-local coordinates is at (0, -11).
    // In world coordinates with chassis tilt:
    const cosTilt = Math.cos(activePlayer.tiltAngle);
    const sinTilt = Math.sin(activePlayer.tiltAngle);
    const pivotX = activePlayer.position.x + 11 * sinTilt;
    const pivotY = activePlayer.position.y - 11 * cosTilt;

    const barrelRad = (-activePlayer.angle * Math.PI) / 180;
    const barrelLength = 22;
    const launchX = pivotX + Math.cos(barrelRad) * barrelLength;
    const launchY = pivotY + Math.sin(barrelRad) * barrelLength;

    const { vx, vy } = calculateLaunchVelocity(
      activePlayer.angle,
      activePlayer.power
    );

    const newProjectile: Projectile = {
      id: `proj_${Date.now()}`,
      x: launchX,
      y: launchY,
      vx,
      vy,
      weapon,
      playerId: curId,
      trail: [],
      age: 0,
      bouncersLeft: weapon.specialType === 'bouncer' ? 3 : 0,
    };

    setProjectiles([newProjectile]);
    setGameStatus('firing');

    // Consume Cadet Aim Guide charge if active and deactivate guide
    const wasCadetActive =
      isCadetAimActiveRef.current || stateRef.current.isCadetAimActive;
    if (wasCadetActive) {
      isCadetAimActiveRef.current = false;
      setIsCadetAimActive(false);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === curId
            ? {
                ...p,
                cadetUsesRemaining: Math.max(0, p.cadetUsesRemaining - 1),
              }
            : p
        ) as [Player, Player]
      );
    }
  }, []);

  const handleActivateCadetAimGuide = useCallback(() => {
    const { players: curPlayers, activePlayerId: curId, gameStatus: curStatus } =
      stateRef.current;
    if (curStatus !== 'aiming') return;
    const curPlayer = curPlayers.find((p) => p.id === curId);
    if (!curPlayer || curPlayer.isAi) return;

    if (curPlayer.cadetUsesRemaining > 0) {
      isCadetAimActiveRef.current = true;
      setIsCadetAimActive(true);
    }
  }, []);

  // -------------------------------------------------------------------------
  // 3. AI Turn Execution Timer (Fast, snappy response: fires in ~900ms, max 2.5s)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (gameStatus !== 'aiming') return;
    const current = stateRef.current;
    const activePlayer = current.players.find((p) => p.id === activePlayerId);
    if (!activePlayer || !activePlayer.isAi) return;

    const opponent = current.players.find((p) => p.id !== activePlayerId);
    if (!opponent) return;

    let fireTimer: ReturnType<typeof setTimeout> | null = null;

    // Step 1: Rapid tactical calculation & visual aim adjustment (350ms)
    const aimTimer = setTimeout(() => {
      const liveState = stateRef.current;
      const liveAiPlayer = liveState.players.find((p) => p.id === activePlayerId);
      const liveOpponent = liveState.players.find((p) => p.id !== activePlayerId);
      if (!liveAiPlayer || !liveOpponent || liveState.gameStatus !== 'aiming') return;

      const decision = calculateAiShot(
        liveAiPlayer,
        liveOpponent,
        liveState.wind,
        liveState.heights,
        liveAiPlayer.aiLevel
      );

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === activePlayerId
            ? {
                ...p,
                angle: decision.angle,
                power: decision.power,
                activeWeaponId: decision.weaponId,
              }
            : p
        ) as [Player, Player]
      );

      // Step 2: Trigger cannon fire at 900ms total (< 1 second total delay)
      fireTimer = setTimeout(() => {
        if (stateRef.current.gameStatus === 'aiming') {
          handleFire();
        }
      }, 550);
    }, 350);

    // Watchdog safety timer: Force fire at 2.5s if not fired already (never exceeds 3s)
    const watchdogTimer = setTimeout(() => {
      if (
        stateRef.current.gameStatus === 'aiming' &&
        stateRef.current.activePlayerId === activePlayerId
      ) {
        handleFire();
      }
    }, 2500);

    return () => {
      clearTimeout(aimTimer);
      if (fireTimer) clearTimeout(fireTimer);
      clearTimeout(watchdogTimer);
    };
  }, [gameStatus, activePlayerId, round, handleFire]);

  // -------------------------------------------------------------------------
  // 4. Main Ballistics, Terrain Avalanche, and Combat Animation Loop
  // -------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.08, (time - lastTime) / 1000);
      lastTime = time;

      const current = stateRef.current;

      // 4a. Step Projectile Physics
      if (current.projectiles.length > 0) {
        const result = stepPhysics(
          current.projectiles,
          current.heights,
          current.players,
          current.wind,
          dt
        );

        // Update projectiles
        setProjectiles(result.activeProjectiles);

        // Append new explosions and particles
        if (result.newExplosions.length > 0) {
          setExplosions((prev) => [...prev, ...result.newExplosions]);
          const maxRadius = Math.max(
            ...result.newExplosions.map((e) => e.maxRadius)
          );
          setScreenShake(maxRadius > 60 ? 1.0 : maxRadius > 35 ? 0.5 : 0.25);
        }

        if (result.newParticles.length > 0) {
          setParticles((prev) => [...prev, ...result.newParticles].slice(-180));
        }

        if (result.newFloatingTexts.length > 0) {
          setFloatingTexts((prev) => [...prev, ...result.newFloatingTexts]);
        }

        // Apply Player Damage
        if (result.damagedPlayers.length > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              const hit = result.damagedPlayers.find((dp) => dp.playerId === p.id);
              if (!hit) return p;
              const newHealth = Math.max(0, p.health - hit.damage);
              return { ...p, health: newHealth };
            }) as [Player, Player]
          );

          // Update match stats
          setMatchStats((prev) => {
            let p1Hits = prev.p1DirectHits;
            let p2Hits = prev.p2DirectHits;
            let p1Dmg = prev.p1DamageDealt;
            let p2Dmg = prev.p2DamageDealt;

            result.damagedPlayers.forEach((hit) => {
              if (hit.playerId === 'p2') {
                p1Hits++;
                p1Dmg += hit.damage;
              } else {
                p2Hits++;
                p2Dmg += hit.damage;
              }
            });

            return {
              ...prev,
              p1DirectHits: p1Hits,
              p2DirectHits: p2Hits,
              p1DamageDealt: p1Dmg,
              p2DamageDealt: p2Dmg,
            };
          });
        }

        // Soil Avalanche and Slope Stabilization
        if (result.terrainModified) {
          setMatchStats((prev) => ({
            ...prev,
            terrainDisplacedCraters: prev.terrainDisplacedCraters + 1,
          }));

          stabilizeTerrainSlopes(current.heights, 1.6, 6);
          setHeights([...current.heights]);
        }
      }

      // Continuous Tank Ground Settling & Fall Physics
      setPlayers((prev) =>
        prev.map((p) => {
          const groundY = getInterpolatedTerrainHeight(p.position.x, current.heights);
          const drop = groundY - p.position.y;
          const newTilt = getTerrainSlopeAngle(p.position.x, current.heights);

          if (drop > 1) {
            // Tank falling towards lower crater floor
            const step = Math.min(drop, Math.max(4, drop * 0.35 + 2));
            const nextY = p.position.y + step;
            let fallDmg = 0;

            // Apply fall damage when reaching ground from a deep drop (> 38px)
            if (drop > 38 && nextY >= groundY - 2) {
              fallDmg = Math.round((drop - 38) * 0.75);
              audioService.playSlideSound();
              setFloatingTexts((f) => [
                ...f,
                {
                  id: `fall_${Date.now()}_${Math.random()}`,
                  text: `FALL -${fallDmg}`,
                  x: p.position.x,
                  y: p.position.y - 20,
                  color: '#f87171',
                  opacity: 1,
                  vy: -35,
                },
              ]);
            }

            return {
              ...p,
              position: { x: p.position.x, y: nextY },
              tiltAngle: newTilt,
              health: Math.max(0, p.health - fallDmg),
            };
          } else if (drop < -1) {
            // Tank rising atop additive soil mound
            return {
              ...p,
              position: { x: p.position.x, y: Math.max(groundY, p.position.y + drop * 0.4) },
              tiltAngle: newTilt,
            };
          } else if (Math.abs(p.tiltAngle - newTilt) > 0.02) {
            return {
              ...p,
              tiltAngle: newTilt,
            };
          }
          return p;
        }) as [Player, Player]
      );

      // 4b. Update Explosions
      if (current.explosions.length > 0) {
        setExplosions((prev) =>
          prev
            .map((exp) => ({
              ...exp,
              progress: exp.progress + dt / exp.duration,
            }))
            .filter((exp) => exp.progress < 1)
        );
      }

      // 4c. Update Particles
      if (current.particles.length > 0) {
        setParticles((prev) =>
          prev
            .map((part) => ({
              ...part,
              x: part.x + part.vx * dt,
              y: part.y + part.vy * dt,
              life: part.life - dt,
            }))
            .filter((part) => part.life > 0)
        );
      }

      // 4d. Update Floating Texts
      if (current.floatingTexts.length > 0) {
        setFloatingTexts((prev) =>
          prev
            .map((txt) => ({
              ...txt,
              y: txt.y + txt.vy * dt,
              opacity: txt.opacity - dt * 0.9,
            }))
            .filter((txt) => txt.opacity > 0)
        );
      }

      // 4e. Decay Screen Shake
      if (current.screenShake > 0) {
        setScreenShake((prev) => Math.max(0, prev - dt * 2.8));
      }

      // 4f. Resolve End of Turn when all animations and tank settling complete
      const tanksSettled = current.players.every((p) => {
        const groundY = getInterpolatedTerrainHeight(p.position.x, current.heights);
        return Math.abs(groundY - p.position.y) <= 2;
      });

      if (
        current.gameStatus === 'firing' &&
        current.projectiles.length === 0 &&
        current.explosions.length === 0 &&
        tanksSettled
      ) {
        // Check for Match Winner
        const p1Dead = current.players[0].health <= 0;
        const p2Dead = current.players[1].health <= 0;

        if (p1Dead || p2Dead) {
          setGameStatus('game_over');
          let victoriousPlayer = current.players[0];
          if (p1Dead && !p2Dead) victoriousPlayer = current.players[1];
          else if (!p1Dead && p2Dead) victoriousPlayer = current.players[0];
          else victoriousPlayer = current.players[0]; // Tie fallback

          setWinner(victoriousPlayer);
          setIsGameOverOpen(true);
          audioService.playVictorySound();
        } else {
          // Switch Turn
          const nextId = current.activePlayerId === 'p1' ? 'p2' : 'p1';
          setActivePlayerId(nextId);
          isCadetAimActiveRef.current = false;
          setIsCadetAimActive(false);

          // Reset depleted active weapon to standard shell
          setPlayers((prev) =>
            prev.map((p) =>
              p.inventory[p.activeWeaponId] === 0
                ? { ...p, activeWeaponId: 'standard' }
                : p
            ) as [Player, Player]
          );

          if (nextId === 'p1') {
            setRound((r) => r + 1);
            setMatchStats((s) => ({ ...s, turnNumber: s.turnNumber + 1 }));
          }

          // Weather shift: modify wind speed slightly
          setWind((w) => {
            const delta = Math.round(Math.random() * 24 - 12);
            const newSpeed = Math.max(-50, Math.min(50, w.speed + delta));
            return { speed: newSpeed };
          });

          setGameStatus('aiming');
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // -------------------------------------------------------------------------
  // 5. Keyboard Navigation & Tactical Shortcuts
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or modals
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        isArenaSelectorOpen ||
        isGameOverOpen ||
        isHelpOpen
      ) {
        return;
      }

      const { gameStatus: curStatus, activePlayerId: curId, players: curPlayers } =
        stateRef.current;
      if (curStatus !== 'aiming') return;

      const activePlayer = curPlayers.find((p) => p.id === curId);
      if (!activePlayer || activePlayer.isAi) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === curId ? { ...p, angle: Math.max(0, p.angle - 1) } : p
          ) as [Player, Player]
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === curId ? { ...p, angle: Math.min(180, p.angle + 1) } : p
          ) as [Player, Player]
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === curId ? { ...p, power: Math.min(100, p.power + 1) } : p
          ) as [Player, Player]
        );
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === curId ? { ...p, power: Math.max(1, p.power - 1) } : p
          ) as [Player, Player]
        );
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFire();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        // Cycle active weapon to next available in inventory
        const weaponKeys = Object.keys(WEAPONS);
        const currentIdx = weaponKeys.indexOf(activePlayer.activeWeaponId);
        for (let i = 1; i <= weaponKeys.length; i++) {
          const nextKey = weaponKeys[(currentIdx + i) % weaponKeys.length];
          const ammo = activePlayer.inventory[nextKey] ?? 0;
          if (ammo !== 0) {
            audioService.playUiClick();
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === curId ? { ...p, activeWeaponId: nextKey } : p
              ) as [Player, Player]
            );
            break;
          }
        }
      } else if (e.key === 'g' || e.key === 'G' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleActivateCadetAimGuide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArenaSelectorOpen, isGameOverOpen, isHelpOpen, handleFire, handleActivateCadetAimGuide]);

  // Current active player object
  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];
  const opponentPlayer = players.find((p) => p.id !== activePlayerId) || players[1];

  const appContent = (
    <div className="flex flex-col min-h-[100dvh] lg:h-screen lg:overflow-hidden w-full bg-slate-950 text-slate-100 overflow-x-hidden select-none p-2 sm:p-3 gap-2 sm:gap-3">
      {/* Top Score & Match Control Header */}
      <ScoreBoard
        p1={players[0]}
        p2={players[1]}
        activePlayerId={activePlayerId}
        round={round}
        currentArena={currentArena}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(audioService.toggleMute())}
        onOpenArenaSelector={() => setIsArenaSelectorOpen(true)}
        onResetMatch={() => loadBattlefield(currentArena)}
        onToggleAi={() =>
          setPlayers((prev) => [
            prev[0],
            {
              ...prev[1],
              name: !prev[1].isAi ? 'General CPU' : 'Commander Bravo',
              isAi: !prev[1].isAi,
            },
          ])
        }
        onChangeAiLevel={(level: AiLevel) =>
          setPlayers((prev) => [
            prev[0],
            { ...prev[1], aiLevel: level },
          ])
        }
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Center Viewport: Clean, Unobstructed Destructible Topographic Canvas */}
      <div className="relative flex-1 w-full min-h-[250px] lg:min-h-0 rounded-xl overflow-hidden flex flex-col">
        <GameCanvas
          heights={heights}
          players={players}
          activePlayerId={activePlayerId}
          projectiles={projectiles}
          explosions={explosions}
          particles={particles}
          floatingTexts={floatingTexts}
          wind={wind}
          arenaId={currentArena.id}
          isAiming={gameStatus === 'aiming'}
          isCadetAimActive={isCadetAimActive}
          screenShake={screenShake}
        />
      </div>

      {/* Bottom Fire Control Console with Integrated Topology Metrics & Satellite MiniMap */}
      <ControlPanel
        player={activePlayer}
        opponent={opponentPlayer}
        wind={wind}
        gameStatus={gameStatus}
        onAngleChange={(angle) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === activePlayerId ? { ...p, angle } : p
            ) as [Player, Player]
          )
        }
        onPowerChange={(power) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === activePlayerId ? { ...p, power } : p
            ) as [Player, Player]
          )
        }
        onSelectWeapon={(weaponId) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === activePlayerId ? { ...p, activeWeaponId: weaponId } : p
            ) as [Player, Player]
          )
        }
        onFire={handleFire}
        arena={currentArena}
        terrainProfile={terrainProfile}
        isLoadingTerrain={isLoadingTerrain}
        p1Health={players[0].health}
        p2Health={players[1].health}
        isCadetAimActive={isCadetAimActive}
        onActivateCadetAimGuide={handleActivateCadetAimGuide}
      />

      {/* Modals */}
      <ArenaSelector
        currentArena={currentArena}
        isOpen={isArenaSelectorOpen}
        onClose={() => setIsArenaSelectorOpen(false)}
        onSelectArena={handleSelectArena}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        winner={winner}
        stats={matchStats}
        onRematch={() => loadBattlefield(currentArena)}
        onSelectArena={() => {
          setIsGameOverOpen(false);
          setIsArenaSelectorOpen(true);
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );

  if (isGoogleMapsEnabled()) {
    return (
      <APIProvider
        apiKey={MAPS_API_KEY}
        solutionChannel="gmp_aistudio_topotanks_v1.0.0"
        libraries={['elevation', 'maps', 'marker']}
        onLoad={() => {
          if (stateRef.current.terrainProfile?.isProcedural) {
            void loadBattlefield(stateRef.current.currentArena);
          }
        }}
      >
        {appContent}
      </APIProvider>
    );
  }

  return appContent;
}

export default App;
