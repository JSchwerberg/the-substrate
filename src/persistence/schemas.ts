/**
 * Zod schemas for validating save data
 * Prevents JSON injection and ensures data integrity on import
 */

import { z } from 'zod'

// ============= Basic Types =============

export const DifficultySchema = z.enum(['easy', 'normal', 'hard'])

export const ExpeditionResultSchema = z.enum(['active', 'victory', 'defeat'])

// ============= Resources =============

export const ResourcesSchema = z.object({
  cycles: z.number().int().min(0),
  memory: z.number().int().min(0),
  energy: z.number().int().min(0),
})

export const ResourceCapacitySchema = z.object({
  maxCycles: z.number().int().min(0),
  maxMemory: z.number().int().min(0),
  maxEnergy: z.number().int().min(0),
})

// ============= Expedition Score =============

export const ExpeditionScoreSchema = z.object({
  cachesCollected: z.number().int().min(0),
  malwareDestroyed: z.number().int().min(0),
  ticksSurvived: z.number().int().min(0),
})

// ============= Persistent Data & Upgrades =============

export const PersistentDataSchema = z.object({
  totalData: z.number().int().min(0),
  expeditionsCompleted: z.number().int().min(0),
  expeditionsLost: z.number().int().min(0),
  totalMalwareDestroyed: z.number().int().min(0),
})

export const UpgradesSchema = z.object({
  maxHealth: z.number().int().min(0),
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  startingCycles: z.number().int().min(0),
})

// ============= Behavior Rules =============

export const ConditionTypeSchema = z.enum([
  'always',
  'health_below',
  'health_above',
  'enemy_in_range',
  'enemy_adjacent',
  'no_enemy_visible',
  'ally_in_range',
  'ally_health_below',
  'at_position',
  'near_exit',
  'near_cache',
  'is_idle',
  'is_moving',
  'has_action_points',
])

export const ConditionSchema = z.object({
  type: ConditionTypeSchema,
  value: z.number().optional(),
  range: z.number().optional(),
})

export const ActionTypeSchema = z.enum([
  'attack_nearest',
  'attack_weakest',
  'attack_strongest',
  'move_to_nearest_enemy',
  'move_to_nearest_cache',
  'move_to_exit',
  'retreat_to_spawn',
  'flee_from_enemy',
  'follow_ally',
  'hold_position',
  'explore',
  'heal_ally',
])

export const GridPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
})

export const ActionSchema = z.object({
  type: ActionTypeSchema,
  targetId: z.string().optional(),
  position: GridPositionSchema.optional(),
})

export const BehaviorRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priority: z.number().int().min(0),
  condition: ConditionSchema,
  action: ActionSchema,
  enabled: z.boolean(),
  cooldown: z.number().int().min(0).optional(),
  lastTriggered: z.number().int().min(0).optional(),
})

// ============= Campaign Schema =============

export const VisibilityStateSchema = z.enum(['hidden', 'revealed', 'visible'])

export const TileTypeSchema = z.enum([
  'empty',
  'blocked',
  'corruption',
  'data_cache',
  'spawn_point',
  'exit_point',
])

export const CampaignTileSchema = z.object({
  type: TileTypeSchema,
  visibility: VisibilityStateSchema,
  corruptionLevel: z.number().min(0).max(100),
  entityIds: z.array(z.string()),
})

export const CampaignGridSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  tiles: z.array(z.array(CampaignTileSchema)),
})

export const SectorStatusSchema = z.enum(['unexplored', 'in_progress', 'cleared', 'lost'])

export const SectorSizeSchema = z.enum(['small', 'medium', 'large'])

export const SectorDifficultySchema = z.enum(['trivial', 'easy', 'normal', 'hard', 'extreme'])

export const SectorConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: SectorSizeSchema,
  difficulty: SectorDifficultySchema,
  seed: z.number().int(),
  corruptionDensity: z.number().min(0).max(1),
  malwareDensity: z.number().min(0).max(1),
  cacheCount: z.number().int().min(0),
})

export const SectorStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: SectorStatusSchema,
  config: SectorConfigSchema,
  grid: CampaignGridSchema.nullable(),
  spawnPoints: z.array(GridPositionSchema),
  killedMalwareIds: z.array(z.string()),
  corruptionPercent: z.number().min(0).max(100),
  mapPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
})

export const SectorConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
})

export const CampaignSchema = z.object({
  id: z.string(),
  sectors: z.array(SectorStateSchema),
  connections: z.array(SectorConnectionSchema),
  selectedSectorId: z.string().nullable(),
  activeSectorId: z.string().nullable(),
  processPool: z.array(z.lazy(() => ProcessSchema)),
  createdAt: z.number().int().min(0),
  lastPlayedAt: z.number().int().min(0),
})

// ============= Saved Progression =============

export const SavedProgressionSchema = z.object({
  version: z.number().int().min(1),
  persistentData: PersistentDataSchema,
  upgrades: UpgradesSchema,
  selectedDifficulty: DifficultySchema,
  behaviorRules: z.array(BehaviorRuleSchema),
  campaign: CampaignSchema.nullable(),
  tutorialCompleted: z.boolean().default(false),
  savedAt: z.number().int().min(0),
})

// ============= Expedition State (subset of GameState that's serializable) =============

// Process types for validation
export const ProcessTypeSchema = z.enum(['scout', 'purifier'])

export const ProcessSchema = z.object({
  id: z.string().min(1),
  type: ProcessTypeSchema,
  name: z.string(),
  position: GridPositionSchema,
  health: z.number().int(),
  maxHealth: z.number().int().min(1),
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  moveRange: z.number().int().min(0),
  attackRange: z.number().int().min(0),
  visibilityRange: z.number().int().min(0),
  path: z.array(GridPositionSchema).nullable(),
  pathIndex: z.number().int().min(0),
})

// Malware types for validation
export const MalwareTypeSchema = z.enum(['worm', 'trojan', 'rootkit', 'logic_bomb'])
export const MalwareStateSchema = z.enum(['dormant', 'active', 'alerted'])

export const MalwareSchema = z.object({
  id: z.string().min(1),
  type: MalwareTypeSchema,
  position: GridPositionSchema,
  health: z.number().int(),
  maxHealth: z.number().int().min(1),
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  state: MalwareStateSchema,
  aggroTarget: z.string().nullable(),
  replicationCounter: z.number().int().min(0).optional(),
  detonationTimer: z.number().int().min(0).optional(),
})

// Tile schema for old expedition saves
export const TileSchema = z.object({
  type: TileTypeSchema,
  visible: z.boolean(),
  explored: z.boolean(),
  walkable: z.boolean(),
})

export const SectorSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  seed: z.number(),
  tiles: z.array(z.array(TileSchema)),
  spawnPoint: GridPositionSchema,
  exitPoint: GridPositionSchema,
  cachePositions: z.array(GridPositionSchema),
})

// Full serializable expedition state
export const ExpeditionFullStateSchema = z.object({
  resources: ResourcesSchema,
  capacity: ResourceCapacitySchema,
  currentSector: SectorSchema.nullable(),
  expeditionActive: z.boolean(),
  expeditionResult: ExpeditionResultSchema,
  expeditionScore: ExpeditionScoreSchema,
  processes: z.array(ProcessSchema),
  malware: z.array(MalwareSchema),
  selectedProcessId: z.string().nullable(),
  currentTick: z.number().int().min(0),
  isPaused: z.boolean(),
  combatLog: z.array(z.string()),
  persistentData: PersistentDataSchema,
  upgrades: UpgradesSchema,
  selectedDifficulty: DifficultySchema,
  behaviorRules: z.array(BehaviorRuleSchema),
})

export const ExpeditionSaveSchema = z.object({
  version: z.number().int().min(1),
  fullState: ExpeditionFullStateSchema,
  savedAt: z.number().int().min(0),
})

// ============= Import Data Schema =============

export const ImportDataSchema = z.object({
  progression: SavedProgressionSchema.nullable().optional(),
  expedition: ExpeditionSaveSchema.nullable().optional(),
  exportedAt: z.number().int().min(0).optional(),
})

// ============= Type exports =============

export type ValidatedSavedProgression = z.infer<typeof SavedProgressionSchema>
export type ValidatedExpeditionSave = z.infer<typeof ExpeditionSaveSchema>
export type ValidatedImportData = z.infer<typeof ImportDataSchema>
