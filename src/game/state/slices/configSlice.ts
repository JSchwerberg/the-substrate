/**
 * Config slice - manages game difficulty settings
 */

import { StateCreator } from 'zustand'
import { isValidDifficulty } from '@game/validation'
import type { ConfigSlice, Difficulty } from '../types'
import type { GameState } from '../gameStore'

export const createConfigSlice: StateCreator<GameState, [], [], ConfigSlice> = set => ({
  // Initial state
  selectedDifficulty: 'normal',

  // Set difficulty (with validation)
  setDifficulty: (difficulty: Difficulty) => {
    if (!isValidDifficulty(difficulty)) {
      console.warn(`Invalid difficulty: ${difficulty}`)
      return
    }
    set({ selectedDifficulty: difficulty })
  },
})
