/**
 * Persistence module for The Substrate
 * Exports all save/load functionality
 */

export {
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
} from './SaveManager'

export type {
  SavedProgression,
  ExpeditionSave,
} from './SaveManager'
