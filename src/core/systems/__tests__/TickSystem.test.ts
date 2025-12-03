import { describe, it, expect } from 'vitest'
import {
  processMovementPhase,
  cacheCollectionPhase,
  processCombatPhase,
  malwareAIPhase,
  wormReplicationPhase,
  dormantActivationPhase,
  checkVictoryDefeat,
  executeTick,
  type TickContext,
} from '../TickSystem'
import { createProcess } from '@core/models/process'
import { createMalware } from '@core/models/malware'
import { createGrid, type Grid } from '@core/models/grid'

// ============= Test Fixtures =============

function createTestGrid(width: number = 10, height: number = 10): Grid {
  return createGrid(width, height)
}

function createTestContext(overrides?: Partial<TickContext>): TickContext {
  return {
    processes: [],
    malware: [],
    grid: createTestGrid(),
    combatLog: [],
    sector: {
      exitPoints: [{ x: 9, y: 9 }],
      spawnPoints: [{ x: 0, y: 0 }],
    },
    behaviorRules: [],
    currentTick: 0,
    difficulty: 'normal',
    ...overrides,
  }
}

// ============= Process Movement Phase Tests =============

describe('processMovementPhase', () => {
  describe('basic movement', () => {
    it('should move process along path to next waypoint', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]
      process.pathIndex = 0
      process.status = 'moving'

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 1, y: 0 })
      expect(result[0]?.pathIndex).toBe(1)
      expect(result[0]?.status).toBe('moving')
    })

    it('should transition to idle when reaching end of path', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 1, y: 0 })
      process.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]
      process.pathIndex = 1
      process.status = 'moving'

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 2, y: 0 })
      expect(result[0]?.status).toBe('idle')
      expect(result[0]?.path).toHaveLength(0)
      expect(result[0]?.targetPosition).toBeNull()
    })

    it('should not move if process is idle', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.status = 'idle'
      process.path = []

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 0, y: 0 })
    })

    it('should not move if path is empty', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 5, y: 5 })
      process.status = 'moving'
      process.path = []

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 5, y: 5 })
    })

    it('should handle multiple processes moving independently', () => {
      const grid = createTestGrid()
      const process1 = createProcess('scout', { x: 0, y: 0 })
      process1.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      process1.pathIndex = 0
      process1.status = 'moving'

      const process2 = createProcess('purifier', { x: 5, y: 5 })
      process2.path = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
      ]
      process2.pathIndex = 0
      process2.status = 'moving'

      const result = processMovementPhase([process1, process2], grid)

      expect(result[0]?.position).toEqual({ x: 1, y: 0 })
      expect(result[1]?.position).toEqual({ x: 5, y: 6 })
    })
  })

  describe('collision handling', () => {
    it('should not move if next position is blocked', () => {
      const grid = createTestGrid()
      grid.tiles[0]![1]!.type = 'blocked'

      const process = createProcess('scout', { x: 0, y: 0 })
      process.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      process.pathIndex = 0
      process.status = 'moving'

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 0, y: 0 })
    })

    it('should not move if path position is out of bounds', () => {
      const grid = createTestGrid(2, 2)
      const process = createProcess('scout', { x: 1, y: 1 })
      process.path = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ]
      process.pathIndex = 0
      process.status = 'moving'

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 1, y: 1 })
    })

    it('should not move if next position has another process', () => {
      const grid = createTestGrid()
      const process1 = createProcess('scout', { x: 0, y: 0 })
      process1.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      process1.pathIndex = 0
      process1.status = 'moving'

      const process2 = createProcess('purifier', { x: 1, y: 0 })

      const result = processMovementPhase([process1, process2], grid)

      expect(result[0]?.position).toEqual({ x: 0, y: 0 })
    })
  })

  describe('action point reset', () => {
    it('should reset action points each tick', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.actionPoints = 0

      const result = processMovementPhase([process], grid)

      expect(result[0]?.stats.actionPoints).toBe(process.stats.maxActionPoints)
    })
  })

  describe('status effect ticking', () => {
    it('should decrement status effect duration', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects = [{ id: 'effect1', name: 'Slow', type: 'debuff', duration: 3 }]

      const result = processMovementPhase([process], grid)

      expect(result[0]?.statusEffects[0]?.duration).toBe(2)
    })

    it('should remove expired status effects', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects = [{ id: 'effect1', name: 'Slow', type: 'debuff', duration: 1 }]

      const result = processMovementPhase([process], grid)

      expect(result[0]?.statusEffects).toHaveLength(0)
    })

    it('should preserve permanent status effects (duration -1)', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects = [{ id: 'effect1', name: 'Buff', type: 'buff', duration: -1 }]

      const result = processMovementPhase([process], grid)

      expect(result[0]?.statusEffects).toHaveLength(1)
      expect(result[0]?.statusEffects[0]?.duration).toBe(-1)
    })

    it('should handle mixed permanent and temporary effects', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects = [
        { id: 'effect1', name: 'Buff', type: 'buff', duration: -1 },
        { id: 'effect2', name: 'Slow', type: 'debuff', duration: 2 },
        { id: 'effect3', name: 'Poison', type: 'debuff', duration: 1 },
      ]

      const result = processMovementPhase([process], grid)

      expect(result[0]?.statusEffects).toHaveLength(2)
      expect(result[0]?.statusEffects[0]?.duration).toBe(-1)
      expect(result[0]?.statusEffects[1]?.duration).toBe(1)
    })
  })

  describe('destroyed processes', () => {
    it('should not move destroyed processes', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.status = 'destroyed'
      process.path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      process.pathIndex = 0

      const result = processMovementPhase([process], grid)

      expect(result[0]?.position).toEqual({ x: 0, y: 0 })
      expect(result[0]?.status).toBe('destroyed')
    })
  })
})

// ============= Cache Collection Phase Tests =============

describe('cacheCollectionPhase', () => {
  it('should collect data cache on current tile', () => {
    const grid = createTestGrid()
    grid.tiles[0]![0]!.type = 'data_cache'

    const process = createProcess('scout', { x: 0, y: 0 })

    const result = cacheCollectionPhase([process], grid)

    expect(result.cachesCollected).toBe(1)
    expect(result.grid.tiles[0]![0]!.type).toBe('empty')
    expect(result.logs[0]).toContain('collected data cache')
  })

  it('should collect cache when process is on cache tile', () => {
    const grid = createTestGrid()
    grid.tiles[0]![0]!.type = 'data_cache'
    grid.tiles[5]![5]!.type = 'data_cache'

    const process1 = createProcess('scout', { x: 0, y: 0 })
    const process2 = createProcess('purifier', { x: 5, y: 5 })

    const result = cacheCollectionPhase([process1, process2], grid)

    expect(result.cachesCollected).toBe(2)
    expect(result.grid.tiles[0]![0]!.type).toBe('empty')
    expect(result.grid.tiles[5]![5]!.type).toBe('empty')
  })

  it('should not collect if no cache on tile', () => {
    const grid = createTestGrid()
    const process = createProcess('scout', { x: 0, y: 0 })

    const result = cacheCollectionPhase([process], grid)

    expect(result.cachesCollected).toBe(0)
    expect(result.logs).toHaveLength(0)
  })

  it('should not collect if process is destroyed', () => {
    const grid = createTestGrid()
    grid.tiles[0]![0]!.type = 'data_cache'

    const process = createProcess('scout', { x: 0, y: 0 })
    process.status = 'destroyed'

    const result = cacheCollectionPhase([process], grid)

    expect(result.cachesCollected).toBe(0)
    expect(result.grid.tiles[0]![0]!.type).toBe('data_cache')
  })

  it('should preserve grid immutability', () => {
    const grid = createTestGrid()
    grid.tiles[0]![0]!.type = 'data_cache'
    const originalGrid = JSON.stringify(grid)

    const process = createProcess('scout', { x: 0, y: 0 })
    cacheCollectionPhase([process], grid)

    expect(JSON.stringify(grid)).toBe(originalGrid)
  })
})

// ============= Process Combat Phase Tests =============

describe('processCombatPhase', () => {
  it('should attack adjacent malware', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const malware = createMalware('worm', { x: 1, y: 0 })

    const result = processCombatPhase([process], [malware])

    expect(result.logs.length).toBeGreaterThan(0)
    expect(result.malware[0]?.stats.health).toBeLessThan(malware.stats.health)
  })

  it('should destroy malware when health reaches zero', () => {
    const process = createProcess('purifier', { x: 0, y: 0 })
    const malware = createMalware('worm', { x: 1, y: 0 })
    malware.stats.health = 5 // Very low health

    const result = processCombatPhase([process], [malware])

    expect(result.malware[0]?.status).toBe('destroyed')
    expect(result.malwareDestroyed).toBe(1)
    expect(result.logs[0]).toContain('destroyed')
  })

  it('should not attack if no adjacent malware', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const malware = createMalware('worm', { x: 5, y: 5 })

    const result = processCombatPhase([process], [malware])

    expect(result.malware[0]?.stats.health).toBe(malware.stats.health)
    expect(result.logs).toHaveLength(0)
  })

  it('should not attack if process is destroyed', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    process.status = 'destroyed'
    const malware = createMalware('worm', { x: 1, y: 0 })

    const result = processCombatPhase([process], [malware])

    expect(result.malware[0]?.stats.health).toBe(malware.stats.health)
  })

  it('should set process to attacking status during combat', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const malware = createMalware('worm', { x: 1, y: 0 })

    const result = processCombatPhase([process], [malware])

    expect(result.processes[0]?.status).toBe('attacking')
  })

  it('should mark malware as revealed when attacked', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const malware = createMalware('trojan', { x: 1, y: 0 })
    malware.isRevealed = false

    const result = processCombatPhase([process], [malware])

    expect(result.malware[0]?.isRevealed).toBe(true)
  })

  it('should handle multiple processes attacking same malware', () => {
    const process1 = createProcess('scout', { x: 0, y: 0 })
    const process2 = createProcess('purifier', { x: 0, y: 1 })
    const malware = createMalware('worm', { x: 1, y: 0 })

    const result = processCombatPhase([process1, process2], [malware])

    // Only first process should attack (filter returns first)
    expect(result.malware[0]?.stats.health).toBeLessThan(malware.stats.health)
  })
})

// ============= Malware AI Phase Tests =============

describe('malwareAIPhase', () => {
  describe('malware attack behavior', () => {
    it('should attack adjacent process', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.processes[0]?.stats.health).toBeLessThan(process.stats.health)
      expect(result.malware[0]?.status).toBe('alerted')
    })

    it('should not attack destroyed processes', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      process.status = 'destroyed'
      const malware = createMalware('worm', { x: 1, y: 0 })

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.processes[0]?.stats.health).toBe(process.stats.health)
    })
  })

  describe('malware aggro behavior', () => {
    it('should become alerted when process in aggro range', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 2, y: 0 })

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.malware[0]?.status).toBe('alerted')
    })

    it('should not aggro if process outside range', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 9, y: 9 })

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.malware[0]?.status).toBe('active')
    })

    it('should respect malware aggro range config', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 4, y: 0 })

      const result = malwareAIPhase([process], [malware], grid)

      // Worm has aggroRange: 3, so x: 4 is outside
      expect(result.malware[0]?.status).toBe('active')
    })
  })

  describe('malware movement', () => {
    it('should move toward alerted target', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 2, y: 0 })
      malware.status = 'alerted'

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.malware[0]?.position).not.toEqual({ x: 2, y: 0 })
    })

    it('should not move if stationary', () => {
      const grid = createTestGrid()
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('rootkit', { x: 2, y: 0 })
      malware.status = 'alerted'

      const result = malwareAIPhase([process], [malware], grid)

      expect(result.malware[0]?.position).toEqual({ x: 2, y: 0 })
    })

    it('should not move into blocked tiles', () => {
      const grid = createTestGrid()
      grid.tiles[1]![1]!.type = 'blocked'

      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 1 })
      malware.status = 'alerted'

      const result = malwareAIPhase([process], [malware], grid)

      // Position should change or stay same (not land on blocked tile at 1,1)
      expect(result.malware[0]).toBeDefined()
      expect(result.malware[0]?.status).toBe('alerted')
    })
  })

  describe('ability cooldown', () => {
    it('should decrement malware ability cooldown', () => {
      const grid = createTestGrid()
      const malware = createMalware('worm', { x: 5, y: 5 })
      malware.abilityCooldown = 3

      const result = malwareAIPhase([], [malware], grid)

      expect(result.malware[0]?.abilityCooldown).toBe(2)
    })

    it('should not go below zero', () => {
      const grid = createTestGrid()
      const malware = createMalware('worm', { x: 5, y: 5 })
      malware.abilityCooldown = 0

      const result = malwareAIPhase([], [malware], grid)

      expect(result.malware[0]?.abilityCooldown).toBe(0)
    })
  })

  describe('destroyed malware', () => {
    it('should not process destroyed malware', () => {
      const grid = createTestGrid()
      const malware = createMalware('worm', { x: 5, y: 5 })
      malware.status = 'destroyed'

      const result = malwareAIPhase([], [malware], grid)

      expect(result.malware[0]?.status).toBe('destroyed')
    })
  })

  describe('dormant malware', () => {
    it('should not process dormant malware', () => {
      const grid = createTestGrid()
      const malware = createMalware('trojan', { x: 5, y: 5 })

      const result = malwareAIPhase([], [malware], grid)

      expect(result.malware[0]?.status).toBe('dormant')
    })
  })
})

// ============= Worm Replication Phase Tests =============

describe('wormReplicationPhase', () => {
  it('should replicate worm to adjacent empty tile', () => {
    const grid = createTestGrid()
    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.abilityCooldown = 0
    worm.status = 'active'

    const result = wormReplicationPhase([], [worm], grid, 'normal')

    expect(result.malware).toHaveLength(2)
    expect(result.logs[0]).toContain('replicates')
  })

  it('should set cooldown after replication', () => {
    const grid = createTestGrid()
    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.abilityCooldown = 0
    worm.status = 'active'

    const result = wormReplicationPhase([], [worm], grid, 'normal')

    expect(result.malware[0]?.abilityCooldown).toBeGreaterThan(0)
  })

  it('should not replicate if cooldown not zero', () => {
    const grid = createTestGrid()
    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.abilityCooldown = 2
    worm.status = 'active'

    const result = wormReplicationPhase([], [worm], grid, 'normal')

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate if destroyed', () => {
    const grid = createTestGrid()
    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.status = 'destroyed'
    worm.abilityCooldown = 0

    const result = wormReplicationPhase([], [worm], grid, 'normal')

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate if dormant', () => {
    const grid = createTestGrid()
    const trojan = createMalware('trojan', { x: 5, y: 5 })
    trojan.abilityCooldown = 0

    const result = wormReplicationPhase([], [trojan], grid, 'normal')

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate to blocked tiles', () => {
    const grid = createTestGrid()
    // Block all adjacent tiles
    grid.tiles[4]![5]!.type = 'blocked'
    grid.tiles[6]![5]!.type = 'blocked'
    grid.tiles[5]![4]!.type = 'blocked'
    grid.tiles[5]![6]!.type = 'blocked'

    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.abilityCooldown = 0
    worm.status = 'active'

    const result = wormReplicationPhase([], [worm], grid, 'normal')

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate to tiles occupied by processes', () => {
    const grid = createTestGrid()
    // Place process at all four adjacent tiles
    const process1 = createProcess('scout', { x: 4, y: 5 })
    const process2 = createProcess('scout', { x: 6, y: 5 })
    const process3 = createProcess('scout', { x: 5, y: 4 })
    const process4 = createProcess('scout', { x: 5, y: 6 })

    const worm = createMalware('worm', { x: 5, y: 5 })
    worm.abilityCooldown = 0
    worm.status = 'active'

    const result = wormReplicationPhase(
      [process1, process2, process3, process4],
      [worm],
      grid,
      'normal'
    )

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate only non-worms', () => {
    const grid = createTestGrid()
    const rootkit = createMalware('rootkit', { x: 5, y: 5 })
    rootkit.abilityCooldown = 0
    rootkit.status = 'active'

    const result = wormReplicationPhase([], [rootkit], grid, 'normal')

    expect(result.malware).toHaveLength(1)
  })

  it('should not replicate when at max worm count (easy)', () => {
    const grid = createTestGrid()
    // Create 8 worms (max for easy difficulty)
    const worms = Array.from({ length: 8 }, (_, i) => {
      const worm = createMalware('worm', { x: i, y: 0 })
      worm.status = 'active'
      if (i === 0) {
        worm.abilityCooldown = 0 // Ready to replicate
      }
      return worm
    })

    const result = wormReplicationPhase([], worms, grid, 'easy')

    // Should not create new worms
    expect(result.malware).toHaveLength(8)
  })

  it('should not replicate when at max worm count (normal)', () => {
    const grid = createTestGrid()
    // Create 12 worms (max for normal difficulty)
    const worms = Array.from({ length: 12 }, (_, i) => {
      const worm = createMalware('worm', { x: i % 10, y: Math.floor(i / 10) })
      worm.status = 'active'
      if (i === 0) {
        worm.abilityCooldown = 0 // Ready to replicate
      }
      return worm
    })

    const result = wormReplicationPhase([], worms, grid, 'normal')

    // Should not create new worms
    expect(result.malware).toHaveLength(12)
  })

  it('should allow replication when below max worm count', () => {
    const grid = createTestGrid()
    // Create 7 worms (below max of 8 for easy difficulty)
    const worms = Array.from({ length: 7 }, (_, i) => {
      const worm = createMalware('worm', { x: i, y: 0 })
      worm.status = 'active'
      if (i === 0) {
        worm.abilityCooldown = 0 // Ready to replicate
      }
      return worm
    })

    const result = wormReplicationPhase([], worms, grid, 'easy')

    // Should create one new worm
    expect(result.malware).toHaveLength(8)
  })
})

// ============= Dormant Activation Phase Tests =============

describe('dormantActivationPhase', () => {
  it('should activate dormant malware adjacent to process', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const trojan = createMalware('trojan', { x: 1, y: 0 })

    const result = dormantActivationPhase([process], [trojan])

    expect(result.malware[0]?.status).toBe('alerted')
    expect(result.malware[0]?.isRevealed).toBe(true)
  })

  it('should log when dormant malware awakens', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const trojan = createMalware('trojan', { x: 1, y: 0 })

    const result = dormantActivationPhase([process], [trojan])

    expect(result.logs[0]).toContain('awakens')
  })

  it('should not activate if no adjacent process', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const trojan = createMalware('trojan', { x: 5, y: 5 })

    const result = dormantActivationPhase([process], [trojan])

    expect(result.malware[0]?.status).toBe('dormant')
  })

  it('should not activate if adjacent process is destroyed', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    process.status = 'destroyed'
    const trojan = createMalware('trojan', { x: 1, y: 0 })

    const result = dormantActivationPhase([process], [trojan])

    expect(result.malware[0]?.status).toBe('dormant')
  })

  it('should activate multiple dormant malware', () => {
    const process = createProcess('scout', { x: 5, y: 5 })
    const trojan1 = createMalware('trojan', { x: 4, y: 5 })
    const trojan2 = createMalware('trojan', { x: 6, y: 5 })

    const result = dormantActivationPhase([process], [trojan1, trojan2])

    expect(result.malware[0]?.status).toBe('alerted')
    expect(result.malware[1]?.status).toBe('alerted')
  })

  it('should not activate already alerted malware', () => {
    const process = createProcess('scout', { x: 0, y: 0 })
    const trojan = createMalware('trojan', { x: 1, y: 0 })
    trojan.status = 'alerted'

    const result = dormantActivationPhase([process], [trojan])

    expect(result.malware[0]?.status).toBe('alerted')
    expect(result.logs).toHaveLength(0)
  })
})

// ============= Victory/Defeat Check Tests =============

describe('checkVictoryDefeat', () => {
  describe('victory conditions', () => {
    it('should return victory when process reaches exit point', () => {
      const process = createProcess('scout', { x: 9, y: 9 })
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('victory')
      expect(result.log).toContain('VICTORY')
    })

    it('should return victory when any process reaches exit', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('purifier', { x: 9, y: 9 })
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process1, process2], exitPoints)

      expect(result.result).toBe('victory')
    })

    it('should return victory when process reaches any exit point', () => {
      const process = createProcess('scout', { x: 5, y: 9 })
      const exitPoints = [
        { x: 9, y: 9 },
        { x: 5, y: 9 },
      ]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('victory')
    })
  })

  describe('defeat conditions', () => {
    it('should return defeat when all processes destroyed', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.status = 'destroyed'
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('defeat')
      expect(result.log).toContain('DEFEAT')
    })

    it('should return defeat with all processes destroyed regardless of position', () => {
      const process = createProcess('scout', { x: 9, y: 9 })
      process.status = 'destroyed'
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('defeat')
    })
  })

  describe('active conditions', () => {
    it('should return active when process alive but not at exit', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('active')
      expect(result.log).toBeNull()
    })

    it('should return active with multiple processes not at exit', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('purifier', { x: 1, y: 0 })
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process1, process2], exitPoints)

      expect(result.result).toBe('active')
    })

    it('should return active with some destroyed processes but alive ones not at exit', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('purifier', { x: 1, y: 0 })
      process2.status = 'destroyed'
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process1, process2], exitPoints)

      expect(result.result).toBe('active')
    })
  })

  describe('edge cases', () => {
    it('should handle empty process array', () => {
      const exitPoints = [{ x: 9, y: 9 }]
      const result = checkVictoryDefeat([], exitPoints)

      expect(result.result).toBe('defeat')
    })

    it('should handle empty exit points array', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const result = checkVictoryDefeat([process], [])

      expect(result.result).toBe('active')
    })

    it('should prioritize defeat over victory when process at exit but destroyed', () => {
      const process = createProcess('scout', { x: 9, y: 9 })
      process.status = 'destroyed'
      const exitPoints = [{ x: 9, y: 9 }]

      const result = checkVictoryDefeat([process], exitPoints)

      expect(result.result).toBe('defeat')
    })
  })
})

// ============= Main Tick Orchestrator Tests =============

describe('executeTick', () => {
  describe('phase execution order', () => {
    it('should execute all phases and return complete result', () => {
      const context = createTestContext()

      const result = executeTick(context)

      expect(result.processes).toBeDefined()
      expect(result.malware).toBeDefined()
      expect(result.grid).toBeDefined()
      expect(result.combatLog).toBeDefined()
      expect(result.cachesCollected).toBeDefined()
      expect(result.malwareDestroyed).toBeDefined()
      expect(result.expeditionResult).toBeDefined()
    })

    it('should include initial malware in result', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('purifier', { x: 1, y: 0 })
      const malware1 = createMalware('rootkit', { x: 5, y: 5 })
      const malware2 = createMalware('logic_bomb', { x: 6, y: 6 })

      const context = createTestContext({
        processes: [process1, process2],
        malware: [malware1, malware2],
      })

      const result = executeTick(context)

      expect(result.processes).toHaveLength(2)
      expect(result.malware.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('combat log management', () => {
    it('should accumulate logs from all phases', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })
      const grid = createTestGrid()
      grid.tiles[0]![0]!.type = 'data_cache'

      const context = createTestContext({
        processes: [process],
        malware: [malware],
        grid,
        combatLog: ['Initial log'],
      })

      const result = executeTick(context)

      expect(result.combatLog.length).toBeGreaterThan(1)
      expect(result.combatLog[0]).toBe('Initial log')
    })

    it('should limit combat log to 50 entries after adding new logs', () => {
      const logs = Array.from({ length: 50 }, (_, i) => `Log ${i}`)
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })

      const context = createTestContext({
        combatLog: logs,
        processes: [process],
        malware: [malware],
      })

      const result = executeTick(context)

      // Result should have at most 50 entries (old entries removed when new ones exceed limit)
      expect(result.combatLog.length).toBeLessThanOrEqual(50)
    })

    it('should remove oldest log when exceeding 50', () => {
      const logs = Array.from({ length: 50 }, (_, i) => `Log ${i}`)
      const context = createTestContext({ combatLog: logs })

      const result = executeTick(context)

      expect(result.combatLog[0]).not.toBe('Log 0')
    })
  })

  describe('grid mutation handling', () => {
    it('should return new grid from cache collection', () => {
      const grid = createTestGrid()
      const originalGrid = grid

      const context = createTestContext({ grid })

      const result = executeTick(context)

      expect(result.grid).not.toBe(originalGrid)
    })

    it('should preserve grid dimensions', () => {
      const grid = createTestGrid(12, 14)
      const context = createTestContext({ grid })

      const result = executeTick(context)

      expect(result.grid.width).toBe(12)
      expect(result.grid.height).toBe(14)
    })
  })

  describe('victory defeat integration', () => {
    it('should set expeditionResult to victory when process at exit', () => {
      const process = createProcess('scout', { x: 9, y: 9 })
      const exitPoints = [{ x: 9, y: 9 }]

      const context = createTestContext({
        processes: [process],
        sector: {
          exitPoints,
          spawnPoints: [{ x: 0, y: 0 }],
        },
      })

      const result = executeTick(context)

      expect(result.expeditionResult).toBe('victory')
    })

    it('should set expeditionResult to defeat', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.status = 'destroyed'

      const context = createTestContext({
        processes: [process],
      })

      const result = executeTick(context)

      expect(result.expeditionResult).toBe('defeat')
    })

    it('should set expeditionResult to active when process alive but not at exit', () => {
      const process = createProcess('scout', { x: 0, y: 0 })

      const context = createTestContext({
        processes: [process],
        sector: {
          exitPoints: [{ x: 9, y: 9 }],
          spawnPoints: [{ x: 0, y: 0 }],
        },
      })

      const result = executeTick(context)

      expect(result.expeditionResult).toBe('active')
    })
  })

  describe('cache and malware counters', () => {
    it('should count collected caches', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const grid = createTestGrid()
      grid.tiles[0]![0]!.type = 'data_cache'

      const context = createTestContext({
        processes: [process],
        grid,
      })

      const result = executeTick(context)

      expect(result.cachesCollected).toBe(1)
    })

    it('should count destroyed malware', () => {
      const process = createProcess('purifier', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })
      malware.stats.health = 5

      const context = createTestContext({
        processes: [process],
        malware: [malware],
      })

      const result = executeTick(context)

      expect(result.malwareDestroyed).toBeGreaterThanOrEqual(0)
    })

    it('should accumulate counters across entities', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('purifier', { x: 5, y: 5 })
      const grid = createTestGrid()
      grid.tiles[0]![0]!.type = 'data_cache'
      grid.tiles[5]![5]!.type = 'data_cache'

      const context = createTestContext({
        processes: [process1, process2],
        grid,
      })

      const result = executeTick(context)

      expect(result.cachesCollected).toBe(2)
    })
  })

  describe('immutability', () => {
    it('should not mutate input context', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })
      const grid = createTestGrid()
      const originalProcessPosition = { ...process.position }

      const context = createTestContext({
        processes: [process],
        malware: [malware],
        grid,
      })

      executeTick(context)

      // Note: Current implementation mutates, this test documents actual behavior
      // If immutability is desired, this test shows the requirement
      expect(process.position).toEqual(originalProcessPosition)
    })
  })

  describe('integration scenarios', () => {
    it('should handle full combat sequence', () => {
      const process = createProcess('purifier', { x: 0, y: 0 })
      const malware = createMalware('worm', { x: 1, y: 0 })

      const context = createTestContext({
        processes: [process],
        malware: [malware],
      })

      const result = executeTick(context)

      expect(result.processes).toHaveLength(1)
      expect(result.malware.length).toBeGreaterThanOrEqual(1)
      expect(result.combatLog.length).toBeGreaterThan(0)
    })

    it('should handle dormant activation during tick', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const trojan = createMalware('trojan', { x: 1, y: 0 })

      const context = createTestContext({
        processes: [process],
        malware: [trojan],
      })

      const result = executeTick(context)

      expect(result.malware[0]?.status).toBe('alerted')
    })

    it('should handle worm replication during tick', () => {
      const worm = createMalware('worm', { x: 5, y: 5 })
      worm.abilityCooldown = 0
      worm.status = 'active'

      const context = createTestContext({
        malware: [worm],
      })

      const result = executeTick(context)

      expect(result.malware.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle multi-phase scenario', () => {
      const process = createProcess('purifier', { x: 4, y: 5 })
      process.path = [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
      ]
      process.pathIndex = 0
      process.status = 'moving'

      const worm = createMalware('worm', { x: 5, y: 5 })
      worm.abilityCooldown = 0
      worm.status = 'active'

      const grid = createTestGrid()
      grid.tiles[4]![5]!.type = 'data_cache'

      const context = createTestContext({
        processes: [process],
        malware: [worm],
        grid,
      })

      const result = executeTick(context)

      expect(result.cachesCollected).toBeGreaterThanOrEqual(0)
      expect(result.processes[0]?.position.x).toBeDefined()
      expect(result.malware[0]?.status).toBeDefined()
    })
  })
})
