/**
 * Main game state store using Zustand
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { produce } from 'immer'
import { Sector, Grid, GridPosition, getTile } from '@core/models/grid'
import { Process, ProcessArchetype, createProcess } from '@core/models/process'
import { Malware, MalwareType, createMalware } from '@core/models/malware'
import { generateSector, GeneratorOptions } from '@core/generation/SectorGenerator'
import { revealSpawnArea, updateFogOfWar } from '@core/systems/FogOfWar'
import { setMovementTarget } from '@core/systems/MovementSystem'
import { executeTick } from '@core/systems/TickSystem'
import { saveProgression, loadProgression } from '@persistence/SaveManager'
import { isValidArchetype, isValidSpawnIndex } from '@game/validation'
import {
  DEPLOY_COST,
  ENERGY_DEPLOYMENT_COSTS,
  ENERGY_REGEN_PER_TICK,
  UPGRADES,
  REWARDS,
  DIFFICULTY,
  SAFE_LIMITS,
} from '@core/constants/GameConfig'

// Import slices
import { createBehaviorSlice } from './slices/behaviorSlice'
import { createConfigSlice } from './slices/configSlice'
import { createResourceSlice, getInitialResources } from './slices/resourceSlice'

// Re-export types for backward compatibility
export type {
  Resources,
  ResourceCapacity,
  Difficulty,
  Upgrades,
  UpgradeType,
  PersistentData,
  ExpeditionScore,
  ExpeditionResult,
  ExpeditionRewards,
  BehaviorSlice,
  ConfigSlice,
  ResourceSlice,
} from './types'

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

// Clamp a value to safe integer bounds (prevents overflow)
function clampToSafe(value: number, max: number = SAFE_LIMITS.MAX_DATA): number {
  return Math.max(0, Math.min(Math.floor(value), max))
}

// ============= Deployment Costs =============

export const DEPLOYMENT_COSTS: Record<ProcessArchetype, Partial<Resources>> = {
  scout: { cycles: DEPLOY_COST.SCOUT },
  purifier: { cycles: DEPLOY_COST.PURIFIER },
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

// Re-export rewards from config for backward compatibility
export { REWARDS } from '@core/constants/GameConfig'

// Import types for use in GameState interface
import type {
  Resources,
  Upgrades,
  UpgradeType,
  PersistentData,
  ExpeditionScore,
  ExpeditionResult,
  ExpeditionRewards,
  BehaviorSlice,
  ConfigSlice,
  ResourceSlice,
} from './types'

export interface GameState extends BehaviorSlice, ConfigSlice, ResourceSlice {
  // Core state (non-sliced)
  currentSector: Sector | null

  // Expedition state
  expeditionActive: boolean
  expeditionResult: ExpeditionResult
  expeditionScore: ExpeditionScore
  midExpeditionDeployCount: number
  processes: Process[]
  malware: Malware[]
  selectedProcessId: string | null
  currentTick: number
  isPaused: boolean
  combatLog: string[]

  // Persistent progression
  persistentData: PersistentData
  upgrades: Upgrades

  // Actions - Sector
  generateNewSector: (options: GeneratorOptions) => void

  // Actions - Expedition
  startExpedition: () => void
  endExpedition: (success: boolean) => void
  deployProcess: (archetype: ProcessArchetype, spawnIndex: number) => void
  selectProcess: (processId: string | null) => void
  moveSelectedProcess: (target: GridPosition) => void
  tick: () => void
  togglePause: () => void

  // Actions - Visibility
  updateVisibility: () => void

  // Actions - Progression
  purchaseUpgrade: (upgradeType: UpgradeType) => boolean
  getUpgradeCost: (upgradeType: UpgradeType) => number
  claimExpeditionRewards: () => ExpeditionRewards

  // Actions - Save/Load
  loadSavedData: () => Promise<void>
  autoSaveProgression: () => Promise<void>
}

// ============= Initial State =============

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

// ============= Store =============

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Compose slices
    ...createBehaviorSlice(set, get, undefined as never),
    ...createConfigSlice(set, get, undefined as never),
    ...createResourceSlice(set, get, undefined as never),

    // Initial state (non-sliced)
    currentSector: null,
    expeditionActive: false,
    expeditionResult: 'active',
    expeditionScore: {
      cachesCollected: 0,
      malwareDestroyed: 0,
      ticksSurvived: 0,
    },
    midExpeditionDeployCount: 0,
    processes: [],
    malware: [],
    selectedProcessId: null,
    currentTick: 0,
    isPaused: true,
    combatLog: [],
    persistentData: initialPersistentData,
    upgrades: initialUpgrades,

    // Generate a new sector
    generateNewSector: (options: GeneratorOptions) => {
      const { upgrades, selectedDifficulty } = get()

      // Apply difficulty multiplier to malware density
      const malwareMultiplier = DIFFICULTY.MALWARE_MULTIPLIER[selectedDifficulty]

      const sector = generateSector(options)

      // Reveal spawn area initially
      revealSpawnArea(sector.grid, sector.spawnPoints)

      // Spawn some malware based on difficulty
      const malwareList: Malware[] = []
      const malwareCount = Math.floor(
        sector.grid.width * sector.grid.height * sector.config.malwareDensity * malwareMultiplier
      )

      const malwareTypes: MalwareType[] = ['worm', 'worm', 'worm', 'trojan', 'rootkit']

      for (let i = 0; i < malwareCount; i++) {
        // Find a valid position (not on spawn, not on blocked, not on cache)
        let attempts = 0
        while (attempts < 50) {
          const x = Math.floor(Math.random() * (sector.grid.width - 4)) + 2
          const y = Math.floor(Math.random() * sector.grid.height)
          const tile = getTile(sector.grid, { x, y })

          if (tile && tile.type === 'empty') {
            const type = malwareTypes[Math.floor(Math.random() * malwareTypes.length)] ?? 'worm'
            malwareList.push(createMalware(type, { x, y }))
            break
          }
          attempts++
        }
      }

      set({
        currentSector: sector,
        processes: [],
        malware: malwareList,
        expeditionActive: false,
        expeditionResult: 'active',
        expeditionScore: {
          cachesCollected: 0,
          malwareDestroyed: 0,
          ticksSurvived: 0,
        },
        midExpeditionDeployCount: 0,
        resources: getInitialResources(upgrades),
        selectedProcessId: null,
        currentTick: 0,
        isPaused: true,
        combatLog: [],
        // NOTE: persistentData and upgrades are NOT reset
      })

      // Force initial visibility update
      get().updateVisibility()
    },

    // Start an expedition
    startExpedition: () => {
      const { currentSector } = get()
      if (!currentSector) return

      set({ expeditionActive: true, isPaused: false })
      get().updateVisibility()
    },

    // End the expedition
    endExpedition: (success: boolean) => {
      set(state => ({
        expeditionActive: false,
        isPaused: true,
        currentSector: state.currentSector
          ? { ...state.currentSector, status: success ? 'success' : 'failed' }
          : null,
      }))
    },

    // Deploy a process at a spawn point (with validation)
    deployProcess: (archetype: ProcessArchetype, spawnIndex: number) => {
      const { currentSector, processes, upgrades, expeditionActive, midExpeditionDeployCount } =
        get()
      if (!currentSector) return

      // Validate archetype
      if (!isValidArchetype(archetype)) {
        console.warn(`Invalid archetype: ${archetype}`)
        return
      }

      // Validate spawn index
      if (!isValidSpawnIndex(spawnIndex, currentSector.spawnPoints.length)) {
        console.warn(`Invalid spawn index: ${spawnIndex}`)
        return
      }

      const spawnPoint = currentSector.spawnPoints[spawnIndex]
      if (!spawnPoint) return

      // Check if spawn point is already occupied
      const occupied = processes.some(
        p => p.position.x === spawnPoint.x && p.position.y === spawnPoint.y
      )
      if (occupied) return

      // Calculate deployment cost based on expedition status
      let cost: Partial<Resources>
      let newDeployCount = midExpeditionDeployCount

      if (expeditionActive) {
        // Mid-expedition: use energy with exponential scaling
        const baseEnergyCost =
          archetype === 'scout' ? ENERGY_DEPLOYMENT_COSTS.SCOUT : ENERGY_DEPLOYMENT_COSTS.PURIFIER
        const scaledEnergyCost = Math.floor(
          baseEnergyCost *
            Math.pow(ENERGY_DEPLOYMENT_COSTS.SCALING_MULTIPLIER, midExpeditionDeployCount)
        )
        cost = { energy: scaledEnergyCost }
        newDeployCount = midExpeditionDeployCount + 1
      } else {
        // Pre-expedition: use cycles (existing behavior)
        cost = DEPLOYMENT_COSTS[archetype]
      }

      // Check and deduct deployment cost
      const canAfford = get().spendResources(cost)
      if (!canAfford) return

      const process = createProcess(archetype, spawnPoint)

      // Apply upgrade bonuses
      const healthBonus = upgrades.maxHealth * UPGRADES.BONUS_PER_LEVEL.HEALTH
      const attackBonus = upgrades.attack * UPGRADES.BONUS_PER_LEVEL.ATTACK
      const defenseBonus = upgrades.defense * UPGRADES.BONUS_PER_LEVEL.DEFENSE

      process.stats.maxHealth += healthBonus
      process.stats.health += healthBonus
      process.stats.attack += attackBonus
      process.stats.defense += defenseBonus

      set(state => ({
        processes: [...state.processes, process],
        selectedProcessId: process.id,
        midExpeditionDeployCount: newDeployCount,
        // Auto-start expedition when first process deployed
        expeditionActive: true,
        isPaused: false,
      }))

      get().updateVisibility()
    },

    // Select a process
    selectProcess: (processId: string | null) => {
      set({ selectedProcessId: processId })
    },

    // Move selected process to target
    moveSelectedProcess: (target: GridPosition) => {
      const { selectedProcessId, processes, currentSector } = get()
      if (!selectedProcessId || !currentSector) return

      const process = processes.find(p => p.id === selectedProcessId)
      if (!process) return

      const success = setMovementTarget(process, target, currentSector.grid)
      if (success) {
        set({ processes: [...processes] })
      }
    },

    // Game tick - delegates to TickSystem for business logic
    tick: () => {
      const {
        processes,
        malware,
        currentSector,
        isPaused,
        expeditionActive,
        expeditionResult,
        combatLog,
        expeditionScore,
        behaviorRules,
        currentTick,
        selectedDifficulty,
      } = get()
      // Block tick on defeat, but allow continuation after victory for cache collection
      if (!currentSector || isPaused || !expeditionActive || expeditionResult === 'defeat') return

      // Execute tick using the core TickSystem
      const result = executeTick({
        processes,
        malware,
        grid: currentSector.grid,
        combatLog,
        sector: {
          exitPoints: currentSector.exitPoints,
          spawnPoints: currentSector.spawnPoints,
        },
        behaviorRules,
        currentTick,
        difficulty: selectedDifficulty,
      })

      // Award resources for collected caches
      if (result.cachesCollected > 0) {
        get().addResources({ cycles: result.cachesCollected * 10 })
      }

      // Regenerate energy during expedition
      get().addResources({ energy: ENERGY_REGEN_PER_TICK })

      // Update state with tick results
      set({
        currentTick: get().currentTick + 1,
        currentSector: {
          ...currentSector,
          grid: result.grid,
        },
        processes: result.processes,
        malware: result.malware,
        expeditionResult: result.expeditionResult,
        expeditionScore: {
          cachesCollected: expeditionScore.cachesCollected + result.cachesCollected,
          malwareDestroyed: expeditionScore.malwareDestroyed + result.malwareDestroyed,
          ticksSurvived: expeditionScore.ticksSurvived + 1,
        },
        // Only auto-pause on defeat, not victory (allow collecting remaining caches)
        isPaused: result.expeditionResult === 'defeat' ? true : get().isPaused,
        combatLog: result.combatLog,
      })

      get().updateVisibility()
    },

    // Toggle pause
    togglePause: () => {
      set(state => ({ isPaused: !state.isPaused }))
    },

    // Update fog of war visibility
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
    claimExpeditionRewards: () => {
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
  }))
)

// ============= Selectors =============

export const selectCurrentSector = (state: GameState) => state.currentSector
export const selectResources = (state: GameState) => state.resources
export const selectProcesses = (state: GameState) => state.processes
export const selectMalware = (state: GameState) => state.malware
export const selectSelectedProcessId = (state: GameState) => state.selectedProcessId
export const selectExpeditionActive = (state: GameState) => state.expeditionActive
export const selectIsPaused = (state: GameState) => state.isPaused
