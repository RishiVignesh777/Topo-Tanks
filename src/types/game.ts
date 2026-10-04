export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Arena {
  id: string;
  name: string;
  locationName: string;
  country: string;
  p1Coords: LatLng;
  p2Coords: LatLng;
  boundaryCoords?: [LatLng, LatLng];
  p1Label: string;
  p2Label: string;
  description: string;
  estimatedDistanceKm: number;
  defaultZoom: number;
  cameraCenter: LatLng;
  bounds: GeoBounds;
}

export interface ArenaBoundaries {
  boundaryStart: LatLng;
  boundaryEnd: LatLng;
  p1TerrainRatio: number;
  p2TerrainRatio: number;
  paddingFraction: number;
  totalSpanKm: number;
}

/**
 * Calculates extended arena boundary endpoints given two artillery combat positions.
 * P1 and P2 represent the exact placement coordinates of Player 1 and Player 2 artillery.
 * Arena boundaries extend outward on either end by paddingFraction (default 0.16, giving ~12% / 88% placement ratios).
 */
export function calculateArenaBoundaries(
  p1: LatLng,
  p2: LatLng,
  paddingFraction = 0.16
): ArenaBoundaries {
  const dLat = p2.lat - p1.lat;
  let dLng = p2.lng - p1.lng;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;

  const b1Lat = Math.max(-85, Math.min(85, p1.lat - paddingFraction * dLat));
  let b1Lng = p1.lng - paddingFraction * dLng;
  while (b1Lng > 180) b1Lng -= 360;
  while (b1Lng < -180) b1Lng += 360;

  const b2Lat = Math.max(-85, Math.min(85, p2.lat + paddingFraction * dLat));
  let b2Lng = p2.lng + paddingFraction * dLng;
  while (b2Lng > 180) b2Lng -= 360;
  while (b2Lng < -180) b2Lng += 360;

  const boundaryStart: LatLng = { lat: b1Lat, lng: b1Lng };
  const boundaryEnd: LatLng = { lat: b2Lat, lng: b2Lng };

  const p1TerrainRatio = paddingFraction / (1 + 2 * paddingFraction);
  const p2TerrainRatio = (1 + paddingFraction) / (1 + 2 * paddingFraction);
  const totalSpanKm = calculateDistanceKm(boundaryStart, boundaryEnd);

  return {
    boundaryStart,
    boundaryEnd,
    p1TerrainRatio,
    p2TerrainRatio,
    paddingFraction,
    totalSpanKm,
  };
}

/**
 * Computes a bounding box containing both coordinate points with tactical margin,
 * calibrated to match the widescreen map viewport aspect ratio (~1.85 : 1).
 */
export function computeBoundsFromCoords(
  p1: LatLng,
  p2: LatLng,
  paddingPercent = 0.35,
  targetAspectRatio = 1.85
): GeoBounds {
  const minLat = Math.min(p1.lat, p2.lat);
  const maxLat = Math.max(p1.lat, p2.lat);
  const minLng = Math.min(p1.lng, p2.lng);
  const maxLng = Math.max(p1.lng, p2.lng);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const cosLat = Math.max(0.1, Math.cos((centerLat * Math.PI) / 180));

  let latSpan = Math.max(maxLat - minLat, 0.02) * (1 + 2 * paddingPercent);
  let lngSpan = Math.max(maxLng - minLng, 0.02) * (1 + 2 * paddingPercent);

  // Calibrate horizontal span to match widescreen container dimensions on screen
  const targetLngSpan = (latSpan * targetAspectRatio) / cosLat;
  if (lngSpan < targetLngSpan) {
    lngSpan = targetLngSpan;
  } else {
    latSpan = Math.max(latSpan, (lngSpan * cosLat) / targetAspectRatio);
  }

  return {
    north: Math.min(85, centerLat + latSpan / 2),
    south: Math.max(-85, centerLat - latSpan / 2),
    east: Math.min(180, centerLng + lngSpan / 2),
    west: Math.max(-180, centerLng - lngSpan / 2),
  };
}

/**
 * Computes great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export type SpecialWeaponType = 'standard' | 'mirv' | 'digger' | 'dirt' | 'bouncer' | 'nuke';

export interface Weapon {
  id: string;
  name: string;
  icon: string;
  ammo: number; // -1 for infinite
  blastRadius: number;
  directDamage: number;
  description: string;
  specialType: SpecialWeaponType;
  color: string;
}

export type AiLevel = 'cadet' | 'veteran' | 'deadeye';

export interface Player {
  id: 'p1' | 'p2';
  name: string;
  color: string;
  secondaryColor: string;
  health: number;
  maxHealth: number;
  angle: number; // 0 to 180 degrees
  power: number; // 1 to 100
  position: { x: number; y: number };
  tiltAngle: number; // slope tilt in radians
  activeWeaponId: string;
  inventory: Record<string, number>;
  score: number;
  isAi: boolean;
  aiLevel: AiLevel;
  cadetUsesRemaining: number;
  skinId?: string;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  weapon: Weapon;
  playerId: 'p1' | 'p2';
  isChild?: boolean;
  childIndex?: number;
  bouncersLeft?: number;
  trail: TrailPoint[];
  age: number;
  hasSplit?: boolean;
  isDigging?: boolean;
  digStepsLeft?: number;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  color: string;
  progress: number;
  duration: number;
  type: 'blast' | 'dirt' | 'nuke';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'smoke' | 'spark' | 'dirt' | 'debris' | 'nuke_ring';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
}

export interface TerrainProfile {
  rawElevations: number[];
  normalizedHeights: number[]; // 0 to 1
  minElevationMeters: number;
  maxElevationMeters: number;
  resolution: number;
  isProcedural: boolean;
  attributionText: string;
}

export interface Wind {
  speed: number; // -50 to +50 m/s (- = west/left, + = east/right)
}

export type GameStatus =
  | 'loading_terrain'
  | 'aiming'
  | 'firing'
  | 'resolving'
  | 'game_over';

export interface MatchStats {
  turnNumber: number;
  p1DirectHits: number;
  p2DirectHits: number;
  p1DamageDealt: number;
  p2DamageDealt: number;
  terrainDisplacedCraters: number;
}
