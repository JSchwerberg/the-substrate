/**
 * Central game configuration
 * All tunable game values in one place for easy balancing
 */

// ============= Rendering =============

export const RENDER = {
  /** Pixels per grid tile */
  TILE_SIZE: 32,
  /** Milliseconds between game ticks */
  TICK_INTERVAL_MS: 500,
} as const

// ============= Resources =============

export const RESOURCES = {
  /** Starting cycles (before upgrades) */
  STARTING_CYCLES: 100,
  /** Starting memory */
  STARTING_MEMORY: 50,
  /** Starting energy */
  STARTING_ENERGY: 75,
  /** Bonus cycles per startingCycles upgrade level */
  CYCLES_PER_UPGRADE: 20,
} as const

export const CAPACITY = {
  MAX_CYCLES: 100,
  MAX_MEMORY: 100,
  MAX_ENERGY: 100,
} as const

// ============= Deployment Costs =============

export const DEPLOY_COST = {
  SCOUT: 20,
  PURIFIER: 40,
} as const

export const ENERGY_DEPLOYMENT_COSTS = {
  SCOUT: 30,
  PURIFIER: 50,
  SCALING_MULTIPLIER: 1.5,
} as const

// ============= Memory Costs (Capacity Gating) =============

export const MEMORY_COST = {
  /** Memory reserved while a Scout is alive */
  SCOUT: 20,
  /** Memory reserved while a Purifier is alive */
  PURIFIER: 35,
} as const

export const ENERGY_REGEN_PER_TICK = 5

// ============= Spawn Healing =============

/** HP restored per tick when process is on or adjacent to a spawn point */
export const SPAWN_HEALING_PER_TICK = 5

// ============= Upgrade System =============

export const UPGRADES = {
  /** Base cost for each upgrade type */
  BASE_COST: {
    MAX_HEALTH: 50,
    ATTACK: 75,
    DEFENSE: 60,
    STARTING_CYCLES: 40,
  },
  /** Cost multiplier per level (exponential scaling) */
  COST_MULTIPLIER: 1.5,
  /** Stat bonus per upgrade level */
  BONUS_PER_LEVEL: {
    HEALTH: 10,
    ATTACK: 2,
    DEFENSE: 1,
  },
} as const

// ============= Safe Value Limits =============

export const SAFE_LIMITS = {
  /** Maximum value for accumulated data (prevents integer overflow) */
  MAX_DATA: Number.MAX_SAFE_INTEGER,
  /** Maximum expedition score values (prevents manipulation) */
  MAX_SCORE: 1_000_000,
} as const

// ============= Rewards =============

export const REWARDS = {
  /** Data earned per cache collected */
  CACHE_COLLECTED: 10,
  /** Data earned per malware destroyed */
  MALWARE_DESTROYED: 5,
  /** Bonus data for completing expedition */
  VICTORY_BONUS: 50,
  /** Bonus data per 10 ticks survived */
  SURVIVAL_BONUS_PER_10_TICKS: 1,
} as const

// ============= Difficulty =============

export const DIFFICULTY = {
  /** Malware spawn multiplier by difficulty */
  MALWARE_MULTIPLIER: {
    easy: 0.5,
    normal: 1.0,
    hard: 2.0,
  },
  /** Reward multiplier by difficulty */
  REWARD_MULTIPLIER: {
    easy: 0.75,
    normal: 1.0,
    hard: 1.5,
  },
} as const

// ============= Combat Log =============

export const COMBAT_LOG = {
  /** Maximum entries to keep in combat log */
  MAX_ENTRIES: 50,
} as const

// ============= Sector Generation =============

export const GENERATION = {
  /** Max attempts to place malware before giving up */
  MAX_PLACEMENT_ATTEMPTS: 50,
  /** Divisor for calculating cache count from area */
  CACHE_AREA_DIVISOR: 32,
} as const

// ============= Worm Replication =============

export const WORM = {
  /** Ticks between worm replications */
  REPLICATION_COOLDOWN: 10,
  /** Maximum number of worms allowed per difficulty */
  MAX_COUNT: {
    easy: 8,
    normal: 12,
    hard: 16,
  },
} as const

// ============= Interventions =============

export const INTERVENTIONS = {
  /** Retreat: Move selected process toward nearest spawn point */
  RETREAT: {
    cost: 50,
    description: 'Retreat to spawn',
  },
  /** Scan: Reveal area around selected process */
  SCAN: {
    cost: 30,
    radius: 3,
    description: 'Reveal area',
  },
} as const

export type InterventionType = keyof typeof INTERVENTIONS
