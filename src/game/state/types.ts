/**
 * Shared types for game state slices
 */

import type { BehaviorRule } from '@core/models/behavior'
import type { Campaign } from '@core/models/campaign'
import type { Process } from '@core/models/process'

// ============= Resources =============

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

// ============= Difficulty =============

export type Difficulty = 'easy' | 'normal' | 'hard'

// ============= Upgrades =============

export interface Upgrades {
  maxHealth: number
  attack: number
  defense: number
  startingCycles: number
}

export type UpgradeType = keyof Upgrades

// ============= Persistent Data =============

export interface PersistentData {
  totalData: number
  expeditionsCompleted: number
  expeditionsLost: number
  totalMalwareDestroyed: number
}

// ============= Expedition =============

export interface ExpeditionScore {
  cachesCollected: number
  malwareDestroyed: number
  ticksSurvived: number
}

export type ExpeditionResult = 'active' | 'victory' | 'defeat'

export interface ExpeditionRewards {
  cacheReward: number
  malwareReward: number
  victoryBonus: number
  survivalBonus: number
  totalReward: number
}

// ============= Slice Interfaces =============

/**
 * Behavior rules slice - manages process behavior configuration
 */
export interface BehaviorSlice {
  behaviorRules: BehaviorRule[]
  setBehaviorRules: (rules: BehaviorRule[]) => void
  loadRuleTemplate: (template: import('@core/models/behavior').RuleTemplate) => void
  updateBehaviorRule: (ruleId: string, updates: Partial<BehaviorRule>) => void
  deleteBehaviorRule: (ruleId: string) => void
  addBehaviorRule: (rule: BehaviorRule) => void
  reorderBehaviorRules: (rules: BehaviorRule[]) => void
}

/**
 * Config slice - manages game difficulty settings
 */
export interface ConfigSlice {
  selectedDifficulty: Difficulty
  setDifficulty: (difficulty: Difficulty) => void
}

/**
 * Resource slice - manages resource state and capacity
 */
export interface ResourceSlice {
  resources: Resources
  capacity: ResourceCapacity
  spendResources: (cost: Partial<Resources>) => boolean
  addResources: (amount: Partial<Resources>) => void
}

/**
 * Entity slice - manages processes, malware, and selection
 */
export interface EntitySlice {
  processes: import('@core/models/process').Process[]
  malware: import('@core/models/malware').Malware[]
  selectedProcessId: string | null
  setProcesses: (processes: import('@core/models/process').Process[]) => void
  setMalware: (malware: import('@core/models/malware').Malware[]) => void
  selectProcess: (processId: string | null) => void
  addProcess: (process: import('@core/models/process').Process) => void
  clearEntities: () => void
}

/**
 * Grid slice - manages sector and visibility
 */
export interface GridSlice {
  currentSector: import('@core/models/grid').Sector | null
  setSector: (sector: import('@core/models/grid').Sector | null) => void
  setSectorStatus: (status: 'active' | 'success' | 'failed') => void
  updateGrid: (grid: import('@core/models/grid').Grid) => void
  updateVisibility: () => void
}

/**
 * Expedition slice - manages expedition state and tick
 */
export interface ExpeditionSlice {
  expeditionActive: boolean
  expeditionResult: ExpeditionResult
  expeditionScore: ExpeditionScore
  midExpeditionDeployCount: number
  currentTick: number
  isPaused: boolean
  combatLog: string[]
  startExpedition: () => void
  endExpedition: (result: ExpeditionResult) => void
  setExpeditionResult: (result: ExpeditionResult) => void
  updateScore: (updates: Partial<ExpeditionScore>) => void
  incrementScore: (deltas: Partial<ExpeditionScore>) => void
  incrementDeployCount: () => void
  incrementTick: () => void
  togglePause: () => void
  setPaused: (paused: boolean) => void
  addCombatLog: (entry: string) => void
  setCombatLog: (log: string[]) => void
  resetExpedition: () => void
}

/**
 * Progression slice - manages persistent data and upgrades
 */
export interface ProgressionSlice {
  persistentData: PersistentData
  upgrades: Upgrades
  purchaseUpgrade: (upgradeType: UpgradeType) => boolean
  getUpgradeCost: (upgradeType: UpgradeType) => number
  claimExpeditionRewards: () => ExpeditionRewards
  loadSavedData: () => Promise<void>
  autoSaveProgression: () => Promise<void>
}

/**
 * Campaign slice - manages campaign state and sector navigation
 */
export interface CampaignSlice {
  campaign: Campaign | null
  gameScreen: 'main_menu' | 'campaign_map' | 'expedition'
  startNewCampaign: (difficulty: Difficulty) => void
  selectSector: (sectorId: string) => void
  startSectorExpedition: () => void
  endSectorExpedition: (result: 'victory' | 'defeat') => void
  returnToCampaignMap: () => void
  setGameScreen: (screen: 'main_menu' | 'campaign_map' | 'expedition') => void
  saveSectorState: () => void
  loadSectorState: (sectorId: string) => void
  addToProcessPool: (processes: Process[]) => void
  removeFromProcessPool: (processId: string) => void
  abandonCampaign: () => void
}
