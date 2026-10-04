import { Player } from '../types/game';
import { getSkinById, TankSkin } from './skins';

export interface DrawTankOptions {
  ctx: CanvasRenderingContext2D;
  player: Player;
  isActive?: boolean;
  barrelRecoilOffset?: number;
  customScale?: number;
  overrideAngle?: number;
  overrideTilt?: number;
  showHealthBar?: boolean;
  timeMs?: number;
}

/**
 * High-fidelity procedural vector sprite renderer for customizable tanks.
 * Renders unique hulls, treads, camo patterns, turrets, and barrels for all unlocked skins.
 */
export function drawTankSprite(options: DrawTankOptions): void {
  const {
    ctx,
    player,
    isActive = false,
    barrelRecoilOffset = 0,
    customScale = 1.0,
    overrideAngle,
    overrideTilt,
    showHealthBar = true,
    timeMs = Date.now(),
  } = options;

  const skin: TankSkin = getSkinById(player.skinId);
  const { visuals, theme } = skin;

  const posX = player.position.x;
  const posY = player.position.y;
  const tiltAngle = overrideTilt !== undefined ? overrideTilt : player.tiltAngle;
  const aimAngle = overrideAngle !== undefined ? overrideAngle : player.angle;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(customScale, customScale);
  ctx.rotate(tiltAngle);

  // -------------------------------------------------------------------------
  // 0. Active Player Tactical Spotlight Ring & Beacon
  // -------------------------------------------------------------------------
  if (isActive) {
    const pulse = Math.sin(timeMs / 250) * 0.2 + 0.8;
    ctx.strokeStyle = theme.glowColor || player.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -10, 26 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Active beacon marker triangle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(-6, -50);
    ctx.lineTo(6, -50);
    ctx.closePath();
    ctx.fill();
  }

  // -------------------------------------------------------------------------
  // 1. Treads / Suspension / Hover Pads
  // -------------------------------------------------------------------------
  drawTreads(ctx, visuals.treadStyle, theme, timeMs, player.color);

  // -------------------------------------------------------------------------
  // 2. Chassis / Armored Hull
  // -------------------------------------------------------------------------
  drawHull(ctx, visuals.chassisStyle, visuals.pattern, theme, player.color, player.secondaryColor);

  // -------------------------------------------------------------------------
  // 3. Tank Cannon Barrel(s)
  // -------------------------------------------------------------------------
  // Compute barrel angle taking into account world aim angle and tank slope tilt
  const worldRad = (-aimAngle * Math.PI) / 180;
  const localBarrelRad = worldRad - tiltAngle;

  drawBarrels(
    ctx,
    visuals.barrelStyle,
    localBarrelRad,
    theme,
    player.color,
    barrelRecoilOffset,
    timeMs
  );

  // -------------------------------------------------------------------------
  // 4. Tank Turret Mantlet & Cupola
  // -------------------------------------------------------------------------
  drawTurret(
    ctx,
    visuals.turretStyle,
    theme,
    player.color,
    player.secondaryColor,
    localBarrelRad,
    timeMs
  );

  ctx.restore();

  // -------------------------------------------------------------------------
  // 5. Floating Health Bar & Player Name
  // -------------------------------------------------------------------------
  if (showHealthBar) {
    const healthPercent = Math.max(0, player.health / player.maxHealth);
    const barWidth = 38 * customScale;
    const barHeight = 5 * customScale;
    const barX = posX - barWidth / 2;
    const barY = posY - (32 * customScale);

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Health Fill with Gradient
    ctx.fillStyle =
      healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Name & Skin Tag
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.round(10 * customScale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, posX, barY - 4);
  }
}

// ---------------------------------------------------------------------------
// Treads Rendering
// ---------------------------------------------------------------------------
function drawTreads(
  ctx: CanvasRenderingContext2D,
  style: TankSkin['visuals']['treadStyle'],
  theme: TankSkin['theme'],
  timeMs: number,
  playerColor: string
) {
  if (style === 'maglev_hover') {
    // Futuristic anti-gravity hover repulsor pads
    const glow = Math.sin(timeMs / 180) * 0.3 + 0.7;

    // Glowing repulsor energy field
    const grad = ctx.createLinearGradient(0, -6, 0, 4);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
    grad.addColorStop(1, 'rgba(147, 51, 234, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5 * glow, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual hover emitter pods
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(-16, -6, 12, 6, 2);
    ctx.roundRect(4, -6, 12, 6, 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Energy core pips
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-10, -3, 2, 0, Math.PI * 2);
    ctx.arc(10, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Conventional or heavy tracked chassis
  ctx.fillStyle = theme.treadColor;
  ctx.beginPath();
  ctx.roundRect(-16, -6, 32, 8, 3);
  ctx.fill();

  ctx.strokeStyle = style === 'gold_links' ? '#eab308' : '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (style === 'sand_skirt') {
    // Ballistic side skirt plating with desert camouflage
    ctx.fillStyle = theme.wheelColor;
    ctx.beginPath();
    ctx.roundRect(-17, -7, 34, 5, 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Side skirt rivets
    ctx.fillStyle = '#451a03';
    for (let rx = -14; rx <= 14; rx += 7) {
      ctx.fillRect(rx, -5, 1.5, 1.5);
    }
  } else if (style === 'heavy_plates') {
    // Spiked heavy tracks & double road wheels
    ctx.fillStyle = '#475569';
    for (let w = -12; w <= 12; w += 6) {
      ctx.beginPath();
      ctx.arc(w, -2, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    // Tread tooth tracks
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    for (let t = -15; t <= 15; t += 5) {
      ctx.beginPath();
      ctx.moveTo(t, 2);
      ctx.lineTo(t + 1, 2.5);
      ctx.stroke();
    }
  } else if (style === 'gold_links') {
    // Gilded road wheels with jewel center
    for (let w = -11; w <= 11; w += 7) {
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(w, -2, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w, -2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Standard military road wheels
    ctx.fillStyle = theme.wheelColor;
    for (let w = -11; w <= 11; w += 7) {
      ctx.beginPath();
      ctx.arc(w, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(w, -2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------------
// Hull & Chassis Rendering
// ---------------------------------------------------------------------------
function drawHull(
  ctx: CanvasRenderingContext2D,
  style: TankSkin['visuals']['chassisStyle'],
  pattern: TankSkin['visuals']['pattern'],
  theme: TankSkin['theme'],
  playerColor: string,
  secondaryColor?: string
) {
  const baseColor = theme.primaryColor || playerColor;
  const secColor = theme.secondaryColor || secondaryColor || '#334155';

  if (style === 'angular_stealth') {
    // Hexagonal / Faceted Stealth Armor Plate
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.lineTo(-13, -14);
    ctx.lineTo(11, -14);
    ctx.lineTo(15, -6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red infrared optical strip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -12, 16, 1.5);
    return;
  }

  if (style === 'gilded_emperor') {
    // Imperial Curved Gilded Hull
    const grad = ctx.createLinearGradient(-15, -14, 15, -6);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.5, '#ca8a04');
    grad.addColorStop(1, '#eab308');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 9, [4, 4, 1, 1]);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Filigree embellishments
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, -9, 3, 0, Math.PI);
    ctx.stroke();
    return;
  }

  if (style === 'cyber_conduit') {
    // Neon Cyberpunk Chassis with glowing conduits
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 9, 2);
    ctx.fill();

    // Glowing cyan/pink circuit lines
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -10);
    ctx.lineTo(-4, -10);
    ctx.lineTo(-2, -7);
    ctx.lineTo(10, -7);
    ctx.stroke();

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(6, -12);
    ctx.lineTo(11, -10);
    ctx.stroke();
    return;
  }

  if (style === 'heavy_riveted') {
    // Industrial Riveted Iron Goliath Hull
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(-15, -14, 30, 9, 1);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rivet pattern
    ctx.fillStyle = '#0f172a';
    for (let x = -13; x <= 13; x += 5.5) {
      ctx.fillRect(x, -13, 1.5, 1.5);
      ctx.fillRect(x, -7, 1.5, 1.5);
    }
    return;
  }

  // Standard or Sloped Camo Hull
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(-13, -13, 26, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pattern Overlay (Desert Tiger, Arctic Splinter, Hazard Stripes)
  if (pattern === 'desert_tiger' && theme.camoColor) {
    ctx.fillStyle = theme.camoColor;
    ctx.beginPath();
    ctx.moveTo(-10, -13);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-8, -13);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, -13);
    ctx.lineTo(6, -6);
    ctx.lineTo(8, -6);
    ctx.lineTo(4, -13);
    ctx.fill();
  } else if (pattern === 'arctic_splinter' && theme.camoColor) {
    ctx.fillStyle = theme.camoColor;
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(-6, -12);
    ctx.lineTo(-3, -7);
    ctx.lineTo(-8, -7);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(3, -13);
    ctx.lineTo(8, -13);
    ctx.lineTo(11, -8);
    ctx.lineTo(6, -8);
    ctx.fill();
  } else if (pattern === 'hazard_stripes') {
    // Yellow & Black caution chevrons
    ctx.fillStyle = '#0f172a';
    for (let hx = -11; hx <= 9; hx += 6) {
      ctx.beginPath();
      ctx.moveTo(hx, -13);
      ctx.lineTo(hx + 3, -6);
      ctx.lineTo(hx + 5, -6);
      ctx.lineTo(hx + 2, -13);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------------
// Barrel(s) Rendering
// ---------------------------------------------------------------------------
function drawBarrels(
  ctx: CanvasRenderingContext2D,
  style: TankSkin['visuals']['barrelStyle'],
  localBarrelRad: number,
  theme: TankSkin['theme'],
  playerColor: string,
  recoilOffset: number,
  timeMs: number
) {
  const barrelLength = Math.max(16, 23 - recoilOffset);
  const barrelX = Math.cos(localBarrelRad) * barrelLength;
  const barrelY = Math.sin(localBarrelRad) * barrelLength;

  if (style === 'twin_cannon') {
    // Dual Synchronized Heavy Artillery Cannons
    const perpX = -Math.sin(localBarrelRad) * 2.2;
    const perpY = Math.cos(localBarrelRad) * 2.2;

    ctx.strokeStyle = theme.barrelColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';

    // Barrel 1
    ctx.beginPath();
    ctx.moveTo(perpX, -11 + perpY);
    ctx.lineTo(perpX + barrelX, -11 + perpY + barrelY);
    ctx.stroke();

    // Barrel 2
    ctx.beginPath();
    ctx.moveTo(-perpX, -11 - perpY);
    ctx.lineTo(-perpX + barrelX, -11 - perpY + barrelY);
    ctx.stroke();

    // Twin muzzle brakes
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(perpX + barrelX * 0.9, -11 + perpY + barrelY * 0.9);
    ctx.lineTo(perpX + barrelX, -11 + perpY + barrelY);
    ctx.moveTo(-perpX + barrelX * 0.9, -11 - perpY + barrelY * 0.9);
    ctx.lineTo(-perpX + barrelX, -11 - perpY + barrelY);
    ctx.stroke();
    return;
  }

  if (style === 'pulsing_plasma') {
    // Cyberpunk Dual-Ring Plasma Projector
    const pulseGlow = Math.sin(timeMs / 120) * 0.4 + 0.6;

    // Center beam tube
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();

    // Glowing plasma core line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();

    // Accelerator coil rings
    [0.4, 0.7, 0.95].forEach((dist) => {
      const cx = barrelX * dist;
      const cy = -11 + barrelY * dist;
      ctx.fillStyle = `rgba(244, 63, 94, ${pulseGlow})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

  if (style === 'squared_railgun') {
    // Rectangular Stealth Railgun Barrel
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();

    // Crimson magnetic rails
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barrelX * 0.2, -11 + barrelY * 0.2);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();
    return;
  }

  if (style === 'ornate_crown') {
    // Golden Imperial Crown Cannon
    const grad = ctx.createLinearGradient(0, -11, barrelX, -11 + barrelY);
    grad.addColorStop(0, '#ca8a04');
    grad.addColorStop(1, '#fde047');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();

    // Crown muzzle ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(barrelX * 0.88, -11 + barrelY * 0.88);
    ctx.lineTo(barrelX, -11 + barrelY);
    ctx.stroke();
    return;
  }

  // Standard & Perforated Howitzer Barrel
  ctx.strokeStyle = theme.barrelColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(barrelX, -11 + barrelY);
  ctx.stroke();

  // Muzzle brake ring with player/accent color
  ctx.strokeStyle = theme.accentColor || playerColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(barrelX * 0.86, -11 + barrelY * 0.86);
  ctx.lineTo(barrelX, -11 + barrelY);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Turret Rendering
// ---------------------------------------------------------------------------
function drawTurret(
  ctx: CanvasRenderingContext2D,
  style: TankSkin['visuals']['turretStyle'],
  theme: TankSkin['theme'],
  playerColor: string,
  secondaryColor?: string,
  localBarrelRad = 0,
  timeMs = 0
) {
  const turretColor = theme.secondaryColor || secondaryColor || '#334155';

  if (style === 'stealth_facets') {
    // Angular faceted stealth dome
    ctx.fillStyle = theme.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(-5, -17);
    ctx.lineTo(5, -17);
    ctx.lineTo(7, -8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red center optics dome
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -12, 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (style === 'plasma_dome') {
    // Glowing plasma generator cupola
    const glow = Math.sin(timeMs / 140) * 0.3 + 0.7;
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulsing energy core
    ctx.fillStyle = `rgba(244, 63, 94, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (style === 'imperial_crested') {
    // Golden Imperial Crown Crest
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crown tips
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.lineTo(-2, -15);
    ctx.lineTo(0, -19);
    ctx.lineTo(2, -15);
    ctx.lineTo(4, -18);
    ctx.lineTo(2, -15);
    ctx.lineTo(-2, -15);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (style === 'wedge_mantlet') {
    // Angular Mantlet with Commander Sight
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.roundRect(-8, -17, 16, 11, 3);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hatch & Periscope
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(-3, -18, 6, 2);
    return;
  }

  // Classic / Standard Dome
  ctx.fillStyle = turretColor;
  ctx.beginPath();
  ctx.arc(0, -11, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Commander cupola dot
  ctx.fillStyle = theme.accentColor || playerColor;
  ctx.beginPath();
  ctx.arc(0, -13, 2, 0, Math.PI * 2);
  ctx.fill();
}
