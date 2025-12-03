/**
 * Movement System - handles process movement using pathfinding
 */

import { Grid, GridPosition, getTile, isWalkable, positionsEqual } from '../models/grid'
import { Process, consumeActionPoint, getEffectiveStat } from '../models/process'
import { Expedition, getProcessAt, getMalwareAt, logEvent } from '../models/expedition'
import { findPath, getNextStep } from './Pathfinding'

// ============= Movement Actions =============

/**
 * Set a movement target for a process
 * Calculates path and stores it on the process
 */
export function setMovementTarget(process: Process, target: GridPosition, grid: Grid): boolean {
  // Don't pathfind if already at target
  if (positionsEqual(process.position, target)) {
    return false
  }

  const path = findPath(grid, process.position, target)

  if (!path || path.length < 2) {
    return false
  }

  process.path = path
  process.pathIndex = 0
  process.targetPosition = target
  process.status = 'moving'

  return true
}

/**
 * Move a process one step along its current path
 * Returns true if movement occurred
 */
export function moveProcessOneStep(process: Process, expedition: Expedition): boolean {
  if (process.path.length === 0 || process.status !== 'moving') {
    return false
  }

  const nextIndex = process.pathIndex + 1

  if (nextIndex >= process.path.length) {
    // Reached end of path
    process.path = []
    process.pathIndex = 0
    process.targetPosition = null
    process.status = 'idle'
    return false
  }

  const nextPos = process.path[nextIndex]
  if (!nextPos) {
    return false
  }

  // Check if tile is still walkable
  const tile = getTile(expedition.sector.grid, nextPos)
  if (!isWalkable(tile)) {
    // Path blocked, recalculate
    if (process.targetPosition) {
      const success = setMovementTarget(process, process.targetPosition, expedition.sector.grid)
      if (!success) {
        // Can't reach target anymore
        process.path = []
        process.pathIndex = 0
        process.targetPosition = null
        process.status = 'idle'
      }
    }
    return false
  }

  // Check for collisions with other entities
  const otherProcess = getProcessAt(expedition, nextPos)
  if (otherProcess && otherProcess.id !== process.id) {
    // Wait for other process to move
    return false
  }

  const malware = getMalwareAt(expedition, nextPos)
  if (malware && malware.status !== 'destroyed') {
    // Can't walk through malware
    process.status = 'idle'
    return false
  }

  // Move to next position
  process.position = { ...nextPos }
  process.pathIndex = nextIndex

  logEvent(expedition, 'process_moved', `${process.name} moved`, {
    actorId: process.id,
    position: nextPos,
  })

  // Check if reached destination
  if (nextIndex >= process.path.length - 1) {
    process.path = []
    process.pathIndex = 0
    process.targetPosition = null
    process.status = 'idle'
  }

  return true
}

/**
 * Process movement for a single tick based on speed
 */
export function processMovementTick(process: Process, expedition: Expedition): number {
  if (process.status !== 'moving' || process.path.length === 0) {
    return 0
  }

  const speed = getEffectiveStat(process, 'speed')
  let movesMade = 0

  for (let i = 0; i < speed; i++) {
    if (!consumeActionPoint(process)) {
      break
    }

    const moved = moveProcessOneStep(process, expedition)
    if (moved) {
      movesMade++
    } else {
      // Refund action point if couldn't move
      process.stats.actionPoints++
      break
    }
  }

  return movesMade
}

/**
 * Move toward a target position (for AI/behavior use)
 */
export function moveToward(
  process: Process,
  target: GridPosition,
  expedition: Expedition
): boolean {
  const nextStep = getNextStep(expedition.sector.grid, process.position, target)

  if (!nextStep) {
    return false
  }

  // Check for obstacles
  const otherProcess = getProcessAt(expedition, nextStep)
  const malware = getMalwareAt(expedition, nextStep)

  if ((otherProcess && otherProcess.id !== process.id) || malware) {
    return false
  }

  if (!consumeActionPoint(process)) {
    return false
  }

  process.position = { ...nextStep }
  logEvent(expedition, 'process_moved', `${process.name} moved`, {
    actorId: process.id,
    position: nextStep,
  })

  return true
}

/**
 * Move away from a target position (for fleeing)
 */
export function moveAway(process: Process, threat: GridPosition, expedition: Expedition): boolean {
  const grid = expedition.sector.grid

  // Find adjacent tiles and pick the one furthest from threat
  const candidates: { pos: GridPosition; dist: number }[] = []

  const adjacentOffsets = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ]

  for (const offset of adjacentOffsets) {
    const pos = {
      x: process.position.x + offset.x,
      y: process.position.y + offset.y,
    }

    const tile = getTile(grid, pos)
    if (!isWalkable(tile)) continue

    const otherProcess = getProcessAt(expedition, pos)
    const malware = getMalwareAt(expedition, pos)
    if (otherProcess || malware) continue

    const dist = Math.abs(pos.x - threat.x) + Math.abs(pos.y - threat.y)
    candidates.push({ pos, dist })
  }

  if (candidates.length === 0) {
    return false
  }

  // Sort by distance (furthest first)
  candidates.sort((a, b) => b.dist - a.dist)

  const best = candidates[0]
  if (
    !best ||
    best.dist <= Math.abs(process.position.x - threat.x) + Math.abs(process.position.y - threat.y)
  ) {
    // No better position available
    return false
  }

  if (!consumeActionPoint(process)) {
    return false
  }

  process.position = { ...best.pos }
  process.status = 'retreating'

  logEvent(expedition, 'process_moved', `${process.name} retreated`, {
    actorId: process.id,
    position: best.pos,
  })

  return true
}

/**
 * Stop current movement
 */
export function stopMovement(process: Process): void {
  process.path = []
  process.pathIndex = 0
  process.targetPosition = null
  if (process.status === 'moving') {
    process.status = 'idle'
  }
}
