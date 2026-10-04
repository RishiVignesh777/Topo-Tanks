import { Arena, LatLng, TerrainProfile, calculateDistanceKm } from '../types/game';

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('topo_tanks_custom_key');
    if (customKey && customKey.trim()) return customKey.trim();
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || ''
  );
}

export const MAPS_API_KEY = getApiKey();

export function isGoogleMapsEnabled(): boolean {
  return Boolean(MAPS_API_KEY && MAPS_API_KEY.trim().length > 5);
}

export const MAP_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_MAP_ID) || '';

export const TERRAIN_RESOLUTION = 512;

/**
 * Calculates deterministic elevation for any coordinate inside or near an arena.
 */
export function getArenaElevationAt(coord: LatLng, arena: Arena): number {
  const { p1Coords, p2Coords } = arena;
  const dLat = p2Coords.lat - p1Coords.lat;
  const dLng = p2Coords.lng - p1Coords.lng;
  const lenSq = dLat * dLat + dLng * dLng;

  // Project coord onto p1->p2 line segment
  let t = 0.5;
  if (lenSq > 0) {
    const uLat = coord.lat - p1Coords.lat;
    const uLng = coord.lng - p1Coords.lng;
    t = (uLat * dLat + uLng * dLng) / lenSq;
  }
  t = Math.max(0, Math.min(1, t));

  // Determine baseline bounds
  let baseMin = 500;
  let baseMax = 2200;

  if (arena.id.includes('canyon')) {
    baseMin = 750;
    baseMax = 2440;
  } else if (arena.id.includes('everest')) {
    baseMin = 5364;
    baseMax = 8848;
  } else if (arena.id.includes('k2')) {
    baseMin = 5150;
    baseMax = 8611;
  } else if (arena.id.includes('yosemite')) {
    baseMin = 1190;
    baseMax = 2694;
  } else if (arena.id.includes('gibraltar')) {
    baseMin = 5;
    baseMax = 426;
  } else if (arena.id.includes('death_valley')) {
    baseMin = -86;
    baseMax = 1700;
  } else if (arena.id.includes('vesuvius')) {
    baseMin = 220;
    baseMax = 1281;
  } else if (arena.id.includes('helens')) {
    baseMin = 1050;
    baseMax = 2100;
  } else if (arena.id.includes('twin_peaks')) {
    baseMin = 65;
    baseMax = 282;
  }

  // Seed from arena ID
  let seed = 0;
  for (let i = 0; i < arena.id.length; i++) {
    seed = (seed * 31 + arena.id.charCodeAt(i)) >>> 0;
  }

  let curve = 0.5;
  if (arena.id.includes('canyon')) {
    const centerDist = Math.abs(t - 0.5) * 2;
    const gorge = Math.pow(centerDist, 0.45);
    const detail = 0.08 * Math.sin(t * Math.PI * 14 + seed);
    curve = gorge * 0.85 + detail + 0.1;
  } else if (arena.id.includes('everest') || arena.id.includes('k2')) {
    const alpineSlope = Math.pow(t, 1.4);
    const jagged = 0.15 * Math.sin(t * Math.PI * 7 + seed) + 0.08 * Math.cos(t * Math.PI * 17);
    curve = alpineSlope * 0.75 + jagged + 0.2;
  } else if (arena.id.includes('helens') || arena.id.includes('vesuvius')) {
    const rim = Math.sin(t * Math.PI) * 0.7;
    const caldera =
      Math.abs(t - 0.5) < 0.25 ? -0.35 * Math.cos(((t - 0.5) / 0.25) * (Math.PI / 2)) : 0;
    const noise = 0.05 * Math.sin(t * Math.PI * 20 + seed);
    curve = Math.max(0.1, rim + caldera + noise + 0.2);
  } else if (arena.id.includes('death_valley')) {
    curve = 1 - Math.pow(t, 0.8) * 0.9;
  } else if (arena.id.includes('gibraltar')) {
    curve = Math.pow(t, 1.8) * 0.9 + 0.05;
  } else {
    const wave1 = 0.35 * Math.sin(t * Math.PI * 2 + (seed % 10));
    const wave2 = 0.2 * Math.cos(t * Math.PI * 5 + ((seed >> 2) % 10));
    curve = 0.5 + wave1 + wave2;
  }

  curve = Math.max(0.02, Math.min(0.98, curve));
  return Math.round(baseMin + curve * (baseMax - baseMin));
}

/**
 * Procedural harmonic elevation synthesizer.
 * Generates high-fidelity mathematical cross-sections tailored to each geography.
 */
function generateProceduralTerrain(arena: Arena, resolution: number): TerrainProfile {
  // Deterministic seed based on arena ID
  let seed = 0;
  for (let i = 0; i < arena.id.length; i++) {
    seed = (seed * 31 + arena.id.charCodeAt(i)) >>> 0;
  }

  const rawElevations: number[] = new Array(resolution);
  const normalizedHeights: number[] = new Array(resolution);

  // Baseline altitudes based on arena type
  let baseMin = 500;
  let baseMax = 2200;

  if (arena.id.includes('canyon')) {
    baseMin = 750;
    baseMax = 2440;
  } else if (arena.id.includes('everest')) {
    baseMin = 5364;
    baseMax = 8848;
  } else if (arena.id.includes('k2')) {
    baseMin = 5150;
    baseMax = 8611;
  } else if (arena.id.includes('yosemite')) {
    baseMin = 1190;
    baseMax = 2694;
  } else if (arena.id.includes('gibraltar')) {
    baseMin = 5;
    baseMax = 426;
  } else if (arena.id.includes('death_valley')) {
    baseMin = -86;
    baseMax = 1700;
  } else if (arena.id.includes('vesuvius')) {
    baseMin = 220;
    baseMax = 1281;
  } else if (arena.id.includes('helens')) {
    baseMin = 1050;
    baseMax = 2100;
  } else if (arena.id.includes('twin_peaks')) {
    baseMin = 65;
    baseMax = 282;
  }

  for (let i = 0; i < resolution; i++) {
    const t = i / (resolution - 1); // 0 to 1

    let curve = 0;
    if (arena.id.includes('canyon')) {
      // Canyon: High rims at ends, steep plunge into Colorado river gorge
      const centerDist = Math.abs(t - 0.5) * 2;
      const gorge = Math.pow(centerDist, 0.45);
      const detail =
        0.08 * Math.sin(t * Math.PI * 14 + seed) +
        0.04 * Math.cos(t * Math.PI * 28 + seed * 2);
      curve = gorge * 0.85 + detail + 0.1;
    } else if (arena.id.includes('helens') || arena.id.includes('vesuvius')) {
      // Volcano: High rim craters, sunken caldera floor
      const rim = Math.sin(t * Math.PI) * 0.7;
      const caldera =
        Math.abs(t - 0.5) < 0.25
          ? -0.35 * Math.cos(((t - 0.5) / 0.25) * (Math.PI / 2))
          : 0;
      const noise = 0.05 * Math.sin(t * Math.PI * 20 + seed);
      curve = Math.max(0.1, rim + caldera + noise + 0.2);
    } else if (arena.id.includes('everest') || arena.id.includes('k2')) {
      // Alpine: Jagged asymmetric peaks and ridge ascents
      const alpineSlope = Math.pow(t, 1.4);
      const jagged =
        0.18 * Math.sin(t * Math.PI * 7 + seed) +
        0.1 * Math.sin(t * Math.PI * 17 + seed * 3) +
        0.05 * Math.cos(t * Math.PI * 33);
      curve = alpineSlope * 0.75 + jagged + 0.2;
    } else if (arena.id.includes('yosemite')) {
      // Yosemite: High granite spires with glacial U-shaped valley drop
      const valley = Math.abs(t - 0.45) < 0.22 ? -0.45 * Math.cos(((t - 0.45) / 0.22) * (Math.PI / 2)) : 0;
      const spires = 0.45 + 0.4 * Math.pow(t, 1.2) + valley;
      const graniteNoise = 0.06 * Math.sin(t * Math.PI * 16 + seed);
      curve = Math.max(0.08, spires + graniteNoise);
    } else if (arena.id.includes('death_valley')) {
      // Death Valley: High Dante's overlook plunging into salt flats
      const descent = 1 - Math.pow(t, 0.75) * 0.92;
      const fanNoise = 0.04 * Math.sin(t * Math.PI * 9 + seed);
      curve = Math.max(0.02, descent + fanNoise);
    } else if (arena.id.includes('gibraltar')) {
      // Rock of Gibraltar: Low sea port abruptly ascending steep monolithic rock
      const ridge = Math.pow(t, 1.8) * 0.88 + 0.04;
      const crag = 0.05 * Math.sin(t * Math.PI * 15 + seed);
      curve = Math.max(0.03, ridge + crag);
    } else {
      // Rolling hills / topography
      const wave1 = 0.35 * Math.sin(t * Math.PI * 2 + (seed % 10));
      const wave2 = 0.2 * Math.cos(t * Math.PI * 5 + ((seed >> 2) % 10));
      const wave3 = 0.08 * Math.sin(t * Math.PI * 11 + ((seed >> 4) % 10));
      curve = 0.5 + wave1 + wave2 + wave3;
    }

    curve = Math.max(0.05, Math.min(0.95, curve));
    normalizedHeights[i] = curve;
    rawElevations[i] = Math.round(baseMin + curve * (baseMax - baseMin));
  }

  // Recalculate true min/max
  let minEl = Infinity;
  let maxEl = -Infinity;
  for (const el of rawElevations) {
    if (el < minEl) minEl = el;
    if (el > maxEl) maxEl = el;
  }

  return {
    rawElevations,
    normalizedHeights,
    minElevationMeters: minEl,
    maxElevationMeters: maxEl,
    resolution,
    isProcedural: true,
    attributionText: 'Tactical Topographic DEM (High-Resolution Procedural Earth Model)',
  };
}

/**
 * Fetches real elevation profile dynamically using client-side Google Maps ElevationService.
/**
 * Asynchronously waits for Google Maps JavaScript API to load in the window.
 */
export async function waitForGoogleMaps(timeoutMs = 3500): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google?.maps) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return typeof window !== 'undefined' && !!window.google?.maps;
}

/**
 * Fetches real elevation profile dynamically using client-side Google Maps ElevationService,
 * or immediately produces high-fidelity procedural topographic DEM when Google Maps is disabled.
 */
export async function fetchLiveElevationProfile(
  p1: LatLng,
  p2: LatLng,
  arena: Arena,
  resolution = 256
): Promise<TerrainProfile> {
  // If Google Maps is not enabled or no API key, synthesize instantly without delay
  if (!isGoogleMapsEnabled()) {
    return generateProceduralTerrain(arena, resolution);
  }

  // Wait for Google Maps JavaScript API to finish loading if needed
  const mapsReady = await waitForGoogleMaps(3500);

  if (!mapsReady || !window.google?.maps) {
    return generateProceduralTerrain(arena, resolution);
  }

  try {
    let ElevationServiceClass = window.google.maps.ElevationService;
    let okStatus = window.google.maps.ElevationStatus?.OK;

    // Use modern importLibrary if ElevationService is not immediately on the root namespace
    if (!ElevationServiceClass && window.google.maps.importLibrary) {
      const elevationLib = (await window.google.maps.importLibrary(
        'elevation'
      )) as google.maps.ElevationLibrary;
      ElevationServiceClass = elevationLib.ElevationService;
      okStatus = elevationLib.ElevationStatus.OK;
    }

    if (!ElevationServiceClass) {
      return generateProceduralTerrain(arena, resolution);
    }

    const elevationService = new ElevationServiceClass();
    const path = [
      new window.google.maps.LatLng(p1.lat, p1.lng),
      new window.google.maps.LatLng(p2.lat, p2.lng),
    ];

    const response = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
      elevationService.getElevationAlongPath(
        { path, samples: resolution },
        (results, status) => {
          if (status === (okStatus ?? 'OK') && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`ElevationService query failed with status: ${status}`));
          }
        }
      );
    });

    const rawElevations: number[] = response.map((r) => r.elevation);
    let minEl = Infinity;
    let maxEl = -Infinity;
    for (const el of rawElevations) {
      if (el < minEl) minEl = el;
      if (el > maxEl) maxEl = el;
    }

    // Handle nearly flat terrain by adding minimum relief contrast
    const relief = Math.max(15, maxEl - minEl);
    const normalizedHeights = rawElevations.map((el) => (el - minEl) / relief);

    return {
      rawElevations,
      normalizedHeights,
      minElevationMeters: Math.round(minEl),
      maxElevationMeters: Math.round(maxEl),
      resolution: rawElevations.length,
      isProcedural: false,
      attributionText: 'Google Maps Elevation API (Live Real-Time Query)',
    };
  } catch (err) {
    console.warn(
      'Google Maps ElevationService call failed or quota exceeded. Using procedural DEM:',
      err
    );
    return generateProceduralTerrain(arena, resolution);
  }
}

/**
 * Fetches elevation in meters for a list of discrete geographic locations using ElevationService
 * or instant calculated spot elevations from the arena topographic model.
 */
export async function fetchElevationsForLocations(
  locations: LatLng[],
  arena?: Arena
): Promise<(number | null)[]> {
  if (!isGoogleMapsEnabled()) {
    if (arena) {
      return locations.map((loc) => getArenaElevationAt(loc, arena));
    }
    return locations.map(() => 1200);
  }

  const mapsReady = await waitForGoogleMaps(1500);
  if (!mapsReady || !window.google?.maps || locations.length === 0) {
    if (arena) {
      return locations.map((loc) => getArenaElevationAt(loc, arena));
    }
    return locations.map(() => null);
  }

  try {
    let ElevationServiceClass = window.google.maps.ElevationService;
    let okStatus = window.google.maps.ElevationStatus?.OK;

    if (!ElevationServiceClass && window.google.maps.importLibrary) {
      const elevationLib = (await window.google.maps.importLibrary(
        'elevation'
      )) as google.maps.ElevationLibrary;
      ElevationServiceClass = elevationLib.ElevationService;
      okStatus = elevationLib.ElevationStatus.OK;
    }

    if (!ElevationServiceClass) {
      return locations.map(() => null);
    }

    const elevationService = new ElevationServiceClass();
    const gLocations = locations.map(
      (loc) => new window.google.maps.LatLng(loc.lat, loc.lng)
    );

    return await new Promise<(number | null)[]>((resolve) => {
      elevationService.getElevationForLocations(
        { locations: gLocations },
        (results, status) => {
          if (status === (okStatus ?? 'OK') && results && results.length > 0) {
            resolve(results.map((r) => (r ? Math.round(r.elevation) : null)));
          } else {
            resolve(locations.map(() => null));
          }
        }
      );
    });
  } catch (err) {
    console.warn('Failed to fetch elevations for locations:', err);
    return locations.map(() => null);
  }
}

export interface PathSegmentElevation {
  segmentIndex: number;
  startKm: number;
  endKm: number;
  startCoord: LatLng;
  endCoord: LatLng;
  midpointCoord: LatLng;
  elevations: number[];
  minElevation: number;
  maxElevation: number;
}

export interface SegmentElevationReport {
  totalDistanceKm: number;
  numSegments: number;
  totalApiCalls: number;
  segments: PathSegmentElevation[];
  minElevation: number;
  maxElevation: number;
  reliefMeters: number;
}

/**
 * Linearly interpolates GPS coordinates between two points.
 */
function interpolateSegmentCoords(p1: LatLng, p2: LatLng, t: number): LatLng {
  let dLng = p2.lng - p1.lng;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;

  let lng = p1.lng + t * dLng;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;

  return {
    lat: p1.lat + t * (p2.lat - p1.lat),
    lng,
  };
}

/**
 * Queries Elevation Along a Path for a single line segment.
 */
async function querySinglePathSegment(
  start: LatLng,
  end: LatLng,
  samples = 20
): Promise<number[]> {
  const mapsReady = await waitForGoogleMaps(2500);
  if (!mapsReady || !window.google?.maps) {
    return [];
  }

  try {
    let ElevationServiceClass = window.google.maps.ElevationService;
    let okStatus = window.google.maps.ElevationStatus?.OK;

    if (!ElevationServiceClass && window.google.maps.importLibrary) {
      const elevationLib = (await window.google.maps.importLibrary(
        'elevation'
      )) as google.maps.ElevationLibrary;
      ElevationServiceClass = elevationLib.ElevationService;
      okStatus = elevationLib.ElevationStatus.OK;
    }

    if (!ElevationServiceClass) return [];

    const elevationService = new ElevationServiceClass();
    const path = [
      new window.google.maps.LatLng(start.lat, start.lng),
      new window.google.maps.LatLng(end.lat, end.lng),
    ];

    return await new Promise<number[]>((resolve) => {
      elevationService.getElevationAlongPath(
        { path, samples },
        (results, status) => {
          if (status === (okStatus ?? 'OK') && results && results.length > 0) {
            resolve(results.map((r) => Math.round(r.elevation)));
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Path segment elevation query failed:', err);
    return [];
  }
}

/**
 * Partitions the connecting line into 5km segments and executes one Elevation API call
 * per 5km segment concurrently.
 */
export async function fetchElevationAlong5kmSegments(
  p1: LatLng,
  p2: LatLng,
  segmentSizeKm = 5.0
): Promise<SegmentElevationReport> {
  const totalDistanceKm = calculateDistanceKm(p1, p2);
  const numSegments = Math.max(1, Math.ceil(totalDistanceKm / segmentSizeKm));

  const segmentDefs: Array<{
    segmentIndex: number;
    startKm: number;
    endKm: number;
    startCoord: LatLng;
    endCoord: LatLng;
    midpointCoord: LatLng;
  }> = [];

  for (let i = 0; i < numSegments; i++) {
    const startKm = Math.round(i * segmentSizeKm * 10) / 10;
    const endKm = Math.min(totalDistanceKm, Math.round((i + 1) * segmentSizeKm * 10) / 10);
    const t0 = totalDistanceKm > 0 ? (i * segmentSizeKm) / totalDistanceKm : 0;
    const t1 = totalDistanceKm > 0 ? Math.min(1.0, ((i + 1) * segmentSizeKm) / totalDistanceKm) : 1;
    const tMid = (t0 + t1) / 2;

    const startCoord = interpolateSegmentCoords(p1, p2, t0);
    const endCoord = interpolateSegmentCoords(p1, p2, t1);
    const midpointCoord = interpolateSegmentCoords(p1, p2, tMid);

    segmentDefs.push({
      segmentIndex: i,
      startKm,
      endKm,
      startCoord,
      endCoord,
      midpointCoord,
    });
  }

  // Execute one Elevation Along Path API call for every 5km segment concurrently
  const segmentPromises = segmentDefs.map(async (def) => {
    const elevations = await querySinglePathSegment(def.startCoord, def.endCoord, 20);

    let minElevation = Infinity;
    let maxElevation = -Infinity;
    for (const el of elevations) {
      if (el < minElevation) minElevation = el;
      if (el > maxElevation) maxElevation = el;
    }

    if (minElevation === Infinity) minElevation = 0;
    if (maxElevation === -Infinity) maxElevation = 0;

    return {
      ...def,
      elevations,
      minElevation,
      maxElevation,
    };
  });

  const segments = await Promise.all(segmentPromises);

  let overallMin = Infinity;
  let overallMax = -Infinity;
  for (const seg of segments) {
    if (seg.elevations.length > 0) {
      if (seg.minElevation < overallMin) overallMin = seg.minElevation;
      if (seg.maxElevation > overallMax) overallMax = seg.maxElevation;
    }
  }

  if (overallMin === Infinity) overallMin = 0;
  if (overallMax === -Infinity) overallMax = 0;

  return {
    totalDistanceKm,
    numSegments,
    totalApiCalls: segments.length,
    segments,
    minElevation: overallMin,
    maxElevation: overallMax,
    reliefMeters: Math.max(0, overallMax - overallMin),
  };
}


