/**
 * ConditionDropdown - Dropdown for selecting and configuring behavior conditions
 */

import { ConditionType, Condition } from '@core/models/behavior'

interface ConditionDropdownProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

// Human-readable condition names and metadata
const CONDITION_METADATA: Record<
  ConditionType,
  {
    label: string
    hasValue?: boolean
    hasRange?: boolean
    defaultValue?: number
    defaultRange?: number
  }
> = {
  always: { label: 'Always' },
  health_below: { label: 'Health Below', hasValue: true, defaultValue: 50 },
  health_above: { label: 'Health Above', hasValue: true, defaultValue: 75 },
  enemy_in_range: { label: 'Enemy in Range', hasRange: true, defaultRange: 4 },
  enemy_adjacent: { label: 'Enemy Adjacent' },
  no_enemy_visible: { label: 'No Enemy Visible' },
  ally_in_range: { label: 'Ally in Range', hasRange: true, defaultRange: 3 },
  ally_health_below: { label: 'Ally Health Below', hasValue: true, defaultValue: 50 },
  at_position: { label: 'At Position' },
  near_exit: { label: 'Near Exit', hasRange: true, defaultRange: 2 },
  near_cache: { label: 'Near Cache', hasRange: true, defaultRange: 3 },
  is_idle: { label: 'Is Idle' },
  is_moving: { label: 'Is Moving' },
  has_action_points: { label: 'Has Action Points' },
}

export function ConditionDropdown({ condition, onChange }: ConditionDropdownProps) {
  const metadata = CONDITION_METADATA[condition.type]

  const handleTypeChange = (newType: ConditionType) => {
    const newMetadata = CONDITION_METADATA[newType]
    const newCondition: Condition = { type: newType }

    if (newMetadata.hasValue) {
      newCondition.value = newMetadata.defaultValue ?? 50
    }

    if (newMetadata.hasRange) {
      newCondition.range = newMetadata.defaultRange ?? 3
    }

    onChange(newCondition)
  }

  const handleValueChange = (value: number) => {
    onChange({ ...condition, value })
  }

  const handleRangeChange = (range: number) => {
    onChange({ ...condition, range })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
      }}
    >
      {/* Condition Type Dropdown */}
      <select
        value={condition.type}
        onChange={e => handleTypeChange(e.target.value as ConditionType)}
        style={{
          padding: '4px 6px',
          backgroundColor: '#16213e',
          border: '1px solid #4ecdc4',
          borderRadius: '3px',
          color: '#4ecdc4',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          flex: 1,
          minWidth: '140px',
        }}
      >
        {Object.entries(CONDITION_METADATA).map(([type, meta]) => (
          <option key={type} value={type}>
            {meta.label}
          </option>
        ))}
      </select>

      {/* Value Input (for threshold conditions) */}
      {metadata.hasValue && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <input
            type="number"
            value={condition.value ?? 50}
            onChange={e => handleValueChange(Number(e.target.value))}
            min={0}
            max={100}
            style={{
              width: '50px',
              padding: '4px 6px',
              backgroundColor: '#16213e',
              border: '1px solid #fbbf24',
              borderRadius: '3px',
              color: '#fbbf24',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              fontWeight: 600,
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              color: '#888',
              fontFamily: 'monospace',
            }}
          >
            %
          </span>
        </div>
      )}

      {/* Range Input (for range-based conditions) */}
      {metadata.hasRange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <input
            type="number"
            value={condition.range ?? 3}
            onChange={e => handleRangeChange(Number(e.target.value))}
            min={1}
            max={10}
            style={{
              width: '40px',
              padding: '4px 6px',
              backgroundColor: '#16213e',
              border: '1px solid #a78bfa',
              borderRadius: '3px',
              color: '#a78bfa',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              fontWeight: 600,
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              color: '#888',
              fontFamily: 'monospace',
            }}
          >
            tiles
          </span>
        </div>
      )}
    </div>
  )
}
