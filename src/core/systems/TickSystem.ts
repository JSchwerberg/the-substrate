/**
 * Core tick system - handles game loop logic
 * Extracted from gameStore to separate business logic from state management
 */

import {
  Grid,
  GridPosition,
  getTile,
  isWalkable,
  getManhattanDistance,
  getAdjacentPositions,
} from '@core/models/grid'
import { Process, getEffectiveStat } from '@core/models/process'
import { Malware, createMalware } from '@core/models/malware'
import { BehaviorRule } from '@core/models/behavior'
import { calculateDamage } from '@core/systems/CombatSystem'
import { processBehavior, type GameState as BehaviorGameState } from '@core/systems/BehaviorSystem'
import { WORM } from '@core/constants/GameConfig'

// ============= Types =============

export interface TickContext {
  processes: Process[]
  malware: Malware[]
  grid: Grid
  combatLog: string[]
  sector: {
    exitPoints: GridPosition[]
    spawnPoints: GridPosition[]
  }
  behaviorRules: BehaviorRule[]
  currentTick: number
  difficulty: 'easy' | 'normal' | 'hard'
}

export interface TickResult {
  processes: Process[]
  malware: Malware[]
  grid: Grid
  combatLog: string[]
  cachesCollected: number
  malwareDestroyed: number
  expeditionResult: 'active' | 'victory' | 'defeat'
}

// Deep clone a grid to ensure immutability
function cloneGrid(grid: Grid): Grid {
  return {
    width: grid.width,
    height: grid.height,
    tiles: grid.tiles.map(row => row.map(tile => ({ ...tile, entityIds: [...tile.entityIds] }))),
  }
}

// ============= Phase 1: Process Movement =============

export function processMovementPhase(processes: Process[], grid: Grid): Process[] {
  return processes.map(process => {
    // Tick status effects
    const withTickedEffects = {
      ...process,
      statusEffects: process.statusEffects
        .map(e => (e.duration === -1 ? e : { ...e, duration: e.duration - 1 }))
        .filter(e => e.duration === -1 || e.duration > 0),
    }

    // Reset action points
    const withResetAP = {
      ...withTickedEffects,
      stats: {
        ...withTickedEffects.stats,
        actionPoints: withTickedEffects.stats.maxActionPoints,
      },
    }

    if (withResetAP.status !== 'moving' || withResetAP.path.length === 0) {
      return withResetAP
    }

    const nextIndex = withResetAP.pathIndex + 1

    if (nextIndex >= withResetAP.path.length) {
      return {
        ...withResetAP,
        path: [],
        pathIndex: 0,
        targetPosition: null,
        status: 'idle' as const,
      }
    }

    const nextPos = withResetAP.path[nextIndex]
    if (!nextPos) return withResetAP

    const tile = getTile(grid, nextPos)
    if (!tile || !isWalkable(tile)) return withResetAP

    const collision = processes.some(
      p => p.id !== withResetAP.id && p.position.x === nextPos.x && p.position.y === nextPos.y
    )
    if (collision) return withResetAP

    const reachedEnd = nextIndex >= withResetAP.path.length - 1

    return {
      ...withResetAP,
      position: { ...nextPos },
      pathIndex: nextIndex,
      path: reachedEnd ? [] : withResetAP.path,
      targetPosition: reachedEnd ? null : withResetAP.targetPosition,
      status: reachedEnd ? ('idle' as const) : ('moving' as const),
    }
  })
}

// ============= Phase 1.5: Data Cache Collection =============

export interface CacheCollectionResult {
  grid: Grid
  cachesCollected: number
  logs: string[]
}

export function cacheCollectionPhase(processes: Process[], grid: Grid): CacheCollectionResult {
  const updatedGrid = cloneGrid(grid)
  let cachesCollected = 0
  const logs: string[] = []

  for (const process of processes) {
    if (process.status === 'destroyed') continue

    const tile = getTile(updatedGrid, process.position)
    if (tile && tile.type === 'data_cache') {
      tile.type = 'empty'
      cachesCollected++
      logs.push(`${process.name} collected data cache! +10 cycles`)
    }
  }

  return { grid: updatedGrid, cachesCollected, logs }
}

// ============= Phase 2: Process Combat =============

export interface ProcessCombatResult {
  processes: Process[]
  malware: Malware[]
  malwareDestroyed: number
  logs: string[]
}

export function processCombatPhase(processes: Process[], malware: Malware[]): ProcessCombatResult {
  let updatedMalware = [...malware]
  let malwareDestroyed = 0
  const logs: string[] = []

  const updatedProcesses = processes.map(process => {
    if (process.status === 'destroyed') return process

    // Find adjacent malware
    const adjacentMalware = updatedMalware.filter(
      m => m.status !== 'destroyed' && getManhattanDistance(process.position, m.position) <= 1
    )

    if (adjacentMalware.length === 0) return process

    // Attack the first adjacent malware
    const target = adjacentMalware[0]!
    const attack = getEffectiveStat(process, 'attack')
    const damage = calculateDamage(attack, target.stats.defense)

    // Apply damage to malware
    updatedMalware = updatedMalware.map(m => {
      if (m.id !== target.id) return m
      const newHealth = Math.max(0, m.stats.health - damage)
      const destroyed = newHealth <= 0
      if (destroyed) malwareDestroyed++
      logs.push(
        `${process.name} deals ${damage} damage to ${m.name}${destroyed ? ' (destroyed!)' : ''}`
      )
      return {
        ...m,
        stats: { ...m.stats, health: newHealth },
        status: destroyed ? ('destroyed' as const) : m.status,
        isRevealed: true,
      }
    })

    return { ...process, status: 'attacking' as const }
  })

  return { processes: updatedProcesses, malware: updatedMalware, malwareDestroyed, logs }
}

// ============= Phase 3: Malware AI =============

export interface MalwareAIResult {
  processes: Process[]
  malware: Malware[]
  logs: string[]
}

export function malwareAIPhase(
  processes: Process[],
  malware: Malware[],
  grid: Grid
): MalwareAIResult {
  let updatedProcesses = [...processes]
  const logs: string[] = []

  const updatedMalware = malware.map(m => {
    if (m.status === 'destroyed' || m.status === 'dormant') return m

    // Tick cooldown
    const withCooldown = {
      ...m,
      abilityCooldown: Math.max(0, m.abilityCooldown - 1),
    }

    // Check for adjacent processes to attack
    const adjacentProcesses = updatedProcesses.filter(
      p => p.status !== 'destroyed' && getManhattanDistance(withCooldown.position, p.position) <= 1
    )

    if (adjacentProcesses.length > 0) {
      // Attack a random adjacent process
      const target = adjacentProcesses[Math.floor(Math.random() * adjacentProcesses.length)]!
      const damage = calculateDamage(withCooldown.stats.attack, getEffectiveStat(target, 'defense'))

      // Apply damage to process
      updatedProcesses = updatedProcesses.map(p => {
        if (p.id !== target.id) return p
        const newHealth = Math.max(0, p.stats.health - damage)
        const destroyed = newHealth <= 0
        logs.push(
          `${withCooldown.name} deals ${damage} damage to ${p.name}${destroyed ? ' (destroyed!)' : ''}`
        )
        return {
          ...p,
          stats: { ...p.stats, health: newHealth },
          status: destroyed ? ('destroyed' as const) : p.status,
        }
      })

      return { ...withCooldown, status: 'alerted' as const, isRevealed: true }
    }

    // Check if should become alerted (process in aggro range)
    const inAggroRange = updatedProcesses.filter(
      p =>
        p.status !== 'destroyed' &&
        getManhattanDistance(withCooldown.position, p.position) <= withCooldown.behavior.aggroRange
    )

    if (inAggroRange.length > 0 && withCooldown.status !== 'alerted') {
      return { ...withCooldown, status: 'alerted' as const }
    }

    // Mobile malware: move toward nearest process if alerted
    if (
      withCooldown.status === 'alerted' &&
      withCooldown.stats.speed > 0 &&
      inAggroRange.length > 0
    ) {
      const nearest = inAggroRange.reduce((a, b) =>
        getManhattanDistance(withCooldown.position, a.position) <
        getManhattanDistance(withCooldown.position, b.position)
          ? a
          : b
      )

      // Simple movement: move one step toward target
      const dx = Math.sign(nearest.position.x - withCooldown.position.x)
      const dy = Math.sign(nearest.position.y - withCooldown.position.y)

      // Try horizontal first, then vertical
      const candidates =
        dx !== 0
          ? [
              { x: withCooldown.position.x + dx, y: withCooldown.position.y },
              { x: withCooldown.position.x, y: withCooldown.position.y + dy },
            ]
          : [{ x: withCooldown.position.x, y: withCooldown.position.y + dy }]

      for (const newPos of candidates) {
        const tile = getTile(grid, newPos)
        if (!tile || !isWalkable(tile)) continue

        // Check collision with other malware
        const malwareCollision = malware.some(
          other =>
            other.id !== withCooldown.id &&
            other.status !== 'destroyed' &&
            other.position.x === newPos.x &&
            other.position.y === newPos.y
        )
        if (malwareCollision) continue

        return { ...withCooldown, position: newPos }
      }
    }

    return withCooldown
  })

  return { processes: updatedProcesses, malware: updatedMalware, logs }
}

// ============= Phase 3.5: Worm Replication =============

export interface WormReplicationResult {
  malware: Malware[]
  logs: string[]
}

export function wormReplicationPhase(
  processes: Process[],
  malware: Malware[],
  grid: Grid,
  difficulty: 'easy' | 'normal' | 'hard'
): WormReplicationResult {
  const newWorms: Malware[] = []
  const logs: string[] = []
  const updatedMalware = [...malware]

  // Count current worms
  const currentWormCount = updatedMalware.filter(
    m => m.type === 'worm' && m.status !== 'destroyed'
  ).length
  const maxWorms = WORM.MAX_COUNT[difficulty]

  // If at or above max worms, skip replication entirely
  if (currentWormCount >= maxWorms) {
    return { malware: updatedMalware, logs }
  }

  for (const m of updatedMalware) {
    if (
      m.type === 'worm' &&
      m.status !== 'destroyed' &&
      m.status !== 'dormant' &&
      m.abilityCooldown === 0
    ) {
      // Try to find an adjacent empty tile to replicate
      const adjacentPositions = getAdjacentPositions(m.position)
      const validPositions = adjacentPositions.filter(pos => {
        const tile = getTile(grid, pos)
        if (!tile || !isWalkable(tile)) return false

        // Check if occupied by process
        const hasProcess = processes.some(
          p => p.status !== 'destroyed' && p.position.x === pos.x && p.position.y === pos.y
        )
        if (hasProcess) return false

        // Check if occupied by malware (including newly created worms)
        const hasMalware =
          updatedMalware.some(
            other =>
              other.status !== 'destroyed' &&
              other.position.x === pos.x &&
              other.position.y === pos.y
          ) || newWorms.some(other => other.position.x === pos.x && other.position.y === pos.y)
        if (hasMalware) return false

        return true
      })

      if (validPositions.length > 0) {
        // Check if we've reached the max worm count (including newly created worms)
        const totalWorms = currentWormCount + newWorms.length
        if (totalWorms >= maxWorms) {
          continue // Skip replication if at max
        }

        const spawnPos = validPositions[Math.floor(Math.random() * validPositions.length)]!
        const newWorm = createMalware('worm', spawnPos)
        newWorms.push(newWorm)
        logs.push(`${m.name} replicates!`)

        // Set the parent worm's cooldown
        m.abilityCooldown = m.behavior.specialAbility?.cooldown ?? 5
      }
    }
  }

  return {
    malware: newWorms.length > 0 ? [...updatedMalware, ...newWorms] : updatedMalware,
    logs,
  }
}

// ============= Phase 4: Dormant Activation =============

export interface DormantActivationResult {
  malware: Malware[]
  logs: string[]
}

export function dormantActivationPhase(
  processes: Process[],
  malware: Malware[]
): DormantActivationResult {
  const logs: string[] = []

  const updatedMalware = malware.map(m => {
    if (m.status !== 'dormant') return m

    const nearbyProcess = processes.some(
      p => p.status !== 'destroyed' && getManhattanDistance(m.position, p.position) <= 1
    )

    if (nearbyProcess) {
      logs.push(`${m.name} awakens!`)
      return { ...m, status: 'alerted' as const, isRevealed: true }
    }

    return m
  })

  return { malware: updatedMalware, logs }
}

// ============= Phase 5: Victory/Defeat Check =============

export type ExpeditionResult = 'active' | 'victory' | 'defeat'

export function checkVictoryDefeat(
  processes: Process[],
  exitPoints: GridPosition[]
): { result: ExpeditionResult; log: string | null } {
  const aliveProcesses = processes.filter(p => p.status !== 'destroyed')

  // Defeat: all processes destroyed
  if (aliveProcesses.length === 0) {
    return { result: 'defeat', log: 'All processes destroyed - DEFEAT' }
  }

  // Victory: any alive process reached an exit point
  const processAtExit =
    exitPoints &&
    exitPoints.length > 0 &&
    aliveProcesses.some(process =>
      exitPoints.some(exit => exit.x === process.position.x && exit.y === process.position.y)
    )

  if (processAtExit) {
    return { result: 'victory', log: 'Process reached exit point - VICTORY!' }
  }

  return { result: 'active', log: null }
}

// ============= Phase 0: Behavior Rules Evaluation =============

export interface BehaviorRulesResult {
  processes: Process[]
  logs: string[]
}

/**
 * Evaluate behavior rules for all processes
 * Sets movement targets based on rule actions
 * Must run BEFORE movement phase so targets are set
 */
export function behaviorRulesPhase(context: TickContext): BehaviorRulesResult {
  const { processes, malware, grid, sector, behaviorRules, currentTick } = context
  const logs: string[] = []

  // Build GameState for BehaviorSystem (matches BehaviorGameState interface)
  const behaviorState: BehaviorGameState = {
    grid,
    processes: new Map(processes.map(p => [p.id, p])),
    malware: new Map(malware.map(m => [m.id, m])),
    sector: {
      exitPoints: sector.exitPoints,
      spawnPoints: sector.spawnPoints,
    },
  }

  // Evaluate behavior rules for each alive process
  const updatedProcesses = processes.map(process => {
    if (process.status === 'destroyed') return process

    // Process behavior rules for this process
    const triggeredRule = processBehavior(process, behaviorRules, behaviorState, currentTick)

    if (triggeredRule) {
      logs.push(`${process.name}: ${triggeredRule.name} (${triggeredRule.action.type})`)
    }

    return process
  })

  return { processes: updatedProcesses, logs }
}

// ============= Main Tick Orchestrator =============

export function executeTick(context: TickContext): TickResult {
  const { malware, grid, combatLog } = context
  const newCombatLog = [...combatLog]
  const addLog = (msg: string) => {
    newCombatLog.push(msg)
    if (newCombatLog.length > 50) newCombatLog.shift()
  }

  // Phase 0: Behavior Rules Evaluation
  const behaviorResult = behaviorRulesPhase(context)
  let updatedProcesses = behaviorResult.processes
  behaviorResult.logs.forEach(addLog)

  // Phase 1: Process Movement
  updatedProcesses = processMovementPhase(updatedProcesses, grid)

  // Phase 1.5: Cache Collection
  const cacheResult = cacheCollectionPhase(updatedProcesses, grid)
  const updatedGrid = cacheResult.grid
  cacheResult.logs.forEach(addLog)

  // Phase 2: Process Combat
  const combatResult = processCombatPhase(updatedProcesses, malware)
  updatedProcesses = combatResult.processes
  let updatedMalware = combatResult.malware
  combatResult.logs.forEach(addLog)

  // Phase 3: Malware AI
  const aiResult = malwareAIPhase(updatedProcesses, updatedMalware, updatedGrid)
  updatedProcesses = aiResult.processes
  updatedMalware = aiResult.malware
  aiResult.logs.forEach(addLog)

  // Phase 3.5: Worm Replication
  const replicationResult = wormReplicationPhase(
    updatedProcesses,
    updatedMalware,
    updatedGrid,
    context.difficulty
  )
  updatedMalware = replicationResult.malware
  replicationResult.logs.forEach(addLog)

  // Phase 4: Dormant Activation
  const activationResult = dormantActivationPhase(updatedProcesses, updatedMalware)
  updatedMalware = activationResult.malware
  activationResult.logs.forEach(addLog)

  // Phase 5: Victory/Defeat Check
  const victoryCheck = checkVictoryDefeat(updatedProcesses, context.sector.exitPoints)
  if (victoryCheck.log) addLog(victoryCheck.log)

  return {
    processes: updatedProcesses,
    malware: updatedMalware,
    grid: updatedGrid,
    combatLog: newCombatLog,
    cachesCollected: cacheResult.cachesCollected,
    malwareDestroyed: combatResult.malwareDestroyed,
    expeditionResult: victoryCheck.result,
  }
}
