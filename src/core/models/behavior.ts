/**
 * Behavior rule definitions for process automation
 */

import { GridPosition } from './grid'

// ============= Conditions =============

export type ConditionType =
  | 'always'
  | 'health_below'
  | 'health_above'
  | 'enemy_in_range'
  | 'enemy_adjacent'
  | 'no_enemy_visible'
  | 'ally_in_range'
  | 'ally_health_below'
  | 'at_position'
  | 'near_exit'
  | 'near_cache'
  | 'is_idle'
  | 'is_moving'
  | 'has_action_points'

export interface Condition {
  type: ConditionType
  value?: number // For threshold conditions like health_below
  range?: number // For range-based conditions
}

// ============= Actions =============

export type ActionType =
  | 'attack_nearest'
  | 'attack_weakest'
  | 'attack_strongest'
  | 'move_to_nearest_enemy'
  | 'move_to_nearest_cache'
  | 'move_to_exit'
  | 'retreat_to_spawn'
  | 'flee_from_enemy'
  | 'follow_ally'
  | 'hold_position'
  | 'explore'
  | 'heal_ally'

export interface Action {
  type: ActionType
  targetId?: string // For specific target actions
  position?: GridPosition // For position-based actions
}

// ============= Behavior Rules =============

export interface BehaviorRule {
  id: string
  name: string
  priority: number // Lower = higher priority
  condition: Condition
  action: Action
  enabled: boolean
  cooldown?: number // Ticks before this rule can trigger again
  lastTriggered?: number // Tick when last triggered
}

// ============= Preset Templates =============

export type RuleTemplate = 'aggressive' | 'defensive' | 'explorer' | 'support'

export function createDefaultRules(template: RuleTemplate): BehaviorRule[] {
  switch (template) {
    case 'aggressive':
      return [
        {
          id: 'aggro-1',
          name: 'Attack Adjacent',
          priority: 1,
          condition: { type: 'enemy_adjacent' },
          action: { type: 'attack_nearest' },
          enabled: true,
        },
        {
          id: 'aggro-2',
          name: 'Chase Enemy',
          priority: 2,
          condition: { type: 'enemy_in_range', range: 4 },
          action: { type: 'move_to_nearest_enemy' },
          enabled: true,
        },
        {
          id: 'aggro-3',
          name: 'Explore',
          priority: 3,
          condition: { type: 'is_idle' },
          action: { type: 'explore' },
          enabled: true,
        },
      ]

    case 'defensive':
      return [
        {
          id: 'def-1',
          name: 'Retreat When Low',
          priority: 1,
          condition: { type: 'health_below', value: 30 },
          action: { type: 'retreat_to_spawn' },
          enabled: true,
        },
        {
          id: 'def-2',
          name: 'Attack Adjacent',
          priority: 2,
          condition: { type: 'enemy_adjacent' },
          action: { type: 'attack_nearest' },
          enabled: true,
        },
        {
          id: 'def-3',
          name: 'Hold Position',
          priority: 3,
          condition: { type: 'always' },
          action: { type: 'hold_position' },
          enabled: true,
        },
      ]

    case 'explorer':
      return [
        {
          id: 'exp-1',
          name: 'Flee When Low',
          priority: 1,
          condition: { type: 'health_below', value: 50 },
          action: { type: 'flee_from_enemy' },
          enabled: true,
        },
        {
          id: 'exp-2',
          name: 'Collect Cache',
          priority: 2,
          condition: { type: 'near_cache', range: 3 },
          action: { type: 'move_to_nearest_cache' },
          enabled: true,
        },
        {
          id: 'exp-3',
          name: 'Explore',
          priority: 3,
          condition: { type: 'always' },
          action: { type: 'explore' },
          enabled: true,
        },
      ]

    case 'support':
      return [
        {
          id: 'sup-1',
          name: 'Help Wounded Ally',
          priority: 1,
          condition: { type: 'ally_health_below', value: 50 },
          action: { type: 'follow_ally' },
          enabled: true,
        },
        {
          id: 'sup-2',
          name: 'Attack if Safe',
          priority: 2,
          condition: { type: 'enemy_adjacent' },
          action: { type: 'attack_weakest' },
          enabled: true,
        },
        {
          id: 'sup-3',
          name: 'Follow Ally',
          priority: 3,
          condition: { type: 'always' },
          action: { type: 'follow_ally' },
          enabled: true,
        },
      ]
  }
}

// ============= Factory =============

let ruleIdCounter = 0

export function createRule(
  name: string,
  condition: Condition,
  action: Action,
  priority: number = 50
): BehaviorRule {
  return {
    id: `rule-${++ruleIdCounter}`,
    name,
    priority,
    condition,
    action,
    enabled: true,
  }
}

// ============= Utility =============

export function sortRulesByPriority(rules: BehaviorRule[]): BehaviorRule[] {
  return [...rules].sort((a, b) => a.priority - b.priority)
}

export function canTriggerRule(rule: BehaviorRule, currentTick: number): boolean {
  if (!rule.enabled) return false
  if (!rule.cooldown) return true
  if (rule.lastTriggered === undefined) return true
  return currentTick - rule.lastTriggered >= rule.cooldown
}
