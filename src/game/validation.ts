/**
 * Input validation for game state actions
 * Prevents invalid data from corrupting game state
 */

import type { BehaviorRule, ConditionType, ActionType } from '@core/models/behavior'
import type { Difficulty } from './state/gameStore'
import type { ProcessArchetype } from '@core/models/process'

// Valid enum values
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
const VALID_ARCHETYPES: ProcessArchetype[] = ['scout', 'purifier']
const VALID_CONDITION_TYPES: ConditionType[] = [
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
]
const VALID_ACTION_TYPES: ActionType[] = [
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
]

// ============= Validation Functions =============

export function isValidDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && VALID_DIFFICULTIES.includes(value as Difficulty)
}

export function isValidArchetype(value: unknown): value is ProcessArchetype {
  return typeof value === 'string' && VALID_ARCHETYPES.includes(value as ProcessArchetype)
}

export function isValidConditionType(value: unknown): value is ConditionType {
  return typeof value === 'string' && VALID_CONDITION_TYPES.includes(value as ConditionType)
}

export function isValidActionType(value: unknown): value is ActionType {
  return typeof value === 'string' && VALID_ACTION_TYPES.includes(value as ActionType)
}

export function isValidBehaviorRule(rule: unknown): rule is BehaviorRule {
  if (!rule || typeof rule !== 'object') return false

  const r = rule as Record<string, unknown>

  // Required string fields
  if (typeof r.id !== 'string' || r.id.length === 0) return false
  if (typeof r.name !== 'string' || r.name.length === 0) return false

  // Required number field
  if (typeof r.priority !== 'number' || !Number.isInteger(r.priority) || r.priority < 0)
    return false

  // Required boolean field
  if (typeof r.enabled !== 'boolean') return false

  // Condition validation
  if (!r.condition || typeof r.condition !== 'object') return false
  const condition = r.condition as Record<string, unknown>
  if (!isValidConditionType(condition.type)) return false
  if (condition.value !== undefined && typeof condition.value !== 'number') return false
  if (condition.range !== undefined && typeof condition.range !== 'number') return false

  // Action validation
  if (!r.action || typeof r.action !== 'object') return false
  const action = r.action as Record<string, unknown>
  if (!isValidActionType(action.type)) return false
  if (action.targetId !== undefined && typeof action.targetId !== 'string') return false
  if (action.position !== undefined) {
    const pos = action.position as Record<string, unknown>
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return false
  }

  // Optional fields
  if (r.cooldown !== undefined && (typeof r.cooldown !== 'number' || r.cooldown < 0)) return false
  if (r.lastTriggered !== undefined && (typeof r.lastTriggered !== 'number' || r.lastTriggered < 0))
    return false

  return true
}

export function isValidSpawnIndex(index: unknown, maxSpawnPoints: number): index is number {
  return (
    typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < maxSpawnPoints
  )
}

// ============= Validation with Error Messages =============

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateDifficulty(value: unknown): ValidationResult {
  if (isValidDifficulty(value)) {
    return { valid: true }
  }
  return {
    valid: false,
    error: `Invalid difficulty: ${String(value)}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
  }
}

export function validateArchetype(value: unknown): ValidationResult {
  if (isValidArchetype(value)) {
    return { valid: true }
  }
  return {
    valid: false,
    error: `Invalid archetype: ${String(value)}. Must be one of: ${VALID_ARCHETYPES.join(', ')}`,
  }
}

export function validateBehaviorRule(rule: unknown): ValidationResult {
  if (isValidBehaviorRule(rule)) {
    return { valid: true }
  }
  return { valid: false, error: 'Invalid behavior rule structure' }
}

export function validateBehaviorRules(rules: unknown): ValidationResult {
  if (!Array.isArray(rules)) {
    return { valid: false, error: 'Rules must be an array' }
  }

  for (let i = 0; i < rules.length; i++) {
    const result = validateBehaviorRule(rules[i])
    if (!result.valid) {
      return { valid: false, error: `Invalid rule at index ${i}: ${result.error}` }
    }
  }

  return { valid: true }
}
