/**
 * BehaviorRuleEditor - Main rule editor panel for configuring process automation
 */

import { useState } from 'react'
import { useGameStore } from '@game/state/gameStore'
import { BehaviorRule, RuleTemplate, createRule } from '@core/models/behavior'
import { ConditionDropdown } from './ConditionDropdown'
import { ActionDropdown } from './ActionDropdown'

export function BehaviorRuleEditor() {
  const behaviorRules = useGameStore(state => state.behaviorRules)
  const loadRuleTemplate = useGameStore(state => state.loadRuleTemplate)
  const updateBehaviorRule = useGameStore(state => state.updateBehaviorRule)
  const deleteBehaviorRule = useGameStore(state => state.deleteBehaviorRule)
  const addBehaviorRule = useGameStore(state => state.addBehaviorRule)
  const reorderBehaviorRules = useGameStore(state => state.reorderBehaviorRules)

  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')

  // Sort rules by priority for display
  const sortedRules = [...behaviorRules].sort((a, b) => a.priority - b.priority)

  const handleTemplateChange = (template: RuleTemplate) => {
    loadRuleTemplate(template)
  }

  const handleToggleEnabled = (ruleId: string, enabled: boolean) => {
    updateBehaviorRule(ruleId, { enabled })
  }

  const handleStartEditName = (rule: BehaviorRule) => {
    setEditingNameId(rule.id)
    setEditingNameValue(rule.name)
  }

  const handleSaveEditName = (ruleId: string) => {
    if (editingNameValue.trim()) {
      updateBehaviorRule(ruleId, { name: editingNameValue.trim() })
    }
    setEditingNameId(null)
  }

  const handleCancelEditName = () => {
    setEditingNameId(null)
  }

  const handleAddRule = () => {
    const newRule = createRule(
      'New Rule',
      { type: 'always' },
      { type: 'hold_position' },
      sortedRules.length + 1
    )
    addBehaviorRule(newRule)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newRules = [...sortedRules]
    const temp = newRules[index]!
    newRules[index] = newRules[index - 1]!
    newRules[index - 1] = temp
    reorderBehaviorRules(newRules)
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedRules.length - 1) return
    const newRules = [...sortedRules]
    const temp = newRules[index]!
    newRules[index] = newRules[index + 1]!
    newRules[index + 1] = temp
    reorderBehaviorRules(newRules)
  }

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '4px',
      padding: '12px',
      width: '100%',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid #333',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#7ecbff',
          fontFamily: 'monospace',
        }}>
          BEHAVIOR RULES
        </h3>

        {/* Template Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: '#888',
            fontFamily: 'monospace',
          }}>
            Template:
          </span>
          <select
            onChange={(e) => handleTemplateChange(e.target.value as RuleTemplate)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#16213e',
              border: '1px solid #7ecbff',
              borderRadius: '3px',
              color: '#7ecbff',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">Load Preset...</option>
            <option value="aggressive">Aggressive</option>
            <option value="defensive">Defensive</option>
            <option value="explorer">Explorer</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      {/* Rules List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '4px',
      }}>
        {sortedRules.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}>
            No rules defined. Click "Add Rule" to create one.
          </div>
        ) : (
          sortedRules.map((rule, index) => (
            <div
              key={rule.id}
              style={{
                backgroundColor: '#16213e',
                border: `1px solid ${rule.enabled ? '#4ecdc4' : '#555'}`,
                borderRadius: '3px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                opacity: rule.enabled ? 1 : 0.5,
              }}
            >
              {/* Rule Header: Priority, Name, Toggle, Delete */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '6px',
                borderBottom: '1px solid #333',
              }}>
                {/* Priority Badge */}
                <div style={{
                  minWidth: '24px',
                  height: '24px',
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #7ecbff',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#7ecbff',
                  fontFamily: 'monospace',
                }}>
                  {rule.priority}
                </div>

                {/* Rule Name (editable) */}
                {editingNameId === rule.id ? (
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onBlur={() => handleSaveEditName(rule.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEditName(rule.id)
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #7ecbff',
                      borderRadius: '3px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => handleStartEditName(rule)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#fff',
                      cursor: 'pointer',
                      borderRadius: '3px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {rule.name}
                  </div>
                )}

                {/* Reorder Buttons */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #666',
                      borderRadius: '2px',
                      color: index === 0 ? '#444' : '#7ecbff',
                      fontSize: '0.65rem',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedRules.length - 1}
                    style={{
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #666',
                      borderRadius: '2px',
                      color: index === sortedRules.length - 1 ? '#444' : '#7ecbff',
                      fontSize: '0.65rem',
                      cursor: index === sortedRules.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                    title="Move Down"
                  >
                    ▼
                  </button>
                </div>

                {/* Enable/Disable Toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '4px',
                }}>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleToggleEnabled(rule.id, e.target.checked)}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{
                    fontSize: '0.65rem',
                    color: '#888',
                    fontFamily: 'monospace',
                  }}>
                    ON
                  </span>
                </label>

                {/* Delete Button */}
                <button
                  onClick={() => deleteBehaviorRule(rule.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #ef4444',
                    borderRadius: '2px',
                    color: '#ef4444',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                  title="Delete Rule"
                >
                  ×
                </button>
              </div>

              {/* Rule Logic: IF ... THEN ... */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
              }}>
                <span style={{
                  color: '#4ecdc4',
                  fontWeight: 700,
                  minWidth: '20px',
                }}>
                  IF
                </span>

                <ConditionDropdown
                  condition={rule.condition}
                  onChange={(condition) => updateBehaviorRule(rule.id, { condition })}
                />

                <span style={{
                  color: '#ff6b6b',
                  fontWeight: 700,
                  minWidth: '32px',
                }}>
                  THEN
                </span>

                <ActionDropdown
                  action={rule.action}
                  onChange={(action) => updateBehaviorRule(rule.id, { action })}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Rule Button */}
      <button
        onClick={handleAddRule}
        style={{
          padding: '8px 12px',
          backgroundColor: '#16213e',
          border: '1px solid #4ade80',
          borderRadius: '3px',
          color: '#4ade80',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4ade8020'
          e.currentTarget.style.boxShadow = '0 0 8px #4ade8040'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#16213e'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        + ADD RULE
      </button>
    </div>
  )
}
