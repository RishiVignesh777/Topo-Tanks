import { Weapon } from '../types/game';

export const WEAPONS: Record<string, Weapon> = {
  standard: {
    id: 'standard',
    name: 'HE Shell',
    icon: 'Bomb',
    ammo: -1, // Infinite
    blastRadius: 36,
    directDamage: 40,
    description: 'High-explosive fragmentation shell. Reliable medium blast radius and steady trajectory.',
    specialType: 'standard',
    color: '#f59e0b',
  },
  mirv: {
    id: 'mirv',
    name: 'MIRV Cluster',
    icon: 'Sparkles',
    ammo: 3,
    blastRadius: 22,
    directDamage: 22,
    description: 'Splits into 5 mini-warheads at the apex of its arc, carpet-bombing mountain ridges.',
    specialType: 'mirv',
    color: '#ec4899',
  },
  digger: {
    id: 'digger',
    name: 'Mountain Digger',
    icon: 'Drill',
    ammo: 2,
    blastRadius: 40,
    directDamage: 48,
    description: 'Bores 40px deep into soil before detonation to trigger massive subterranean landslides.',
    specialType: 'digger',
    color: '#10b981',
  },
  dirt: {
    id: 'dirt',
    name: 'Dirt Bomb',
    icon: 'Mountain',
    ammo: 3,
    blastRadius: 46,
    directDamage: 5,
    description: 'Additive ordnance: deposits a high soil mound to shield your tank or bury opponents.',
    specialType: 'dirt',
    color: '#d97706',
  },
  bouncer: {
    id: 'bouncer',
    name: 'Bouncer / Roller',
    icon: 'Disc',
    ammo: 3,
    blastRadius: 34,
    directDamage: 42,
    description: 'Bounces and rolls down steep topographic slopes up to 3 times before detonating.',
    specialType: 'bouncer',
    color: '#06b6d4',
  },
  nuke: {
    id: 'nuke',
    name: 'Tectonic Nuke',
    icon: 'Flame',
    ammo: 1,
    blastRadius: 82,
    directDamage: 80,
    description: 'Devastating seismic ordnance. Obliterates terrain and shatters mountain cliffs.',
    specialType: 'nuke',
    color: '#ef4444',
  },
};

export const WEAPON_LIST = Object.values(WEAPONS);

export function createDefaultInventory(): Record<string, number> {
  return {
    standard: -1,
    mirv: 3,
    digger: 2,
    dirt: 3,
    bouncer: 3,
    nuke: 1,
  };
}
