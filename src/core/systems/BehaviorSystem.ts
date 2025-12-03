/**
 * Behavior System - evaluates conditions and executes actions for processes
 */

import { GridPosition, getTile, getManhattanDistance } from '../models/grid'
import { Process, getHealthPercent, canAct } from '../models/process'
import { Malware } from '../models/malware'
import {
  BehaviorRule,
  Condition,
  Action,
  sortRulesByPriority,
  canTriggerRule,
} from '../models/behavior'
import { setMovementTarget, type GameState as MovementGameState } from './MovementSystem'

// ============= Game State Interface =============

/**
 * Game state interface for behavior evaluation
 * Extends movement's GameState with sector information
 */
export interface GameState extends MovementGameState {
  sector: {
    exitPoints: GridPosition[]
    spawnPoints: GridPosition[]
  }
}

/**
 * Get alive processes from game state
 */
function getAliveProcesses(state: GameState): Process[] {
  return Array.from(state.processes.values()).filter(p => p.status !== 'destroyed')
}

/**
 * Get alive malware from game state
 */
function getAliveMalware(state: GameState): Malware[] {
  return Array.from(state.malware.values()).filter(m => m.status !== 'destroyed')
}

/**
 * Get processes within range of a position
 */
function getProcessesInRange(state: GameState, position: GridPosition, range: number): Process[] {
  return getAliveProcesses(state).filter(p => {
    const dx = Math.abs(p.position.x - position.x)
    const dy = Math.abs(p.position.y - position.y)
    return dx + dy <= range
  })
}

/**
 * Get malware within range of a position
 */
function getMalwareInRange(state: GameState, position: GridPosition, range: number): Malware[] {
  return getAliveMalware(state).filter(m => {
    const dx = Math.abs(m.position.x - position.x)
    const dy = Math.abs(m.position.y - position.y)
    return dx + dy <= range
  })
}

// ============= Context for Evaluation =============

export interface BehaviorContext {
  process: Process
  state: GameState
  currentTick: number
}

// ============= Condition Evaluation =============

export function evaluateCondition(condition: Condition, context: BehaviorContext): boolean {
  const { process, state } = context

  switch (condition.type) {
    case 'always':
      return true

    case 'health_below':
      return getHealthPercent(process) < (condition.value ?? 50)

    case 'health_above':
      return getHealthPercent(process) > (condition.value ?? 50)

    case 'enemy_in_range': {
      const range = condition.range ?? 3
      const enemies = getMalwareInRange(state, process.position, range)
      return enemies.length > 0
    }

    case 'enemy_adjacent': {
      const adjacent = getMalwareInRange(state, process.position, 1)
      return adjacent.length > 0
    }

    case 'no_enemy_visible': {
      const visible = getMalwareInRange(state, process.position, process.stats.sightRange)
      return visible.length === 0
    }

    case 'ally_in_range': {
      const range = condition.range ?? 3
      const allies = getProcessesInRange(state, process.position, range).filter(
        p => p.id !== process.id
      )
      return allies.length > 0
    }

    case 'ally_health_below': {
      const threshold = condition.value ?? 50
      const allies = getAliveProcesses(state).filter(p => p.id !== process.id)
      return allies.some(a => getHealthPercent(a) < threshold)
    }

    case 'at_position':
      return false // Needs position in condition, not implemented yet

    case 'near_exit': {
      const range = condition.range ?? 2
      return state.sector.exitPoints.some(
        exit => getManhattanDistance(process.position, exit) <= range
      )
    }

    case 'near_cache': {
      const range = condition.range ?? 3
      // Check tiles for data_cache within range
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          if (Math.abs(dx) + Math.abs(dy) > range) continue
          const pos = { x: process.position.x + dx, y: process.position.y + dy }
          const tile = getTile(state.grid, pos)
          if (tile?.type === 'data_cache') return true
        }
      }
      return false
    }

    case 'is_idle':
      return process.status === 'idle'

    case 'is_moving':
      return process.status === 'moving'

    case 'has_action_points':
      return process.stats.actionPoints > 0

    default:
      return false
  }
}

// ============= Action Execution =============

export interface ActionResult {
  success: boolean
  message?: string
  targetPosition?: GridPosition
  targetId?: string
}

export function executeAction(action: Action, context: BehaviorContext): ActionResult {
  const { process, state } = context

  switch (action.type) {
    case 'attack_nearest':
      return attackNearest(process, state, 'nearest')

    case 'attack_weakest':
      return attackNearest(process, state, 'weakest')

    case 'attack_strongest':
      return attackNearest(process, state, 'strongest')

    case 'move_to_nearest_enemy':
      return moveToNearestEnemy(process, state)

    case 'move_to_nearest_cache':
      return moveToNearestCache(process, state)

    case 'move_to_exit':
      return moveToExit(process, state)

    case 'retreat_to_spawn':
      return retreatToSpawn(process, state)

    case 'flee_from_enemy':
      return fleeFromEnemy(process, state)

    case 'follow_ally':
      return followAlly(process, state)

    case 'hold_position':
      return { success: true, message: 'Holding position' }

    case 'explore':
      return explore(process, state)

    case 'heal_ally':
      return { success: false, message: 'Heal not implemented' }

    default:
      return { success: false, message: 'Unknown action' }
  }
}

// ============= Action Implementations =============

function attackNearest(
  process: Process,
  state: GameState,
  targetSelection: 'nearest' | 'weakest' | 'strongest'
): ActionResult {
  const adjacent = getMalwareInRange(state, process.position, 1)
  if (adjacent.length === 0) {
    return { success: false, message: 'No adjacent enemies' }
  }

  let target: Malware

  switch (targetSelection) {
    case 'nearest':
      target = adjacent[0]!
      break
    case 'weakest':
      target = adjacent.reduce((a, b) => (a.stats.health < b.stats.health ? a : b))
      break
    case 'strongest':
      target = adjacent.reduce((a, b) => (a.stats.health > b.stats.health ? a : b))
      break
  }

  // Set process status to attacking (combat will be resolved by CombatSystem)
  process.status = 'attacking'

  return {
    success: true,
    message: `Attacking ${target.name}`,
    targetId: target.id,
  }
}

function moveToNearestEnemy(process: Process, state: GameState): ActionResult {
  const enemies = getAliveMalware(state)
  if (enemies.length === 0) {
    return { success: false, message: 'No enemies found' }
  }

  // Find nearest enemy
  let nearest = enemies[0]!
  let nearestDist = getManhattanDistance(process.position, nearest.position)

  for (const enemy of enemies) {
    const dist = getManhattanDistance(process.position, enemy.position)
    if (dist < nearestDist) {
      nearest = enemy
      nearestDist = dist
    }
  }

  // Move toward enemy (stop 1 tile away to attack)
  const success = setMovementTarget(process, nearest.position, state.grid)

  return {
    success,
    message: success ? `Moving toward ${nearest.name}` : 'Cannot reach enemy',
    targetPosition: nearest.position,
  }
}

function moveToNearestCache(process: Process, state: GameState): ActionResult {
  const grid = state.grid
  let nearestCache: GridPosition | null = null
  let nearestDist = Infinity

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = getTile(grid, { x, y })
      if (tile?.type === 'data_cache') {
        const dist = getManhattanDistance(process.position, { x, y })
        if (dist < nearestDist) {
          nearestDist = dist
          nearestCache = { x, y }
        }
      }
    }
  }

  if (!nearestCache) {
    return { success: false, message: 'No caches found' }
  }

  const success = setMovementTarget(process, nearestCache, state.grid)

  return {
    success,
    message: success ? 'Moving to cache' : 'Cannot reach cache',
    targetPosition: nearestCache,
  }
}

function moveToExit(process: Process, state: GameState): ActionResult {
  const exits = state.sector.exitPoints
  if (exits.length === 0) {
    return { success: false, message: 'No exit found' }
  }

  // Find nearest exit
  let nearest = exits[0]!
  let nearestDist = getManhattanDistance(process.position, nearest)

  for (const exit of exits) {
    const dist = getManhattanDistance(process.position, exit)
    if (dist < nearestDist) {
      nearest = exit
      nearestDist = dist
    }
  }

  const success = setMovementTarget(process, nearest, state.grid)

  return {
    success,
    message: success ? 'Moving to exit' : 'Cannot reach exit',
    targetPosition: nearest,
  }
}

function retreatToSpawn(process: Process, state: GameState): ActionResult {
  const spawns = state.sector.spawnPoints
  if (spawns.length === 0) {
    return { success: false, message: 'No spawn found' }
  }

  // Find nearest spawn
  let nearest = spawns[0]!
  let nearestDist = getManhattanDistance(process.position, nearest)

  for (const spawn of spawns) {
    const dist = getManhattanDistance(process.position, spawn)
    if (dist < nearestDist) {
      nearest = spawn
      nearestDist = dist
    }
  }

  process.status = 'retreating'
  const success = setMovementTarget(process, nearest, state.grid)

  return {
    success,
    message: success ? 'Retreating to spawn' : 'Cannot reach spawn',
    targetPosition: nearest,
  }
}

function fleeFromEnemy(process: Process, state: GameState): ActionResult {
  const enemies = getMalwareInRange(state, process.position, process.stats.sightRange)
  if (enemies.length === 0) {
    return { success: false, message: 'No enemies to flee from' }
  }

  // Find average enemy position
  let avgX = 0
  let avgY = 0
  for (const enemy of enemies) {
    avgX += enemy.position.x
    avgY += enemy.position.y
  }
  avgX = Math.floor(avgX / enemies.length)
  avgY = Math.floor(avgY / enemies.length)

  // Move away from average enemy position
  const dx = process.position.x - avgX
  const dy = process.position.y - avgY

  // Target position is in opposite direction
  const fleeTarget = {
    x: process.position.x + Math.sign(dx) * 3,
    y: process.position.y + Math.sign(dy) * 3,
  }

  // Clamp to grid bounds
  fleeTarget.x = Math.max(0, Math.min(state.grid.width - 1, fleeTarget.x))
  fleeTarget.y = Math.max(0, Math.min(state.grid.height - 1, fleeTarget.y))

  process.status = 'retreating'
  const success = setMovementTarget(process, fleeTarget, state.grid)

  return {
    success,
    message: success ? 'Fleeing from enemies' : 'Cannot flee',
    targetPosition: fleeTarget,
  }
}

function followAlly(process: Process, state: GameState): ActionResult {
  const allies = getAliveProcesses(state).filter(p => p.id !== process.id)
  if (allies.length === 0) {
    return { success: false, message: 'No allies to follow' }
  }

  // Find nearest ally
  let nearest = allies[0]!
  let nearestDist = getManhattanDistance(process.position, nearest.position)

  for (const ally of allies) {
    const dist = getManhattanDistance(process.position, ally.position)
    if (dist < nearestDist) {
      nearest = ally
      nearestDist = dist
    }
  }

  // Don't move if already adjacent
  if (nearestDist <= 1) {
    return { success: true, message: 'Already near ally' }
  }

  const success = setMovementTarget(process, nearest.position, state.grid)

  return {
    success,
    message: success ? `Following ${nearest.name}` : 'Cannot reach ally',
    targetPosition: nearest.position,
  }
}

function explore(process: Process, state: GameState): ActionResult {
  const grid = state.grid

  // Find nearest unrevealed tile
  let nearestHidden: GridPosition | null = null
  let nearestDist = Infinity

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = getTile(grid, { x, y })
      if (tile?.visibility === 'hidden' && tile.type !== 'blocked') {
        const dist = getManhattanDistance(process.position, { x, y })
        if (dist < nearestDist) {
          nearestDist = dist
          nearestHidden = { x, y }
        }
      }
    }
  }

  if (!nearestHidden) {
    // All explored, move toward exit
    return moveToExit(process, state)
  }

  const success = setMovementTarget(process, nearestHidden, state.grid)

  return {
    success,
    message: success ? 'Exploring' : 'Cannot explore',
    targetPosition: nearestHidden,
  }
}

// ============= Main Behavior Processing =============

export function processBehavior(
  process: Process,
  rules: BehaviorRule[],
  state: GameState,
  currentTick: number
): BehaviorRule | null {
  if (!canAct(process)) return null

  const sortedRules = sortRulesByPriority(rules)
  const context: BehaviorContext = { process, state, currentTick }

  for (const rule of sortedRules) {
    if (!canTriggerRule(rule, currentTick)) continue

    if (evaluateCondition(rule.condition, context)) {
      const result = executeAction(rule.action, context)

      if (result.success) {
        rule.lastTriggered = currentTick
        return rule
      }
    }
  }

  return null
}
