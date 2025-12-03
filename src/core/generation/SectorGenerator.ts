/**
 * Procedural sector generation
 */

import {
  Grid,
  Sector,
  SectorConfig,
  SectorSize,
  SectorDifficulty,
  SECTOR_DIMENSIONS,
  GridPosition,
  createGrid,
  setTileType,
  getTile,
  getAdjacentPositions,
  isInBounds,
  getManhattanDistance,
} from '../models/grid'
import { SeededRandom } from '../../utils/random'

// Difficulty presets
const DIFFICULTY_SETTINGS: Record<SectorDifficulty, {
  corruptionDensity: number
  malwareDensity: number
  cacheMultiplier: number
}> = {
  trivial: { corruptionDensity: 0.05, malwareDensity: 0.02, cacheMultiplier: 1.5 },
  easy: { corruptionDensity: 0.10, malwareDensity: 0.05, cacheMultiplier: 1.2 },
  normal: { corruptionDensity: 0.15, malwareDensity: 0.08, cacheMultiplier: 1.0 },
  hard: { corruptionDensity: 0.20, malwareDensity: 0.12, cacheMultiplier: 0.8 },
  extreme: { corruptionDensity: 0.30, malwareDensity: 0.18, cacheMultiplier: 0.6 },
}

export interface GeneratorOptions {
  size: SectorSize
  difficulty: SectorDifficulty
  seed?: number
  name?: string
}

export function generateSector(options: GeneratorOptions): Sector {
  const seed = options.seed ?? Date.now()
  const rng = new SeededRandom(seed)
  const dimensions = SECTOR_DIMENSIONS[options.size]
  const difficultySettings = DIFFICULTY_SETTINGS[options.difficulty]

  // Calculate cache count based on sector size and difficulty
  const baseCacheCount = Math.floor((dimensions.width * dimensions.height) / 32)
  const cacheCount = Math.max(1, Math.floor(baseCacheCount * difficultySettings.cacheMultiplier))

  const config: SectorConfig = {
    id: `sector-${seed}`,
    name: options.name ?? `Sector ${seed.toString(16).slice(-6).toUpperCase()}`,
    size: options.size,
    difficulty: options.difficulty,
    seed,
    corruptionDensity: difficultySettings.corruptionDensity,
    malwareDensity: difficultySettings.malwareDensity,
    cacheCount,
  }

  // Create empty grid
  const grid = createGrid(dimensions.width, dimensions.height)

  // Generate terrain features
  placeBlockedTiles(grid, rng, 0.08) // 8% blocked tiles

  // Place spawn points on left edge
  const spawnPoints = placeSpawnPoints(grid, rng)

  // Place exit points on right edge
  const exitPoints = placeExitPoints(grid, rng)

  // Place corruption nodes (away from spawn)
  placeCorruption(grid, rng, config.corruptionDensity, spawnPoints)

  // Place data caches (distributed across the map)
  placeDataCaches(grid, rng, cacheCount, spawnPoints, exitPoints)

  // Ensure path exists from spawn to exit
  ensurePathExists(grid, spawnPoints, exitPoints)

  return {
    config,
    grid,
    spawnPoints,
    exitPoints,
    explored: 0,
    status: 'active',
  }
}

/**
 * Place blocked (impassable) tiles using cellular automata-like clustering
 */
function placeBlockedTiles(grid: Grid, rng: SeededRandom, density: number): void {
  const targetCount = Math.floor(grid.width * grid.height * density)
  let placed = 0

  // First pass: random placement
  while (placed < targetCount) {
    const x = rng.nextInt(1, grid.width - 2) // Avoid edges
    const y = rng.nextInt(1, grid.height - 2)
    const tile = getTile(grid, { x, y })

    if (tile && tile.type === 'empty') {
      setTileType(grid, { x, y }, 'blocked')
      placed++

      // Cluster: 50% chance to add adjacent blocked tile
      if (placed < targetCount && rng.chance(0.5)) {
        const neighbors = getAdjacentPositions({ x, y })
        const validNeighbor = rng.pick(
          neighbors.filter(pos => {
            const t = getTile(grid, pos)
            return t && t.type === 'empty' && pos.x > 0 && pos.x < grid.width - 1
          })
        )
        if (validNeighbor) {
          setTileType(grid, validNeighbor, 'blocked')
          placed++
        }
      }
    }
  }
}

/**
 * Place spawn points along the left edge
 */
function placeSpawnPoints(grid: Grid, rng: SeededRandom): GridPosition[] {
  const spawnCount = Math.max(1, Math.floor(grid.height / 4))
  const positions: GridPosition[] = []

  // Distribute spawn points evenly along left edge
  const spacing = Math.floor(grid.height / (spawnCount + 1))

  for (let i = 0; i < spawnCount; i++) {
    const y = spacing * (i + 1) + rng.nextInt(-1, 1)
    const clampedY = Math.max(1, Math.min(grid.height - 2, y))
    const pos = { x: 0, y: clampedY }

    setTileType(grid, pos, 'spawn_point')
    positions.push(pos)
  }

  return positions
}

/**
 * Place exit points along the right edge
 */
function placeExitPoints(grid: Grid, rng: SeededRandom): GridPosition[] {
  const exitCount = Math.max(1, Math.floor(grid.height / 6))
  const positions: GridPosition[] = []

  const spacing = Math.floor(grid.height / (exitCount + 1))

  for (let i = 0; i < exitCount; i++) {
    const y = spacing * (i + 1) + rng.nextInt(-1, 1)
    const clampedY = Math.max(1, Math.min(grid.height - 2, y))
    const pos = { x: grid.width - 1, y: clampedY }

    setTileType(grid, pos, 'exit_point')
    positions.push(pos)
  }

  return positions
}

/**
 * Place corruption nodes with clustering behavior
 */
function placeCorruption(
  grid: Grid,
  rng: SeededRandom,
  density: number,
  avoidPositions: GridPosition[]
): void {
  const targetCount = Math.floor(grid.width * grid.height * density)
  let placed = 0
  const minDistanceFromSpawn = Math.floor(grid.width / 3)

  while (placed < targetCount) {
    const x = rng.nextInt(minDistanceFromSpawn, grid.width - 2)
    const y = rng.nextInt(1, grid.height - 2)
    const pos = { x, y }

    // Check distance from spawn points
    const tooCloseToSpawn = avoidPositions.some(
      spawn => getManhattanDistance(pos, spawn) < minDistanceFromSpawn
    )

    if (tooCloseToSpawn) continue

    const tile = getTile(grid, pos)
    if (tile && tile.type === 'empty') {
      setTileType(grid, pos, 'corruption')
      tile.corruptionLevel = rng.nextInt(30, 80)
      placed++

      // Spread corruption to neighbors with decreasing probability
      const spreadChance = 0.4
      for (const neighbor of getAdjacentPositions(pos)) {
        if (!isInBounds(grid, neighbor)) continue
        const neighborTile = getTile(grid, neighbor)
        if (neighborTile && neighborTile.type === 'empty' && rng.chance(spreadChance)) {
          neighborTile.corruptionLevel = rng.nextInt(10, 40)
        }
      }
    }
  }
}

/**
 * Place data caches distributed across the map
 */
function placeDataCaches(
  grid: Grid,
  rng: SeededRandom,
  count: number,
  spawnPoints: GridPosition[],
  exitPoints: GridPosition[]
): void {
  let placed = 0
  const minDistanceFromEdges = 2
  const attempts = count * 20 // Prevent infinite loops

  for (let i = 0; i < attempts && placed < count; i++) {
    const x = rng.nextInt(minDistanceFromEdges, grid.width - minDistanceFromEdges - 1)
    const y = rng.nextInt(1, grid.height - 2)
    const pos = { x, y }

    const tile = getTile(grid, pos)
    if (!tile || tile.type !== 'empty') continue

    // Avoid placing too close to spawn/exit
    const tooCloseToSpawn = spawnPoints.some(sp => getManhattanDistance(pos, sp) < 3)
    const tooCloseToExit = exitPoints.some(ep => getManhattanDistance(pos, ep) < 2)

    if (tooCloseToSpawn || tooCloseToExit) continue

    setTileType(grid, pos, 'data_cache')
    placed++
  }
}

/**
 * Ensure there's at least one valid path from spawn to exit
 * Uses a simple corridor carving if needed
 */
function ensurePathExists(
  grid: Grid,
  spawnPoints: GridPosition[],
  exitPoints: GridPosition[]
): void {
  const spawn = spawnPoints[0]
  const exit = exitPoints[0]

  if (!spawn || !exit) return

  // Try to find existing path using BFS
  if (hasPath(grid, spawn, exit)) return

  // Carve a simple corridor
  const current = { ...spawn }

  while (current.x < exit.x) {
    current.x++
    clearTileForPath(grid, current)
  }

  const yDir = exit.y > current.y ? 1 : -1
  while (current.y !== exit.y) {
    current.y += yDir
    clearTileForPath(grid, current)
  }
}

function clearTileForPath(grid: Grid, pos: GridPosition): void {
  const tile = getTile(grid, pos)
  if (tile && tile.type === 'blocked') {
    setTileType(grid, pos, 'empty')
  }
}

function hasPath(grid: Grid, start: GridPosition, end: GridPosition): boolean {
  const visited = new Set<string>()
  const queue: GridPosition[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    const key = `${current.x},${current.y}`
    if (visited.has(key)) continue
    visited.add(key)

    if (current.x === end.x && current.y === end.y) return true

    for (const neighbor of getAdjacentPositions(current)) {
      if (!isInBounds(grid, neighbor)) continue
      const tile = getTile(grid, neighbor)
      if (tile && tile.type !== 'blocked') {
        queue.push(neighbor)
      }
    }
  }

  return false
}

/**
 * Generate a quick test sector for development
 */
export function generateTestSector(): Sector {
  return generateSector({
    size: 'small',
    difficulty: 'easy',
    seed: 12345,
    name: 'Test Sector Alpha',
  })
}
