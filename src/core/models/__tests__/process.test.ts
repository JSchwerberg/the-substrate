/**
 * Tests for Process model functions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createProcess,
  isAlive,
  getHealthPercent,
  canAct,
  resetActionPoints,
  consumeActionPoint,
  applyDamage,
  heal,
  getEffectiveStat,
  tickStatusEffects,
  ARCHETYPES,
  Process,
} from '../process'

describe('Process Model', () => {
  describe('createProcess', () => {
    it('should create a scout with correct base stats', () => {
      const process = createProcess('scout', { x: 5, y: 3 })

      expect(process.archetype).toBe('scout')
      expect(process.position).toEqual({ x: 5, y: 3 })
      expect(process.stats.maxHealth).toBe(ARCHETYPES.scout.baseStats.maxHealth)
      expect(process.stats.health).toBe(ARCHETYPES.scout.baseStats.maxHealth)
      expect(process.stats.attack).toBe(ARCHETYPES.scout.baseStats.attack)
      expect(process.stats.defense).toBe(ARCHETYPES.scout.baseStats.defense)
      expect(process.stats.speed).toBe(ARCHETYPES.scout.baseStats.speed)
      expect(process.stats.sightRange).toBe(ARCHETYPES.scout.baseStats.sightRange)
      expect(process.status).toBe('idle')
    })

    it('should create a purifier with correct base stats', () => {
      const process = createProcess('purifier', { x: 0, y: 0 })

      expect(process.archetype).toBe('purifier')
      expect(process.stats.maxHealth).toBe(ARCHETYPES.purifier.baseStats.maxHealth)
      expect(process.stats.attack).toBe(ARCHETYPES.purifier.baseStats.attack)
      expect(process.stats.defense).toBe(ARCHETYPES.purifier.baseStats.defense)
    })

    it('should assign unique IDs to each process', () => {
      const process1 = createProcess('scout', { x: 0, y: 0 })
      const process2 = createProcess('scout', { x: 1, y: 1 })

      expect(process1.id).not.toBe(process2.id)
    })

    it('should use custom name when provided', () => {
      const process = createProcess('scout', { x: 0, y: 0 }, 'CustomName')

      expect(process.name).toBe('CustomName')
    })

    it('should initialize with empty path and status effects', () => {
      const process = createProcess('scout', { x: 0, y: 0 })

      expect(process.path).toEqual([])
      expect(process.pathIndex).toBe(0)
      expect(process.statusEffects).toEqual([])
      expect(process.targetPosition).toBeNull()
    })

    it('should set correct color based on archetype', () => {
      const scout = createProcess('scout', { x: 0, y: 0 })
      const purifier = createProcess('purifier', { x: 0, y: 0 })

      expect(scout.color).toBe(ARCHETYPES.scout.color)
      expect(purifier.color).toBe(ARCHETYPES.purifier.color)
    })
  })

  describe('isAlive', () => {
    let process: Process

    beforeEach(() => {
      process = createProcess('scout', { x: 0, y: 0 })
    })

    it('should return true for healthy process', () => {
      expect(isAlive(process)).toBe(true)
    })

    it('should return true for damaged but living process', () => {
      process.stats.health = 1
      expect(isAlive(process)).toBe(true)
    })

    it('should return false for process with 0 health', () => {
      process.stats.health = 0
      expect(isAlive(process)).toBe(false)
    })

    it('should return false for destroyed process', () => {
      process.status = 'destroyed'
      expect(isAlive(process)).toBe(false)
    })

    it('should return false for destroyed process even with health', () => {
      process.status = 'destroyed'
      process.stats.health = 50
      expect(isAlive(process)).toBe(false)
    })
  })

  describe('getHealthPercent', () => {
    it('should return 100 for full health', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      expect(getHealthPercent(process)).toBe(100)
    })

    it('should return 50 for half health', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.health = process.stats.maxHealth / 2
      expect(getHealthPercent(process)).toBe(50)
    })

    it('should return 0 for no health', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.health = 0
      expect(getHealthPercent(process)).toBe(0)
    })
  })

  describe('canAct', () => {
    let process: Process

    beforeEach(() => {
      process = createProcess('scout', { x: 0, y: 0 })
    })

    it('should return true for healthy process with action points', () => {
      expect(canAct(process)).toBe(true)
    })

    it('should return false for process with 0 action points', () => {
      process.stats.actionPoints = 0
      expect(canAct(process)).toBe(false)
    })

    it('should return false for dead process', () => {
      process.stats.health = 0
      expect(canAct(process)).toBe(false)
    })

    it('should return false for disabled process', () => {
      process.status = 'disabled'
      expect(canAct(process)).toBe(false)
    })

    it('should return false for destroyed process', () => {
      process.status = 'destroyed'
      expect(canAct(process)).toBe(false)
    })
  })

  describe('resetActionPoints', () => {
    it('should reset action points to max', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.actionPoints = 0

      resetActionPoints(process)

      expect(process.stats.actionPoints).toBe(process.stats.maxActionPoints)
    })
  })

  describe('consumeActionPoint', () => {
    it('should consume one action point and return true', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const initialAP = process.stats.actionPoints

      const result = consumeActionPoint(process)

      expect(result).toBe(true)
      expect(process.stats.actionPoints).toBe(initialAP - 1)
    })

    it('should return false when no action points available', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.actionPoints = 0

      const result = consumeActionPoint(process)

      expect(result).toBe(false)
      expect(process.stats.actionPoints).toBe(0)
    })
  })

  describe('applyDamage', () => {
    it('should reduce health by damage minus defense', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const initialHealth = process.stats.health
      const damage = 10

      const actualDamage = applyDamage(process, damage)

      const expectedDamage = Math.max(0, damage - process.stats.defense)
      expect(actualDamage).toBe(expectedDamage)
      expect(process.stats.health).toBe(initialHealth - expectedDamage)
    })

    it('should not reduce health below 0', () => {
      const process = createProcess('scout', { x: 0, y: 0 })

      applyDamage(process, 9999)

      expect(process.stats.health).toBe(0)
    })

    it('should set status to destroyed when health reaches 0', () => {
      const process = createProcess('scout', { x: 0, y: 0 })

      applyDamage(process, 9999)

      expect(process.status).toBe('destroyed')
    })

    it('should return 0 damage when defense exceeds damage', () => {
      const process = createProcess('purifier', { x: 0, y: 0 }) // Higher defense
      const lowDamage = 1

      const actualDamage = applyDamage(process, lowDamage)

      expect(actualDamage).toBe(0)
    })
  })

  describe('heal', () => {
    it('should increase health by heal amount', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.health = 20

      const healed = heal(process, 10)

      expect(healed).toBe(10)
      expect(process.stats.health).toBe(30)
    })

    it('should not heal above max health', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      const maxHealth = process.stats.maxHealth

      const healed = heal(process, 1000)

      expect(process.stats.health).toBe(maxHealth)
      expect(healed).toBe(0) // Was already at max
    })

    it('should return actual amount healed', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.stats.health = process.stats.maxHealth - 5

      const healed = heal(process, 100)

      expect(healed).toBe(5)
    })
  })

  describe('getEffectiveStat', () => {
    it('should return base stat when no status effects', () => {
      const process = createProcess('scout', { x: 0, y: 0 })

      expect(getEffectiveStat(process, 'attack')).toBe(process.stats.attack)
      expect(getEffectiveStat(process, 'defense')).toBe(process.stats.defense)
    })

    it('should add positive modifier from buff', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'buff-1',
        name: 'Attack Boost',
        type: 'buff',
        duration: 3,
        statModifiers: { attack: 5 },
      })

      expect(getEffectiveStat(process, 'attack')).toBe(process.stats.attack + 5)
    })

    it('should subtract negative modifier from debuff', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'debuff-1',
        name: 'Weaken',
        type: 'debuff',
        duration: 2,
        statModifiers: { defense: -2 },
      })

      expect(getEffectiveStat(process, 'defense')).toBe(process.stats.defense - 2)
    })

    it('should not return negative values', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'debuff-1',
        name: 'Massive Debuff',
        type: 'debuff',
        duration: 1,
        statModifiers: { defense: -9999 },
      })

      expect(getEffectiveStat(process, 'defense')).toBe(0)
    })

    it('should stack multiple status effects', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push(
        {
          id: 'buff-1',
          name: 'Attack Boost',
          type: 'buff',
          duration: 3,
          statModifiers: { attack: 5 },
        },
        {
          id: 'buff-2',
          name: 'Double Attack',
          type: 'buff',
          duration: 2,
          statModifiers: { attack: 3 },
        }
      )

      expect(getEffectiveStat(process, 'attack')).toBe(process.stats.attack + 8)
    })
  })

  describe('tickStatusEffects', () => {
    it('should decrement duration of all effects', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'buff-1',
        name: 'Test',
        type: 'buff',
        duration: 3,
      })

      tickStatusEffects(process)

      expect(process.statusEffects[0]?.duration).toBe(2)
    })

    it('should remove effects when duration reaches 0', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'buff-1',
        name: 'Test',
        type: 'buff',
        duration: 1,
      })

      tickStatusEffects(process)

      expect(process.statusEffects.length).toBe(0)
    })

    it('should not remove permanent effects (duration -1)', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push({
        id: 'permanent-1',
        name: 'Permanent',
        type: 'buff',
        duration: -1,
      })

      tickStatusEffects(process)
      tickStatusEffects(process)

      expect(process.statusEffects.length).toBe(1)
      expect(process.statusEffects[0]?.duration).toBe(-1)
    })

    it('should keep some effects and remove others', () => {
      const process = createProcess('scout', { x: 0, y: 0 })
      process.statusEffects.push(
        { id: 'expire', name: 'Expiring', type: 'buff', duration: 1 },
        { id: 'keep', name: 'Keep', type: 'buff', duration: 5 },
        { id: 'perm', name: 'Permanent', type: 'buff', duration: -1 }
      )

      tickStatusEffects(process)

      expect(process.statusEffects.length).toBe(2)
      expect(process.statusEffects.find(e => e.id === 'expire')).toBeUndefined()
      expect(process.statusEffects.find(e => e.id === 'keep')).toBeDefined()
      expect(process.statusEffects.find(e => e.id === 'perm')).toBeDefined()
    })
  })

  describe('ARCHETYPES', () => {
    it('should have scout archetype defined', () => {
      expect(ARCHETYPES.scout).toBeDefined()
      expect(ARCHETYPES.scout.name).toBe('Scout')
      expect(ARCHETYPES.scout.baseStats.speed).toBeGreaterThan(ARCHETYPES.purifier.baseStats.speed)
    })

    it('should have purifier archetype defined', () => {
      expect(ARCHETYPES.purifier).toBeDefined()
      expect(ARCHETYPES.purifier.name).toBe('Purifier')
      expect(ARCHETYPES.purifier.baseStats.attack).toBeGreaterThan(
        ARCHETYPES.scout.baseStats.attack
      )
    })
  })
})
