/**
 * Process (player unit) data models
 */

import { GridPosition } from './grid'

// ============= Archetypes =============

export type ProcessArchetype = 'scout' | 'purifier'

export interface ArchetypeDefinition {
  name: string
  description: string
  baseStats: ProcessBaseStats
  color: number // Hex color for rendering
}

export const ARCHETYPES: Record<ProcessArchetype, ArchetypeDefinition> = {
  scout: {
    name: 'Scout',
    description: 'Fast movement, high sight range, low combat stats',
    baseStats: {
      maxHealth: 60,
      attack: 8,
      defense: 3,
      speed: 3,
      sightRange: 4,
      maxActionPoints: 2,
    },
    color: 0x4ecdc4, // Cyan
  },
  purifier: {
    name: 'Purifier',
    description: 'High damage, moderate health, slower movement',
    baseStats: {
      maxHealth: 100,
      attack: 18,
      defense: 6,
      speed: 2,
      sightRange: 2,
      maxActionPoints: 1,
    },
    color: 0xff6b6b, // Red
  },
}

// ============= Stats =============

export interface ProcessBaseStats {
  maxHealth: number
  attack: number
  defense: number
  speed: number // Tiles per turn
  sightRange: number // Fog reveal radius
  maxActionPoints: number
}

export interface ProcessStats extends ProcessBaseStats {
  health: number
  actionPoints: number
}

// ============= Status =============

export type ProcessStatus =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'retreating'
  | 'disabled'
  | 'destroyed'

export interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff'
  duration: number // Ticks remaining, -1 for permanent
  statModifiers?: Partial<ProcessBaseStats>
}

// ============= Process =============

export interface Process {
  id: string
  name: string
  archetype: ProcessArchetype

  // Stats
  stats: ProcessStats

  // Position and state
  position: GridPosition
  targetPosition: GridPosition | null // For movement animation
  status: ProcessStatus
  statusEffects: StatusEffect[]

  // Movement
  path: GridPosition[] // Current path being followed
  pathIndex: number // Current position in path

  // Visual
  color: number
}

// ============= Factory =============

let processIdCounter = 0

export function createProcess(
  archetype: ProcessArchetype,
  position: GridPosition,
  name?: string
): Process {
  const definition = ARCHETYPES[archetype]
  const id = `process-${++processIdCounter}`

  return {
    id,
    name: name ?? `${definition.name}-${processIdCounter}`,
    archetype,
    stats: {
      ...definition.baseStats,
      health: definition.baseStats.maxHealth,
      actionPoints: definition.baseStats.maxActionPoints,
    },
    position: { ...position },
    targetPosition: null,
    status: 'idle',
    statusEffects: [],
    path: [],
    pathIndex: 0,
    color: definition.color,
  }
}

// ============= Utility Functions =============

export function isAlive(process: Process): boolean {
  return process.stats.health > 0 && process.status !== 'destroyed'
}

export function getHealthPercent(process: Process): number {
  return (process.stats.health / process.stats.maxHealth) * 100
}

export function canAct(process: Process): boolean {
  return isAlive(process) && process.stats.actionPoints > 0 && process.status !== 'disabled'
}

export function resetActionPoints(process: Process): void {
  process.stats.actionPoints = process.stats.maxActionPoints
}

export function consumeActionPoint(process: Process): boolean {
  if (process.stats.actionPoints <= 0) return false
  process.stats.actionPoints--
  return true
}

export function applyDamage(process: Process, damage: number): number {
  const actualDamage = Math.max(0, damage - process.stats.defense)
  process.stats.health = Math.max(0, process.stats.health - actualDamage)

  if (process.stats.health <= 0) {
    process.status = 'destroyed'
  }

  return actualDamage
}

export function heal(process: Process, amount: number): number {
  const oldHealth = process.stats.health
  process.stats.health = Math.min(process.stats.maxHealth, process.stats.health + amount)
  return process.stats.health - oldHealth
}

export function getEffectiveStat(process: Process, stat: keyof ProcessBaseStats): number {
  let value = process.stats[stat]

  // Apply status effect modifiers
  for (const effect of process.statusEffects) {
    if (effect.statModifiers?.[stat]) {
      value += effect.statModifiers[stat]
    }
  }

  return Math.max(0, value)
}

export function tickStatusEffects(process: Process): void {
  process.statusEffects = process.statusEffects.filter(effect => {
    if (effect.duration === -1) return true // Permanent
    effect.duration--
    return effect.duration > 0
  })
}
