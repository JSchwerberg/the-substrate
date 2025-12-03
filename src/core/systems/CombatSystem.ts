/**
 * Combat System - handles damage calculation and combat resolution
 */

import { GridPosition, getManhattanDistance } from '../models/grid'
import { Process, applyDamage as applyDamageToProcess, getEffectiveStat } from '../models/process'
import { Malware, applyDamageToMalware, activateMalware } from '../models/malware'
import { Expedition, getMalwareInRange, getProcessesInRange, logEvent } from '../models/expedition'

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

// ============= Process vs Malware Combat =============

export function processAttacksMalware(
  process: Process,
  malware: Malware,
  expedition: Expedition
): CombatResult {
  const attack = getEffectiveStat(process, 'attack')
  const defense = malware.stats.defense
  const damage = calculateDamage(attack, defense)

  const actualDamage = applyDamageToMalware(malware, damage)
  const destroyed = malware.status === 'destroyed'

  const message = destroyed
    ? `${process.name} destroyed ${malware.name}!`
    : `${process.name} dealt ${actualDamage} damage to ${malware.name}`

  logEvent(expedition, 'malware_damaged', message, {
    actorId: process.id,
    targetId: malware.id,
    value: actualDamage,
    position: malware.position,
  })

  if (destroyed) {
    expedition.rewards.malwareDestroyed++
    logEvent(expedition, 'malware_destroyed', `${malware.name} was destroyed`, {
      actorId: process.id,
      targetId: malware.id,
      position: malware.position,
    })
  }

  // Reset process status after attack
  process.status = 'idle'

  return {
    attacker: { id: process.id, type: 'process' },
    defender: { id: malware.id, type: 'malware' },
    damage: actualDamage,
    defenderDestroyed: destroyed,
    message,
  }
}

export function malwareAttacksProcess(
  malware: Malware,
  process: Process,
  expedition: Expedition
): CombatResult {
  const attack = malware.stats.attack
  const defense = getEffectiveStat(process, 'defense')
  const damage = calculateDamage(attack, defense)

  const actualDamage = applyDamageToProcess(process, damage)
  const destroyed = process.status === 'destroyed'

  const message = destroyed
    ? `${malware.name} destroyed ${process.name}!`
    : `${malware.name} dealt ${actualDamage} damage to ${process.name}`

  logEvent(expedition, 'process_damaged', message, {
    actorId: malware.id,
    targetId: process.id,
    value: actualDamage,
    position: process.position,
  })

  if (destroyed) {
    logEvent(expedition, 'process_destroyed', `${process.name} was destroyed`, {
      actorId: malware.id,
      targetId: process.id,
      position: process.position,
    })
  }

  return {
    attacker: { id: malware.id, type: 'malware' },
    defender: { id: process.id, type: 'process' },
    damage: actualDamage,
    defenderDestroyed: destroyed,
    message,
  }
}

// ============= Combat Resolution =============

/**
 * Resolve all combat for a single tick
 * Processes that are 'attacking' will attack adjacent malware
 * Malware will counterattack or initiate attacks based on AI
 */
export function resolveCombat(expedition: Expedition): CombatRound {
  const results: CombatResult[] = []

  // Process attacks
  for (const process of expedition.processes.values()) {
    if (process.status !== 'attacking') continue

    const adjacentMalware = getMalwareInRange(expedition, process.position, 1)
    if (adjacentMalware.length === 0) {
      process.status = 'idle'
      continue
    }

    // Attack first adjacent malware (could be smarter about target selection)
    const target = adjacentMalware[0]!
    const result = processAttacksMalware(process, target, expedition)
    results.push(result)

    // Activate dormant malware when attacked
    if (target.status === 'dormant') {
      activateMalware(target)
      logEvent(expedition, 'malware_activated', `${target.name} has been awakened!`, {
        actorId: process.id,
        targetId: target.id,
        position: target.position,
      })
    }
  }

  // Malware counterattacks and attacks
  for (const malware of expedition.malware.values()) {
    if (malware.status === 'destroyed' || malware.status === 'dormant') continue

    const adjacentProcesses = getProcessesInRange(expedition, malware.position, 1)
    if (adjacentProcesses.length === 0) continue

    // Activate if adjacent to a process
    if (malware.status !== 'alerted' && malware.status !== 'active') {
      activateMalware(malware)
    }

    // Attack a random adjacent process
    const target = adjacentProcesses[Math.floor(Math.random() * adjacentProcesses.length)]!
    const result = malwareAttacksProcess(malware, target, expedition)
    results.push(result)
  }

  return {
    tick: expedition.currentTick,
    results,
  }
}

// ============= Range Checks =============

export function isInAttackRange(
  attacker: GridPosition,
  defender: GridPosition,
  range: number = 1
): boolean {
  return getManhattanDistance(attacker, defender) <= range
}

export function getValidTargets(
  process: Process,
  expedition: Expedition,
  range: number = 1
): Malware[] {
  return getMalwareInRange(expedition, process.position, range).filter(
    m => m.status !== 'destroyed'
  )
}

// ============= Special Attacks =============

export interface AreaAttackResult {
  center: GridPosition
  radius: number
  targets: CombatResult[]
}

/**
 * Area of effect attack (for abilities like logic bomb explosion)
 */
export function areaAttack(
  attacker: { id: string; type: 'process' | 'malware'; attack: number },
  center: GridPosition,
  radius: number,
  expedition: Expedition
): AreaAttackResult {
  const results: CombatResult[] = []

  if (attacker.type === 'malware') {
    // Malware AoE hits processes
    const targets = getProcessesInRange(expedition, center, radius)
    for (const target of targets) {
      const damage = calculateDamage(attacker.attack, getEffectiveStat(target, 'defense'))
      const actualDamage = applyDamageToProcess(target, damage)
      const destroyed = target.status === 'destroyed'

      results.push({
        attacker: { id: attacker.id, type: 'malware' },
        defender: { id: target.id, type: 'process' },
        damage: actualDamage,
        defenderDestroyed: destroyed,
        message: `AoE hit ${target.name} for ${actualDamage}`,
      })

      logEvent(expedition, 'process_damaged', `AoE hit ${target.name} for ${actualDamage}`, {
        actorId: attacker.id,
        targetId: target.id,
        value: actualDamage,
        position: target.position,
      })
    }
  } else {
    // Process AoE hits malware
    const targets = getMalwareInRange(expedition, center, radius)
    for (const target of targets) {
      const damage = calculateDamage(attacker.attack, target.stats.defense)
      const actualDamage = applyDamageToMalware(target, damage)
      const destroyed = target.status === 'destroyed'

      results.push({
        attacker: { id: attacker.id, type: 'process' },
        defender: { id: target.id, type: 'malware' },
        damage: actualDamage,
        defenderDestroyed: destroyed,
        message: `AoE hit ${target.name} for ${actualDamage}`,
      })

      logEvent(expedition, 'malware_damaged', `AoE hit ${target.name} for ${actualDamage}`, {
        actorId: attacker.id,
        targetId: target.id,
        value: actualDamage,
        position: target.position,
      })
    }
  }

  return { center, radius, targets: results }
}
