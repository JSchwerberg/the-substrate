/**
 * Grid slice - manages sector and visibility state
 */

import { StateCreator } from 'zustand'
import { produce } from 'immer'
import { Sector, Grid, GridPosition } from '@core/models/grid'
import { updateFogOfWar } from '@core/systems/FogOfWar'
import type { GridSlice } from '../types'
import type { GameState } from '../gameStore'

// Create a new immutable grid with fog of war updates using Immer
// Uses structural sharing - only changed tiles get new references
function updateGridFog(
  grid: Grid,
  viewers: Array<{ position: GridPosition; sightRange: number }>
): Grid {
  return produce(grid, draft => {
    updateFogOfWar(draft, viewers)
  })
}

export const createGridSlice: StateCreator<GameState, [], [], GridSlice> = (set, get) => ({
  // Initial state
  currentSector: null,

  // Set the current sector
  setSector: (sector: Sector | null) => {
    set({ currentSector: sector })
  },

  // Update sector status
  setSectorStatus: (status: 'active' | 'success' | 'failed') => {
    set(state => ({
      currentSector: state.currentSector ? { ...state.currentSector, status } : null,
    }))
  },

  // Update the grid within the sector
  updateGrid: (grid: Grid) => {
    set(state => ({
      currentSector: state.currentSector ? { ...state.currentSector, grid } : null,
    }))
  },

  // Update fog of war visibility based on process positions
  updateVisibility: () => {
    const { currentSector, processes } = get()
    if (!currentSector) return

    // Build viewers from processes
    const viewers = processes
      .filter(p => p.status !== 'destroyed')
      .map(p => ({
        position: p.position,
        sightRange: p.stats.sightRange,
      }))

    // Use Immer for efficient structural sharing - only changed tiles get new references
    const newGrid = updateGridFog(currentSector.grid, viewers)

    // Create new sector with new grid reference
    set({
      currentSector: {
        ...currentSector,
        grid: newGrid,
      },
    })
  },
})
