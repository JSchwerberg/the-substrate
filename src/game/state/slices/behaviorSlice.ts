/**
 * Behavior rules slice - manages process behavior configuration
 */

import { StateCreator } from 'zustand'
import { BehaviorRule, RuleTemplate, createDefaultRules } from '@core/models/behavior'
import { isValidBehaviorRule } from '@game/validation'
import type { BehaviorSlice } from '../types'
import type { GameState } from '../gameStore'

export const createBehaviorSlice: StateCreator<GameState, [], [], BehaviorSlice> = set => ({
  // Initial state
  behaviorRules: createDefaultRules('aggressive'),

  // Set behavior rules (with validation)
  setBehaviorRules: (rules: BehaviorRule[]) => {
    // Validate each rule at runtime to catch corrupted data
    const validRules = rules.filter(rule => isValidBehaviorRule(rule))
    if (validRules.length !== rules.length) {
      console.warn(`Filtered ${rules.length - validRules.length} invalid behavior rules`)
    }
    set({ behaviorRules: validRules })
  },

  // Load rule template
  loadRuleTemplate: (template: RuleTemplate) => {
    set({ behaviorRules: createDefaultRules(template) })
  },

  // Update a specific behavior rule
  updateBehaviorRule: (ruleId: string, updates: Partial<BehaviorRule>) => {
    set(state => ({
      behaviorRules: state.behaviorRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }))
  },

  // Delete a behavior rule
  deleteBehaviorRule: (ruleId: string) => {
    set(state => ({
      behaviorRules: state.behaviorRules.filter(rule => rule.id !== ruleId),
    }))
  },

  // Add a new behavior rule (with validation)
  addBehaviorRule: (rule: BehaviorRule) => {
    // Runtime validation to catch corrupted data
    if (!isValidBehaviorRule(rule)) {
      console.warn('Attempted to add invalid behavior rule')
      return
    }
    set(state => ({
      behaviorRules: [...state.behaviorRules, rule],
    }))
  },

  // Reorder behavior rules (for drag-and-drop or priority changes)
  reorderBehaviorRules: (rules: BehaviorRule[]) => {
    // Update priorities based on new order
    const reorderedRules = rules.map((rule, index) => ({
      ...rule,
      priority: index + 1,
    }))
    set({ behaviorRules: reorderedRules })
  },
})
