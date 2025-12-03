/**
 * Grid and Sector data models
 */

export interface GridPosition {
  x: number
  y: number
}

export type TileType =
  | 'empty'
  | 'blocked'
  | 'corruption'
  | 'data_cache'
  | 'spawn_point'
  | 'exit_point'

export type VisibilityState =
  | 'hidden' // Never seen (fog of war)
  | 'revealed' // Previously seen, currently not visible
  | 'visible' // Currently visible by a process

export interface Tile {
  type: TileType
  visibility: VisibilityState
  corruptionLevel: number // 0-100
  entityIds: string[] // IDs of entities on this tile
}

export interface Grid {
  width: number
  height: number
  tiles: Tile[][] // [y][x] for row-major access
}

export type SectorSize = 'small' | 'medium' | 'large'

export const SECTOR_DIMENSIONS: Record<SectorSize, { width: number; height: number }> = {
  small: { width: 8, height: 8 },
  medium: { width: 16, height: 16 },
  large: { width: 24, height: 24 },
}

export type SectorDifficulty = 'trivial' | 'easy' | 'normal' | 'hard' | 'extreme'

export interface SectorConfig {
  id: string
  name: string
  size: SectorSize
  difficulty: SectorDifficulty
  seed: number
  corruptionDensity: number // 0-1
  malwareDensity: number // 0-1
  cacheCount: number
}

export interface Sector {
  config: SectorConfig
  grid: Grid
  spawnPoints: GridPosition[]
  exitPoints: GridPosition[]
  explored: number // 0-100 percentage
  status: 'active' | 'success' | 'failed' | 'retreated'
}

// ============= Grid Utility Functions =============

export function createEmptyTile(): Tile {
  return {
    type: 'empty',
    visibility: 'hidden',
    corruptionLevel: 0,
    entityIds: [],
  }
}

export function createGrid(width: number, height: number): Grid {
  const tiles: Tile[][] = []
  for (let y = 0; y < height; y++) {
    const row: Tile[] = []
    for (let x = 0; x < width; x++) {
      row.push(createEmptyTile())
    }
    tiles.push(row)
  }
  return { width, height, tiles }
}

export function getTile(grid: Grid, pos: GridPosition): Tile | null {
  if (pos.x < 0 || pos.x >= grid.width || pos.y < 0 || pos.y >= grid.height) {
    return null
  }
  const row = grid.tiles[pos.y]
  if (!row) return null
  return row[pos.x] ?? null
}

export function setTileType(grid: Grid, pos: GridPosition, type: TileType): void {
  const tile = getTile(grid, pos)
  if (tile) {
    tile.type = type
  }
}

export function setTileVisibility(
  grid: Grid,
  pos: GridPosition,
  visibility: VisibilityState
): void {
  const tile = getTile(grid, pos)
  if (tile) {
    tile.visibility = visibility
  }
}

export function getAdjacentPositions(pos: GridPosition): GridPosition[] {
  return [
    { x: pos.x - 1, y: pos.y }, // left
    { x: pos.x + 1, y: pos.y }, // right
    { x: pos.x, y: pos.y - 1 }, // up
    { x: pos.x, y: pos.y + 1 }, // down
  ]
}

export function getDiagonalPositions(pos: GridPosition): GridPosition[] {
  return [
    { x: pos.x - 1, y: pos.y - 1 }, // top-left
    { x: pos.x + 1, y: pos.y - 1 }, // top-right
    { x: pos.x - 1, y: pos.y + 1 }, // bottom-left
    { x: pos.x + 1, y: pos.y + 1 }, // bottom-right
  ]
}

export function getAllNeighbors(pos: GridPosition): GridPosition[] {
  return [...getAdjacentPositions(pos), ...getDiagonalPositions(pos)]
}

export function getManhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function getEuclideanDistance(a: GridPosition, b: GridPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function positionsEqual(a: GridPosition, b: GridPosition): boolean {
  return a.x === b.x && a.y === b.y
}

export function isWalkable(tile: Tile | null): boolean {
  if (!tile) return false
  return tile.type !== 'blocked' && tile.corruptionLevel < 100
}

export function isInBounds(grid: Grid, pos: GridPosition): boolean {
  return pos.x >= 0 && pos.x < grid.width && pos.y >= 0 && pos.y < grid.height
}

export function positionToKey(pos: GridPosition): string {
  return `${pos.x},${pos.y}`
}

export function keyToPosition(key: string): GridPosition {
  const [x, y] = key.split(',').map(Number)
  return { x: x ?? 0, y: y ?? 0 }
}

/**
 * Calculate explored percentage of the grid
 */
export function calculateExploredPercentage(grid: Grid): number {
  let total = 0
  let explored = 0

  for (let y = 0; y < grid.height; y++) {
    const row = grid.tiles[y]
    if (!row) continue
    for (let x = 0; x < grid.width; x++) {
      const tile = row[x]
      if (!tile) continue
      if (tile.type !== 'blocked') {
        total++
        if (tile.visibility !== 'hidden') {
          explored++
        }
      }
    }
  }

  return total === 0 ? 0 : Math.round((explored / total) * 100)
}
