import { MatchStats } from '../types/game';

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface TankSkin {
  id: string;
  name: string;
  tagline: string;
  category: 'standard' | 'camo' | 'cyber' | 'heavy' | 'prestige';
  rarity: SkinRarity;
  description: string;
  unlockCondition: string;
  unlockedByDefault: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    barrelColor: string;
    treadColor: string;
    wheelColor: string;
    camoColor?: string;
    glowColor?: string;
    badgeText?: string;
  };
  visuals: {
    chassisStyle:
      | 'classic'
      | 'sloped_skirt'
      | 'angular_stealth'
      | 'heavy_riveted'
      | 'cyber_conduit'
      | 'gilded_emperor';
    turretStyle:
      | 'rounded_dome'
      | 'wedge_mantlet'
      | 'stealth_facets'
      | 'twin_turret'
      | 'plasma_dome'
      | 'imperial_crested';
    barrelStyle:
      | 'single_howitzer'
      | 'perforated_brake'
      | 'squared_railgun'
      | 'twin_cannon'
      | 'pulsing_plasma'
      | 'ornate_crown';
    treadStyle:
      | 'rubber_pads'
      | 'sand_skirt'
      | 'heavy_plates'
      | 'maglev_hover'
      | 'gold_links';
    pattern:
      | 'solid'
      | 'desert_tiger'
      | 'arctic_splinter'
      | 'hex_stealth'
      | 'neon_circuits'
      | 'hazard_stripes'
      | 'gold_filigree';
  };
}

export const TANK_SKINS: TankSkin[] = [
  {
    id: 'classic',
    name: 'Standard Issue',
    tagline: 'Military Heavy Ordnance',
    category: 'standard',
    rarity: 'common',
    description: 'Battlefield-tested composite armor with heavy road wheels and a high-velocity field howitzer.',
    unlockCondition: 'Unlocked by default',
    unlockedByDefault: true,
    theme: {
      primaryColor: '#ef4444', // customized per player ID if desired
      secondaryColor: '#991b1b',
      accentColor: '#fbbf24',
      barrelColor: '#64748b',
      treadColor: '#1e293b',
      wheelColor: '#475569',
      badgeText: 'STD-1',
    },
    visuals: {
      chassisStyle: 'classic',
      turretStyle: 'rounded_dome',
      barrelStyle: 'single_howitzer',
      treadStyle: 'rubber_pads',
      pattern: 'solid',
    },
  },
  {
    id: 'desert_camo',
    name: 'Desert Scorpions',
    tagline: 'Arid Sandstorm Warfare',
    category: 'camo',
    rarity: 'common',
    description: 'Heat-dissipating sandstorm camouflage with reinforced track dust skirts for desert chasms.',
    unlockCondition: 'Unlocked by default',
    unlockedByDefault: true,
    theme: {
      primaryColor: '#d97706',
      secondaryColor: '#92400e',
      accentColor: '#fef08a',
      barrelColor: '#78350f',
      treadColor: '#292524',
      wheelColor: '#78716c',
      camoColor: '#fde68a',
      badgeText: 'DESERT',
    },
    visuals: {
      chassisStyle: 'sloped_skirt',
      turretStyle: 'wedge_mantlet',
      barrelStyle: 'perforated_brake',
      treadStyle: 'sand_skirt',
      pattern: 'desert_tiger',
    },
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Vanguard',
    tagline: 'Glacial Altitude Specialist',
    category: 'camo',
    rarity: 'rare',
    description: 'Sub-zero frost white and glacial cyan splinter camouflage engineered for Everest ridge artillery.',
    unlockCondition: 'Unlocked by default',
    unlockedByDefault: true,
    theme: {
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1',
      accentColor: '#38bdf8',
      barrelColor: '#cbd5e1',
      treadColor: '#0f172a',
      wheelColor: '#94a3b8',
      camoColor: '#f8fafc',
      glowColor: '#38bdf8',
      badgeText: 'FROST',
    },
    visuals: {
      chassisStyle: 'sloped_skirt',
      turretStyle: 'wedge_mantlet',
      barrelStyle: 'perforated_brake',
      treadStyle: 'rubber_pads',
      pattern: 'arctic_splinter',
    },
  },
  {
    id: 'stealth_obsidian',
    name: 'Obsidian Nighthawk',
    tagline: 'Low-Observable Railgun',
    category: 'standard',
    rarity: 'rare',
    description: 'Radar-absorbent faceted carbon armor with crimson optic sensors and a shrouded railgun barrel.',
    unlockCondition: 'Unlocked by default',
    unlockedByDefault: true,
    theme: {
      primaryColor: '#18181b',
      secondaryColor: '#09090b',
      accentColor: '#ef4444',
      barrelColor: '#27272a',
      treadColor: '#09090b',
      wheelColor: '#3f3f46',
      glowColor: '#ef4444',
      badgeText: 'STEALTH',
    },
    visuals: {
      chassisStyle: 'angular_stealth',
      turretStyle: 'stealth_facets',
      barrelStyle: 'squared_railgun',
      treadStyle: 'heavy_plates',
      pattern: 'hex_stealth',
    },
  },
  {
    id: 'cyber_neon',
    name: 'Neon Cyberpunk',
    tagline: 'Pulsing Plasma Artillery',
    category: 'cyber',
    rarity: 'epic',
    description: 'Electroluminescent circuit traces with floating mag-lev hover pads and dual plasma accelerator coils.',
    unlockCondition: 'Fire 3 artillery rounds in any battle',
    unlockedByDefault: false,
    theme: {
      primaryColor: '#9333ea',
      secondaryColor: '#581c87',
      accentColor: '#06b6d4',
      barrelColor: '#3b0764',
      treadColor: '#18022a',
      wheelColor: '#06b6d4',
      glowColor: '#06b6d4',
      camoColor: '#f43f5e',
      badgeText: 'CYBER',
    },
    visuals: {
      chassisStyle: 'cyber_conduit',
      turretStyle: 'plasma_dome',
      barrelStyle: 'pulsing_plasma',
      treadStyle: 'maglev_hover',
      pattern: 'neon_circuits',
    },
  },
  {
    id: 'toxic_hazard',
    name: 'Toxic Bio-Dread',
    tagline: 'Wasteland Siege Machine',
    category: 'heavy',
    rarity: 'epic',
    description: 'Industrial hazard warning chevrons, pressurized caustic fuel canisters, and a corroded heavy bore barrel.',
    unlockCondition: 'Deal 250+ cumulative damage in combat',
    unlockedByDefault: false,
    theme: {
      primaryColor: '#ca8a04',
      secondaryColor: '#854d0e',
      accentColor: '#84cc16',
      barrelColor: '#422006',
      treadColor: '#1c1917',
      wheelColor: '#713f12',
      glowColor: '#84cc16',
      camoColor: '#1c1917',
      badgeText: 'HAZARD',
    },
    visuals: {
      chassisStyle: 'heavy_riveted',
      turretStyle: 'wedge_mantlet',
      barrelStyle: 'single_howitzer',
      treadStyle: 'heavy_plates',
      pattern: 'hazard_stripes',
    },
  },
  {
    id: 'iron_goliath',
    name: 'Iron Behemoth',
    tagline: 'Synchronized Twin Cannons',
    category: 'heavy',
    rarity: 'epic',
    description: 'Massive multi-layered riveted armor plating boasting dual synchronized heavy howitzers.',
    unlockCondition: 'Score 2 Direct Hits in a match',
    unlockedByDefault: false,
    theme: {
      primaryColor: '#475569',
      secondaryColor: '#1e293b',
      accentColor: '#f97316',
      barrelColor: '#334155',
      treadColor: '#0f172a',
      wheelColor: '#64748b',
      glowColor: '#f97316',
      badgeText: 'GOLIATH',
    },
    visuals: {
      chassisStyle: 'heavy_riveted',
      turretStyle: 'twin_turret',
      barrelStyle: 'twin_cannon',
      treadStyle: 'heavy_plates',
      pattern: 'solid',
    },
  },
  {
    id: 'golden_emperor',
    name: 'Golden Sovereign',
    tagline: 'Prestige 24K Imperial Armor',
    category: 'prestige',
    rarity: 'legendary',
    description: 'Mirror-polished solid 24-karat gold plating with imperial royal filigree and gleaming muzzle crown.',
    unlockCondition: 'Win a match or achieve victory',
    unlockedByDefault: false,
    theme: {
      primaryColor: '#eab308',
      secondaryColor: '#ca8a04',
      accentColor: '#fef08a',
      barrelColor: '#a16207',
      treadColor: '#422006',
      wheelColor: '#fbbf24',
      glowColor: '#fef08a',
      camoColor: '#ffffff',
      badgeText: 'ROYAL',
    },
    visuals: {
      chassisStyle: 'gilded_emperor',
      turretStyle: 'imperial_crested',
      barrelStyle: 'ornate_crown',
      treadStyle: 'gold_links',
      pattern: 'gold_filigree',
    },
  },
];

const STORAGE_KEY = 'topo_tanks_unlocked_skins_v1';

/**
 * Returns all unlocked skin IDs.
 */
export function getUnlockedSkinIds(): string[] {
  if (typeof window === 'undefined') {
    return TANK_SKINS.filter((s) => s.unlockedByDefault).map((s) => s.id);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = TANK_SKINS.filter((s) => s.unlockedByDefault).map((s) => s.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure defaults are always included
      const merged = Array.from(
        new Set([...parsed, ...TANK_SKINS.filter((s) => s.unlockedByDefault).map((s) => s.id)])
      );
      return merged;
    }
  } catch {
    // fallback
  }
  return TANK_SKINS.filter((s) => s.unlockedByDefault).map((s) => s.id);
}

/**
 * Unlocks a specific skin and persists to localStorage.
 */
export function unlockSkin(skinId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getUnlockedSkinIds();
  if (current.includes(skinId)) return false;
  const updated = [...current, skinId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return true;
}

/**
 * Unlocks all skins immediately (Armory Master Key).
 */
export function unlockAllSkins(): void {
  if (typeof window === 'undefined') return;
  const allIds = TANK_SKINS.map((s) => s.id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
  } catch {
    // ignore
  }
}

/**
 * Checks milestone unlocks based on current match telemetry and returns any newly unlocked skins.
 */
export function checkMilestoneUnlocks(stats: MatchStats, didWin: boolean): string[] {
  const currentUnlocked = getUnlockedSkinIds();
  const newlyUnlocked: string[] = [];

  // 1. Cyber Neon: 3+ turns played
  if (stats.turnNumber >= 3 && !currentUnlocked.includes('cyber_neon')) {
    if (unlockSkin('cyber_neon')) newlyUnlocked.push('cyber_neon');
  }

  // 2. Toxic Hazard: 250+ damage dealt
  if (
    (stats.p1DamageDealt >= 250 || stats.p2DamageDealt >= 250) &&
    !currentUnlocked.includes('toxic_hazard')
  ) {
    if (unlockSkin('toxic_hazard')) newlyUnlocked.push('toxic_hazard');
  }

  // 3. Iron Goliath: 2+ direct hits
  if (
    (stats.p1DirectHits >= 2 || stats.p2DirectHits >= 2) &&
    !currentUnlocked.includes('iron_goliath')
  ) {
    if (unlockSkin('iron_goliath')) newlyUnlocked.push('iron_goliath');
  }

  // 4. Golden Sovereign: match won
  if (didWin && !currentUnlocked.includes('golden_emperor')) {
    if (unlockSkin('golden_emperor')) newlyUnlocked.push('golden_emperor');
  }

  return newlyUnlocked;
}

/**
 * Finds a skin definition by ID or falls back to classic.
 */
export function getSkinById(skinId?: string): TankSkin {
  if (!skinId) return TANK_SKINS[0];
  return TANK_SKINS.find((s) => s.id === skinId) || TANK_SKINS[0];
}
