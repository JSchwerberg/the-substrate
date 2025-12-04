import { describe, it, expect } from 'vitest'
import {
  initDatabase,
  saveProgression,
  loadProgression,
  saveExpedition,
  loadExpedition,
  clearExpeditionSave,
  hasSavedExpedition,
  clearAllSaves,
  exportSaveData,
  importSaveData,
} from '../SaveManager'
import {
  createMockGameState,
  createMockSerializableState,
  createMockPersistentData,
  createMockUpgrades,
  createMockBehaviorRules,
} from './fixtures'

const DB_NAME = 'the-substrate-saves'
const STORE_PROGRESSION = 'progression'
const STORE_EXPEDITION = 'expedition'

describe('SaveManager', () => {
  describe('initDatabase', () => {
    it('should create database with both object stores on first init', async () => {
      const db = await initDatabase()

      expect(db).toBeDefined()
      expect(db.name).toBe(DB_NAME)
      expect(db.objectStoreNames.contains(STORE_PROGRESSION)).toBe(true)
      expect(db.objectStoreNames.contains(STORE_EXPEDITION)).toBe(true)

      db.close()
    })

    it('should return existing database without recreating stores', async () => {
      const db1 = await initDatabase()
      db1.close()

      const db2 = await initDatabase()
      expect(db2.name).toBe(DB_NAME)
      expect(db2.objectStoreNames.length).toBe(2)

      db2.close()
    })

    it('should handle concurrent initialization calls', async () => {
      const promises = [initDatabase(), initDatabase(), initDatabase()]
      const databases = await Promise.all(promises)

      databases.forEach(db => {
        expect(db.name).toBe(DB_NAME)
        db.close()
      })
    })
  })

  describe('saveProgression', () => {
    it('should save progression data with correct structure', async () => {
      const state = createMockGameState()

      await saveProgression(state)

      const loaded = await loadProgression()
      expect(loaded).not.toBeNull()
      expect(loaded!.version).toBe(1)
      expect(loaded!.savedAt).toBeGreaterThan(0)
      expect(loaded!.persistentData).toEqual(state.persistentData)
      expect(loaded!.upgrades).toEqual(state.upgrades)
      expect(loaded!.selectedDifficulty).toBe(state.selectedDifficulty)
      expect(loaded!.behaviorRules).toEqual(state.behaviorRules)
    })

    it('should overwrite existing progression save', async () => {
      const state1 = createMockGameState({
        persistentData: createMockPersistentData({ totalData: 100 }),
      })
      const state2 = createMockGameState({
        persistentData: createMockPersistentData({ totalData: 500 }),
      })

      await saveProgression(state1)
      await saveProgression(state2)

      const loaded = await loadProgression()
      expect(loaded!.persistentData.totalData).toBe(500)
    })

    it('should generate new savedAt timestamp on each save', async () => {
      const state = createMockGameState()

      await saveProgression(state)
      const loaded1 = await loadProgression()
      const timestamp1 = loaded1!.savedAt

      // Wait a small amount to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      await saveProgression(state)
      const loaded2 = await loadProgression()
      const timestamp2 = loaded2!.savedAt

      expect(timestamp2).toBeGreaterThan(timestamp1)
    })
  })

  describe('loadProgression', () => {
    it('should return null when no save exists', async () => {
      const loaded = await loadProgression()
      expect(loaded).toBeNull()
    })

    it('should return complete saved progression data', async () => {
      const state = createMockGameState({
        persistentData: createMockPersistentData({
          totalData: 999,
          expeditionsCompleted: 10,
        }),
        upgrades: createMockUpgrades({
          maxHealth: 5,
          attack: 3,
        }),
        selectedDifficulty: 'hard',
      })

      await saveProgression(state)
      const loaded = await loadProgression()

      expect(loaded).not.toBeNull()
      expect(loaded!.persistentData.totalData).toBe(999)
      expect(loaded!.persistentData.expeditionsCompleted).toBe(10)
      expect(loaded!.upgrades.maxHealth).toBe(5)
      expect(loaded!.upgrades.attack).toBe(3)
      expect(loaded!.selectedDifficulty).toBe('hard')
    })
  })

  describe('saveExpedition', () => {
    it('should save complete expedition state', async () => {
      // Use serializable state (no functions) for IndexedDB
      const state = createMockSerializableState({
        currentTick: 42,
        expeditionActive: true,
        combatLog: ['Log 1', 'Log 2', 'Log 3'],
      })

      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])

      const loaded = await loadExpedition()
      expect(loaded).not.toBeNull()
      expect(loaded!.version).toBe(1)
      expect(loaded!.savedAt).toBeGreaterThan(0)
      expect(loaded!.fullState.currentTick).toBe(42)
      expect(loaded!.fullState.expeditionActive).toBe(true)
      expect(loaded!.fullState.combatLog).toEqual(['Log 1', 'Log 2', 'Log 3'])
    })

    it('should overwrite existing expedition save', async () => {
      const state1 = createMockSerializableState({ currentTick: 10 })
      const state2 = createMockSerializableState({ currentTick: 99 })

      await saveExpedition(state1 as unknown as Parameters<typeof saveExpedition>[0])
      await saveExpedition(state2 as unknown as Parameters<typeof saveExpedition>[0])

      const loaded = await loadExpedition()
      expect(loaded!.fullState.currentTick).toBe(99)
    })
  })

  describe('loadExpedition', () => {
    it('should return null when no expedition save exists', async () => {
      const loaded = await loadExpedition()
      expect(loaded).toBeNull()
    })

    it('should return complete expedition state', async () => {
      const state = createMockSerializableState({
        expeditionScore: {
          cachesCollected: 15,
          malwareDestroyed: 8,
          ticksSurvived: 200,
        },
      })

      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])
      const loaded = await loadExpedition()

      expect(loaded).not.toBeNull()
      expect(loaded!.fullState.expeditionScore.cachesCollected).toBe(15)
      expect(loaded!.fullState.expeditionScore.malwareDestroyed).toBe(8)
      expect(loaded!.fullState.expeditionScore.ticksSurvived).toBe(200)
    })

    it('should preserve array data', async () => {
      const state = createMockSerializableState({
        combatLog: ['Entry 1', 'Entry 2', 'Entry 3'],
        behaviorRules: createMockBehaviorRules(),
      })

      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])
      const loaded = await loadExpedition()

      expect(loaded!.fullState.combatLog).toHaveLength(3)
      expect(loaded!.fullState.behaviorRules).toHaveLength(2)
    })
  })

  describe('clearExpeditionSave', () => {
    it('should delete existing expedition save', async () => {
      const state = createMockSerializableState()
      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])

      expect(await loadExpedition()).not.toBeNull()

      await clearExpeditionSave()

      expect(await loadExpedition()).toBeNull()
    })

    it('should succeed when no expedition exists', async () => {
      // Should not throw
      await expect(clearExpeditionSave()).resolves.toBeUndefined()
    })

    it('should not delete progression data', async () => {
      const state = createMockGameState({
        persistentData: createMockPersistentData({ totalData: 777 }),
      })
      const serializableState = createMockSerializableState({
        persistentData: createMockPersistentData({ totalData: 777 }),
      })

      await saveProgression(state)
      await saveExpedition(serializableState as unknown as Parameters<typeof saveExpedition>[0])
      await clearExpeditionSave()

      const progression = await loadProgression()
      expect(progression).not.toBeNull()
      expect(progression!.persistentData.totalData).toBe(777)
    })
  })

  describe('hasSavedExpedition', () => {
    it('should return true when expedition exists', async () => {
      const state = createMockSerializableState()
      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])

      const result = await hasSavedExpedition()
      expect(result).toBe(true)
    })

    it('should return false when no expedition exists', async () => {
      const result = await hasSavedExpedition()
      expect(result).toBe(false)
    })

    it('should return false after expedition is cleared', async () => {
      const state = createMockSerializableState()
      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])
      await clearExpeditionSave()

      const result = await hasSavedExpedition()
      expect(result).toBe(false)
    })
  })

  describe('clearAllSaves', () => {
    it('should clear both progression and expedition saves', async () => {
      const state = createMockGameState()
      const serializableState = createMockSerializableState()
      await saveProgression(state)
      await saveExpedition(serializableState as unknown as Parameters<typeof saveExpedition>[0])

      expect(await loadProgression()).not.toBeNull()
      expect(await loadExpedition()).not.toBeNull()

      await clearAllSaves()

      expect(await loadProgression()).toBeNull()
      expect(await loadExpedition()).toBeNull()
    })

    it('should succeed on empty database', async () => {
      await expect(clearAllSaves()).resolves.toBeUndefined()
    })
  })

  describe('exportSaveData', () => {
    it('should export both saves as JSON', async () => {
      const state = createMockGameState({
        persistentData: createMockPersistentData({ totalData: 888 }),
      })
      const serializableState = createMockSerializableState({
        persistentData: createMockPersistentData({ totalData: 888 }),
        currentTick: 55,
      })

      await saveProgression(state)
      await saveExpedition(serializableState as unknown as Parameters<typeof saveExpedition>[0])

      const json = await exportSaveData()
      const parsed = JSON.parse(json)

      expect(parsed.progression).not.toBeNull()
      expect(parsed.expedition).not.toBeNull()
      expect(parsed.exportedAt).toBeGreaterThan(0)
      expect(parsed.progression.persistentData.totalData).toBe(888)
      expect(parsed.expedition.fullState.currentTick).toBe(55)
    })

    it('should handle null saves in export', async () => {
      const json = await exportSaveData()
      const parsed = JSON.parse(json)

      expect(parsed.progression).toBeNull()
      expect(parsed.expedition).toBeNull()
      expect(parsed.exportedAt).toBeGreaterThan(0)
    })

    it('should export only progression when expedition is null', async () => {
      const state = createMockGameState()
      await saveProgression(state)

      const json = await exportSaveData()
      const parsed = JSON.parse(json)

      expect(parsed.progression).not.toBeNull()
      expect(parsed.expedition).toBeNull()
    })

    it('should return valid parseable JSON', async () => {
      const state = createMockGameState()
      await saveProgression(state)

      const json = await exportSaveData()

      expect(() => JSON.parse(json)).not.toThrow()
    })
  })

  describe('importSaveData', () => {
    it('should import both progression and expedition', async () => {
      const exportData = {
        progression: {
          version: 1,
          persistentData: createMockPersistentData({ totalData: 1234 }),
          upgrades: createMockUpgrades({ maxHealth: 10 }),
          selectedDifficulty: 'hard' as const,
          behaviorRules: createMockBehaviorRules(),
          campaign: null,
          savedAt: Date.now(),
        },
        expedition: {
          version: 1,
          fullState: createMockSerializableState({ currentTick: 77 }),
          savedAt: Date.now(),
        },
      }

      await importSaveData(JSON.stringify(exportData))

      const progression = await loadProgression()
      const expedition = await loadExpedition()

      expect(progression).not.toBeNull()
      expect(expedition).not.toBeNull()
      expect(progression!.persistentData.totalData).toBe(1234)
      expect(expedition!.fullState.currentTick).toBe(77)
    })

    it('should import only progression when expedition is null', async () => {
      const exportData = {
        progression: {
          version: 1,
          persistentData: createMockPersistentData({ totalData: 555 }),
          upgrades: createMockUpgrades(),
          selectedDifficulty: 'easy' as const,
          behaviorRules: [],
          campaign: null,
          savedAt: Date.now(),
        },
        expedition: null,
      }

      await importSaveData(JSON.stringify(exportData))

      const progression = await loadProgression()
      const expedition = await loadExpedition()

      expect(progression).not.toBeNull()
      expect(progression!.persistentData.totalData).toBe(555)
      expect(expedition).toBeNull()
    })

    it('should reject on invalid JSON', async () => {
      await expect(importSaveData('{invalid json')).rejects.toThrow('Failed to parse save data')
    })

    it('should reject invalid progression data structure', async () => {
      const invalidData = {
        progression: {
          version: 'not a number', // Should be number
          persistentData: { totalData: 100 },
        },
      }

      await expect(importSaveData(JSON.stringify(invalidData))).rejects.toThrow(
        'Invalid save data format'
      )
    })

    it('should reject missing required fields in progression', async () => {
      const invalidData = {
        progression: {
          version: 1,
          // Missing persistentData, upgrades, etc.
        },
      }

      await expect(importSaveData(JSON.stringify(invalidData))).rejects.toThrow(
        'Invalid save data format'
      )
    })

    it('should reject invalid difficulty value', async () => {
      const invalidData = {
        progression: {
          version: 1,
          persistentData: createMockPersistentData(),
          upgrades: createMockUpgrades(),
          selectedDifficulty: 'impossible', // Invalid value
          behaviorRules: [],
          savedAt: Date.now(),
        },
      }

      await expect(importSaveData(JSON.stringify(invalidData))).rejects.toThrow(
        'Invalid save data format'
      )
    })

    it('should reject negative numbers where not allowed', async () => {
      const invalidData = {
        progression: {
          version: 1,
          persistentData: {
            totalData: -100,
            expeditionsCompleted: 0,
            expeditionsLost: 0,
            totalMalwareDestroyed: 0,
          },
          upgrades: createMockUpgrades(),
          selectedDifficulty: 'normal',
          behaviorRules: [],
          savedAt: Date.now(),
        },
      }

      await expect(importSaveData(JSON.stringify(invalidData))).rejects.toThrow(
        'Invalid save data format'
      )
    })

    it('should reject invalid behavior rule structure', async () => {
      const invalidData = {
        progression: {
          version: 1,
          persistentData: createMockPersistentData(),
          upgrades: createMockUpgrades(),
          selectedDifficulty: 'normal',
          behaviorRules: [
            {
              id: 'test',
              name: 'Test',
              priority: 1,
              condition: { type: 'invalid_condition_type' }, // Invalid
              action: { type: 'attack_nearest' },
              enabled: true,
            },
          ],
          savedAt: Date.now(),
        },
      }

      await expect(importSaveData(JSON.stringify(invalidData))).rejects.toThrow(
        'Invalid save data format'
      )
    })

    it('should accept valid empty data', async () => {
      const validEmptyData = {
        progression: null,
        expedition: null,
      }

      await expect(importSaveData(JSON.stringify(validEmptyData))).resolves.toBeUndefined()
    })

    it('should overwrite existing saves', async () => {
      // Save initial data
      const state = createMockGameState({
        persistentData: createMockPersistentData({ totalData: 100 }),
      })
      await saveProgression(state)

      // Import new data
      const exportData = {
        progression: {
          version: 1,
          persistentData: createMockPersistentData({ totalData: 9999 }),
          upgrades: createMockUpgrades(),
          selectedDifficulty: 'normal' as const,
          behaviorRules: [],
          campaign: null,
          savedAt: Date.now(),
        },
      }

      await importSaveData(JSON.stringify(exportData))

      const loaded = await loadProgression()
      expect(loaded!.persistentData.totalData).toBe(9999)
    })
  })

  describe('data integrity', () => {
    it('should preserve data types on save/load round-trip', async () => {
      const state = createMockSerializableState({
        persistentData: {
          totalData: 12345,
          expeditionsCompleted: 10,
          expeditionsLost: 3,
          totalMalwareDestroyed: 100,
        },
        currentTick: 50,
        isPaused: false,
        expeditionActive: true,
      })

      await saveExpedition(state as unknown as Parameters<typeof saveExpedition>[0])
      const loaded = await loadExpedition()

      expect(typeof loaded!.fullState.persistentData.totalData).toBe('number')
      expect(typeof loaded!.fullState.currentTick).toBe('number')
      expect(typeof loaded!.fullState.isPaused).toBe('boolean')
      expect(typeof loaded!.fullState.expeditionActive).toBe('boolean')
    })

    it('should preserve array ordering', async () => {
      const rules = [
        {
          id: '1',
          name: 'First',
          priority: 1,
          condition: { type: 'always' as const },
          action: { type: 'attack_nearest' as const },
          enabled: true,
        },
        {
          id: '2',
          name: 'Second',
          priority: 2,
          condition: { type: 'always' as const },
          action: { type: 'explore' as const },
          enabled: true,
        },
        {
          id: '3',
          name: 'Third',
          priority: 3,
          condition: { type: 'always' as const },
          action: { type: 'retreat_to_spawn' as const },
          enabled: false,
        },
      ]

      const state = createMockGameState({ behaviorRules: rules })
      await saveProgression(state)

      const loaded = await loadProgression()

      expect(loaded!.behaviorRules[0]!.id).toBe('1')
      expect(loaded!.behaviorRules[1]!.id).toBe('2')
      expect(loaded!.behaviorRules[2]!.id).toBe('3')
    })
  })
})
