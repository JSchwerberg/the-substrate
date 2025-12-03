/**
 * A* Pathfinding implementation for grid-based movement
 */

import {
  Grid,
  GridPosition,
  getTile,
  getAdjacentPositions,
  isInBounds,
  isWalkable,
  getManhattanDistance,
  positionToKey,
} from '../models/grid'

interface PathNode {
  position: GridPosition
  g: number // Cost from start to this node
  h: number // Heuristic (estimated cost to goal)
  f: number // g + h
  parent: PathNode | null
}

/**
 * Find the shortest path between two positions using A* algorithm
 * Returns array of positions from start to end (inclusive), or null if no path exists
 */
export function findPath(
  grid: Grid,
  start: GridPosition,
  end: GridPosition,
  maxIterations: number = 1000
): GridPosition[] | null {
  // Quick checks
  if (!isInBounds(grid, start) || !isInBounds(grid, end)) {
    return null
  }

  const endTile = getTile(grid, end)
  if (!isWalkable(endTile)) {
    return null
  }

  // If start equals end, return just the start position
  if (start.x === end.x && start.y === end.y) {
    return [start]
  }

  const openSet = new Map<string, PathNode>()
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: getManhattanDistance(start, end),
    f: getManhattanDistance(start, end),
    parent: null,
  }

  openSet.set(positionToKey(start), startNode)

  let iterations = 0

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++

    // Find node with lowest f score
    let currentNode: PathNode | null = null
    let lowestF = Infinity

    for (const node of openSet.values()) {
      if (node.f < lowestF) {
        lowestF = node.f
        currentNode = node
      }
    }

    if (!currentNode) break

    // Check if we've reached the goal
    if (currentNode.position.x === end.x && currentNode.position.y === end.y) {
      return reconstructPath(currentNode)
    }

    // Move current from open to closed
    const currentKey = positionToKey(currentNode.position)
    openSet.delete(currentKey)
    closedSet.add(currentKey)

    // Check all adjacent neighbors
    for (const neighborPos of getAdjacentPositions(currentNode.position)) {
      const neighborKey = positionToKey(neighborPos)

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) continue

      // Skip if not walkable
      if (!isInBounds(grid, neighborPos)) continue
      const neighborTile = getTile(grid, neighborPos)
      if (!isWalkable(neighborTile)) continue

      // Calculate tentative g score
      const tentativeG = currentNode.g + 1

      // Check if this path is better than any previous one
      const existingNode = openSet.get(neighborKey)

      if (!existingNode) {
        // New node discovered
        const h = getManhattanDistance(neighborPos, end)
        const newNode: PathNode = {
          position: neighborPos,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: currentNode,
        }
        openSet.set(neighborKey, newNode)
      } else if (tentativeG < existingNode.g) {
        // Better path found
        existingNode.g = tentativeG
        existingNode.f = tentativeG + existingNode.h
        existingNode.parent = currentNode
      }
    }
  }

  // No path found
  return null
}

/**
 * Reconstruct the path from end node to start
 */
function reconstructPath(endNode: PathNode): GridPosition[] {
  const path: GridPosition[] = []
  let current: PathNode | null = endNode

  while (current) {
    path.unshift({ ...current.position })
    current = current.parent
  }

  return path
}

/**
 * Find the next step toward a target (for one-step-at-a-time movement)
 */
export function getNextStep(grid: Grid, from: GridPosition, to: GridPosition): GridPosition | null {
  const path = findPath(grid, from, to)
  if (!path || path.length < 2) return null
  return path[1] ?? null
}

/**
 * Get all positions within a certain distance that are reachable
 */
export function getReachablePositions(
  grid: Grid,
  start: GridPosition,
  maxDistance: number
): GridPosition[] {
  const reachable: GridPosition[] = []
  const visited = new Set<string>()
  const queue: { pos: GridPosition; dist: number }[] = [{ pos: start, dist: 0 }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    const key = positionToKey(current.pos)
    if (visited.has(key)) continue
    visited.add(key)

    if (current.dist > 0) {
      reachable.push(current.pos)
    }

    if (current.dist >= maxDistance) continue

    for (const neighbor of getAdjacentPositions(current.pos)) {
      if (!isInBounds(grid, neighbor)) continue
      const tile = getTile(grid, neighbor)
      if (isWalkable(tile)) {
        queue.push({ pos: neighbor, dist: current.dist + 1 })
      }
    }
  }

  return reachable
}

/**
 * Check if there's a clear line of sight between two positions
 * Uses Bresenham's line algorithm
 */
export function hasLineOfSight(grid: Grid, from: GridPosition, to: GridPosition): boolean {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let err = dx - dy

  let x = from.x
  let y = from.y

  while (true) {
    // Skip the start position check
    if (x !== from.x || y !== from.y) {
      const tile = getTile(grid, { x, y })
      if (!tile || tile.type === 'blocked') {
        return false
      }
    }

    if (x === to.x && y === to.y) {
      return true
    }

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * Get all positions visible from a point within a certain range
 */
export function getVisiblePositions(grid: Grid, from: GridPosition, range: number): GridPosition[] {
  const visible: GridPosition[] = []

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const pos = { x: from.x + dx, y: from.y + dy }

      if (!isInBounds(grid, pos)) continue
      if (getManhattanDistance(from, pos) > range) continue

      if (hasLineOfSight(grid, from, pos)) {
        visible.push(pos)
      }
    }
  }

  return visible
}
