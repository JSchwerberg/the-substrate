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
import {
  Expedition,
  getAliveProcesses,
  getAliveMalware,
  getMalwareInRange,
  getProcessesInRange,
  logEvent,
} from '../models/expedition'
import { setMovementTarget } from './MovementSystem'

// ============= Context for Evaluation =============

export interface BehaviorContext {
  process: Process
  expedition: Expedition
  currentTick: number
}

// ============= Condition Evaluation =============

export function evaluateCondition(
  condition: Condition,
  context: BehaviorContext
): boolean {
  const { process, expedition } = context

  switch (condition.type) {
    case 'always':
      return true

    case 'health_below':
      return getHealthPercent(process) < (condition.value ?? 50)

    case 'health_above':
      return getHealthPercent(process) > (condition.value ?? 50)

    case 'enemy_in_range': {
      const range = condition.range ?? 3
      const enemies = getMalwareInRange(expedition, process.position, range)
      return enemies.length > 0
    }

    case 'enemy_adjacent': {
      const adjacent = getMalwareInRange(expedition, process.position, 1)
      return adjacent.length > 0
    }

    case 'no_enemy_visible': {
      const visible = getMalwareInRange(expedition, process.position, process.stats.sightRange)
      return visible.length === 0
    }

    case 'ally_in_range': {
      const range = condition.range ?? 3
      const allies = getProcessesInRange(expedition, process.position, range)
        .filter(p => p.id !== process.id)
      return allies.length > 0
    }

    case 'ally_health_below': {
      const threshold = condition.value ?? 50
      const allies = getAliveProcesses(expedition).filter(p => p.id !== process.id)
      return allies.some(a => getHealthPercent(a) < threshold)
    }

    case 'at_position':
      return false  // Needs position in condition, not implemented yet

    case 'near_exit': {
      const range = condition.range ?? 2
      return expedition.sector.exitPoints.some(
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
          const tile = getTile(expedition.sector.grid, pos)
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

export function executeAction(
  action: Action,
  context: BehaviorContext
): ActionResult {
  const { process, expedition } = context

  switch (action.type) {
    case 'attack_nearest':
      return attackNearest(process, expedition, 'nearest')

    case 'attack_weakest':
      return attackNearest(process, expedition, 'weakest')

    case 'attack_strongest':
      return attackNearest(process, expedition, 'strongest')

    case 'move_to_nearest_enemy':
      return moveToNearestEnemy(process, expedition)

    case 'move_to_nearest_cache':
      return moveToNearestCache(process, expedition)

    case 'move_to_exit':
      return moveToExit(process, expedition)

    case 'retreat_to_spawn':
      return retreatToSpawn(process, expedition)

    case 'flee_from_enemy':
      return fleeFromEnemy(process, expedition)

    case 'follow_ally':
      return followAlly(process, expedition)

    case 'hold_position':
      return { success: true, message: 'Holding position' }

    case 'explore':
      return explore(process, expedition)

    case 'heal_ally':
      return { success: false, message: 'Heal not implemented' }

    default:
      return { success: false, message: 'Unknown action' }
  }
}

// ============= Action Implementations =============

function attackNearest(
  process: Process,
  expedition: Expedition,
  targetSelection: 'nearest' | 'weakest' | 'strongest'
): ActionResult {
  const adjacent = getMalwareInRange(expedition, process.position, 1)
  if (adjacent.length === 0) {
    return { success: false, message: 'No adjacent enemies' }
  }

  let target: Malware

  switch (targetSelection) {
    case 'nearest':
      target = adjacent[0]!
      break
    case 'weakest':
      target = adjacent.reduce((a, b) => a.stats.health < b.stats.health ? a : b)
      break
    case 'strongest':
      target = adjacent.reduce((a, b) => a.stats.health > b.stats.health ? a : b)
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

function moveToNearestEnemy(process: Process, expedition: Expedition): ActionResult {
  const enemies = getAliveMalware(expedition)
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
  const success = setMovementTarget(process, nearest.position, expedition.sector.grid)

  return {
    success,
    message: success ? `Moving toward ${nearest.name}` : 'Cannot reach enemy',
    targetPosition: nearest.position,
  }
}

function moveToNearestCache(process: Process, expedition: Expedition): ActionResult {
  const grid = expedition.sector.grid
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

  const success = setMovementTarget(process, nearestCache, expedition.sector.grid)

  return {
    success,
    message: success ? 'Moving to cache' : 'Cannot reach cache',
    targetPosition: nearestCache,
  }
}

function moveToExit(process: Process, expedition: Expedition): ActionResult {
  const exits = expedition.sector.exitPoints
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

  const success = setMovementTarget(process, nearest, expedition.sector.grid)

  return {
    success,
    message: success ? 'Moving to exit' : 'Cannot reach exit',
    targetPosition: nearest,
  }
}

function retreatToSpawn(process: Process, expedition: Expedition): ActionResult {
  const spawns = expedition.sector.spawnPoints
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
  const success = setMovementTarget(process, nearest, expedition.sector.grid)

  return {
    success,
    message: success ? 'Retreating to spawn' : 'Cannot reach spawn',
    targetPosition: nearest,
  }
}

function fleeFromEnemy(process: Process, expedition: Expedition): ActionResult {
  const enemies = getMalwareInRange(expedition, process.position, process.stats.sightRange)
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
  fleeTarget.x = Math.max(0, Math.min(expedition.sector.grid.width - 1, fleeTarget.x))
  fleeTarget.y = Math.max(0, Math.min(expedition.sector.grid.height - 1, fleeTarget.y))

  process.status = 'retreating'
  const success = setMovementTarget(process, fleeTarget, expedition.sector.grid)

  return {
    success,
    message: success ? 'Fleeing from enemies' : 'Cannot flee',
    targetPosition: fleeTarget,
  }
}

function followAlly(process: Process, expedition: Expedition): ActionResult {
  const allies = getAliveProcesses(expedition).filter(p => p.id !== process.id)
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

  const success = setMovementTarget(process, nearest.position, expedition.sector.grid)

  return {
    success,
    message: success ? `Following ${nearest.name}` : 'Cannot reach ally',
    targetPosition: nearest.position,
  }
}

function explore(process: Process, expedition: Expedition): ActionResult {
  const grid = expedition.sector.grid

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
    return moveToExit(process, expedition)
  }

  const success = setMovementTarget(process, nearestHidden, expedition.sector.grid)

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
  expedition: Expedition,
  currentTick: number
): BehaviorRule | null {
  if (!canAct(process)) return null

  const sortedRules = sortRulesByPriority(rules)
  const context: BehaviorContext = { process, expedition, currentTick }

  for (const rule of sortedRules) {
    if (!canTriggerRule(rule, currentTick)) continue

    if (evaluateCondition(rule.condition, context)) {
      const result = executeAction(rule.action, context)

      if (result.success) {
        rule.lastTriggered = currentTick

        if (result.targetPosition) {
          logEvent(expedition, 'tick_completed', `${process.name}: ${rule.name}`, {
            actorId: process.id,
            position: result.targetPosition,
          })
        } else {
          logEvent(expedition, 'tick_completed', `${process.name}: ${rule.name}`, {
            actorId: process.id,
          })
        }

        return rule
      }
    }
  }

  return null
}
