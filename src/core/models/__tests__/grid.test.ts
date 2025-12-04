/**
 * Tests for Grid model functions
 */

import { describe, it, expect } from 'vitest'
import {
  createGrid,
  createEmptyTile,
  getTile,
  setTileType,
  setTileVisibility,
  getAdjacentPositions,
  getDiagonalPositions,
  getAllNeighbors,
  getManhattanDistance,
  getEuclideanDistance,
  positionsEqual,
  isWalkable,
  isInBounds,
  positionToKey,
  keyToPosition,
  calculateExploredPercentage,
  SECTOR_DIMENSIONS,
} from '../grid'

describe('Grid Model', () => {
  describe('createEmptyTile', () => {
    it('should create an empty tile', () => {
      const tile = createEmptyTile()

      expect(tile.type).toBe('empty')
      expect(tile.visibility).toBe('hidden')
      expect(tile.corruptionLevel).toBe(0)
      expect(isWalkable(tile)).toBe(true) // Derived from type
    })
  })

  describe('createGrid', () => {
    it('should create a grid with correct dimensions', () => {
      const grid = createGrid(10, 8)

      expect(grid.width).toBe(10)
      expect(grid.height).toBe(8)
      expect(grid.tiles.length).toBe(8)
      expect(grid.tiles[0]?.length).toBe(10)
    })

    it('should fill grid with empty tiles', () => {
      const grid = createGrid(5, 5)

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const tile = grid.tiles[y]?.[x]
          expect(tile?.type).toBe('empty')
          expect(isWalkable(tile ?? null)).toBe(true)
        }
      }
    })

    it('should handle single-cell grid', () => {
      const grid = createGrid(1, 1)

      expect(grid.width).toBe(1)
      expect(grid.height).toBe(1)
      expect(grid.tiles[0]?.[0]?.type).toBe('empty')
    })
  })

  describe('getTile', () => {
    it('should return tile at valid position', () => {
      const grid = createGrid(5, 5)
      grid.tiles[2]![3]!.type = 'blocked'

      const tile = getTile(grid, { x: 3, y: 2 })

      expect(tile?.type).toBe('blocked')
    })

    it('should return null for out of bounds x', () => {
      const grid = createGrid(5, 5)

      expect(getTile(grid, { x: -1, y: 0 })).toBeNull()
      expect(getTile(grid, { x: 5, y: 0 })).toBeNull()
    })

    it('should return null for out of bounds y', () => {
      const grid = createGrid(5, 5)

      expect(getTile(grid, { x: 0, y: -1 })).toBeNull()
      expect(getTile(grid, { x: 0, y: 5 })).toBeNull()
    })
  })

  describe('setTileType', () => {
    it('should set tile type at position', () => {
      const grid = createGrid(5, 5)

      setTileType(grid, { x: 2, y: 3 }, 'blocked')

      expect(grid.tiles[3]?.[2]?.type).toBe('blocked')
    })

    it('should update walkability based on type', () => {
      const grid = createGrid(5, 5)

      setTileType(grid, { x: 2, y: 2 }, 'blocked')
      expect(isWalkable(getTile(grid, { x: 2, y: 2 }))).toBe(false)

      setTileType(grid, { x: 2, y: 2 }, 'empty')
      expect(isWalkable(getTile(grid, { x: 2, y: 2 }))).toBe(true)

      setTileType(grid, { x: 2, y: 2 }, 'cache')
      expect(isWalkable(getTile(grid, { x: 2, y: 2 }))).toBe(true)
    })
  })

  describe('setTileVisibility', () => {
    it('should set visibility at position', () => {
      const grid = createGrid(5, 5)

      setTileVisibility(grid, { x: 1, y: 1 }, 'visible')

      expect(grid.tiles[1]?.[1]?.visibility).toBe('visible')
    })

    it('should handle all visibility states', () => {
      const grid = createGrid(5, 5)

      setTileVisibility(grid, { x: 0, y: 0 }, 'hidden')
      setTileVisibility(grid, { x: 1, y: 0 }, 'revealed')
      setTileVisibility(grid, { x: 2, y: 0 }, 'visible')

      expect(grid.tiles[0]?.[0]?.visibility).toBe('hidden')
      expect(grid.tiles[0]?.[1]?.visibility).toBe('revealed')
      expect(grid.tiles[0]?.[2]?.visibility).toBe('visible')
    })
  })

  describe('getAdjacentPositions', () => {
    it('should return 4 cardinal directions', () => {
      const adjacent = getAdjacentPositions({ x: 5, y: 5 })

      expect(adjacent).toHaveLength(4)
      expect(adjacent).toContainEqual({ x: 5, y: 4 }) // North
      expect(adjacent).toContainEqual({ x: 5, y: 6 }) // South
      expect(adjacent).toContainEqual({ x: 4, y: 5 }) // West
      expect(adjacent).toContainEqual({ x: 6, y: 5 }) // East
    })

    it('should return positions including negative coords at origin', () => {
      const adjacent = getAdjacentPositions({ x: 0, y: 0 })

      expect(adjacent).toContainEqual({ x: 0, y: -1 })
      expect(adjacent).toContainEqual({ x: -1, y: 0 })
    })
  })

  describe('getDiagonalPositions', () => {
    it('should return 4 diagonal directions', () => {
      const diagonals = getDiagonalPositions({ x: 5, y: 5 })

      expect(diagonals).toHaveLength(4)
      expect(diagonals).toContainEqual({ x: 4, y: 4 }) // NW
      expect(diagonals).toContainEqual({ x: 6, y: 4 }) // NE
      expect(diagonals).toContainEqual({ x: 4, y: 6 }) // SW
      expect(diagonals).toContainEqual({ x: 6, y: 6 }) // SE
    })
  })

  describe('getAllNeighbors', () => {
    it('should return 8 neighbors (cardinal + diagonal)', () => {
      const neighbors = getAllNeighbors({ x: 5, y: 5 })

      expect(neighbors).toHaveLength(8)
    })
  })

  describe('getManhattanDistance', () => {
    it('should return 0 for same position', () => {
      expect(getManhattanDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    })

    it('should calculate correct distance horizontally', () => {
      expect(getManhattanDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5)
    })

    it('should calculate correct distance vertically', () => {
      expect(getManhattanDistance({ x: 0, y: 0 }, { x: 0, y: 3 })).toBe(3)
    })

    it('should calculate correct distance diagonally', () => {
      expect(getManhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7)
    })

    it('should handle negative coordinates', () => {
      expect(getManhattanDistance({ x: -2, y: -3 }, { x: 2, y: 3 })).toBe(10)
    })
  })

  describe('getEuclideanDistance', () => {
    it('should return 0 for same position', () => {
      expect(getEuclideanDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    })

    it('should calculate correct distance for 3-4-5 triangle', () => {
      const dist = getEuclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
      expect(dist).toBe(5)
    })

    it('should calculate correct distance horizontally', () => {
      expect(getEuclideanDistance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5)
    })
  })

  describe('positionsEqual', () => {
    it('should return true for same position', () => {
      expect(positionsEqual({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(true)
    })

    it('should return false for different x', () => {
      expect(positionsEqual({ x: 3, y: 4 }, { x: 5, y: 4 })).toBe(false)
    })

    it('should return false for different y', () => {
      expect(positionsEqual({ x: 3, y: 4 }, { x: 3, y: 6 })).toBe(false)
    })
  })

  describe('isWalkable', () => {
    it('should return true for empty tile', () => {
      const tile = createEmptyTile()
      expect(isWalkable(tile)).toBe(true)
    })

    it('should return false for blocked tile', () => {
      const tile = createEmptyTile()
      tile.type = 'blocked'
      expect(isWalkable(tile)).toBe(false)
    })

    it('should return false for fully corrupted tile', () => {
      const tile = createEmptyTile()
      tile.corruptionLevel = 100
      expect(isWalkable(tile)).toBe(false)
    })

    it('should return false for null tile', () => {
      expect(isWalkable(null)).toBe(false)
    })
  })

  describe('isInBounds', () => {
    it('should return true for position within grid', () => {
      const grid = createGrid(10, 10)

      expect(isInBounds(grid, { x: 0, y: 0 })).toBe(true)
      expect(isInBounds(grid, { x: 5, y: 5 })).toBe(true)
      expect(isInBounds(grid, { x: 9, y: 9 })).toBe(true)
    })

    it('should return false for negative coordinates', () => {
      const grid = createGrid(10, 10)

      expect(isInBounds(grid, { x: -1, y: 0 })).toBe(false)
      expect(isInBounds(grid, { x: 0, y: -1 })).toBe(false)
    })

    it('should return false for coordinates beyond bounds', () => {
      const grid = createGrid(10, 10)

      expect(isInBounds(grid, { x: 10, y: 0 })).toBe(false)
      expect(isInBounds(grid, { x: 0, y: 10 })).toBe(false)
    })
  })

  describe('positionToKey / keyToPosition', () => {
    it('should convert position to key', () => {
      const key = positionToKey({ x: 5, y: 3 })
      expect(key).toBe('5,3')
    })

    it('should convert key back to position', () => {
      const pos = keyToPosition('5,3')
      expect(pos).toEqual({ x: 5, y: 3 })
    })

    it('should be reversible', () => {
      const original = { x: 42, y: 17 }
      const key = positionToKey(original)
      const result = keyToPosition(key)

      expect(result).toEqual(original)
    })

    it('should handle negative coordinates', () => {
      const original = { x: -5, y: -3 }
      const key = positionToKey(original)
      const result = keyToPosition(key)

      expect(result).toEqual(original)
    })
  })

  describe('calculateExploredPercentage', () => {
    it('should return 0 for completely hidden grid', () => {
      const grid = createGrid(5, 5)

      expect(calculateExploredPercentage(grid)).toBe(0)
    })

    it('should return 100 for completely explored grid', () => {
      const grid = createGrid(5, 5)

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          grid.tiles[y]![x]!.visibility = 'visible'
        }
      }

      expect(calculateExploredPercentage(grid)).toBe(100)
    })

    it('should calculate partial exploration correctly', () => {
      const grid = createGrid(10, 10) // 100 tiles

      // Reveal 25 tiles
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          grid.tiles[y]![x]!.visibility = 'revealed'
        }
      }

      expect(calculateExploredPercentage(grid)).toBe(25)
    })

    it('should count both revealed and visible as explored', () => {
      const grid = createGrid(10, 10) // 100 tiles

      // Set 10 revealed, 10 visible
      for (let i = 0; i < 10; i++) {
        grid.tiles[0]![i]!.visibility = 'revealed'
        grid.tiles[1]![i]!.visibility = 'visible'
      }

      expect(calculateExploredPercentage(grid)).toBe(20)
    })
  })

  describe('SECTOR_DIMENSIONS', () => {
    it('should have small sector defined', () => {
      expect(SECTOR_DIMENSIONS.small).toBeDefined()
      expect(SECTOR_DIMENSIONS.small.width).toBeGreaterThan(0)
      expect(SECTOR_DIMENSIONS.small.height).toBeGreaterThan(0)
    })

    it('should have medium sector defined', () => {
      expect(SECTOR_DIMENSIONS.medium).toBeDefined()
      expect(SECTOR_DIMENSIONS.medium.width).toBeGreaterThan(SECTOR_DIMENSIONS.small.width)
    })

    it('should have large sector defined', () => {
      expect(SECTOR_DIMENSIONS.large).toBeDefined()
      expect(SECTOR_DIMENSIONS.large.width).toBeGreaterThan(SECTOR_DIMENSIONS.medium.width)
    })
  })
})
