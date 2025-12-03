/**
 * ActionDropdown - Dropdown for selecting behavior actions
 */

import { ActionType, Action } from '@core/models/behavior'

interface ActionDropdownProps {
  action: Action
  onChange: (action: Action) => void
}

// Human-readable action names grouped by category
const ACTION_CATEGORIES = {
  Attack: [
    { type: 'attack_nearest' as ActionType, label: 'Attack Nearest Enemy' },
    { type: 'attack_weakest' as ActionType, label: 'Attack Weakest Enemy' },
    { type: 'attack_strongest' as ActionType, label: 'Attack Strongest Enemy' },
  ],
  Movement: [
    { type: 'move_to_nearest_enemy' as ActionType, label: 'Move to Nearest Enemy' },
    { type: 'move_to_nearest_cache' as ActionType, label: 'Move to Nearest Cache' },
    { type: 'move_to_exit' as ActionType, label: 'Move to Exit' },
    { type: 'explore' as ActionType, label: 'Explore' },
  ],
  Defense: [
    { type: 'retreat_to_spawn' as ActionType, label: 'Retreat to Spawn' },
    { type: 'flee_from_enemy' as ActionType, label: 'Flee from Enemy' },
    { type: 'hold_position' as ActionType, label: 'Hold Position' },
  ],
  Support: [
    { type: 'follow_ally' as ActionType, label: 'Follow Ally' },
    { type: 'heal_ally' as ActionType, label: 'Heal Ally' },
  ],
}

export function ActionDropdown({ action, onChange }: ActionDropdownProps) {
  const handleChange = (newType: ActionType) => {
    onChange({ type: newType })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
      }}
    >
      {/* Action Type Dropdown with Categories */}
      <select
        value={action.type}
        onChange={e => handleChange(e.target.value as ActionType)}
        style={{
          padding: '4px 6px',
          backgroundColor: '#16213e',
          border: '1px solid #ff6b6b',
          borderRadius: '3px',
          color: '#ff6b6b',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          flex: 1,
          minWidth: '160px',
        }}
      >
        {Object.entries(ACTION_CATEGORIES).map(([category, actions]) => (
          <optgroup key={category} label={category}>
            {actions.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
