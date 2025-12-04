/**
 * Tutorial slice - manages tutorial state and progression
 */

import { StateCreator } from 'zustand'
import type { TutorialSlice, TutorialAction } from '../types'
import type { GameState } from '../gameStore'
import { getTile } from '@core/models/grid'

import { TUTORIAL_STEPS } from '@core/constants/TutorialConfig'
// TODO: Import when TutorialSector.ts is created
// import { generateTutorialSector } from '@core/generation/TutorialSector'

export const createTutorialSlice: StateCreator<GameState, [], [], TutorialSlice> = (set, get) => ({
  // Initial state
  tutorialActive: false,
  tutorialCompleted: false,
  currentStepIndex: 0,
  showTutorialPrompt: false,
  showDeviationReminder: false,
  deviationMessage: '',

  /**
   * Start the tutorial by generating the tutorial sector
   */
  startTutorial: () => {
    // TODO: Uncomment when generateTutorialSector is implemented
    // const tutorialSector = generateTutorialSector()

    set({
      tutorialActive: true,
      currentStepIndex: 0,
      showTutorialPrompt: false,
      gameScreen: 'expedition',
    })

    // TODO: Uncomment when generateTutorialSector is implemented
    // Generate the tutorial sector
    // get().setSector(tutorialSector)
  },

  /**
   * Skip the tutorial and start a new campaign
   */
  skipTutorial: () => {
    set({
      showTutorialPrompt: false,
      tutorialCompleted: true,
    })

    // Start a new campaign with the selected difficulty
    const { selectedDifficulty } = get()
    get().startNewCampaign(selectedDifficulty)
  },

  /**
   * Advance to the next tutorial step
   */
  advanceStep: () => {
    const { currentStepIndex } = get()
    const nextIndex = currentStepIndex + 1

    // Check if we've reached the end of the tutorial
    if (nextIndex >= TUTORIAL_STEPS.length) {
      get().completeTutorial()
      return
    }

    set({ currentStepIndex: nextIndex })
  },

  /**
   * Set the deviation reminder state with auto-hide
   */
  setDeviationReminder: (show: boolean, message?: string) => {
    set({
      showDeviationReminder: show,
      deviationMessage: message ?? '',
    })

    // Auto-hide the reminder after 3 seconds
    if (show) {
      setTimeout(() => {
        const currentState = get()
        if (currentState.showDeviationReminder) {
          set({
            showDeviationReminder: false,
            deviationMessage: '',
          })
        }
      }, 3000)
    }
  },

  /**
   * Complete the tutorial
   */
  completeTutorial: () => {
    set({
      tutorialActive: false,
      tutorialCompleted: true,
    })

    // Auto-save progression
    get().autoSaveProgression()
  },

  /**
   * Reset the tutorial state
   */
  resetTutorial: () => {
    set({
      tutorialCompleted: false,
      tutorialActive: false,
      currentStepIndex: 0,
      showDeviationReminder: false,
      deviationMessage: '',
    })
  },

  /**
   * Get the current tutorial step
   */
  getCurrentStep: () => {
    const { currentStepIndex } = get()
    const step = TUTORIAL_STEPS[currentStepIndex]
    return step ?? null
  },

  /**
   * Check if an action is allowed in the current tutorial step
   */
  isActionAllowed: (action: TutorialAction) => {
    const { tutorialActive } = get()
    if (!tutorialActive) {
      return true
    }

    const currentStep = get().getCurrentStep()
    if (!currentStep) {
      return true
    }

    // Check if 'any' is in allowed actions
    if (currentStep.allowedActions.includes('any')) {
      return true
    }

    // Check if the specific action is allowed
    return currentStep.allowedActions.includes(action)
  },

  /**
   * Check if the current step's completion condition is met
   */
  checkStepCompletion: () => {
    const currentStep = get().getCurrentStep()
    if (!currentStep) {
      return false
    }

    const state = get()

    switch (currentStep.completionCondition) {
      case 'process_deployed': {
        // Check if a process with the specified archetype has been deployed
        const requiredArchetype = currentStep.completionParams?.archetype as string | undefined
        if (!requiredArchetype) {
          return false
        }
        return state.processes.some(p => p.archetype === requiredArchetype)
      }

      case 'process_selected': {
        // Check if a process is selected
        return state.selectedProcessId !== null
      }

      case 'process_at_position': {
        // Check if any process is at the specified position
        const targetX = currentStep.completionParams?.x as number | undefined
        const targetY = currentStep.completionParams?.y as number | undefined
        if (targetX === undefined || targetY === undefined) {
          return false
        }
        return state.processes.some(p => p.position.x === targetX && p.position.y === targetY)
      }

      case 'malware_destroyed': {
        // Check if the required number of malware has been destroyed
        const requiredCount = (currentStep.completionParams?.count as number | undefined) ?? 1
        const destroyedCount = state.malware.filter(m => m.status === 'destroyed').length
        return destroyedCount >= requiredCount
      }

      case 'tile_revealed': {
        // Check if the specified tile is revealed or visible
        const targetX = currentStep.completionParams?.x as number | undefined
        const targetY = currentStep.completionParams?.y as number | undefined
        if (targetX === undefined || targetY === undefined || !state.currentSector) {
          return false
        }

        const tile = getTile(state.currentSector.grid, { x: targetX, y: targetY })
        return tile !== null && (tile.visibility === 'revealed' || tile.visibility === 'visible')
      }

      case 'dormant_activated': {
        // Check if any trojan has been activated (status !== 'dormant')
        return state.malware.some(m => m.type === 'trojan' && m.status !== 'dormant')
      }

      case 'process_at_exit': {
        // Check if any process is on an exit tile
        if (!state.currentSector) {
          return false
        }

        return state.processes.some(p => {
          const tile = getTile(state.currentSector!.grid, p.position)
          return tile !== null && tile.type === 'exit_point'
        })
      }

      case 'acknowledged': {
        // This condition requires manual advancement (e.g., clicking a "Continue" button)
        return false
      }

      default:
        return false
    }
  },
})
