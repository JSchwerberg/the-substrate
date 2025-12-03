/**
 * Shared types for game state slices
 */

import { BehaviorRule } from '@core/models/behavior'

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
