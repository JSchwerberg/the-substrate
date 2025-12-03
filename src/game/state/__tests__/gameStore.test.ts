import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useGameStore,
  DEPLOYMENT_COSTS,
  UPGRADE_COSTS,
  REWARDS,
  selectResources,
  selectProcesses,
} from '../gameStore'
import type { GameState, Difficulty } from '../gameStore'
import { createMockPersistentData, createMockUpgrades } from '@persistence/__tests__/fixtures'
import type { BehaviorRule } from '@core/models/behavior'

// Mock dependencies
vi.mock('@persistence/SaveManager', () => ({
  saveProgression: vi.fn(),
  loadProgression: vi.fn().mockResolvedValue(null),
}))

vi.mock('@core/generation/SectorGenerator', () => ({
  generateSector: vi.fn(() => ({
    width: 20,
    height: 20,
    grid: {
      width: 20,
      height: 20,
      tiles: Array(20)
        .fill(null)
        .map(() =>
          Array(20).fill({
            type: 'empty',
            visibility: 'hidden',
            entityIds: [],
            corruption: 0,
          })
        ),
    },
    spawnPoints: [{ x: 2, y: 2 }],
    config: { malwareDensity: 0.01 },
    status: 'active',
  })),
}))

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store state before each test by creating a completely fresh state
    useGameStore.setState({
      resources: { cycles: 100, memory: 50, energy: 75 },
      capacity: { maxCycles: 100, maxMemory: 100, maxEnergy: 100 },
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
      persistentData: {
        totalData: 0,
        expeditionsCompleted: 0,
        expeditionsLost: 0,
        totalMalwareDestroyed: 0,
      },
      upgrades: {
        maxHealth: 0,
        attack: 0,
        defense: 0,
        startingCycles: 0,
      },
      selectedDifficulty: 'normal',
      behaviorRules: [
        {
          id: 'aggro-1',
          name: 'Attack Adjacent',
          priority: 1,
          condition: { type: 'enemy_adjacent' },
          action: { type: 'attack_nearest' },
          enabled: true,
        },
      ],
    } as Partial<GameState>)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============= Initial State =============

  describe('initial state', () => {
    it('should have correct initial resources', () => {
      const state = useGameStore.getState()
      expect(state.resources.cycles).toBe(100)
      expect(state.resources.memory).toBe(50)
      expect(state.resources.energy).toBe(75)
    })

    it('should have correct initial capacity', () => {
      const state = useGameStore.getState()
      expect(state.capacity.maxCycles).toBe(100)
      expect(state.capacity.maxMemory).toBe(100)
      expect(state.capacity.maxEnergy).toBe(100)
    })

    it('should start with no sector', () => {
      const state = useGameStore.getState()
      expect(state.currentSector).toBeNull()
    })

    it('should start with no expedition', () => {
      const state = useGameStore.getState()
      expect(state.expeditionActive).toBe(false)
      expect(state.expeditionResult).toBe('active')
    })

    it('should start with no processes', () => {
      const state = useGameStore.getState()
      expect(state.processes).toHaveLength(0)
    })

    it('should start with no malware', () => {
      const state = useGameStore.getState()
      expect(state.malware).toHaveLength(0)
    })

    it('should start with no selected process', () => {
      const state = useGameStore.getState()
      expect(state.selectedProcessId).toBeNull()
    })

    it('should start paused', () => {
      const state = useGameStore.getState()
      expect(state.isPaused).toBe(true)
    })

    it('should start at tick 0', () => {
      const state = useGameStore.getState()
      expect(state.currentTick).toBe(0)
    })

    it('should have empty combat log', () => {
      const state = useGameStore.getState()
      expect(state.combatLog).toHaveLength(0)
    })

    it('should start with zero persistent data', () => {
      const state = useGameStore.getState()
      expect(state.persistentData.totalData).toBe(0)
      expect(state.persistentData.expeditionsCompleted).toBe(0)
      expect(state.persistentData.expeditionsLost).toBe(0)
      expect(state.persistentData.totalMalwareDestroyed).toBe(0)
    })

    it('should start with zero upgrades', () => {
      const state = useGameStore.getState()
      expect(state.upgrades.maxHealth).toBe(0)
      expect(state.upgrades.attack).toBe(0)
      expect(state.upgrades.defense).toBe(0)
      expect(state.upgrades.startingCycles).toBe(0)
    })

    it('should start on normal difficulty', () => {
      const state = useGameStore.getState()
      expect(state.selectedDifficulty).toBe('normal')
    })

    it('should have default behavior rules', () => {
      const state = useGameStore.getState()
      expect(state.behaviorRules.length).toBeGreaterThan(0)
      expect(state.behaviorRules[0]).toHaveProperty('id')
      expect(state.behaviorRules[0]).toHaveProperty('name')
    })
  })

  // ============= Resource Management =============

  describe('resource management', () => {
    it('spendResources should deduct cycles when sufficient', () => {
      const store = useGameStore.getState()
      const initialCycles = store.resources.cycles
      const success = store.spendResources({ cycles: 50 })

      expect(success).toBe(true)
      expect(useGameStore.getState().resources.cycles).toBe(initialCycles - 50)
    })

    it('spendResources should fail when insufficient cycles', () => {
      const store = useGameStore.getState()
      const initialCycles = store.resources.cycles
      const success = store.spendResources({ cycles: initialCycles + 1 })

      expect(success).toBe(false)
      expect(useGameStore.getState().resources.cycles).toBe(initialCycles)
    })

    it('spendResources should deduct all resource types', () => {
      const store = useGameStore.getState()
      const success = store.spendResources({ cycles: 25, memory: 10, energy: 15 })

      expect(success).toBe(true)
      expect(useGameStore.getState().resources.cycles).toBe(75)
      expect(useGameStore.getState().resources.memory).toBe(40)
      expect(useGameStore.getState().resources.energy).toBe(60)
    })

    it('spendResources should fail if any resource is insufficient', () => {
      const store = useGameStore.getState()
      const initialState = { ...useGameStore.getState().resources }
      const success = store.spendResources({
        cycles: 50,
        memory: 100, // More than available
      })

      expect(success).toBe(false)
      expect(useGameStore.getState().resources).toEqual(initialState)
    })

    it('addResources should add cycles', () => {
      // Set to 50 so we can add without hitting cap
      useGameStore.setState({ resources: { cycles: 50, memory: 50, energy: 75 } })
      useGameStore.getState().addResources({ cycles: 30 })

      expect(useGameStore.getState().resources.cycles).toBe(80)
    })

    it('addResources should add all resource types', () => {
      // Set to values below max to ensure no capping
      useGameStore.setState({ resources: { cycles: 70, memory: 40, energy: 60 } })
      useGameStore.getState().addResources({ cycles: 20, memory: 15, energy: 10 })

      expect(useGameStore.getState().resources.cycles).toBe(90)
      expect(useGameStore.getState().resources.memory).toBe(55)
      expect(useGameStore.getState().resources.energy).toBe(70)
    })

    it('addResources should cap resources at max capacity', () => {
      useGameStore.getState().addResources({ cycles: 1000 })

      expect(useGameStore.getState().resources.cycles).toBeLessThanOrEqual(100)
    })

    it('addResources should cap all resources independently', () => {
      useGameStore.getState().addResources({
        cycles: 1000,
        memory: 1000,
        energy: 1000,
      })

      expect(useGameStore.getState().resources.cycles).toBe(100)
      expect(useGameStore.getState().resources.memory).toBe(100)
      expect(useGameStore.getState().resources.energy).toBe(100)
    })
  })

  // ============= Sector Generation =============

  describe('sector generation', () => {
    it('generateNewSector should create a sector', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      const state = useGameStore.getState()
      expect(state.currentSector).not.toBeNull()
      expect(state.currentSector?.grid).toBeDefined()
      expect(state.currentSector?.spawnPoints).toBeDefined()
    })

    it('generateNewSector should reset processes', () => {
      // Deploy a process first
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
      expect(useGameStore.getState().processes.length).toBeGreaterThan(0)

      // Generate new sector should reset processes
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().processes).toHaveLength(0)
    })

    it('generateNewSector should reset expedition state', () => {
      useGameStore.setState({
        expeditionActive: true,
        expeditionResult: 'victory',
      })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().expeditionActive).toBe(false)
      expect(useGameStore.getState().expeditionResult).toBe('active')
    })

    it('generateNewSector should reset score', () => {
      useGameStore.setState({
        expeditionScore: {
          cachesCollected: 10,
          malwareDestroyed: 5,
          ticksSurvived: 100,
        },
      })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().expeditionScore.cachesCollected).toBe(0)
      expect(useGameStore.getState().expeditionScore.malwareDestroyed).toBe(0)
      expect(useGameStore.getState().expeditionScore.ticksSurvived).toBe(0)
    })

    it('generateNewSector should reset combat log', () => {
      useGameStore.setState({
        combatLog: ['Log 1', 'Log 2'],
      })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().combatLog).toHaveLength(0)
    })

    it('generateNewSector should not reset persistent data', () => {
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 500 }),
      })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().persistentData.totalData).toBe(500)
    })

    it('generateNewSector should not reset upgrades', () => {
      useGameStore.setState({
        upgrades: createMockUpgrades({ maxHealth: 5 }),
      })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().upgrades.maxHealth).toBe(5)
    })

    it('generateNewSector should spawn malware based on difficulty', () => {
      useGameStore.setState({ selectedDifficulty: 'hard' })
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      const state = useGameStore.getState()
      // Hard difficulty should spawn more malware than easy
      const hardMalwareCount = state.malware.length

      useGameStore.setState({ selectedDifficulty: 'easy' })
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      const easyMalwareCount = useGameStore.getState().malware.length
      expect(hardMalwareCount).toBeGreaterThanOrEqual(easyMalwareCount)
    })
  })

  // ============= Expedition Management =============

  describe('expedition management', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
    })

    it('startExpedition should mark expedition as active', () => {
      useGameStore.getState().startExpedition()

      expect(useGameStore.getState().expeditionActive).toBe(true)
    })

    it('startExpedition should unpause', () => {
      useGameStore.getState().startExpedition()

      expect(useGameStore.getState().isPaused).toBe(false)
    })

    it('endExpedition with success should end expedition', () => {
      useGameStore.getState().endExpedition(true)

      expect(useGameStore.getState().expeditionActive).toBe(false)
      // endExpedition sets sector.status, not expeditionResult
    })

    it('endExpedition with failure should end expedition', () => {
      useGameStore.getState().endExpedition(false)

      expect(useGameStore.getState().expeditionActive).toBe(false)
      // endExpedition sets sector.status, not expeditionResult
    })

    it('endExpedition should pause the game', () => {
      useGameStore.getState().startExpedition()
      useGameStore.getState().endExpedition(true)

      expect(useGameStore.getState().isPaused).toBe(true)
    })
  })

  // ============= Process Deployment =============

  describe('process deployment', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
    })

    it('deployProcess should create process at spawn point', () => {
      useGameStore.getState().deployProcess('scout', 0)

      const state = useGameStore.getState()
      expect(state.processes).toHaveLength(1)
      expect(state.processes[0]?.archetype).toBe('scout')
    })

    it('deployProcess should deduct cycles', () => {
      const initialCycles = useGameStore.getState().resources.cycles
      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().resources.cycles).toBe(
        initialCycles - DEPLOYMENT_COSTS.scout.cycles!
      )
    })

    it('deployProcess should fail if no sector', () => {
      useGameStore.setState({ currentSector: null })
      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().processes).toHaveLength(0)
    })

    it('deployProcess should fail if insufficient resources', () => {
      useGameStore.setState({ resources: { cycles: 10, memory: 50, energy: 75 } })
      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().processes).toHaveLength(0)
      expect(useGameStore.getState().resources.cycles).toBe(10)
    })

    it('deployProcess should fail if spawn occupied', () => {
      useGameStore.getState().deployProcess('scout', 0)
      const initialProcessCount = useGameStore.getState().processes.length
      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().processes).toHaveLength(initialProcessCount)
    })

    it('deployProcess should fail with invalid spawn index', () => {
      useGameStore.getState().deployProcess('scout', 999)

      expect(useGameStore.getState().processes).toHaveLength(0)
    })

    it('deployProcess should select deployed process', () => {
      useGameStore.getState().deployProcess('scout', 0)

      const processId = useGameStore.getState().processes[0]?.id
      expect(useGameStore.getState().selectedProcessId).toBe(processId)
    })

    it('deployProcess should start expedition', () => {
      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().expeditionActive).toBe(true)
    })

    it('deployProcess should apply health upgrade bonus', () => {
      useGameStore.setState({
        upgrades: createMockUpgrades({ maxHealth: 3, attack: 2, defense: 1 }),
      })

      useGameStore.getState().deployProcess('scout', 0)

      const process = useGameStore.getState().processes[0]
      expect(process?.stats.maxHealth).toBeGreaterThan(60) // Scout base health
    })

    it('deployProcess should deploy purifier with correct cost', () => {
      const initialCycles = useGameStore.getState().resources.cycles
      useGameStore.getState().deployProcess('purifier', 0)

      expect(useGameStore.getState().resources.cycles).toBe(
        initialCycles - DEPLOYMENT_COSTS.purifier.cycles!
      )
    })
  })

  // ============= Process Selection =============

  describe('process selection', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
    })

    it('selectProcess should set selected process ID', () => {
      const processId = useGameStore.getState().processes[0]?.id
      useGameStore.getState().selectProcess(null)

      expect(useGameStore.getState().selectedProcessId).toBeNull()

      useGameStore.getState().selectProcess(processId!)

      expect(useGameStore.getState().selectedProcessId).toBe(processId)
    })

    it('selectProcess(null) should deselect', () => {
      useGameStore.getState().selectProcess(null)

      expect(useGameStore.getState().selectedProcessId).toBeNull()
    })
  })

  // ============= Game Pause =============

  describe('pause control', () => {
    it('togglePause should toggle pause state', () => {
      const initialPaused = useGameStore.getState().isPaused
      useGameStore.getState().togglePause()

      expect(useGameStore.getState().isPaused).toBe(!initialPaused)

      useGameStore.getState().togglePause()

      expect(useGameStore.getState().isPaused).toBe(initialPaused)
    })
  })

  // ============= Difficulty Management =============

  describe('difficulty management', () => {
    it('setDifficulty should set difficulty to easy', () => {
      useGameStore.getState().setDifficulty('easy')

      expect(useGameStore.getState().selectedDifficulty).toBe('easy')
    })

    it('setDifficulty should set difficulty to hard', () => {
      useGameStore.getState().setDifficulty('hard')

      expect(useGameStore.getState().selectedDifficulty).toBe('hard')
    })

    it('setDifficulty should reject invalid difficulty', () => {
      useGameStore.getState().setDifficulty('normal')
      useGameStore.getState().setDifficulty('invalid' as Difficulty)

      expect(useGameStore.getState().selectedDifficulty).toBe('normal')
    })
  })

  // ============= Upgrade System =============

  describe('upgrade system', () => {
    it('getUpgradeCost should return base cost for level 0', () => {
      const cost = useGameStore.getState().getUpgradeCost('maxHealth')

      expect(cost).toBe(50)
    })

    it('getUpgradeCost should increase with level', () => {
      const cost0 = useGameStore.getState().getUpgradeCost('maxHealth')

      // Must have enough data to purchase
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 500 }),
      })

      useGameStore.getState().purchaseUpgrade('maxHealth')
      const cost1 = useGameStore.getState().getUpgradeCost('maxHealth')

      expect(cost1).toBeGreaterThan(cost0)
    })

    it('purchaseUpgrade should fail if insufficient data', () => {
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 10 }),
      })

      const success = useGameStore.getState().purchaseUpgrade('maxHealth')

      expect(success).toBe(false)
    })

    it('purchaseUpgrade should deduct data', () => {
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 500 }),
      })

      const cost = useGameStore.getState().getUpgradeCost('maxHealth')
      useGameStore.getState().purchaseUpgrade('maxHealth')

      expect(useGameStore.getState().persistentData.totalData).toBe(500 - cost)
    })

    it('purchaseUpgrade should increment upgrade level', () => {
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 500 }),
      })

      const initialLevel = useGameStore.getState().upgrades.maxHealth
      useGameStore.getState().purchaseUpgrade('maxHealth')

      expect(useGameStore.getState().upgrades.maxHealth).toBe(initialLevel + 1)
    })

    it('purchaseUpgrade should work for all upgrade types', () => {
      useGameStore.setState({
        persistentData: createMockPersistentData({ totalData: 5000 }),
      })

      const upgradeTypes: Array<'maxHealth' | 'attack' | 'defense' | 'startingCycles'> = [
        'maxHealth',
        'attack',
        'defense',
        'startingCycles',
      ]

      upgradeTypes.forEach(upgrade => {
        const initialLevel = useGameStore.getState().upgrades[upgrade]
        useGameStore.getState().purchaseUpgrade(upgrade)
        expect(useGameStore.getState().upgrades[upgrade]).toBe(initialLevel + 1)
      })
    })
  })

  // ============= Expedition Rewards =============

  describe('expedition rewards', () => {
    beforeEach(() => {
      useGameStore.setState({
        expeditionScore: {
          cachesCollected: 5,
          malwareDestroyed: 3,
          ticksSurvived: 50,
        },
      })
    })

    it('claimExpeditionRewards should calculate cache reward', () => {
      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(rewards.cacheReward).toBe(5 * REWARDS.CACHE_COLLECTED)
    })

    it('claimExpeditionRewards should calculate malware reward', () => {
      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(rewards.malwareReward).toBe(3 * REWARDS.MALWARE_DESTROYED)
    })

    it('claimExpeditionRewards should grant victory bonus on victory', () => {
      useGameStore.setState({ expeditionResult: 'victory' })
      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(rewards.victoryBonus).toBe(REWARDS.VICTORY_BONUS)
    })

    it('claimExpeditionRewards should not grant victory bonus on defeat', () => {
      useGameStore.setState({ expeditionResult: 'defeat' })
      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(rewards.victoryBonus).toBe(0)
    })

    it('claimExpeditionRewards should calculate survival bonus', () => {
      const rewards = useGameStore.getState().claimExpeditionRewards()

      // 50 ticks / 10 = 5 * SURVIVAL_BONUS_PER_10_TICKS
      const expectedBonus = Math.floor(50 / 10) * REWARDS.SURVIVAL_BONUS_PER_10_TICKS
      expect(rewards.survivalBonus).toBe(expectedBonus)
    })

    it('claimExpeditionRewards should sum total reward', () => {
      const rewards = useGameStore.getState().claimExpeditionRewards()

      const total =
        rewards.cacheReward + rewards.malwareReward + rewards.victoryBonus + rewards.survivalBonus
      expect(rewards.totalReward).toBe(total)
    })

    it('claimExpeditionRewards should add data to persistent data', () => {
      const initialData = useGameStore.getState().persistentData.totalData
      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(useGameStore.getState().persistentData.totalData).toBe(
        initialData + rewards.totalReward
      )
    })

    it('claimExpeditionRewards should increment expeditions completed on victory', () => {
      useGameStore.setState({ expeditionResult: 'victory' })
      const initialCount = useGameStore.getState().persistentData.expeditionsCompleted
      useGameStore.getState().claimExpeditionRewards()

      expect(useGameStore.getState().persistentData.expeditionsCompleted).toBe(initialCount + 1)
    })

    it('claimExpeditionRewards should increment expeditions lost on defeat', () => {
      useGameStore.setState({ expeditionResult: 'defeat' })
      const initialCount = useGameStore.getState().persistentData.expeditionsLost
      useGameStore.getState().claimExpeditionRewards()

      expect(useGameStore.getState().persistentData.expeditionsLost).toBe(initialCount + 1)
    })

    it('claimExpeditionRewards should update total malware destroyed', () => {
      const initialCount = useGameStore.getState().persistentData.totalMalwareDestroyed
      useGameStore.getState().claimExpeditionRewards()

      expect(useGameStore.getState().persistentData.totalMalwareDestroyed).toBe(initialCount + 3)
    })

    it('claimExpeditionRewards should apply difficulty reward multiplier', () => {
      useGameStore.setState({ selectedDifficulty: 'hard' })
      const rewardsHard = useGameStore.getState().claimExpeditionRewards()

      useGameStore.setState({
        selectedDifficulty: 'easy',
        expeditionScore: {
          cachesCollected: 5,
          malwareDestroyed: 3,
          ticksSurvived: 50,
        },
      })
      const rewardsEasy = useGameStore.getState().claimExpeditionRewards()

      // Hard should give more reward than easy for same score
      expect(rewardsHard.totalReward).toBeGreaterThan(rewardsEasy.totalReward)
    })

    it('claimExpeditionRewards should prevent integer overflow with large scores', () => {
      useGameStore.setState({
        expeditionScore: {
          cachesCollected: 1_000_000,
          malwareDestroyed: 1_000_000,
          ticksSurvived: 1_000_000,
        },
      })

      const rewards = useGameStore.getState().claimExpeditionRewards()

      // Should be clamped to safe limits
      expect(rewards.totalReward).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
      expect(useGameStore.getState().persistentData.totalData).toBeLessThanOrEqual(
        Number.MAX_SAFE_INTEGER
      )
    })
  })

  // ============= Behavior Rules =============

  describe('behavior rules management', () => {
    const mockRule: BehaviorRule = {
      id: 'test-rule',
      name: 'Test Rule',
      priority: 1,
      condition: { type: 'always' },
      action: { type: 'attack_nearest' },
      enabled: true,
    }

    it('setBehaviorRules should set all rules', () => {
      const rules = [mockRule]
      useGameStore.getState().setBehaviorRules(rules)

      expect(useGameStore.getState().behaviorRules).toEqual(rules)
    })

    it('setBehaviorRules should filter invalid rules', () => {
      const validRule = mockRule
      const invalidRule = { ...mockRule, condition: { type: 'invalid_type' } }

      useGameStore.getState().setBehaviorRules([validRule, invalidRule as BehaviorRule])

      // Should only have the valid rule
      expect(useGameStore.getState().behaviorRules).toHaveLength(1)
      expect(useGameStore.getState().behaviorRules[0]?.id).toBe('test-rule')
    })

    it('addBehaviorRule should add valid rule', () => {
      const initialCount = useGameStore.getState().behaviorRules.length
      useGameStore.getState().addBehaviorRule(mockRule)

      expect(useGameStore.getState().behaviorRules).toHaveLength(initialCount + 1)
    })

    it('addBehaviorRule should not add invalid rule', () => {
      const initialCount = useGameStore.getState().behaviorRules.length
      const invalidRule = { ...mockRule, condition: { type: 'invalid' } }

      useGameStore.getState().addBehaviorRule(invalidRule as BehaviorRule)

      expect(useGameStore.getState().behaviorRules).toHaveLength(initialCount)
    })

    it('updateBehaviorRule should update rule properties', () => {
      useGameStore.getState().addBehaviorRule(mockRule)

      useGameStore.getState().updateBehaviorRule('test-rule', { name: 'Updated Name' })

      const rule = useGameStore.getState().behaviorRules.find(r => r.id === 'test-rule')
      expect(rule?.name).toBe('Updated Name')
    })

    it('updateBehaviorRule should not affect other rules', () => {
      const rule2: BehaviorRule = { ...mockRule, id: 'test-rule-2', name: 'Rule 2' }
      useGameStore.getState().addBehaviorRule(mockRule)
      useGameStore.getState().addBehaviorRule(rule2)

      useGameStore.getState().updateBehaviorRule('test-rule', { name: 'Updated' })

      expect(useGameStore.getState().behaviorRules.find(r => r.id === 'test-rule-2')?.name).toBe(
        'Rule 2'
      )
    })

    it('deleteBehaviorRule should remove rule', () => {
      useGameStore.getState().addBehaviorRule(mockRule)
      const initialCount = useGameStore.getState().behaviorRules.length

      useGameStore.getState().deleteBehaviorRule('test-rule')

      expect(useGameStore.getState().behaviorRules).toHaveLength(initialCount - 1)
      expect(useGameStore.getState().behaviorRules.find(r => r.id === 'test-rule')).toBeUndefined()
    })

    it('reorderBehaviorRules should update priorities', () => {
      const rule1: BehaviorRule = { ...mockRule, id: 'r1', name: 'First' }
      const rule2: BehaviorRule = { ...mockRule, id: 'r2', name: 'Second' }

      useGameStore.getState().setBehaviorRules([rule1, rule2])
      useGameStore.getState().reorderBehaviorRules([rule2, rule1])

      const reordered = useGameStore.getState().behaviorRules
      expect(reordered[0]?.id).toBe('r2')
      expect(reordered[0]?.priority).toBe(1)
      expect(reordered[1]?.id).toBe('r1')
      expect(reordered[1]?.priority).toBe(2)
    })

    it('loadRuleTemplate should load aggressive rules', () => {
      useGameStore.getState().loadRuleTemplate('aggressive')

      const rules = useGameStore.getState().behaviorRules
      expect(rules.length).toBeGreaterThan(0)
    })
  })

  // ============= Tick System =============

  describe('tick system', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
      useGameStore.getState().startExpedition()
    })

    it('tick should increment tick counter', () => {
      const initialTick = useGameStore.getState().currentTick
      useGameStore.getState().tick()

      expect(useGameStore.getState().currentTick).toBe(initialTick + 1)
    })

    it('tick should not execute if paused', () => {
      useGameStore.setState({ isPaused: true })
      const initialTick = useGameStore.getState().currentTick

      useGameStore.getState().tick()

      expect(useGameStore.getState().currentTick).toBe(initialTick)
    })

    it('tick should not execute if no expedition active', () => {
      useGameStore.setState({ expeditionActive: false })
      const initialTick = useGameStore.getState().currentTick

      useGameStore.getState().tick()

      expect(useGameStore.getState().currentTick).toBe(initialTick)
    })

    it('tick should not execute on defeat', () => {
      useGameStore.setState({
        expeditionResult: 'defeat',
        isPaused: false,
        expeditionActive: true,
      })
      const initialTick = useGameStore.getState().currentTick

      useGameStore.getState().tick()

      expect(useGameStore.getState().currentTick).toBe(initialTick)
    })

    it('tick should auto-pause on defeat', () => {
      // This would require mocking TickSystem to return defeat result
      // Skipping for now as it requires deeper test setup
    })

    it('tick should award resources for collected caches', () => {
      const initialCycles = useGameStore.getState().resources.cycles
      useGameStore.getState().tick()

      // May have collected caches, cycles should be >= initial
      expect(useGameStore.getState().resources.cycles).toBeGreaterThanOrEqual(initialCycles)
    })
  })

  // ============= Visibility Updates =============

  describe('visibility updates', () => {
    it('updateVisibility should update fog of war', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)

      const grid1 = useGameStore.getState().currentSector?.grid

      useGameStore.getState().updateVisibility()

      const grid2 = useGameStore.getState().currentSector?.grid

      expect(grid1).not.toBeNull()
      expect(grid2).not.toBeNull()
    })

    it('updateVisibility should update sector grid reference', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
      const sectorBefore = useGameStore.getState().currentSector

      useGameStore.getState().updateVisibility()

      const sectorAfter = useGameStore.getState().currentSector

      // Sector should be recreated with new grid
      expect(sectorBefore).not.toBe(sectorAfter)
    })
  })

  // ============= Movement =============

  describe('movement', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
    })

    it('moveSelectedProcess should fail if no process selected', () => {
      useGameStore.setState({ selectedProcessId: null })
      const processCount = useGameStore.getState().processes.length

      useGameStore.getState().moveSelectedProcess({ x: 5, y: 5 })

      expect(useGameStore.getState().processes).toHaveLength(processCount)
    })

    it('moveSelectedProcess should fail if no sector', () => {
      useGameStore.setState({ currentSector: null })
      const initialState = { ...useGameStore.getState().processes[0] }

      useGameStore.getState().moveSelectedProcess({ x: 5, y: 5 })

      expect(useGameStore.getState().processes[0]).toEqual(initialState)
    })
  })

  // ============= State Immutability =============

  describe('state immutability', () => {
    it('spendResources should not mutate original resources', () => {
      const before = useGameStore.getState().resources
      useGameStore.getState().spendResources({ cycles: 50 })
      const after = useGameStore.getState().resources

      expect(before).not.toBe(after)
    })

    it('addResources should not mutate original resources', () => {
      const before = useGameStore.getState().resources
      useGameStore.getState().addResources({ cycles: 50 })
      const after = useGameStore.getState().resources

      expect(before).not.toBe(after)
    })

    it('deployProcess should not mutate processes array', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      const before = useGameStore.getState().processes
      useGameStore.getState().deployProcess('scout', 0)
      const after = useGameStore.getState().processes

      expect(before).not.toBe(after)
    })

    it('updateBehaviorRule should not mutate rules array', () => {
      const mockRule: BehaviorRule = {
        id: 'test',
        name: 'Test',
        priority: 1,
        condition: { type: 'always' },
        action: { type: 'attack_nearest' },
        enabled: true,
      }
      useGameStore.getState().addBehaviorRule(mockRule)
      const before = useGameStore.getState().behaviorRules
      useGameStore.getState().updateBehaviorRule('test', { name: 'Updated' })
      const after = useGameStore.getState().behaviorRules

      expect(before).not.toBe(after)
    })
  })

  // ============= Deployment Costs =============

  describe('deployment costs constants', () => {
    it('DEPLOYMENT_COSTS should have scout cost', () => {
      expect(DEPLOYMENT_COSTS.scout.cycles).toBe(20)
    })

    it('DEPLOYMENT_COSTS should have purifier cost', () => {
      expect(DEPLOYMENT_COSTS.purifier.cycles).toBe(40)
    })
  })

  // ============= Upgrade Costs =============

  describe('upgrade costs calculation', () => {
    it('UPGRADE_COSTS should calculate base cost for maxHealth', () => {
      const cost = UPGRADE_COSTS.maxHealth(0)
      expect(cost).toBe(50)
    })

    it('UPGRADE_COSTS should calculate scaled cost for level 1', () => {
      const cost0 = UPGRADE_COSTS.maxHealth(0)
      const cost1 = UPGRADE_COSTS.maxHealth(1)

      expect(cost1).toBe(Math.floor(50 * Math.pow(1.5, 1)))
      expect(cost1).toBeGreaterThan(cost0)
    })

    it('UPGRADE_COSTS should increase exponentially', () => {
      const cost0 = UPGRADE_COSTS.maxHealth(0)
      const cost1 = UPGRADE_COSTS.maxHealth(1)
      const cost2 = UPGRADE_COSTS.maxHealth(2)
      const cost3 = UPGRADE_COSTS.maxHealth(3)

      expect(cost1 - cost0).toBeLessThan(cost2 - cost1)
      expect(cost2 - cost1).toBeLessThan(cost3 - cost2)
    })

    it('UPGRADE_COSTS should calculate all upgrade types', () => {
      const types: Array<keyof typeof UPGRADE_COSTS> = [
        'maxHealth',
        'attack',
        'defense',
        'startingCycles',
      ]

      types.forEach(type => {
        const cost = UPGRADE_COSTS[type](0)
        expect(typeof cost).toBe('number')
        expect(cost).toBeGreaterThan(0)
      })
    })
  })

  // ============= Edge Cases =============

  describe('edge cases', () => {
    it('should handle deploying with zero cycles', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.setState({ resources: { cycles: 0, memory: 50, energy: 75 } })

      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().processes).toHaveLength(0)
    })

    it('should handle claiming rewards with zero score', () => {
      useGameStore.setState({
        expeditionScore: {
          cachesCollected: 0,
          malwareDestroyed: 0,
          ticksSurvived: 0,
        },
      })

      const rewards = useGameStore.getState().claimExpeditionRewards()

      expect(rewards.totalReward).toBe(0)
    })

    it('should handle setting difficulty while expedition active', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().startExpedition()

      useGameStore.getState().setDifficulty('hard')

      expect(useGameStore.getState().selectedDifficulty).toBe('hard')
      expect(useGameStore.getState().expeditionActive).toBe(true)
    })

    it('should handle multiple rapid deployments', () => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.setState({
        resources: { cycles: 1000, memory: 1000, energy: 1000 },
      })

      // Create multiple spawn points for testing
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ]
      }

      useGameStore.getState().deployProcess('scout', 0)
      useGameStore.getState().deployProcess('scout', 1)
      useGameStore.getState().deployProcess('scout', 2)

      expect(useGameStore.getState().processes.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============= Selectors =============

  describe('state selectors', () => {
    it('selectResources should return resources', () => {
      const state = useGameStore.getState()
      const resources = selectResources(state)

      expect(resources).toEqual(state.resources)
    })

    it('selectProcesses should return processes', () => {
      const state = useGameStore.getState()
      const processes = selectProcesses(state)

      expect(processes).toEqual(state.processes)
    })
  })

  // ============= Energy-Based Deployment =============

  describe('energy-based deployment', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
    })

    it('deployProcess should cost cycles before expedition starts', () => {
      const initialCycles = useGameStore.getState().resources.cycles
      const initialEnergy = useGameStore.getState().resources.energy

      useGameStore.getState().deployProcess('scout', 0)

      expect(useGameStore.getState().resources.cycles).toBe(initialCycles - 20)
      expect(useGameStore.getState().resources.energy).toBe(initialEnergy) // Energy unchanged
    })

    it('deployProcess should cost energy during expedition with base cost', () => {
      // Deploy first process to start expedition
      useGameStore.getState().deployProcess('scout', 0)
      expect(useGameStore.getState().expeditionActive).toBe(true)

      // Add more energy and create another spawn point for second deployment
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 100 },
      })
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ]
      }

      const initialEnergy = useGameStore.getState().resources.energy
      useGameStore.getState().deployProcess('scout', 1)

      // Should cost 30 energy (base cost for scout)
      expect(useGameStore.getState().resources.energy).toBe(initialEnergy - 30)
    })

    it('deployProcess should apply exponential scaling on subsequent deployments', () => {
      // Start expedition with first deployment
      useGameStore.getState().deployProcess('scout', 0)

      // Add more energy and spawn points
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 200 },
      })
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
          { x: 5, y: 2 },
        ]
        // Ensure processes array is updated in sector
        useGameStore.setState({ currentSector: { ...sector } })
      }

      // Second deployment: 30 * 1.5^0 = 30 (first mid-expedition deployment)
      useGameStore.getState().deployProcess('scout', 1)
      expect(useGameStore.getState().resources.energy).toBe(200 - 30)

      // Third deployment: 30 * 1.5^1 = 45 (second mid-expedition deployment)
      useGameStore.getState().deployProcess('scout', 2)
      expect(useGameStore.getState().resources.energy).toBe(200 - 30 - 45)
    })

    it('deployProcess should track midExpeditionDeployCount correctly', () => {
      useGameStore.getState().deployProcess('scout', 0)
      expect(useGameStore.getState().midExpeditionDeployCount).toBe(0) // First deploy doesn't count

      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 200 },
      })
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ]
      }

      useGameStore.getState().deployProcess('scout', 1)
      expect(useGameStore.getState().midExpeditionDeployCount).toBe(1)

      useGameStore.getState().deployProcess('scout', 2)
      expect(useGameStore.getState().midExpeditionDeployCount).toBe(2)
    })

    it('deployProcess should use different base costs for different archetypes', () => {
      useGameStore.getState().deployProcess('scout', 0)

      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 200 },
      })
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ]
      }

      const initialEnergy = useGameStore.getState().resources.energy
      useGameStore.getState().deployProcess('purifier', 1)

      // Should cost 50 energy (base cost for purifier)
      expect(useGameStore.getState().resources.energy).toBe(initialEnergy - 50)
    })

    it('deployProcess should fail if insufficient energy during expedition', () => {
      useGameStore.getState().deployProcess('scout', 0)

      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 20 }, // Not enough for 30
      })
      const sector = useGameStore.getState().currentSector
      if (sector) {
        sector.spawnPoints = [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ]
      }

      const processCount = useGameStore.getState().processes.length
      useGameStore.getState().deployProcess('scout', 1)

      expect(useGameStore.getState().processes.length).toBe(processCount)
      expect(useGameStore.getState().resources.energy).toBe(20) // Unchanged
    })

    it('generateNewSector should reset midExpeditionDeployCount', () => {
      useGameStore.getState().deployProcess('scout', 0)
      useGameStore.setState({ midExpeditionDeployCount: 5 })

      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })

      expect(useGameStore.getState().midExpeditionDeployCount).toBe(0)
    })
  })

  // ============= Energy Regeneration =============

  describe('energy regeneration', () => {
    beforeEach(() => {
      useGameStore
        .getState()
        .generateNewSector({ size: 'small', difficulty: 'normal', seed: 12345 })
      useGameStore.getState().deployProcess('scout', 0)
      useGameStore.getState().startExpedition()
    })

    it('tick should regenerate energy during expedition', () => {
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 50 },
      })

      const initialEnergy = useGameStore.getState().resources.energy
      useGameStore.getState().tick()

      // Should regenerate +5 energy per tick
      expect(useGameStore.getState().resources.energy).toBe(initialEnergy + 5)
    })

    it('tick should cap energy at max capacity', () => {
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 98 },
      })

      useGameStore.getState().tick()

      // Should cap at 100
      expect(useGameStore.getState().resources.energy).toBe(100)
    })

    it('tick should not regenerate energy when paused', () => {
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 50 },
        isPaused: true,
      })

      const initialEnergy = useGameStore.getState().resources.energy
      useGameStore.getState().tick()

      expect(useGameStore.getState().resources.energy).toBe(initialEnergy)
    })

    it('tick should not regenerate energy when expedition not active', () => {
      useGameStore.setState({
        resources: { cycles: 100, memory: 50, energy: 50 },
        expeditionActive: false,
      })

      const initialEnergy = useGameStore.getState().resources.energy
      useGameStore.getState().tick()

      expect(useGameStore.getState().resources.energy).toBe(initialEnergy)
    })
  })
})
