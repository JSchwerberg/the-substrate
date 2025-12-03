import type {
  PersistentData,
  Upgrades,
  Difficulty,
  GameState,
  Resources,
  ResourceCapacity,
  ExpeditionScore,
  ExpeditionResult,
} from '@game/state/gameStore'
import type { BehaviorRule } from '@core/models/behavior'

export function createMockPersistentData(overrides?: Partial<PersistentData>): PersistentData {
  return {
    totalData: 1000,
    expeditionsCompleted: 5,
    expeditionsLost: 2,
    totalMalwareDestroyed: 50,
    ...overrides,
  }
}

export function createMockUpgrades(overrides?: Partial<Upgrades>): Upgrades {
  return {
    maxHealth: 2,
    attack: 1,
    defense: 1,
    startingCycles: 3,
    ...overrides,
  }
}

export function createMockBehaviorRules(): BehaviorRule[] {
  return [
    {
      id: 'rule-1',
      name: 'Aggressive',
      priority: 1,
      condition: { type: 'enemy_in_range', range: 3 },
      action: { type: 'attack_nearest' },
      enabled: true,
    },
    {
      id: 'rule-2',
      name: 'Retreat',
      priority: 2,
      condition: { type: 'health_below', value: 30 },
      action: { type: 'retreat_to_spawn' },
      enabled: true,
    },
  ]
}

export function createMockResources(overrides?: Partial<Resources>): Resources {
  return {
    cycles: 100,
    memory: 50,
    energy: 75,
    ...overrides,
  }
}

export function createMockCapacity(overrides?: Partial<ResourceCapacity>): ResourceCapacity {
  return {
    maxCycles: 200,
    maxMemory: 100,
    maxEnergy: 100,
    ...overrides,
  }
}

export function createMockExpeditionScore(overrides?: Partial<ExpeditionScore>): ExpeditionScore {
  return {
    cachesCollected: 5,
    malwareDestroyed: 10,
    ticksSurvived: 50,
    ...overrides,
  }
}

/**
 * Creates a serializable mock GameState for testing persistence.
 * NOTE: This only includes serializable data fields, not action functions.
 * The real GameState has action functions, but IndexedDB can only store
 * serializable data. The SaveManager should only be storing the data fields.
 */
export function createMockSerializableState(overrides?: Record<string, unknown>) {
  return {
    resources: createMockResources(),
    capacity: createMockCapacity(),
    currentSector: null,
    expeditionActive: false,
    expeditionResult: 'active' as ExpeditionResult,
    expeditionScore: createMockExpeditionScore(),
    midExpeditionDeployCount: 0,
    processes: [],
    malware: [],
    selectedProcessId: null,
    currentTick: 25,
    isPaused: true,
    combatLog: ['Test log entry 1', 'Test log entry 2'],
    persistentData: createMockPersistentData(),
    upgrades: createMockUpgrades(),
    selectedDifficulty: 'normal' as Difficulty,
    behaviorRules: createMockBehaviorRules(),
    ...overrides,
  }
}

/**
 * Creates a full mock GameState including action stubs for type compatibility.
 * Use createMockSerializableState for persistence tests.
 */
export function createMockGameState(overrides?: Partial<GameState>): GameState {
  const serializableState = createMockSerializableState(overrides as Record<string, unknown>)

  // Add action stubs for type compatibility
  return {
    ...serializableState,
    // Orchestration actions
    generateNewSector: () => {},
    deployProcess: () => {},
    moveSelectedProcess: () => {},
    tick: () => {},
    executeIntervention: () => false,
    // Resource slice
    spendResources: () => false,
    addResources: () => {},
    // Config slice
    setDifficulty: () => {},
    // Behavior slice
    setBehaviorRules: () => {},
    loadRuleTemplate: () => {},
    updateBehaviorRule: () => {},
    deleteBehaviorRule: () => {},
    addBehaviorRule: () => {},
    reorderBehaviorRules: () => {},
    // Entity slice
    setProcesses: () => {},
    setMalware: () => {},
    selectProcess: () => {},
    addProcess: () => {},
    clearEntities: () => {},
    // Grid slice
    setSector: () => {},
    setSectorStatus: () => {},
    updateGrid: () => {},
    updateVisibility: () => {},
    // Expedition slice
    startExpedition: () => {},
    endExpedition: () => {},
    setExpeditionResult: () => {},
    updateScore: () => {},
    incrementScore: () => {},
    incrementDeployCount: () => {},
    incrementTick: () => {},
    togglePause: () => {},
    setPaused: () => {},
    addCombatLog: () => {},
    setCombatLog: () => {},
    resetExpedition: () => {},
    // Progression slice
    purchaseUpgrade: () => false,
    getUpgradeCost: () => 0,
    claimExpeditionRewards: () => ({
      cacheReward: 0,
      malwareReward: 0,
      victoryBonus: 0,
      survivalBonus: 0,
      totalReward: 0,
    }),
    loadSavedData: async () => {},
    autoSaveProgression: async () => {},
  } as GameState
}
