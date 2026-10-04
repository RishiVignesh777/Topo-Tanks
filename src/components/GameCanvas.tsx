import React, { useEffect, useRef } from 'react';
import {
  Explosion,
  FloatingText,
  Particle,
  Player,
  Projectile,
  Wind,
} from '../types/game';
import {
  getInterpolatedTerrainHeight,
  TERRAIN_HEIGHT,
  TERRAIN_WIDTH,
} from '../game/terrain';
import { calculateLaunchVelocity, GRAVITY, WIND_FACTOR } from '../game/physics';

interface GameCanvasProps {
  heights: number[];
  players: [Player, Player];
  activePlayerId: 'p1' | 'p2';
  projectiles: Projectile[];
  explosions: Explosion[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  wind: Wind;
  arenaId: string;
  isAiming: boolean;
  isCadetAimActive?: boolean;
  screenShake: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  heights,
  players,
  activePlayerId,
  projectiles,
  explosions,
  particles,
  floatingTexts,
  wind,
  arenaId,
  isAiming,
  isCadetAimActive = false,
  screenShake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || heights.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || TERRAIN_WIDTH;
    const displayHeight = rect.height || TERRAIN_HEIGHT;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply scale from virtual terrain space (1000 x 650) to canvas dimensions
    const scaleX = displayWidth / TERRAIN_WIDTH;
    const scaleY = displayHeight / TERRAIN_HEIGHT;
    ctx.scale(scaleX, scaleY);

    // Screen shake offset
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 12;
      const shakeY = (Math.random() - 0.5) * screenShake * 12;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Render Sky Background
    drawSky(ctx, arenaId);

    // 2. Render Distant Topographic Mountain Silhouettes (Parallax)
    drawBackgroundMountains(ctx, arenaId);

    // 3. Render Tactical Grid & Altitude Lines
    drawTacticalGrid(ctx);

    // 4. Render Destructible Stratified Topographic Terrain
    drawTerrain(ctx, heights, arenaId);

    // 5. Render Aiming Trajectory Arc (Subtle preview for active player)
    if (isAiming) {
      const activePlayer = players.find((p) => p.id === activePlayerId);
      if (activePlayer && !activePlayer.isAi) {
        drawAimingGuide(ctx, activePlayer, wind, heights, isCadetAimActive);
      }
    }

    // 6. Render Tanks
    players.forEach((player) => {
      drawTank(ctx, player, player.id === activePlayerId);
    });

    // 7. Render Projectiles & Trails
    projectiles.forEach((proj) => {
      drawProjectile(ctx, proj);
    });

    // 8. Render Particles
    particles.forEach((part) => {
      drawParticle(ctx, part);
    });

    // 9. Render Explosions & Shockwaves
    explosions.forEach((exp) => {
      drawExplosion(ctx, exp);
    });

    // 10. Render Floating Text Indicators
    floatingTexts.forEach((txt) => {
      drawFloatingText(ctx, txt);
    });

    ctx.restore();
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[200px] lg:min-h-0 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none"
    >
      <div aria-live="polite" className="sr-only">
        {isAiming ? `Player ${activePlayerId} is aiming. Wind speed is ${wind.speed}.` : `Projectile fired. Waiting for impact.`}
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Tactical battlefield showing terrain, tanks, and trajectories."
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Canvas Drawing Helper Routines
// ---------------------------------------------------------------------------

function drawSky(ctx: CanvasRenderingContext2D, arenaId: string) {
  const grad = ctx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);

  if (arenaId.includes('everest')) {
    // Crisp high-altitude alpine sky
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.4, '#0f172a');
    grad.addColorStop(1, '#1e293b');
  } else if (arenaId.includes('canyon') || arenaId.includes('death_valley')) {
    // Arid desert dusk / twilight glow
    grad.addColorStop(0, '#090a0f');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(0.85, '#431407');
    grad.addColorStop(1, '#78350f');
  } else if (arenaId.includes('vesuvius') || arenaId.includes('helens')) {
    // Volcanic caldera ash & ember sky
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(0.5, '#18181b');
    grad.addColorStop(0.8, '#3f1818');
    grad.addColorStop(1, '#571c1c');
  } else {
    // Atmospheric tactical night
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#1e293b');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

  // Subtle star field in upper sky
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let s = 0; s < 45; s++) {
    const sx = ((s * 137.5) % TERRAIN_WIDTH);
    const sy = ((s * 73.1) % 180);
    const size = (s % 3 === 0) ? 1.5 : 1;
    ctx.fillRect(sx, sy, size, size);
  }
}

function drawBackgroundMountains(ctx: CanvasRenderingContext2D, _arenaId: string) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.beginPath();
  ctx.moveTo(0, TERRAIN_HEIGHT);

  for (let x = 0; x <= TERRAIN_WIDTH; x += 40) {
    const t = x / TERRAIN_WIDTH;
    const bgH =
      TERRAIN_HEIGHT * 0.45 +
      Math.sin(t * Math.PI * 3) * 60 +
      Math.cos(t * Math.PI * 7) * 35;
    ctx.lineTo(x, bgH);
  }

  ctx.lineTo(TERRAIN_WIDTH, TERRAIN_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawTacticalGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;

  // Horizontal altitude lines
  for (let y = 100; y < TERRAIN_HEIGHT; y += 75) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TERRAIN_WIDTH, y);
    ctx.stroke();

    // Altitude tick marks
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.font = '9px monospace';
    ctx.fillText(`${Math.round(TERRAIN_HEIGHT - y)}m`, 8, y - 3);
  }

  // Vertical distance markers
  for (let x = 100; x < TERRAIN_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TERRAIN_HEIGHT);
    ctx.stroke();
  }
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  heights: number[],
  arenaId: string
) {
  if (heights.length === 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, TERRAIN_HEIGHT);

  for (let x = 0; x < heights.length; x++) {
    ctx.lineTo(x, heights[x]);
  }

  ctx.lineTo(TERRAIN_WIDTH, TERRAIN_HEIGHT);
  ctx.closePath();

  // Create stratified geological gradient for bedrock
  const terrainGrad = ctx.createLinearGradient(0, 150, 0, TERRAIN_HEIGHT);

  if (arenaId.includes('canyon') || arenaId.includes('death_valley')) {
    // Red sandstone strata
    terrainGrad.addColorStop(0, '#c2410c'); // Orange surface crest
    terrainGrad.addColorStop(0.2, '#9a3412');
    terrainGrad.addColorStop(0.45, '#7c2d12'); // Deep iron sandstone
    terrainGrad.addColorStop(0.7, '#451a03');
    terrainGrad.addColorStop(1, '#1c1917'); // Dark bedrock
  } else if (arenaId.includes('everest')) {
    // Glacial rock & granite
    terrainGrad.addColorStop(0, '#e2e8f0'); // Snow crest
    terrainGrad.addColorStop(0.15, '#94a3b8'); // Ice-polished rock
    terrainGrad.addColorStop(0.5, '#475569');
    terrainGrad.addColorStop(0.8, '#334155');
    terrainGrad.addColorStop(1, '#0f172a');
  } else if (arenaId.includes('vesuvius') || arenaId.includes('helens')) {
    // Basaltic volcanic pumice & dark ash
    terrainGrad.addColorStop(0, '#52525b');
    terrainGrad.addColorStop(0.3, '#3f3f46');
    terrainGrad.addColorStop(0.65, '#27272a');
    terrainGrad.addColorStop(1, '#09090b');
  } else {
    // Fertile alpine / valley soil
    terrainGrad.addColorStop(0, '#15803d'); // Green crest
    terrainGrad.addColorStop(0.08, '#854d0e'); // Topsoil
    terrainGrad.addColorStop(0.4, '#57534e'); // Shale
    terrainGrad.addColorStop(0.75, '#292524'); // Bedrock
    terrainGrad.addColorStop(1, '#0c0a09');
  }

  ctx.fillStyle = terrainGrad;
  ctx.fill();

  // Draw geological contour strata lines inside terrain
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 1.5;
  for (let offset = 40; offset < 350; offset += 35) {
    ctx.beginPath();
    for (let x = 0; x < heights.length; x += 4) {
      const y = Math.min(TERRAIN_HEIGHT - 5, heights[x] + offset);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Draw glowing surface ridge crest outline
  ctx.beginPath();
  for (let x = 0; x < heights.length; x++) {
    if (x === 0) ctx.moveTo(x, heights[x]);
    else ctx.lineTo(x, heights[x]);
  }

  let crestColor = '#22c55e'; // Green
  if (arenaId.includes('canyon') || arenaId.includes('death_valley')) {
    crestColor = '#fb923c'; // Orange-amber
  } else if (arenaId.includes('everest')) {
    crestColor = '#f8fafc'; // Pure snow
  } else if (arenaId.includes('vesuvius') || arenaId.includes('helens')) {
    crestColor = '#a1a1aa'; // Volcanic ash
  }

  ctx.strokeStyle = crestColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}

function drawTank(
  ctx: CanvasRenderingContext2D,
  player: Player,
  isActive: boolean
) {
  const { x, y } = player.position;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.tiltAngle);

  // Active player spotlight ring
  if (isActive) {
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0, Math.PI * 2);
    ctx.stroke();

    // Small active beacon triangle above tank
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(-6, -50);
    ctx.lineTo(6, -50);
    ctx.closePath();
    ctx.fill();
  }

  // 1. Tank Treads (bottom)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-16, -6, 32, 8, 3);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tread road wheels
  ctx.fillStyle = '#64748b';
  for (let w = -11; w <= 11; w += 7) {
    ctx.beginPath();
    ctx.arc(w, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tank Armored Chassis
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(-13, -13, 26, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Tank Cannon Barrel
  // player.angle is world angle: 0° = right, 90° = vertical up, 180° = left.
  // Because the local canvas has been rotated by player.tiltAngle, subtract tiltAngle
  // so that the barrel in world coordinates points at player.angle exactly.
  const worldRad = (-player.angle * Math.PI) / 180;
  const localBarrelRad = worldRad - player.tiltAngle;
  const barrelLength = 22;
  const barrelX = Math.cos(localBarrelRad) * barrelLength;
  const barrelY = Math.sin(localBarrelRad) * barrelLength;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(barrelX, -11 + barrelY);
  ctx.stroke();

  // Muzzle brake ring
  ctx.strokeStyle = player.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(barrelX * 0.85, -11 + barrelY * 0.85);
  ctx.lineTo(barrelX, -11 + barrelY);
  ctx.stroke();

  // 4. Tank Turret Dome
  ctx.fillStyle = player.secondaryColor || '#334155';
  ctx.beginPath();
  ctx.arc(0, -11, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Draw Health Bar & Name Floating Above Tank
  const healthPercent = Math.max(0, player.health / player.maxHealth);
  const barWidth = 38;
  const barHeight = 5;
  const barX = x - barWidth / 2;
  const barY = y - 32;

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Health fill
  ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  // Player Name Tag
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, x, barY - 4);
}

function drawAimingGuide(
  ctx: CanvasRenderingContext2D,
  player: Player,
  wind: Wind,
  heights: number[],
  isCadetAimActive: boolean
) {
  const { vx: initVx, vy: initVy } = calculateLaunchVelocity(
    player.angle,
    player.power
  );

  // Align start position exactly with the cannon muzzle in world space
  const cosTilt = Math.cos(player.tiltAngle);
  const sinTilt = Math.sin(player.tiltAngle);
  const pivotX = player.position.x + 11 * sinTilt;
  const pivotY = player.position.y - 11 * cosTilt;
  const barrelRad = (-player.angle * Math.PI) / 180;
  const barrelLength = 22;

  const startX = pivotX + Math.cos(barrelRad) * barrelLength;
  const startY = pivotY + Math.sin(barrelRad) * barrelLength;

  // -------------------------------------------------------------------------
  // 1. BASELINE AIMING GUIDE (DEADEYE): Short 22-step barrel muzzle indicator
  // -------------------------------------------------------------------------
  if (!isCadetAimActive) {
    let vx = initVx;
    let vy = initVy;
    let x = startX;
    let y = startY;
    const dt = 0.04;

    ctx.save();
    for (let step = 0; step < 22; step++) {
      vx += wind.speed * WIND_FACTOR * dt;
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;

      if (step % 2 === 0) {
        const alpha = 1 - step / 24;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  // -------------------------------------------------------------------------
  // 2. CADET AIMING GUIDE (Tactical Assist: 3 uses per game)
  // Full trajectory arc factoring in live wind + tactical impact reticle
  // -------------------------------------------------------------------------
  const windAccel = wind.speed * WIND_FACTOR;
  const dt = 0.02; // Fine step for accurate collision and smooth curvature
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let simVx = initVx;
  let simVy = initVy;
  let simX = startX;
  let simY = startY;
  let impactPoint: { x: number; y: number } | null = null;

  for (let step = 0; step < 500; step++) {
    simVx += windAccel * dt;
    simVy += GRAVITY * dt;
    simX += simVx * dt;
    simY += simVy * dt;

    // Check terrain collision
    if (simX >= 0 && simX < TERRAIN_WIDTH) {
      const groundY = getInterpolatedTerrainHeight(simX, heights);
      if (simY >= groundY) {
        points.push({ x: simX, y: groundY });
        impactPoint = { x: simX, y: groundY };
        break;
      }
    }

    // Stop if shell leaves the playable boundaries
    if (simX < -100 || simX > TERRAIN_WIDTH + 100 || simY > TERRAIN_HEIGHT + 60) {
      break;
    }

    points.push({ x: simX, y: simY });
  }

  ctx.save();

  // Draw ballistic dots spaced cleanly along the arc
  let accumulatedDist = 0;
  const dotSpacing = 14; // pixels between trajectory dots
  const totalActive = points.length;

  for (let i = 1; i < totalActive; i++) {
    const pPrev = points[i - 1];
    const pCur = points[i];
    const segDist = Math.hypot(pCur.x - pPrev.x, pCur.y - pPrev.y);
    accumulatedDist += segDist;

    if (accumulatedDist >= dotSpacing) {
      accumulatedDist -= dotSpacing;

      const progress = i / totalActive;
      const fadeAlpha = Math.max(0.35, 1 - progress * 0.4);

      // Outer glow circle
      ctx.fillStyle = `rgba(34, 197, 94, ${0.45 * fadeAlpha})`;
      ctx.beginPath();
      ctx.arc(pCur.x, pCur.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright center core
      ctx.fillStyle = `rgba(220, 252, 231, ${0.92 * fadeAlpha})`;
      ctx.beginPath();
      ctx.arc(pCur.x, pCur.y, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cadet mode tactical impact target reticle
  if (impactPoint) {
    const { x: ix, y: iy } = impactPoint;

    // Crosshairs
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ix - 8, iy);
    ctx.lineTo(ix + 8, iy);
    ctx.moveTo(ix, iy - 8);
    ctx.lineTo(ix, iy + 8);
    ctx.stroke();

    // Concentric impact ring
    ctx.beginPath();
    ctx.arc(ix, iy, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // Center focal pip
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(ix, iy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  // Render ballistic vapor trail
  if (p.trail.length > 1) {
    ctx.save();
    for (let i = 1; i < p.trail.length; i++) {
      const p1 = p.trail[i - 1];
      const p2 = p.trail[i];
      const alpha = (i / p.trail.length) * 0.65;

      ctx.strokeStyle = p.weapon.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = p.isChild ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Render projectile head
  ctx.save();
  ctx.translate(p.x, p.y);

  // Outer glow
  ctx.fillStyle = p.weapon.color;
  ctx.beginPath();
  ctx.arc(0, 0, p.isChild ? 3.5 : 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Core white heat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, p.isChild ? 1.8 : 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, part: Particle) {
  const alpha = Math.max(0, part.life / part.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = part.color;
  ctx.beginPath();
  ctx.arc(part.x, part.y, part.size * (part.type === 'smoke' ? 1.5 - alpha * 0.5 : 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, exp: Explosion) {
  const progress = exp.progress; // 0 to 1
  const radius = exp.maxRadius * Math.sin((progress * Math.PI) / 2);
  const alpha = 1 - progress;

  ctx.save();
  ctx.translate(exp.x, exp.y);

  if (exp.type === 'dirt') {
    // Earth mound plume
    ctx.fillStyle = `rgba(180, 83, 9, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (exp.type === 'nuke') {
    // Blinding multi-layer shockwave ring
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer shockwave wave
    ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Fireball
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.3, `rgba(251, 191, 36, ${alpha * 0.9})`);
    grad.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.7})`);
    grad.addColorStop(1, `rgba(15, 23, 42, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave ring
    ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFloatingText(ctx: CanvasRenderingContext2D, txt: FloatingText) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, txt.opacity);
  ctx.fillStyle = txt.color;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText(txt.text, txt.x, txt.y);
  ctx.restore();
}
