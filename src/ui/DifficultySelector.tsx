/**
 * DifficultySelector - Select expedition difficulty level
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'
import type { Difficulty } from '@game/state/gameStore'

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    name: string
    color: string
    malwareMultiplier: number
    rewardMultiplier: number
    description: string
  }
> = {
  easy: {
    name: 'EASY',
    color: '#4ade80',
    malwareMultiplier: 0.5,
    rewardMultiplier: 0.75,
    description: 'Fewer threats, reduced rewards',
  },
  normal: {
    name: 'NORMAL',
    color: '#7ecbff',
    malwareMultiplier: 1.0,
    rewardMultiplier: 1.0,
    description: 'Balanced challenge and rewards',
  },
  hard: {
    name: 'HARD',
    color: '#ef4444',
    malwareMultiplier: 2.0,
    rewardMultiplier: 1.5,
    description: 'Maximum danger, maximum rewards',
  },
}

export const DifficultySelector = memo(function DifficultySelector() {
  const selectedDifficulty = useGameStore(state => state.selectedDifficulty)
  const setDifficulty = useGameStore(state => state.setDifficulty)
  const expeditionActive = useGameStore(state => state.expeditionActive)

  // Don't allow changing difficulty during active expedition
  if (expeditionActive) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '12px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#7ecbff',
          fontFamily: 'monospace',
        }}
      >
        SELECT DIFFICULTY
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(difficulty => {
          const config = DIFFICULTY_CONFIG[difficulty]
          const isSelected = selectedDifficulty === difficulty

          return (
            <button
              key={difficulty}
              onClick={() => setDifficulty(difficulty)}
              style={{
                padding: '12px',
                backgroundColor: isSelected ? '#16213e' : '#0f0f1a',
                border: `2px solid ${isSelected ? config.color : '#333'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#16213e'
                  e.currentTarget.style.borderColor = `${config.color}80`
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#0f0f1a'
                  e.currentTarget.style.borderColor = '#333'
                }
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: config.color,
                    boxShadow: `0 0 12px ${config.color}`,
                  }}
                />
              )}

              {/* Difficulty name */}
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: config.color,
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                  marginLeft: isSelected ? '8px' : '0',
                  transition: 'margin-left 0.2s ease',
                }}
              >
                {config.name}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#888',
                  marginBottom: '8px',
                  marginLeft: isSelected ? '8px' : '0',
                  transition: 'margin-left 0.2s ease',
                }}
              >
                {config.description}
              </div>

              {/* Multipliers */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  marginLeft: isSelected ? '8px' : '0',
                  transition: 'margin-left 0.2s ease',
                }}
              >
                <div>
                  <span style={{ color: '#888' }}>Malware: </span>
                  <span
                    style={{
                      color: config.malwareMultiplier > 1 ? '#ef4444' : '#4ade80',
                      fontWeight: 600,
                    }}
                  >
                    {config.malwareMultiplier}x
                  </span>
                </div>
                <div
                  style={{
                    width: '1px',
                    backgroundColor: '#333',
                  }}
                />
                <div>
                  <span style={{ color: '#888' }}>Rewards: </span>
                  <span
                    style={{
                      color:
                        config.rewardMultiplier > 1
                          ? '#4ade80'
                          : config.rewardMultiplier < 1
                            ? '#fbbf24'
                            : '#7ecbff',
                      fontWeight: 600,
                    }}
                  >
                    {config.rewardMultiplier}x
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
