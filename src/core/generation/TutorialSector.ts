/**
 * Tutorial sector generation
 * Creates a fixed, handcrafted sector designed for the tutorial experience
 */

import {
  createGrid,
  setTileType,
  type GridPosition,
  type Sector,
  type SectorConfig,
} from '@core/models/grid'
import { createMalware, type Malware } from '@core/models/malware'

/**
 * Generate the tutorial sector with a fixed layout
 * Returns both the sector and the malware entities to place
 */
export function generateTutorialSector(): { sector: Sector; malware: Malware[] } {
  const config: SectorConfig = {
    id: 'tutorial-sector',
    name: 'Tutorial: System Basics',
    size: 'small',
    difficulty: 'trivial',
    seed: 0,
    corruptionDensity: 0,
    malwareDensity: 0,
    cacheCount: 2,
  }

  // Create 8x8 grid
  const grid = createGrid(8, 8)

  // Place blocked tiles (#)
  const blockedPositions: GridPosition[] = [
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 5 },
    { x: 2, y: 6 },
  ]

  for (const pos of blockedPositions) {
    setTileType(grid, pos, 'blocked')
  }

  // Place data caches (C)
  const cachePositions: GridPosition[] = [
    { x: 5, y: 2 },
    { x: 6, y: 6 },
  ]

  for (const pos of cachePositions) {
    setTileType(grid, pos, 'data_cache')
  }

  // Place spawn point (S)
  const spawnPoint: GridPosition = { x: 0, y: 3 }
  setTileType(grid, spawnPoint, 'spawn_point')
  const spawnPoints: GridPosition[] = [spawnPoint]

  // Place exit point (E)
  const exitPoint: GridPosition = { x: 7, y: 3 }
  setTileType(grid, exitPoint, 'exit_point')
  const exitPoints: GridPosition[] = [exitPoint]

  // Create malware entities
  const malware: Malware[] = [
    createMalware('worm', { x: 5, y: 3 }),
    createMalware('trojan', { x: 6, y: 3 }),
  ]

  // Create sector
  const sector: Sector = {
    config,
    grid,
    spawnPoints,
    exitPoints,
    explored: 0,
    status: 'active',
  }

  return { sector, malware }
}
