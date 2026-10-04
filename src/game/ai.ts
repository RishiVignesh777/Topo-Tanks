import { AiLevel, Player, Wind } from '../types/game';
import { calculateLaunchVelocity, GRAVITY, WIND_FACTOR } from './physics';
import { getInterpolatedTerrainHeight, TERRAIN_WIDTH } from './terrain';

export interface AiDecision {
  angle: number;
  power: number;
  weaponId: string;
}

/**
 * Simulates a single hypothetical ballistic shot to find its ground impact coordinate.
 */
function simulateBallisticLanding(
  angleDeg: number,
  power: number,
  startX: number,
  startY: number,
  wind: Wind,
  heights: number[]
): { landingX: number; apexY: number } {
  const { vx: initVx, vy: initVy } = calculateLaunchVelocity(angleDeg, power);
  let vx = initVx;
  let vy = initVy;
  let x = startX;
  let y = startY - 12; // Barrel height
  const dt = 0.04;
  let apexY = startY;

  for (let step = 0; step < 150; step++) {
    vx += wind.speed * WIND_FACTOR * dt;
    vy += GRAVITY * dt;
    x += vx * dt;
    y += vy * dt;

    if (y < apexY) apexY = y;

    if (x < -100 || x > TERRAIN_WIDTH + 100) {
      return { landingX: x, apexY };
    }

    if (x >= 0 && x < heights.length) {
      const groundY = getInterpolatedTerrainHeight(x, heights);
      if (y >= groundY) {
        return { landingX: x, apexY };
      }
    }
  }

  return { landingX: x, apexY };
}

/**
 * Solves the ideal firing solution for the AI bot with difficulty scaling.
 */
export function calculateAiShot(
  aiPlayer: Player,
  targetPlayer: Player,
  wind: Wind,
  heights: number[],
  difficulty: AiLevel = 'veteran'
): AiDecision {
  const startX = aiPlayer.position.x;
  const startY = aiPlayer.position.y;
  const targetX = targetPlayer.position.x;

  const shootingLeft = targetX < startX;

  // Base search angular range
  const minAngle = shootingLeft ? 100 : 20;
  const maxAngle = shootingLeft ? 165 : 80;

  let bestAngle = shootingLeft ? 135 : 45;
  let bestPower = 55;
  let minDistanceToTarget = Infinity;

  // Search candidate trajectory space
  const angleSteps = difficulty === 'deadeye' ? 15 : 9;
  const powerSteps = difficulty === 'deadeye' ? 12 : 7;

  for (let a = 0; a < angleSteps; a++) {
    const testAngle = minAngle + (a / (angleSteps - 1)) * (maxAngle - minAngle);

    for (let p = 0; p < powerSteps; p++) {
      const testPower = 35 + (p / (powerSteps - 1)) * 60; // 35% to 95%
      const { landingX } = simulateBallisticLanding(
        testAngle,
        testPower,
        startX,
        startY,
        wind,
        heights
      );

      const dist = Math.abs(landingX - targetX);
      if (dist < minDistanceToTarget) {
        minDistanceToTarget = dist;
        bestAngle = testAngle;
        bestPower = testPower;
      }
    }
  }

  // Refine firing solution with difficulty-based inaccuracy
  let angleJitter = 0;
  let powerJitter = 0;

  if (difficulty === 'cadet') {
    angleJitter = (Math.random() - 0.5) * 14;
    powerJitter = (Math.random() - 0.5) * 18;
  } else if (difficulty === 'veteran') {
    angleJitter = (Math.random() - 0.5) * 5;
    powerJitter = (Math.random() - 0.5) * 7;
  } else if (difficulty === 'deadeye') {
    angleJitter = (Math.random() - 0.5) * 1.5;
    powerJitter = (Math.random() - 0.5) * 2.5;
  }

  const finalAngle = Math.max(5, Math.min(175, Math.round(bestAngle + angleJitter)));
  const finalPower = Math.max(15, Math.min(100, Math.round(bestPower + powerJitter)));

  // Weapon selection strategy
  let weaponId = 'standard';
  const availableWeapons = Object.entries(aiPlayer.inventory)
    .filter(([, count]) => count !== 0)
    .map(([id]) => id);

  const targetDist = Math.abs(targetX - startX);

  if (availableWeapons.includes('nuke') && aiPlayer.inventory.nuke > 0 && targetPlayer.health > 45 && Math.random() < 0.35) {
    weaponId = 'nuke';
  } else if (availableWeapons.includes('mirv') && aiPlayer.inventory.mirv > 0 && targetDist > 400 && Math.random() < 0.4) {
    weaponId = 'mirv';
  } else if (availableWeapons.includes('digger') && aiPlayer.inventory.digger > 0 && Math.random() < 0.3) {
    weaponId = 'digger';
  } else if (availableWeapons.includes('bouncer') && aiPlayer.inventory.bouncer > 0 && Math.random() < 0.3) {
    weaponId = 'bouncer';
  }

  return {
    angle: finalAngle,
    power: finalPower,
    weaponId,
  };
}
