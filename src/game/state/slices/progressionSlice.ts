/**
 * Progression slice - manages persistent data, upgrades, and save/load
 */

import { StateCreator } from 'zustand'
import { saveProgression, loadProgression } from '@persistence/SaveManager'
import { UPGRADES, REWARDS, DIFFICULTY, SAFE_LIMITS } from '@core/constants/GameConfig'
import { getInitialResources } from './resourceSlice'
import type {
  ProgressionSlice,
  PersistentData,
  Upgrades,
  UpgradeType,
  ExpeditionRewards,
} from '../types'
import type { GameState } from '../gameStore'

// Clamp a value to safe integer bounds (prevents overflow)
function clampToSafe(value: number, max: number = SAFE_LIMITS.MAX_DATA): number {
  return Math.max(0, Math.min(Math.floor(value), max))
}

// ============= Upgrade Costs =============

export const UPGRADE_COSTS: Record<UpgradeType, (level: number) => number> = {
  maxHealth: (level: number) =>
    Math.floor(UPGRADES.BASE_COST.MAX_HEALTH * Math.pow(UPGRADES.COST_MULTIPLIER, level)),
  attack: (level: number) =>
    Math.floor(UPGRADES.BASE_COST.ATTACK * Math.pow(UPGRADES.COST_MULTIPLIER, level)),
  defense: (level: number) =>
    Math.floor(UPGRADES.BASE_COST.DEFENSE * Math.pow(UPGRADES.COST_MULTIPLIER, level)),
  startingCycles: (level: number) =>
    Math.floor(UPGRADES.BASE_COST.STARTING_CYCLES * Math.pow(UPGRADES.COST_MULTIPLIER, level)),
}

const initialPersistentData: PersistentData = {
  totalData: 0,
  expeditionsCompleted: 0,
  expeditionsLost: 0,
  totalMalwareDestroyed: 0,
}

const initialUpgrades: Upgrades = {
  maxHealth: 0,
  attack: 0,
  defense: 0,
  startingCycles: 0,
}

export const createProgressionSlice: StateCreator<GameState, [], [], ProgressionSlice> = (
  set,
  get
) => ({
  // Initial state
  persistentData: initialPersistentData,
  upgrades: initialUpgrades,

  // Purchase an upgrade
  purchaseUpgrade: (upgradeType: UpgradeType) => {
    const { upgrades, persistentData } = get()
    const currentLevel = upgrades[upgradeType]
    const cost = UPGRADE_COSTS[upgradeType](currentLevel)

    // Check if player has enough Data
    if (persistentData.totalData < cost) {
      return false
    }

    // Deduct cost and apply upgrade
    set({
      persistentData: {
        ...persistentData,
        totalData: persistentData.totalData - cost,
      },
      upgrades: {
        ...upgrades,
        [upgradeType]: currentLevel + 1,
      },
    })

    // Auto-save after purchasing upgrade
    get().autoSaveProgression()

    return true
  },

  // Get the cost for the next level of an upgrade
  getUpgradeCost: (upgradeType: UpgradeType) => {
    const { upgrades } = get()
    const currentLevel = upgrades[upgradeType]
    return UPGRADE_COSTS[upgradeType](currentLevel)
  },

  // Claim expedition rewards
  claimExpeditionRewards: (): ExpeditionRewards => {
    const { expeditionScore, expeditionResult, persistentData, selectedDifficulty } = get()

    // Apply difficulty reward multiplier
    const rewardMultiplier = DIFFICULTY.REWARD_MULTIPLIER[selectedDifficulty]

    // Clamp score inputs to prevent manipulation-based overflow
    const safeCaches = clampToSafe(expeditionScore.cachesCollected, SAFE_LIMITS.MAX_SCORE)
    const safeMalware = clampToSafe(expeditionScore.malwareDestroyed, SAFE_LIMITS.MAX_SCORE)
    const safeTicks = clampToSafe(expeditionScore.ticksSurvived, SAFE_LIMITS.MAX_SCORE)

    // Calculate rewards with clamped values
    const cacheReward = clampToSafe(safeCaches * REWARDS.CACHE_COLLECTED * rewardMultiplier)
    const malwareReward = clampToSafe(safeMalware * REWARDS.MALWARE_DESTROYED * rewardMultiplier)
    const victoryBonus =
      expeditionResult === 'victory' ? clampToSafe(REWARDS.VICTORY_BONUS * rewardMultiplier) : 0
    const survivalBonus = clampToSafe(
      Math.floor(safeTicks / 10) * REWARDS.SURVIVAL_BONUS_PER_10_TICKS * rewardMultiplier
    )
    const totalReward = clampToSafe(cacheReward + malwareReward + victoryBonus + survivalBonus)

    // Update persistent data with overflow protection
    const newExpeditionsCompleted =
      expeditionResult === 'victory'
        ? clampToSafe(persistentData.expeditionsCompleted + 1)
        : persistentData.expeditionsCompleted

    const newExpeditionsLost =
      expeditionResult === 'defeat'
        ? clampToSafe(persistentData.expeditionsLost + 1)
        : persistentData.expeditionsLost

    set({
      persistentData: {
        totalData: clampToSafe(persistentData.totalData + totalReward),
        expeditionsCompleted: newExpeditionsCompleted,
        expeditionsLost: newExpeditionsLost,
        totalMalwareDestroyed: clampToSafe(persistentData.totalMalwareDestroyed + safeMalware),
      },
    })

    // Auto-save after claiming rewards
    get().autoSaveProgression()

    return {
      cacheReward,
      malwareReward,
      victoryBonus,
      survivalBonus,
      totalReward,
    }
  },

  // Load saved data from IndexedDB
  loadSavedData: async () => {
    try {
      const savedData = await loadProgression()
      if (savedData) {
        set({
          persistentData: savedData.persistentData,
          upgrades: savedData.upgrades,
          selectedDifficulty: savedData.selectedDifficulty,
          behaviorRules: savedData.behaviorRules,
          resources: getInitialResources(savedData.upgrades),
        })

        // Restore campaign state if present
        if (savedData.campaign) {
          set({ campaign: savedData.campaign })
        }

        console.info('Loaded saved progression data')
      }
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  },

  // Auto-save progression to IndexedDB
  autoSaveProgression: async () => {
    try {
      await saveProgression(get())
      console.info('Auto-saved progression')
    } catch (error) {
      console.error('Failed to auto-save progression:', error)
    }
  },
})
