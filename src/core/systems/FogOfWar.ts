/**
 * Fog of War system - manages tile visibility based on entity positions
 */

import {
  Grid,
  GridPosition,
  getTile,
  setTileVisibility,
  isInBounds,
} from '../models/grid'
import { getVisiblePositions } from './Pathfinding'

/**
 * Update fog of war based on entity vision
 * @param grid The sector grid
 * @param viewerPositions Positions of entities that can see (with their sight ranges)
 */
export function updateFogOfWar(
  grid: Grid,
  viewers: Array<{ position: GridPosition; sightRange: number }>
): void {
  // First, convert all 'visible' tiles to 'revealed'
  for (let y = 0; y < grid.height; y++) {
    const row = grid.tiles[y]
    if (!row) continue
    for (let x = 0; x < grid.width; x++) {
      const tile = row[x]
      if (tile && tile.visibility === 'visible') {
        tile.visibility = 'revealed'
      }
    }
  }

  // Then, mark tiles visible from each viewer's position
  for (const viewer of viewers) {
    const visiblePositions = getVisiblePositions(
      grid,
      viewer.position,
      viewer.sightRange
    )

    for (const pos of visiblePositions) {
      setTileVisibility(grid, pos, 'visible')
    }

    // Always mark the viewer's own position as visible
    setTileVisibility(grid, viewer.position, 'visible')
  }
}

/**
 * Reveal a specific area (e.g., when a scout ability is used)
 */
export function revealArea(
  grid: Grid,
  center: GridPosition,
  radius: number
): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const pos = { x: center.x + dx, y: center.y + dy }
      if (!isInBounds(grid, pos)) continue

      // Use Manhattan distance for reveal area
      if (Math.abs(dx) + Math.abs(dy) <= radius) {
        const tile = getTile(grid, pos)
        if (tile && tile.visibility === 'hidden') {
          tile.visibility = 'revealed'
        }
      }
    }
  }
}

/**
 * Check if a position is currently visible to any viewer
 */
export function isPositionVisible(
  grid: Grid,
  position: GridPosition
): boolean {
  const tile = getTile(grid, position)
  return tile?.visibility === 'visible'
}

/**
 * Check if a position has been revealed (seen at least once)
 */
export function isPositionRevealed(
  grid: Grid,
  position: GridPosition
): boolean {
  const tile = getTile(grid, position)
  return tile?.visibility === 'visible' || tile?.visibility === 'revealed'
}

/**
 * Reveal spawn points and their immediate surroundings
 */
export function revealSpawnArea(grid: Grid, spawnPoints: GridPosition[]): void {
  for (const spawn of spawnPoints) {
    revealArea(grid, spawn, 2)
    setTileVisibility(grid, spawn, 'visible')
  }
}
