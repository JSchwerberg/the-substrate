/**
 * IndexedDB-based save/load system for The Substrate
 * Handles persistent progression data and optional expedition saves
 */

import type { GameState, PersistentData, Upgrades, Difficulty } from '@game/state/gameStore'
import type { BehaviorRule } from '@core/models/behavior'
import { ImportDataSchema } from './schemas'
import { ZodError } from 'zod'

// ============= Save Data Types =============

export interface SavedProgression {
  version: number
  persistentData: PersistentData
  upgrades: Upgrades
  selectedDifficulty: Difficulty
  behaviorRules: BehaviorRule[]
  savedAt: number
}

export interface ExpeditionSave {
  version: number
  fullState: GameState
  savedAt: number
}

// ============= Constants =============

const DB_NAME = 'the-substrate-saves'
const DB_VERSION = 1
const STORE_PROGRESSION = 'progression'
const STORE_EXPEDITION = 'expedition'
const PROGRESSION_KEY = 'main'
const EXPEDITION_KEY = 'current'
const CURRENT_SAVE_VERSION = 1

// ============= Database Initialization =============

/**
 * Initialize and open the IndexedDB database
 * Creates object stores if they don't exist
 */
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message ?? 'Unknown error'}`))
    }

    request.onsuccess = () => {
      const db = request.result
      if (!db) {
        reject(new Error('Database opened but result is null'))
        return
      }
      resolve(db)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db) {
        reject(new Error('Database upgrade failed: result is null'))
        return
      }

      // Create progression store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_PROGRESSION)) {
        db.createObjectStore(STORE_PROGRESSION)
      }

      // Create expedition store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_EXPEDITION)) {
        db.createObjectStore(STORE_EXPEDITION)
      }
    }
  })
}

// ============= Progression Save/Load =============

/**
 * Save persistent progression data (upgrades, stats, etc.)
 * This is what persists between expeditions
 */
export async function saveProgression(state: GameState): Promise<void> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_PROGRESSION], 'readwrite')
      const store = transaction.objectStore(STORE_PROGRESSION)

      const saveData: SavedProgression = {
        version: CURRENT_SAVE_VERSION,
        persistentData: state.persistentData,
        upgrades: state.upgrades,
        selectedDifficulty: state.selectedDifficulty,
        behaviorRules: state.behaviorRules,
        savedAt: Date.now(),
      }

      const request = store.put(saveData, PROGRESSION_KEY)

      request.onerror = () => {
        reject(
          new Error(`Failed to save progression: ${request.error?.message ?? 'Unknown error'}`)
        )
      }

      request.onsuccess = () => {
        resolve()
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

/**
 * Load persistent progression data
 * Returns null if no save exists
 */
export async function loadProgression(): Promise<SavedProgression | null> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_PROGRESSION], 'readonly')
      const store = transaction.objectStore(STORE_PROGRESSION)
      const request = store.get(PROGRESSION_KEY)

      request.onerror = () => {
        reject(
          new Error(`Failed to load progression: ${request.error?.message ?? 'Unknown error'}`)
        )
      }

      request.onsuccess = () => {
        const result = request.result as SavedProgression | undefined
        resolve(result ?? null)
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

// ============= Expedition Save/Load =============

/**
 * Save full expedition state (mid-game save)
 * This is optional and allows players to resume an in-progress expedition
 */
export async function saveExpedition(state: GameState): Promise<void> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_EXPEDITION], 'readwrite')
      const store = transaction.objectStore(STORE_EXPEDITION)

      const saveData: ExpeditionSave = {
        version: CURRENT_SAVE_VERSION,
        fullState: state,
        savedAt: Date.now(),
      }

      const request = store.put(saveData, EXPEDITION_KEY)

      request.onerror = () => {
        reject(new Error(`Failed to save expedition: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve()
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

/**
 * Load saved expedition state
 * Returns null if no expedition save exists
 */
export async function loadExpedition(): Promise<ExpeditionSave | null> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_EXPEDITION], 'readonly')
      const store = transaction.objectStore(STORE_EXPEDITION)
      const request = store.get(EXPEDITION_KEY)

      request.onerror = () => {
        reject(new Error(`Failed to load expedition: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        const result = request.result as ExpeditionSave | undefined
        resolve(result ?? null)
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

/**
 * Delete the current expedition save
 * Used after claiming rewards or abandoning an expedition
 */
export async function clearExpeditionSave(): Promise<void> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_EXPEDITION], 'readwrite')
      const store = transaction.objectStore(STORE_EXPEDITION)
      const request = store.delete(EXPEDITION_KEY)

      request.onerror = () => {
        reject(
          new Error(`Failed to clear expedition save: ${request.error?.message ?? 'Unknown error'}`)
        )
      }

      request.onsuccess = () => {
        resolve()
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

/**
 * Check if a saved expedition exists
 */
export async function hasSavedExpedition(): Promise<boolean> {
  try {
    const save = await loadExpedition()
    return save !== null
  } catch (error) {
    console.error('Error checking for saved expedition:', error)
    return false
  }
}

// ============= Utility Functions =============

/**
 * Clear all save data (for testing or reset functionality)
 * WARNING: This deletes all progress!
 */
export async function clearAllSaves(): Promise<void> {
  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_PROGRESSION, STORE_EXPEDITION], 'readwrite')

      const progressionStore = transaction.objectStore(STORE_PROGRESSION)
      const expeditionStore = transaction.objectStore(STORE_EXPEDITION)

      progressionStore.clear()
      expeditionStore.clear()

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Transaction failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}

/**
 * Export save data as JSON (for backup/sharing)
 */
export async function exportSaveData(): Promise<string> {
  const progression = await loadProgression()
  const expedition = await loadExpedition()

  return JSON.stringify(
    {
      progression,
      expedition,
      exportedAt: Date.now(),
    },
    null,
    2
  )
}

/**
 * Import save data from JSON (for restore/sharing)
 * Validates data structure to prevent injection attacks
 */
export async function importSaveData(jsonData: string): Promise<void> {
  // Parse JSON first
  let rawData: unknown
  try {
    rawData = JSON.parse(jsonData)
  } catch (error) {
    throw new Error(
      `Failed to parse save data: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    )
  }

  // Validate against schema to prevent injection attacks
  let data
  try {
    data = ImportDataSchema.parse(rawData)
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Invalid save data format: ${issues}`)
    }
    throw new Error('Save data validation failed')
  }

  const db = await initDatabase()

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_PROGRESSION, STORE_EXPEDITION], 'readwrite')
      const progressionStore = transaction.objectStore(STORE_PROGRESSION)
      const expeditionStore = transaction.objectStore(STORE_EXPEDITION)

      if (data.progression) {
        progressionStore.put(data.progression, PROGRESSION_KEY)
      }

      if (data.expedition) {
        expeditionStore.put(data.expedition, EXPEDITION_KEY)
      }

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        db.close()
        reject(new Error(`Import failed: ${transaction.error?.message ?? 'Unknown error'}`))
      }
    } catch (error) {
      db.close()
      reject(error)
    }
  })
}
