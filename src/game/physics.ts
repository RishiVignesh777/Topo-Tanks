import {
  Explosion,
  FloatingText,
  Particle,
  Player,
  Projectile,
  Weapon,
  Wind,
} from '../types/game';
import {
  applyCrater,
  applyDirtMound,
  getInterpolatedTerrainHeight,
  getTerrainSlopeAngle,
  TERRAIN_HEIGHT,
  TERRAIN_WIDTH,
} from './terrain';
import { audioService } from '../services/audioService';

export const GRAVITY = 380; // Downward gravity acceleration (px/s^2)
export const WIND_FACTOR = 3.6; // Wind force multiplier on ballistics

export interface PhysicsStepResult {
  activeProjectiles: Projectile[];
  newExplosions: Explosion[];
  newParticles: Particle[];
  newFloatingTexts: FloatingText[];
  damagedPlayers: Array<{ playerId: 'p1' | 'p2'; damage: number }>;
  terrainModified: boolean;
  totalDisplacedSoil: number;
}

/**
 * Calculates initial projectile launch velocity given player angle and power.
 * Angle: 0° = pointing right (P1), 180° = pointing left (P2), 90° = vertical sky.
 * Power: 1 to 100%.
 */
export function calculateLaunchVelocity(
  angleDeg: number,
  powerPercent: number
): { vx: number; vy: number } {
  // Convert to radians (0° = right, 90° = up)
  const rad = (angleDeg * Math.PI) / 180;
  // Velocity magnitude scales with power: power 100% gives ~680 px/s
  const speed = 120 + (powerPercent / 100) * 580;
  const vx = speed * Math.cos(rad);
  const vy = -speed * Math.sin(rad); // Screen coordinates: negative y is upwards!
  return { vx, vy };
}

/**
 * Creates particle effects for an explosion.
 */
export function createExplosionParticles(
  x: number,
  y: number,
  blastRadius: number,
  weaponType: string
): Particle[] {
  const particles: Particle[] = [];
  const count = weaponType === 'nuke' ? 90 : blastRadius > 40 ? 45 : 25;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * (blastRadius * 3.5);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 30; // Bias slightly upwards

    const life = 0.4 + Math.random() * 0.8;
    const isSpark = Math.random() < 0.45;
    const isDirt = Math.random() < 0.35;

    let color = '#f59e0b';
    let type: Particle['type'] = 'smoke';

    if (weaponType === 'nuke') {
      color = Math.random() < 0.5 ? '#ef4444' : '#fbbf24';
      type = isSpark ? 'spark' : 'smoke';
    } else if (weaponType === 'dirt') {
      color = Math.random() < 0.6 ? '#92400e' : '#b45309';
      type = 'dirt';
    } else if (isSpark) {
      color = Math.random() < 0.5 ? '#fde047' : '#f97316';
      type = 'spark';
    } else if (isDirt) {
      color = '#78350f';
      type = 'dirt';
    }

    particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      color,
      size: 2 + Math.random() * 5,
      type,
    });
  }

  return particles;
}

/**
 * Steps all active projectiles forward by time dt.
 */
export function stepPhysics(
  projectiles: Projectile[],
  heights: number[],
  players: [Player, Player],
  wind: Wind,
  dt: number
): PhysicsStepResult {
  const activeProjectiles: Projectile[] = [];
  const newExplosions: Explosion[] = [];
  let newParticles: Particle[] = [];
  const newFloatingTexts: FloatingText[] = [];
  const damagedPlayers: Array<{ playerId: 'p1' | 'p2'; damage: number }> = [];
  let terrainModified = false;
  let totalDisplacedSoil = 0;

  for (const p of projectiles) {
    p.age += dt;

    // Handle Mountain Digger subterranean burrowing
    if (p.isDigging) {
      p.x += p.vx * dt * 0.4;
      p.y += p.vy * dt * 0.4;
      p.digStepsLeft = (p.digStepsLeft ?? 10) - 1;

      // Spawn subterranean debris particles
      if (Math.random() < 0.5) {
        newParticles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 40,
          vy: -20 - Math.random() * 40,
          life: 0.3,
          maxLife: 0.3,
          color: '#10b981',
          size: 3,
          type: 'dirt',
        });
      }

      if ((p.digStepsLeft ?? 0) <= 0) {
        // Digger has burrowed to depth, detonate!
        triggerDetonation(p.x, p.y, p.weapon, p.playerId);
      } else {
        activeProjectiles.push(p);
      }
      continue;
    }

    // MIRV cluster separation at apex
    if (
      p.weapon.specialType === 'mirv' &&
      !p.isChild &&
      !p.hasSplit &&
      p.vy >= -30 && // Reaching apex of flight
      p.age > 0.3
    ) {
      p.hasSplit = true;
      audioService.playMirvSplitSound();

      // Spawn 5 cluster warheads
      const subWarheadCount = 5;
      for (let i = 0; i < subWarheadCount; i++) {
        const spreadAngle = (-25 + i * 12.5) * (Math.PI / 180);
        const cosA = Math.cos(spreadAngle);
        const sinA = Math.sin(spreadAngle);
        const spreadSpeed = 60;

        const subVx = p.vx * 0.85 + sinA * spreadSpeed;
        const subVy = p.vy * 0.85 + cosA * 40;

        activeProjectiles.push({
          id: `${p.id}_sub_${i}`,
          x: p.x,
          y: p.y,
          vx: subVx,
          vy: subVy,
          weapon: {
            ...p.weapon,
            blastRadius: 22,
            directDamage: 22,
          },
          playerId: p.playerId,
          isChild: true,
          childIndex: i,
          trail: [],
          age: 0,
        });
      }

      // Spawn separation burst particles
      for (let j = 0; j < 18; j++) {
        newParticles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          life: 0.4,
          maxLife: 0.4,
          color: '#ec4899',
          size: 3,
          type: 'spark',
        });
      }
      continue;
    }

    // Standard ballistic integration
    const windAccel = wind.speed * WIND_FACTOR;
    p.vx += windAccel * dt;
    p.vy += GRAVITY * dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Trail recording
    p.trail.push({ x: p.x, y: p.y, alpha: 1.0 });
    if (p.trail.length > 25) {
      p.trail.shift();
    }

    // Smoke trail particles
    if (Math.random() < 0.4) {
      newParticles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 0.35,
        maxLife: 0.35,
        color: p.weapon.color,
        size: 2.5,
        type: 'smoke',
      });
    }

    // Direct tank impact check during flight
    let directHitPlayer: Player | null = null;
    const tankBodyRadius = 18;

    for (const player of players) {
      // Allow shell to clear firing tank's barrel during first 0.18s of flight
      if (player.id === p.playerId && p.age < 0.18) continue;

      const tankCenterY = player.position.y - 8;
      const distToTank = Math.hypot(p.x - player.position.x, p.y - tankCenterY);

      if (distToTank <= tankBodyRadius) {
        directHitPlayer = player;
        break;
      }
    }

    if (directHitPlayer) {
      // Direct impact on tank hull in mid-flight!
      triggerDetonation(p.x, p.y, p.weapon, p.playerId);
      continue;
    }

    // Out of horizontal bounds check
    if (p.x < -100 || p.x > TERRAIN_WIDTH + 100 || p.y > TERRAIN_HEIGHT + 150) {
      // Missed off-screen, despawn
      continue;
    }

    // Ground collision test (only when within terrain column bounds)
    if (p.x >= 0 && p.x < heights.length) {
      const terrainY = getInterpolatedTerrainHeight(p.x, heights);

      if (p.y >= terrainY) {
        // Impact detected!
        if (p.weapon.specialType === 'digger' && !p.isDigging) {
          // Start burrowing into the earth
          p.isDigging = true;
          p.digStepsLeft = 14;
          p.vx *= 0.4;
          p.vy = Math.max(80, Math.abs(p.vy) * 0.5); // Drive downwards
          audioService.playDiggerSound();
          activeProjectiles.push(p);
          continue;
        }

        if (p.weapon.specialType === 'bouncer') {
          const bouncersLeft = p.bouncersLeft ?? 3;
          if (bouncersLeft > 0) {
            p.bouncersLeft = bouncersLeft - 1;
            const slopeAngle = getTerrainSlopeAngle(p.x, heights);

            // Normal vector pointing UPWARDS out of the ground into the air
            // In screen space (y down): tangent is (cos theta, sin theta)
            // Upward normal (ny < 0): nx = sin theta, ny = -cos theta
            const nx = Math.sin(slopeAngle);
            const ny = -Math.cos(slopeAngle);

            // Component of velocity in direction of surface normal
            const vDotN = p.vx * nx + p.vy * ny; // <= 0 when approaching ground

            // Tangential velocity component
            const vtx = p.vx - vDotN * nx;
            const vty = p.vy - vDotN * ny;

            // Reflect: reverse normal component with coefficient of restitution (0.65), roll with friction (0.82)
            const normalFactor = vDotN < 0 ? -0.65 : 0.65;
            p.vx = vtx * 0.82 + (vDotN * nx) * normalFactor + nx * 20;
            p.vy = vty * 0.82 + (vDotN * ny) * normalFactor + ny * 40;

            // Lift cleanly off terrain along upward normal to prevent sticky re-collision
            p.x += nx * 4;
            p.y = terrainY - 4;

            audioService.playBounceSound();

            // Spark particles on bounce
            for (let k = 0; k < 8; k++) {
              newParticles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 80,
                life: 0.25,
                maxLife: 0.25,
                color: '#38bdf8',
                size: 2.5,
                type: 'spark',
              });
            }

            activeProjectiles.push(p);
            continue;
          }
        }

        // Detonate projectile on ground
        triggerDetonation(p.x, terrainY, p.weapon, p.playerId);
      } else {
        activeProjectiles.push(p);
      }
    } else {
      // Off-screen projectile still in air
      activeProjectiles.push(p);
    }
  }

  function triggerDetonation(
    detX: number,
    detY: number,
    weapon: Weapon,
    attackerId: 'p1' | 'p2'
  ) {
    const isDirt = weapon.specialType === 'dirt';
    const isNuke = weapon.specialType === 'nuke';
    const explosionType: Explosion['type'] = isDirt ? 'dirt' : isNuke ? 'nuke' : 'blast';

    // Play explosion sound
    audioService.playExplosionSound(weapon.blastRadius, explosionType);

    // Create visual explosion
    newExplosions.push({
      id: `exp_${Date.now()}_${Math.random()}`,
      x: detX,
      y: detY,
      currentRadius: 4,
      maxRadius: weapon.blastRadius,
      color: weapon.color,
      progress: 0,
      duration: isNuke ? 1.4 : 0.6,
      type: explosionType,
    });

    // Spawn explosion particles
    newParticles = newParticles.concat(
      createExplosionParticles(detX, detY, weapon.blastRadius, weapon.specialType)
    );

    // Apply terrain displacement
    if (isDirt) {
      totalDisplacedSoil += applyDirtMound(detX, detY, weapon.blastRadius, heights);
      audioService.playSlideSound();
    } else {
      totalDisplacedSoil += applyCrater(detX, detY, weapon.blastRadius, heights);
    }
    terrainModified = true;

    // Check damage to both players
    const tankHitRadius = 20;

    players.forEach((targetPlayer) => {
      const dist = Math.hypot(targetPlayer.position.x - detX, targetPlayer.position.y - detY);
      const blastReach = weapon.blastRadius + tankHitRadius;

      if (dist <= blastReach) {
        // Direct hit or near miss splash damage
        const falloff = 1 - dist / blastReach;
        const damage = Math.max(5, Math.round(weapon.directDamage * falloff));

        damagedPlayers.push({
          playerId: targetPlayer.id,
          damage,
        });

        audioService.playHitSound();

        // Floating damage indicator
        const isSelf = targetPlayer.id === attackerId;
        const text = isSelf ? `SELF -${damage}` : `-${damage}`;
        newFloatingTexts.push({
          id: `txt_${Date.now()}_${Math.random()}`,
          text,
          x: targetPlayer.position.x,
          y: targetPlayer.position.y - 25,
          color: isSelf ? '#ef4444' : '#fbbf24',
          opacity: 1.0,
          vy: -40,
        });
      }
    });
  }

  return {
    activeProjectiles,
    newExplosions,
    newParticles,
    newFloatingTexts,
    damagedPlayers,
    terrainModified,
    totalDisplacedSoil,
  };
}
