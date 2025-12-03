/**
 * Expedition slice - manages expedition state, tick count, and combat log
 */

import { StateCreator } from 'zustand'
import type { ExpeditionSlice, ExpeditionScore, ExpeditionResult } from '../types'
import type { GameState } from '../gameStore'

const initialScore: ExpeditionScore = {
  cachesCollected: 0,
  malwareDestroyed: 0,
  ticksSurvived: 0,
}

export const createExpeditionSlice: StateCreator<GameState, [], [], ExpeditionSlice> = set => ({
  // Initial state
  expeditionActive: false,
  expeditionResult: 'active',
  expeditionScore: initialScore,
  midExpeditionDeployCount: 0,
  currentTick: 0,
  isPaused: true,
  combatLog: [],

  // Start expedition
  startExpedition: () => {
    set({ expeditionActive: true, isPaused: false })
  },

  // End expedition
  endExpedition: (result: ExpeditionResult) => {
    set({
      expeditionActive: false,
      isPaused: true,
      expeditionResult: result,
    })
  },

  // Set expedition result
  setExpeditionResult: (result: ExpeditionResult) => {
    set({ expeditionResult: result })
  },

  // Update expedition score
  updateScore: (updates: Partial<ExpeditionScore>) => {
    set(state => ({
      expeditionScore: {
        ...state.expeditionScore,
        ...updates,
      },
    }))
  },

  // Increment score values
  incrementScore: (deltas: Partial<ExpeditionScore>) => {
    set(state => ({
      expeditionScore: {
        cachesCollected: state.expeditionScore.cachesCollected + (deltas.cachesCollected ?? 0),
        malwareDestroyed: state.expeditionScore.malwareDestroyed + (deltas.malwareDestroyed ?? 0),
        ticksSurvived: state.expeditionScore.ticksSurvived + (deltas.ticksSurvived ?? 0),
      },
    }))
  },

  // Increment deploy count for mid-expedition deployments
  incrementDeployCount: () => {
    set(state => ({ midExpeditionDeployCount: state.midExpeditionDeployCount + 1 }))
  },

  // Increment tick counter
  incrementTick: () => {
    set(state => ({ currentTick: state.currentTick + 1 }))
  },

  // Toggle pause state
  togglePause: () => {
    set(state => ({ isPaused: !state.isPaused }))
  },

  // Set pause state
  setPaused: (paused: boolean) => {
    set({ isPaused: paused })
  },

  // Add entry to combat log
  addCombatLog: (entry: string) => {
    set(state => ({
      combatLog: [...state.combatLog, entry],
    }))
  },

  // Set entire combat log (used by tick)
  setCombatLog: (log: string[]) => {
    set({ combatLog: log })
  },

  // Reset expedition state for new expedition
  resetExpedition: () => {
    set({
      expeditionActive: false,
      expeditionResult: 'active',
      expeditionScore: initialScore,
      midExpeditionDeployCount: 0,
      currentTick: 0,
      isPaused: true,
      combatLog: [],
    })
  },
})
