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
import { BehaviorRule, RuleTemplate, createDefaultRules } from '@core/models/behavior'
import { saveProgression, loadProgression } from '@persistence/SaveManager'
import {
  isValidDifficulty,
  isValidBehaviorRule,
  isValidArchetype,
  isValidSpawnIndex,
} from '@game/validation'
import {
  RESOURCES,
  CAPACITY,
  DEPLOY_COST,
  UPGRADES,
  REWARDS,
  DIFFICULTY,
  SAFE_LIMITS,
} from '@core/constants/GameConfig'

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

// ============= State Types =============

export interface Resources {
  cycles: number
  memory: number
  energy: number
}

export interface ResourceCapacity {
  maxCycles: number
  maxMemory: number
  maxEnergy: number
}

export interface ExpeditionScore {
  cachesCollected: number
  malwareDestroyed: number
  ticksSurvived: number
}

export type ExpeditionResult = 'active' | 'victory' | 'defeat'

export interface PersistentData {
  totalData: number
  expeditionsCompleted: number
  expeditionsLost: number
  totalMalwareDestroyed: number
}

export interface Upgrades {
  maxHealth: number
  attack: number
  defense: number
  startingCycles: number
}

export type UpgradeType = keyof Upgrades

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface ExpeditionRewards {
  cacheReward: number
  malwareReward: number
  victoryBonus: number
  survivalBonus: number
  totalReward: number
}

export interface GameState {
  // Core state
  resources: Resources
  capacity: ResourceCapacity
  currentSector: Sector | null

  // Expedition state
  expeditionActive: boolean
  expeditionResult: ExpeditionResult
  expeditionScore: ExpeditionScore
  processes: Process[]
  malware: Malware[]
  selectedProcessId: string | null
  currentTick: number
  isPaused: boolean
  combatLog: string[]

  // Persistent progression
  persistentData: PersistentData
  upgrades: Upgrades

  // Difficulty
  selectedDifficulty: Difficulty

  // Behavior rules
  behaviorRules: BehaviorRule[]

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

  // Actions - Resources
  spendResources: (cost: Partial<Resources>) => boolean
  addResources: (amount: Partial<Resources>) => void

  // Actions - Progression
  purchaseUpgrade: (upgradeType: UpgradeType) => boolean
  getUpgradeCost: (upgradeType: UpgradeType) => number
  claimExpeditionRewards: () => ExpeditionRewards

  // Actions - Difficulty
  setDifficulty: (difficulty: Difficulty) => void

  // Actions - Behavior Rules
  setBehaviorRules: (rules: BehaviorRule[]) => void
  loadRuleTemplate: (template: RuleTemplate) => void
  updateBehaviorRule: (ruleId: string, updates: Partial<BehaviorRule>) => void
  deleteBehaviorRule: (ruleId: string) => void
  addBehaviorRule: (rule: BehaviorRule) => void
  reorderBehaviorRules: (rules: BehaviorRule[]) => void

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

const initialCapacity: ResourceCapacity = {
  maxCycles: CAPACITY.MAX_CYCLES,
  maxMemory: CAPACITY.MAX_MEMORY,
  maxEnergy: CAPACITY.MAX_ENERGY,
}

function getInitialResources(upgrades: Upgrades): Resources {
  return {
    cycles: RESOURCES.STARTING_CYCLES + upgrades.startingCycles * RESOURCES.CYCLES_PER_UPGRADE,
    memory: RESOURCES.STARTING_MEMORY,
    energy: RESOURCES.STARTING_ENERGY,
  }
}

// ============= Store =============

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    resources: getInitialResources(initialUpgrades),
    capacity: initialCapacity,
    currentSector: null,
    expeditionActive: false,
    expeditionResult: 'active',
    expeditionScore: {
      cachesCollected: 0,
      malwareDestroyed: 0,
      ticksSurvived: 0,
    },
    processes: [],
    malware: [],
    selectedProcessId: null,
    currentTick: 0,
    isPaused: true,
    combatLog: [],
    persistentData: initialPersistentData,
    upgrades: initialUpgrades,
    selectedDifficulty: 'normal',
    behaviorRules: createDefaultRules('aggressive'),

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
      const { currentSector, processes, upgrades } = get()
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

      // Check and deduct deployment cost
      const cost = DEPLOYMENT_COSTS[archetype]
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
      })

      // Award resources for collected caches
      if (result.cachesCollected > 0) {
        get().addResources({ cycles: result.cachesCollected * 10 })
      }

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

    // Set difficulty (with validation)
    setDifficulty: (difficulty: Difficulty) => {
      if (!isValidDifficulty(difficulty)) {
        console.warn(`Invalid difficulty: ${difficulty}`)
        return
      }
      set({ selectedDifficulty: difficulty })
    },

    // Set behavior rules (with validation)
    setBehaviorRules: (rules: BehaviorRule[]) => {
      // Validate each rule at runtime to catch corrupted data
      const validRules = rules.filter(rule => isValidBehaviorRule(rule))
      if (validRules.length !== rules.length) {
        console.warn(`Filtered ${rules.length - validRules.length} invalid behavior rules`)
      }
      set({ behaviorRules: validRules })
    },

    // Load rule template
    loadRuleTemplate: (template: RuleTemplate) => {
      set({ behaviorRules: createDefaultRules(template) })
    },

    // Update a specific behavior rule
    updateBehaviorRule: (ruleId: string, updates: Partial<BehaviorRule>) => {
      set(state => ({
        behaviorRules: state.behaviorRules.map(rule =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        ),
      }))
    },

    // Delete a behavior rule
    deleteBehaviorRule: (ruleId: string) => {
      set(state => ({
        behaviorRules: state.behaviorRules.filter(rule => rule.id !== ruleId),
      }))
    },

    // Add a new behavior rule (with validation)
    addBehaviorRule: (rule: BehaviorRule) => {
      // Runtime validation to catch corrupted data
      if (!isValidBehaviorRule(rule)) {
        console.warn('Attempted to add invalid behavior rule')
        return
      }
      set(state => ({
        behaviorRules: [...state.behaviorRules, rule],
      }))
    },

    // Reorder behavior rules (for drag-and-drop or priority changes)
    reorderBehaviorRules: (rules: BehaviorRule[]) => {
      // Update priorities based on new order
      const reorderedRules = rules.map((rule, index) => ({
        ...rule,
        priority: index + 1,
      }))
      set({ behaviorRules: reorderedRules })
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
