import { TerrainProfile } from '../types/game';

export const TERRAIN_WIDTH = 1000; // Normalized virtual coordinate width
export const TERRAIN_HEIGHT = 650; // Normalized virtual coordinate height
export const MAX_REPOSE_SLOPE = 2.4; // Maximum allowed slope px/col before sand cascades

/**
 * Initializes the canvas pixel heightfield from a normalized TerrainProfile.
 */
export function initHeightfieldFromProfile(
  profile: TerrainProfile,
  canvasWidth = TERRAIN_WIDTH,
  canvasHeight = TERRAIN_HEIGHT
): number[] {
  const topPadding = 120; // Highest peaks won't clip into HUD
  const bottomPadding = 80; // Lowest valleys won't clip into floor
  const playableVerticalRange = canvasHeight - topPadding - bottomPadding;

  const heights: number[] = new Array(canvasWidth);
  const sampleCount = profile.normalizedHeights.length;

  for (let x = 0; x < canvasWidth; x++) {
    const t = x / (canvasWidth - 1);
    const sampleIdx = t * (sampleCount - 1);
    const lowIdx = Math.floor(sampleIdx);
    const highIdx = Math.min(sampleCount - 1, lowIdx + 1);
    const frac = sampleIdx - lowIdx;

    const normH =
      (1 - frac) * profile.normalizedHeights[lowIdx] +
      frac * profile.normalizedHeights[highIdx];

    // normH = 1 (highest peak) -> smaller y (top of canvas)
    // normH = 0 (lowest valley) -> larger y (bottom of canvas)
    const y = canvasHeight - bottomPadding - normH * playableVerticalRange;
    heights[x] = Math.round(y);
  }

  return heights;
}

/**
 * Retrieves the exact terrain height at any continuous coordinate x.
 */
export function getInterpolatedTerrainHeight(x: number, heights: number[]): number {
  if (heights.length === 0) return TERRAIN_HEIGHT * 0.7;
  const clampedX = Math.max(0, Math.min(heights.length - 1, x));
  const lowX = Math.floor(clampedX);
  const highX = Math.min(heights.length - 1, lowX + 1);
  const frac = clampedX - lowX;
  return (1 - frac) * heights[lowX] + frac * heights[highX];
}

/**
 * Calculates terrain normal / slope angle in radians at coordinate x.
 */
export function getTerrainSlopeAngle(x: number, heights: number[]): number {
  const delta = 10;
  const yLeft = getInterpolatedTerrainHeight(x - delta, heights);
  const yRight = getInterpolatedTerrainHeight(x + delta, heights);
  return Math.atan2(yRight - yLeft, delta * 2);
}

/**
 * Applies a spherical/circular explosive crater to the terrain heightfield.
 * Returns estimated volume of displaced dirt.
 */
export function applyCrater(
  cx: number,
  cy: number,
  radius: number,
  heights: number[]
): number {
  let displacedPixels = 0;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(heights.length - 1, Math.ceil(cx + radius));

  for (let x = minX; x <= maxX; x++) {
    const dx = x - cx;
    const rSq = radius * radius;
    const dxSq = dx * dx;

    if (dxSq < rSq) {
      const halfChord = Math.sqrt(rSq - dxSq);
      const craterBottomY = cy + halfChord;

      // If existing terrain is above the crater bottom, carve it out
      if (heights[x] < craterBottomY) {
        const delta = Math.min(TERRAIN_HEIGHT - 20, craterBottomY) - heights[x];
        displacedPixels += delta;
        heights[x] = Math.min(TERRAIN_HEIGHT - 20, Math.max(heights[x], craterBottomY));
      }
    }
  }

  return displacedPixels;
}

/**
 * Deposits an additive soil mound (Dirt Bomb).
 */
export function applyDirtMound(
  cx: number,
  cy: number,
  radius: number,
  heights: number[]
): number {
  let addedPixels = 0;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(heights.length - 1, Math.ceil(cx + radius));

  for (let x = minX; x <= maxX; x++) {
    const dx = x - cx;
    const rSq = radius * radius;
    const dxSq = dx * dx;

    if (dxSq < rSq) {
      const halfChord = Math.sqrt(rSq - dxSq) * 0.8;
      const newY = Math.max(80, heights[x] - halfChord);
      addedPixels += heights[x] - newY;
      heights[x] = newY;
    }
  }

  return addedPixels;
}

/**
 * Simulates granular sand/soil avalanches based on angle of repose.
 * Overhangs and sheer drops cascade naturally down into adjacent lower columns.
 * Runs multiple iterative relaxation passes.
 */
export function stabilizeTerrainSlopes(
  heights: number[],
  maxSlope = 1.6,
  passes = 8
): boolean {
  let hasMoved = false;

  for (let pass = 0; pass < passes; pass++) {
    const forward = pass % 2 === 0;
    const start = forward ? 0 : heights.length - 2;
    const end = forward ? heights.length - 1 : -1;
    const step = forward ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const diff = heights[i + 1] - heights[i]; // + means i+1 is lower (larger y)

      if (Math.abs(diff) > maxSlope) {
        hasMoved = true;
        const excess = (Math.abs(diff) - maxSlope) * 0.38;
        if (diff > 0) {
          // Column i is higher (smaller y), column i+1 is lower (larger y)
          heights[i] += excess;
          heights[i + 1] -= excess;
        } else {
          // Column i is lower (larger y), column i+1 is higher (smaller y)
          heights[i] -= excess;
          heights[i + 1] += excess;
        }
      }
    }
  }

  return hasMoved;
}

/**
 * Finds optimal initial placement for tanks on the terrain profile.
 * Avoids placing tanks directly on vertical cliff faces.
 */
export function findGentleSlopePosition(
  targetFraction: number,
  heights: number[],
  searchRange = 50
): number {
  const center = Math.round(targetFraction * heights.length);
  let bestX = center;
  let minSlope = Infinity;

  const start = Math.max(20, center - searchRange);
  const end = Math.min(heights.length - 21, center + searchRange);

  for (let x = start; x <= end; x++) {
    const slope = Math.abs(heights[x + 5] - heights[x - 5]);
    if (slope < minSlope) {
      minSlope = slope;
      bestX = x;
    }
  }

  return bestX;
}
