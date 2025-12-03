/**
 * Combat System - handles damage calculation and combat resolution
 */

import { GridPosition, getManhattanDistance } from '../models/grid'

// ============= Combat Types =============

export interface CombatResult {
  attacker: { id: string; type: 'process' | 'malware' }
  defender: { id: string; type: 'process' | 'malware' }
  damage: number
  defenderDestroyed: boolean
  message: string
}

export interface CombatRound {
  tick: number
  results: CombatResult[]
}

// ============= Damage Calculation =============

/**
 * Calculate damage from attacker to defender
 * Formula: base_attack * (1 + variance) - defense
 * Minimum damage is 1
 */
export function calculateDamage(
  attackerAttack: number,
  defenderDefense: number,
  variance: number = 0.2
): number {
  const varianceMod = 1 + (Math.random() * variance * 2 - variance)
  const rawDamage = Math.floor(attackerAttack * varianceMod)
  return Math.max(1, rawDamage - defenderDefense)
}

// ============= Range Checks =============

export function isInAttackRange(
  attacker: GridPosition,
  defender: GridPosition,
  range: number = 1
): boolean {
  return getManhattanDistance(attacker, defender) <= range
}
