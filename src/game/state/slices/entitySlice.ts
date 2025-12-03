/**
 * Entity slice - manages processes, malware, and selection state
 */

import { StateCreator } from 'zustand'
import { Process } from '@core/models/process'
import { Malware } from '@core/models/malware'
import type { EntitySlice } from '../types'
import type { GameState } from '../gameStore'

export const createEntitySlice: StateCreator<GameState, [], [], EntitySlice> = set => ({
  // Initial state
  processes: [],
  malware: [],
  selectedProcessId: null,

  // Set processes (used by tick and other orchestrators)
  setProcesses: (processes: Process[]) => {
    set({ processes })
  },

  // Set malware (used by tick and other orchestrators)
  setMalware: (malware: Malware[]) => {
    set({ malware })
  },

  // Select a process
  selectProcess: (processId: string | null) => {
    set({ selectedProcessId: processId })
  },

  // Add a process to the list
  addProcess: (process: Process) => {
    set(state => ({
      processes: [...state.processes, process],
      selectedProcessId: process.id,
    }))
  },

  // Clear all entities (used when generating new sector)
  clearEntities: () => {
    set({
      processes: [],
      malware: [],
      selectedProcessId: null,
    })
  },
})
