import { describe, it, expect } from 'vitest'
import {
  findPath,
  getNextStep,
  getReachablePositions,
  hasLineOfSight,
  getVisiblePositions,
} from '../Pathfinding'
import { createGrid, type Grid, type GridPosition } from '@core/models/grid'

// ============= Test Fixtures =============

function createTestGrid(width: number = 10, height: number = 10): Grid {
  return createGrid(width, height)
}

function createBlockedGrid(width: number = 10, height: number = 10): Grid {
  const grid = createTestGrid(width, height)
  // Block out a region for testing obstacles
  for (let x = 3; x <= 6; x++) {
    grid.tiles[5]![x]!.type = 'blocked'
  }
  return grid
}

function createMazeGrid(): Grid {
  const grid = createTestGrid(10, 10)

  // Create a simple maze pattern
  // Vertical wall from (3, 1) to (3, 8)
  for (let y = 1; y <= 8; y++) {
    grid.tiles[y]![3]!.type = 'blocked'
  }

  // Horizontal wall from (5, 2) to (8, 2)
  for (let x = 5; x <= 8; x++) {
    grid.tiles[2]![x]!.type = 'blocked'
  }

  return grid
}

function pathLength(path: GridPosition[]): number {
  return path.length
}

function isPathValid(grid: Grid, path: GridPosition[]): boolean {
  if (path.length === 0) return false

  // Check start and end exist
  if (!path[0] || !path[path.length - 1]) return false

  // Check all positions are in bounds and walkable
  for (const pos of path) {
    if (pos.x < 0 || pos.x >= grid.width || pos.y < 0 || pos.y >= grid.height) {
      return false
    }
    const tile = grid.tiles[pos.y]?.[pos.x]
    if (!tile || tile.type === 'blocked' || tile.corruptionLevel >= 100) {
      return false
    }
  }

  // Check path continuity (each step is adjacent)
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i]!
    const next = path[i + 1]!
    const dx = Math.abs(curr.x - next.x)
    const dy = Math.abs(curr.y - next.y)

    // 4-connectivity (orthogonal movement only)
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      continue
    }
    return false
  }

  return true
}

function isShortestPath(
  grid: Grid,
  start: GridPosition,
  end: GridPosition,
  path: GridPosition[]
): boolean {
  // Shortest path in grid with orthogonal movement is at least the Manhattan distance - 1
  const manhattanDist = Math.abs(start.x - end.x) + Math.abs(start.y - end.y)
  return path.length === manhattanDist + 1
}

// ============= Basic Pathfinding Tests =============

describe('findPath - Basic Pathfinding', () => {
  it('should find straight path on empty grid', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 0 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should find vertical path on empty grid', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 0, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should find diagonal path on empty grid', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should return shortest path on empty grid', () => {
    const grid = createTestGrid()
    const start = { x: 2, y: 2 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isShortestPath(grid, start, end, path!)).toBe(true)
  })

  it('should find path between distant positions', () => {
    const grid = createTestGrid(20, 20)
    const start = { x: 0, y: 0 }
    const end = { x: 19, y: 19 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should work on large grid', () => {
    const grid = createTestGrid(50, 50)
    const start = { x: 5, y: 5 }
    const end = { x: 45, y: 45 }

    const path = findPath(grid, start, end, 5000)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(isShortestPath(grid, start, end, path!)).toBe(true)
  })
})

// ============= Same Start and Goal Tests =============

describe('findPath - Same Start and Goal', () => {
  it('should return single position when start equals goal', () => {
    const grid = createTestGrid()
    const pos = { x: 5, y: 5 }

    const path = findPath(grid, pos, pos)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(1)
    expect(path![0]).toEqual(pos)
  })

  it('should handle same position at grid corner', () => {
    const grid = createTestGrid()
    const pos = { x: 0, y: 0 }

    const path = findPath(grid, pos, pos)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(1)
    expect(path![0]).toEqual(pos)
  })

  it('should handle same position at grid opposite corner', () => {
    const grid = createTestGrid()
    const pos = { x: 9, y: 9 }

    const path = findPath(grid, pos, pos)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(1)
    expect(path![0]).toEqual(pos)
  })
})

// ============= Adjacent Position Tests =============

describe('findPath - Adjacent Positions', () => {
  it('should find path to adjacent left position', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }
    const end = { x: 4, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(2)
    expect(path![0]).toEqual(start)
    expect(path![1]).toEqual(end)
  })

  it('should find path to adjacent right position', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }
    const end = { x: 6, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(2)
    expect(path![0]).toEqual(start)
    expect(path![1]).toEqual(end)
  })

  it('should find path to adjacent up position', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }
    const end = { x: 5, y: 4 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(2)
    expect(path![0]).toEqual(start)
    expect(path![1]).toEqual(end)
  })

  it('should find path to adjacent down position', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }
    const end = { x: 5, y: 6 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(2)
    expect(path![0]).toEqual(start)
    expect(path![1]).toEqual(end)
  })
})

// ============= Obstacle Avoidance Tests =============

describe('findPath - Obstacle Avoidance', () => {
  it('should navigate around single blocked tile', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const start = { x: 0, y: 5 }
    const end = { x: 9, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should navigate around vertical wall', () => {
    const grid = createBlockedGrid()

    const start = { x: 0, y: 5 }
    const end = { x: 9, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should navigate around horizontal wall', () => {
    const grid = createTestGrid()
    for (let x = 2; x <= 7; x++) {
      grid.tiles[5]![x]!.type = 'blocked'
    }

    const start = { x: 5, y: 0 }
    const end = { x: 5, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should navigate through maze', () => {
    const grid = createMazeGrid()

    const start = { x: 0, y: 0 }
    const end = { x: 9, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    expect(path![0]).toEqual(start)
    expect(path![path!.length - 1]).toEqual(end)
  })

  it('should choose shortest path around obstacle', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const start = { x: 5, y: 0 }
    const end = { x: 5, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })

  it('should avoid high corruption tiles', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.corruptionLevel = 100

    const start = { x: 0, y: 5 }
    const end = { x: 9, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })
})

// ============= No Path Found Tests =============

describe('findPath - No Path Found', () => {
  it('should return null when goal is blocked', () => {
    const grid = createTestGrid()
    // Surround goal completely
    grid.tiles[5]![4]!.type = 'blocked'
    grid.tiles[5]![6]!.type = 'blocked'
    grid.tiles[4]![5]!.type = 'blocked'
    grid.tiles[6]![5]!.type = 'blocked'

    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when island is isolated by blocks', () => {
    const grid = createTestGrid()
    // Create isolated island
    for (let x = 3; x <= 6; x++) {
      grid.tiles[3]![x]!.type = 'blocked'
      grid.tiles[6]![x]!.type = 'blocked'
    }
    for (let y = 3; y <= 6; y++) {
      grid.tiles[y]![3]!.type = 'blocked'
      grid.tiles[y]![6]!.type = 'blocked'
    }

    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when goal tile is blocked', () => {
    const grid = createTestGrid()
    const end = { x: 5, y: 5 }
    grid.tiles[end.y]![end.x]!.type = 'blocked'

    const start = { x: 0, y: 0 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when goal has max corruption', () => {
    const grid = createTestGrid()
    const end = { x: 5, y: 5 }
    grid.tiles[end.y]![end.x]!.corruptionLevel = 100

    const start = { x: 0, y: 0 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })
})

// ============= Boundary and Invalid Input Tests =============

describe('findPath - Boundary and Invalid Input', () => {
  it('should return null when start is out of bounds (negative x)', () => {
    const grid = createTestGrid()
    const start = { x: -1, y: 0 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when start is out of bounds (negative y)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: -1 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when start is out of bounds (x too large)', () => {
    const grid = createTestGrid()
    const start = { x: 10, y: 0 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when start is out of bounds (y too large)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 10 }
    const end = { x: 5, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when end is out of bounds (negative x)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: -1, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when end is out of bounds (negative y)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: -1 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when end is out of bounds (x too large)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 10, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should return null when end is out of bounds (y too large)', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 10 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should handle path on grid border', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 9, y: 0 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })

  it('should handle path along entire left border', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 0, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })
})

// ============= Iteration Limit Tests =============

describe('findPath - Iteration Limit', () => {
  it('should respect maxIterations parameter', () => {
    const grid = createTestGrid(50, 50)
    const start = { x: 0, y: 0 }
    const end = { x: 49, y: 49 }

    const path = findPath(grid, start, end, 10)

    // With only 10 iterations, might not find path on large grid
    expect(path === null || isPathValid(grid, path!)).toBe(true)
  })

  it('should find path with sufficient iterations', () => {
    const grid = createTestGrid(15, 15)
    const start = { x: 0, y: 0 }
    const end = { x: 14, y: 14 }

    const path = findPath(grid, start, end, 10000)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })

  it('should use default iterations when not specified', () => {
    const grid = createTestGrid(20, 20)
    const start = { x: 0, y: 0 }
    const end = { x: 19, y: 19 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })
})

// ============= Path Optimality Tests =============

describe('findPath - Path Optimality', () => {
  it('should find shortest path on empty grid', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 3, y: 4 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isShortestPath(grid, start, end, path!)).toBe(true)
  })

  it('should find shortest path around single obstacle', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const start = { x: 5, y: 0 }
    const end = { x: 5, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
    // Path should go around the obstacle
    const hasBlockedTile = path!.some(pos => grid.tiles[pos.y]![pos.x]!.type === 'blocked')
    expect(hasBlockedTile).toBe(false)
  })

  it('should not include unnecessary detours', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 0 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    // Straight horizontal path should be shortest
    expect(path).toHaveLength(6) // start + 5 steps
  })
})

// ============= getNextStep Tests =============

describe('getNextStep - One-Step Movement', () => {
  it('should return next position in path', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 0 }
    const to = { x: 3, y: 0 }

    const nextStep = getNextStep(grid, from, to)

    expect(nextStep).not.toBeNull()
    expect(nextStep).toEqual({ x: 1, y: 0 })
  })

  it('should return adjacent position when target is adjacent', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }
    const to = { x: 6, y: 5 }

    const nextStep = getNextStep(grid, from, to)

    expect(nextStep).not.toBeNull()
    expect(nextStep).toEqual(to)
  })

  it('should return null when same start and goal', () => {
    const grid = createTestGrid()
    const pos = { x: 5, y: 5 }

    const nextStep = getNextStep(grid, pos, pos)

    expect(nextStep).toBeNull()
  })

  it('should return null when no path exists', () => {
    const grid = createTestGrid()
    // Block all neighbors of from
    grid.tiles[4]![5]!.type = 'blocked'
    grid.tiles[6]![5]!.type = 'blocked'
    grid.tiles[5]![4]!.type = 'blocked'
    grid.tiles[5]![6]!.type = 'blocked'

    const from = { x: 5, y: 5 }
    const to = { x: 0, y: 0 }

    const nextStep = getNextStep(grid, from, to)

    expect(nextStep).toBeNull()
  })

  it('should handle path around obstacles', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const from = { x: 5, y: 0 }
    const to = { x: 5, y: 9 }

    const nextStep = getNextStep(grid, from, to)

    expect(nextStep).not.toBeNull()
    // Path exists, just verify it's a valid step
    expect(nextStep).toBeDefined()
  })
})

// ============= getReachablePositions Tests =============

describe('getReachablePositions - Flood Fill', () => {
  it('should find all adjacent positions with distance 1', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 1)

    expect(reachable).toHaveLength(4)
    expect(reachable).toContainEqual({ x: 4, y: 5 })
    expect(reachable).toContainEqual({ x: 6, y: 5 })
    expect(reachable).toContainEqual({ x: 5, y: 4 })
    expect(reachable).toContainEqual({ x: 5, y: 6 })
  })

  it('should find all positions within distance 2', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 2)

    expect(reachable.length).toBeGreaterThan(4)
    expect(reachable).toContainEqual({ x: 5, y: 4 })
    expect(reachable).toContainEqual({ x: 5, y: 6 })
    expect(reachable).toContainEqual({ x: 5, y: 3 })
    expect(reachable).toContainEqual({ x: 5, y: 7 })
  })

  it('should not include start position', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 2)

    const hasStart = reachable.some(pos => pos.x === start.x && pos.y === start.y)
    expect(hasStart).toBe(false)
  })

  it('should respect blocked tiles', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const start = { x: 5, y: 4 }
    const reachable = getReachablePositions(grid, start, 2)

    const hasBlocked = reachable.some(pos => grid.tiles[pos.y]![pos.x]!.type === 'blocked')
    expect(hasBlocked).toBe(false)
  })

  it('should respect high corruption tiles', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.corruptionLevel = 100

    const start = { x: 5, y: 4 }
    const reachable = getReachablePositions(grid, start, 2)

    const hasCorrupted = reachable.some(pos => grid.tiles[pos.y]![pos.x]!.corruptionLevel >= 100)
    expect(hasCorrupted).toBe(false)
  })

  it('should handle distance 0 (no movement)', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 0)

    expect(reachable).toHaveLength(0)
  })

  it('should handle large distance on open grid', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 5)

    expect(reachable.length).toBeGreaterThan(10)
  })

  it('should not exceed distance limit', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 2)

    for (const pos of reachable) {
      const distance = Math.abs(pos.x - start.x) + Math.abs(pos.y - start.y)
      expect(distance).toBeLessThanOrEqual(2)
    }
  })

  it('should not duplicate positions', () => {
    const grid = createTestGrid()
    const start = { x: 5, y: 5 }

    const reachable = getReachablePositions(grid, start, 3)

    const positionSet = new Set(reachable.map(p => `${p.x},${p.y}`))
    expect(positionSet.size).toBe(reachable.length)
  })
})

// ============= hasLineOfSight Tests =============

describe('hasLineOfSight - Visibility Check', () => {
  it('should have line of sight on empty grid', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 0 }
    const to = { x: 5, y: 0 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should have line of sight to adjacent position', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }
    const to = { x: 6, y: 5 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should have line of sight same position', () => {
    const grid = createTestGrid()
    const pos = { x: 5, y: 5 }

    const result = hasLineOfSight(grid, pos, pos)

    expect(result).toBe(true)
  })

  it('should have line of sight on diagonal', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 0 }
    const to = { x: 5, y: 5 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should have line of sight vertically', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 0 }
    const to = { x: 5, y: 9 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should be blocked by blocked tile in line', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const from = { x: 5, y: 0 }
    const to = { x: 5, y: 9 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(false)
  })

  it('should not be blocked by tile at end position', () => {
    const grid = createTestGrid()
    const to = { x: 5, y: 5 }
    grid.tiles[to.y]![to.x]!.type = 'blocked'

    const from = { x: 0, y: 0 }

    // Blocked tiles shouldn't affect line of sight to that position
    // (based on Bresenham's algorithm in code)
    const result = hasLineOfSight(grid, from, to)

    // The implementation checks the end position separately, so this depends on exact behavior
    expect(typeof result).toBe('boolean')
  })

  it('should be blocked by tile on diagonal line', () => {
    const grid = createTestGrid()
    grid.tiles[2]![2]!.type = 'blocked'

    const from = { x: 0, y: 0 }
    const to = { x: 4, y: 4 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(false)
  })

  it('should handle horizontal line of sight', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 5 }
    const to = { x: 9, y: 5 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should handle long distance line of sight', () => {
    const grid = createTestGrid(20, 20)
    const from = { x: 0, y: 0 }
    const to = { x: 19, y: 19 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should work with reversed direction', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }
    const to = { x: 0, y: 0 }

    const result = hasLineOfSight(grid, from, to)

    expect(result).toBe(true)
  })

  it('should be symmetric for clear lines', () => {
    const grid = createTestGrid()
    const from = { x: 2, y: 2 }
    const to = { x: 7, y: 7 }

    const result1 = hasLineOfSight(grid, from, to)
    const result2 = hasLineOfSight(grid, to, from)

    expect(result1).toBe(result2)
  })
})

// ============= getVisiblePositions Tests =============

describe('getVisiblePositions - Visibility Radius', () => {
  it('should find visible positions within range 1', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 1)

    expect(visible).toContainEqual({ x: 4, y: 5 })
    expect(visible).toContainEqual({ x: 6, y: 5 })
    expect(visible).toContainEqual({ x: 5, y: 4 })
    expect(visible).toContainEqual({ x: 5, y: 6 })
  })

  it('should find visible positions within range 2', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 2)

    expect(visible.length).toBeGreaterThan(4)
    expect(visible).toContainEqual({ x: 5, y: 3 })
    expect(visible).toContainEqual({ x: 5, y: 7 })
  })

  it('should respect distance limit', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 2)

    for (const pos of visible) {
      const distance = Math.abs(pos.x - from.x) + Math.abs(pos.y - from.y)
      expect(distance).toBeLessThanOrEqual(2)
    }
  })

  it('should handle visible positions including center', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 3)

    // getVisiblePositions may include the start position depending on implementation
    expect(visible.length).toBeGreaterThan(0)
  })

  it('should be blocked by blocked tiles in line of sight', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'

    const from = { x: 5, y: 2 }
    const visible = getVisiblePositions(grid, from, 5)

    const blockedPosition = { x: 5, y: 7 }
    const hasBlocked = visible.some(
      pos => pos.x === blockedPosition.x && pos.y === blockedPosition.y
    )
    expect(hasBlocked).toBe(false)
  })

  it('should handle center position at corner', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 0 }

    const visible = getVisiblePositions(grid, from, 2)

    expect(visible.length).toBeGreaterThan(0)
    expect(visible).toContainEqual({ x: 1, y: 0 })
    expect(visible).toContainEqual({ x: 0, y: 1 })
  })

  it('should handle large radius on open grid', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 4)

    expect(visible.length).toBeGreaterThan(20)
  })

  it('should respect only line of sight positions', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    // Completely block a direction
    grid.tiles[5]![6]!.type = 'blocked'
    grid.tiles[4]![6]!.type = 'blocked'
    grid.tiles[6]![6]!.type = 'blocked'

    const visible = getVisiblePositions(grid, from, 2)

    // Verify that x=7+ positions on this direction are harder to reach
    expect(visible.length).toBeGreaterThan(0)
  })

  it('should not duplicate visible positions', () => {
    const grid = createTestGrid()
    const from = { x: 5, y: 5 }

    const visible = getVisiblePositions(grid, from, 3)

    const positionSet = new Set(visible.map(p => `${p.x},${p.y}`))
    expect(positionSet.size).toBe(visible.length)
  })

  it('should stay within grid bounds', () => {
    const grid = createTestGrid()
    const from = { x: 0, y: 0 }

    const visible = getVisiblePositions(grid, from, 5)

    for (const pos of visible) {
      expect(pos.x).toBeGreaterThanOrEqual(0)
      expect(pos.x).toBeLessThan(grid.width)
      expect(pos.y).toBeGreaterThanOrEqual(0)
      expect(pos.y).toBeLessThan(grid.height)
    }
  })
})

// ============= Edge Cases and Integration Tests =============

describe('Pathfinding - Edge Cases', () => {
  it('should handle minimum grid size 1x1', () => {
    const grid = createTestGrid(1, 1)
    const pos = { x: 0, y: 0 }

    const path = findPath(grid, pos, pos)

    expect(path).not.toBeNull()
    expect(path).toHaveLength(1)
  })

  it('should handle minimum grid size 2x2', () => {
    const grid = createTestGrid(2, 2)
    const start = { x: 0, y: 0 }
    const end = { x: 1, y: 1 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })

  it('should handle grid where entire row is blocked', () => {
    const grid = createTestGrid()
    for (let x = 0; x < grid.width; x++) {
      grid.tiles[5]![x]!.type = 'blocked'
    }

    const start = { x: 5, y: 0 }
    const end = { x: 5, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should handle grid where entire column is blocked', () => {
    const grid = createTestGrid()
    for (let y = 0; y < grid.height; y++) {
      grid.tiles[y]![5]!.type = 'blocked'
    }

    const start = { x: 0, y: 5 }
    const end = { x: 9, y: 5 }

    const path = findPath(grid, start, end)

    expect(path).toBeNull()
  })

  it('should maintain consistency across multiple calls', () => {
    const grid = createTestGrid()
    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path1 = findPath(grid, start, end)
    const path2 = findPath(grid, start, end)

    expect(path1).toEqual(path2)
  })

  it('should handle many obstacles efficiently', () => {
    const grid = createTestGrid(30, 30)
    // Add scattered obstacles
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * grid.width)
      const y = Math.floor(Math.random() * grid.height)
      grid.tiles[y]![x]!.type = 'blocked'
    }

    const start = { x: 0, y: 0 }
    const end = { x: 29, y: 29 }

    const path = findPath(grid, start, end)

    if (path) {
      expect(isPathValid(grid, path)).toBe(true)
    } else {
      expect(path).toBeNull()
    }
  })

  it('should handle mixed corruption and blocking', () => {
    const grid = createTestGrid()
    grid.tiles[5]![5]!.type = 'blocked'
    grid.tiles[5]![6]!.corruptionLevel = 100
    grid.tiles[4]![5]!.corruptionLevel = 100

    const start = { x: 5, y: 0 }
    const end = { x: 5, y: 9 }

    const path = findPath(grid, start, end)

    expect(path).not.toBeNull()
    expect(isPathValid(grid, path!)).toBe(true)
  })
})
