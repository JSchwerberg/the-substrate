/**
 * Main game state store using Zustand
 *
 * This store composes domain slices and provides orchestration methods
 * that coordinate across multiple slices.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { GridPosition, getTile } from '@core/models/grid'
import { ProcessArchetype, createProcess } from '@core/models/process'
import { MalwareType, createMalware } from '@core/models/malware'
import { generateSector, GeneratorOptions } from '@core/generation/SectorGenerator'
import { revealSpawnArea, revealArea } from '@core/systems/FogOfWar'
import { setMovementTarget } from '@core/systems/MovementSystem'
import { findPath } from '@core/systems/Pathfinding'
import { executeTick } from '@core/systems/TickSystem'
import { isValidArchetype, isValidSpawnIndex } from '@game/validation'
import {
  DEPLOY_COST,
  ENERGY_DEPLOYMENT_COSTS,
  ENERGY_REGEN_PER_TICK,
  MEMORY_COST,
  UPGRADES,
  DIFFICULTY,
  INTERVENTIONS,
} from '@core/constants/GameConfig'
import type { InterventionType } from '@core/constants/GameConfig'

// Import slices
import { createBehaviorSlice } from './slices/behaviorSlice'
import { createConfigSlice } from './slices/configSlice'
import { createResourceSlice, getInitialResources } from './slices/resourceSlice'
import { createEntitySlice } from './slices/entitySlice'
import { createGridSlice } from './slices/gridSlice'
import { createExpeditionSlice } from './slices/expeditionSlice'
import { createProgressionSlice, UPGRADE_COSTS } from './slices/progressionSlice'
import { createCampaignSlice } from './slices/campaignSlice'

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
  EntitySlice,
  GridSlice,
  ExpeditionSlice,
  ProgressionSlice,
  CampaignSlice,
} from './types'

// Re-export upgrade costs for backward compatibility
export { UPGRADE_COSTS }

// Re-export rewards from config for backward compatibility
export { REWARDS } from '@core/constants/GameConfig'

// Import types for use in GameState interface
import type {
  Resources,
  BehaviorSlice,
  ConfigSlice,
  ResourceSlice,
  EntitySlice,
  GridSlice,
  ExpeditionSlice,
  ProgressionSlice,
  CampaignSlice,
} from './types'

// ============= Deployment Costs =============

export const DEPLOYMENT_COSTS: Record<ProcessArchetype, Partial<Resources>> = {
  scout: { cycles: DEPLOY_COST.SCOUT },
  purifier: { cycles: DEPLOY_COST.PURIFIER },
}

// ============= Memory Capacity Helpers =============

import type { Process } from '@core/models/process'

/** Get memory cost for a process archetype */
export function getMemoryCost(archetype: ProcessArchetype): number {
  return archetype === 'scout' ? MEMORY_COST.SCOUT : MEMORY_COST.PURIFIER
}

/** Calculate total memory used by alive processes */
export function calculateUsedMemory(processes: Process[]): number {
  return processes
    .filter(p => p.status !== 'destroyed')
    .reduce((sum, p) => sum + getMemoryCost(p.archetype), 0)
}

// ============= Orchestration Interface =============

/**
 * Orchestration actions that coordinate across multiple slices
 */
interface OrchestrationActions {
  generateNewSector: (options: GeneratorOptions) => void
  deployProcess: (archetype: ProcessArchetype, spawnIndex: number) => void
  deployFromPool: (processId: string, spawnIndex: number) => void
  moveSelectedProcess: (target: GridPosition) => void
  tick: () => void
  executeIntervention: (type: InterventionType) => boolean
}

// ============= Game State =============

export interface GameState
  extends
    BehaviorSlice,
    ConfigSlice,
    ResourceSlice,
    EntitySlice,
    GridSlice,
    ExpeditionSlice,
    ProgressionSlice,
    CampaignSlice,
    OrchestrationActions {}

// ============= Store =============

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Compose all slices
    ...createBehaviorSlice(set, get, undefined as never),
    ...createConfigSlice(set, get, undefined as never),
    ...createResourceSlice(set, get, undefined as never),
    ...createEntitySlice(set, get, undefined as never),
    ...createGridSlice(set, get, undefined as never),
    ...createExpeditionSlice(set, get, undefined as never),
    ...createProgressionSlice(set, get, undefined as never),
    ...createCampaignSlice(set, get, undefined as never),

    // ============= Orchestration Methods =============

    // Generate a new sector - orchestrates grid, entity, expedition, and resource slices
    generateNewSector: (options: GeneratorOptions) => {
      const { upgrades, selectedDifficulty } = get()

      // Apply difficulty multiplier to malware density
      const malwareMultiplier = DIFFICULTY.MALWARE_MULTIPLIER[selectedDifficulty]

      const sector = generateSector(options)

      // Reveal spawn area initially
      revealSpawnArea(sector.grid, sector.spawnPoints)

      // Spawn some malware based on difficulty
      const malwareList = []
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

      // Reset all relevant slices
      get().setSector(sector)
      get().setMalware(malwareList)
      get().setProcesses([])
      get().selectProcess(null)
      get().resetExpedition()
      set({ resources: getInitialResources(upgrades) })

      // Force initial visibility update
      get().updateVisibility()
    },

    // Deploy a process - orchestrates entity, resource, and expedition slices
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

      // Check memory capacity
      const { capacity } = get()
      const usedMemory = calculateUsedMemory(processes)
      const memoryCost = getMemoryCost(archetype)
      if (usedMemory + memoryCost > capacity.maxMemory) {
        console.warn(`Insufficient memory: ${usedMemory}/${capacity.maxMemory}, need ${memoryCost}`)
        return
      }

      // Calculate deployment cost based on expedition status
      let cost: Partial<Resources>

      if (expeditionActive) {
        // Mid-expedition: use energy with exponential scaling
        const baseEnergyCost =
          archetype === 'scout' ? ENERGY_DEPLOYMENT_COSTS.SCOUT : ENERGY_DEPLOYMENT_COSTS.PURIFIER
        const scaledEnergyCost = Math.floor(
          baseEnergyCost *
            Math.pow(ENERGY_DEPLOYMENT_COSTS.SCALING_MULTIPLIER, midExpeditionDeployCount)
        )
        cost = { energy: scaledEnergyCost }
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

      // Update entity slice
      get().addProcess(process)

      // Update expedition slice
      if (expeditionActive) {
        get().incrementDeployCount()
      } else {
        // Auto-start expedition when first process deployed
        get().startExpedition()
      }

      get().updateVisibility()
    },

    // Deploy a process from the campaign pool - FREE (reward for keeping processes alive)
    deployFromPool: (processId: string, spawnIndex: number) => {
      const { campaign, currentSector, processes } = get()
      if (!campaign || !currentSector) {
        console.warn('Cannot deploy from pool: no active campaign or sector')
        return
      }

      // Find process in pool
      const poolProcess = campaign.processPool.find(p => p.id === processId)
      if (!poolProcess) {
        console.warn(`Process ${processId} not found in pool`)
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
      if (occupied) {
        console.warn('Spawn point is occupied')
        return
      }

      // Check memory capacity
      const { capacity } = get()
      const usedMemory = calculateUsedMemory(processes)
      const memoryCost = getMemoryCost(poolProcess.archetype)
      if (usedMemory + memoryCost > capacity.maxMemory) {
        console.warn(`Insufficient memory: ${usedMemory}/${capacity.maxMemory}, need ${memoryCost}`)
        return
      }

      // Remove from pool
      get().removeFromProcessPool(processId)

      // Update position to spawn point
      const deployedProcess: Process = {
        ...poolProcess,
        position: { ...spawnPoint },
        targetPosition: null,
        path: [],
        pathIndex: 0,
        status: 'idle',
      }

      // Add to active processes
      get().addProcess(deployedProcess)

      // Update visibility
      get().updateVisibility()
    },

    // Move selected process to target
    moveSelectedProcess: (target: GridPosition) => {
      const { selectedProcessId, processes, currentSector } = get()
      if (!selectedProcessId || !currentSector) return

      const process = processes.find(p => p.id === selectedProcessId)
      if (!process) return

      const success = setMovementTarget(process, target, currentSector.grid)
      if (success) {
        get().setProcesses([...processes])
      }
    },

    // Game tick - orchestrates all game systems
    tick: () => {
      const {
        processes,
        malware,
        currentSector,
        isPaused,
        expeditionActive,
        expeditionResult,
        combatLog,
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

      // Update grid slice
      get().updateGrid(result.grid)

      // Update entity slice
      get().setProcesses(result.processes)
      get().setMalware(result.malware)

      // Update expedition slice
      get().incrementTick()
      get().setExpeditionResult(result.expeditionResult)
      get().incrementScore({
        cachesCollected: result.cachesCollected,
        malwareDestroyed: result.malwareDestroyed,
        ticksSurvived: 1,
      })
      get().setCombatLog(result.combatLog)

      // Only auto-pause on defeat
      if (result.expeditionResult === 'defeat') {
        get().setPaused(true)
      }

      get().updateVisibility()
    },

    // Execute an intervention - costs energy, requires selected process
    executeIntervention: (type: InterventionType): boolean => {
      const { selectedProcessId, processes, currentSector, expeditionActive, resources } = get()

      // Must be in active expedition with a selected process
      if (!expeditionActive || !selectedProcessId || !currentSector) {
        return false
      }

      const process = processes.find(p => p.id === selectedProcessId)
      if (!process || process.status === 'destroyed') {
        return false
      }

      const intervention = INTERVENTIONS[type]
      const cost = intervention.cost

      // Check if we can afford
      if (resources.energy < cost) {
        return false
      }

      // Deduct energy cost
      get().spendResources({ energy: cost })

      // Execute the intervention
      if (type === 'SCAN') {
        // Reveal area around selected process
        revealArea(currentSector.grid, process.position, INTERVENTIONS.SCAN.radius)
        get().updateVisibility()
        get().addCombatLog(`[SCAN] Revealed area around ${process.archetype}`)
      } else if (type === 'RETREAT') {
        // Find nearest spawn point and set as movement target
        const spawnPoints = currentSector.spawnPoints
        let nearestSpawn: GridPosition | null = null
        let nearestDistance = Infinity

        for (const spawn of spawnPoints) {
          const path = findPath(currentSector.grid, process.position, spawn)
          if (path && path.length < nearestDistance) {
            nearestDistance = path.length
            nearestSpawn = spawn
          }
        }

        if (nearestSpawn) {
          setMovementTarget(process, nearestSpawn, currentSector.grid)
          get().setProcesses([...processes])
          get().addCombatLog(`[RETREAT] ${process.archetype} retreating to spawn`)
        }
      }

      return true
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
export const selectProcessPool = (state: GameState) => state.campaign?.processPool ?? []
