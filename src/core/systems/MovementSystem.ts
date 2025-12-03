/**
 * Movement System - handles process movement using pathfinding
 */

import { Grid, GridPosition, positionsEqual } from '../models/grid'
import { Process } from '../models/process'
import { Malware } from '../models/malware'
import { findPath } from './Pathfinding'

// ============= Game State Interface =============

/**
 * Minimal game state interface for movement operations
 */
export interface GameState {
  grid: Grid
  processes: Map<string, Process>
  malware: Map<string, Malware>
}

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
