/**
 * Resource slice - manages resource state and capacity
 */

import { StateCreator } from 'zustand'
import { RESOURCES, CAPACITY } from '@core/constants/GameConfig'
import type { ResourceSlice, Resources, ResourceCapacity, Upgrades } from '../types'
import type { GameState } from '../gameStore'

const initialCapacity: ResourceCapacity = {
  maxCycles: CAPACITY.MAX_CYCLES,
  maxMemory: CAPACITY.MAX_MEMORY,
  maxEnergy: CAPACITY.MAX_ENERGY,
}

export function getInitialResources(upgrades: Upgrades): Resources {
  return {
    cycles: RESOURCES.STARTING_CYCLES + upgrades.startingCycles * RESOURCES.CYCLES_PER_UPGRADE,
    memory: RESOURCES.STARTING_MEMORY,
    energy: RESOURCES.STARTING_ENERGY,
  }
}

export const createResourceSlice: StateCreator<GameState, [], [], ResourceSlice> = (set, get) => ({
  // Initial state
  resources: getInitialResources({ maxHealth: 0, attack: 0, defense: 0, startingCycles: 0 }),
  capacity: initialCapacity,

  // Spend resources
  spendResources: (cost: Partial<Resources>) => {
    const { resources } = get()

    // Check if we can afford
    if ((cost.cycles ?? 0) > resources.cycles) return false
    if ((cost.memory ?? 0) > resources.memory) return false
    if ((cost.energy ?? 0) > resources.energy) return false

    set({
      resources: {
        cycles: resources.cycles - (cost.cycles ?? 0),
        memory: resources.memory - (cost.memory ?? 0),
        energy: resources.energy - (cost.energy ?? 0),
      },
    })

    return true
  },

  // Add resources
  addResources: (amount: Partial<Resources>) => {
    const { resources, capacity } = get()

    set({
      resources: {
        cycles: Math.min(capacity.maxCycles, resources.cycles + (amount.cycles ?? 0)),
        memory: Math.min(capacity.maxMemory, resources.memory + (amount.memory ?? 0)),
        energy: Math.min(capacity.maxEnergy, resources.energy + (amount.energy ?? 0)),
      },
    })
  },
})
