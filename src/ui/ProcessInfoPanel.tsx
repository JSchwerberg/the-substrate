/**
 * ProcessInfoPanel - Display selected process details
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'
import { ARCHETYPES } from '@core/models/process'

export const ProcessInfoPanel = memo(function ProcessInfoPanel() {
  const processes = useGameStore(state => state.processes)
  const selectedProcessId = useGameStore(state => state.selectedProcessId)

  const selectedProcess = processes.find(p => p.id === selectedProcessId)

  if (!selectedProcess) {
    return null
  }

  const archetype = ARCHETYPES[selectedProcess.archetype]
  const healthPercent = (selectedProcess.stats.health / selectedProcess.stats.maxHealth) * 100
  const isAlive = selectedProcess.status !== 'destroyed'

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: `2px solid #${selectedProcess.color.toString(16).padStart(6, '0')}`,
        borderRadius: '4px',
        padding: '12px',
        minWidth: '240px',
        maxWidth: '280px',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #333',
        }}
      >
        <h3
          style={{
            margin: '0 0 4px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: `#${selectedProcess.color.toString(16).padStart(6, '0')}`,
            fontFamily: 'monospace',
          }}
        >
          {selectedProcess.name}
        </h3>
        <div
          style={{
            fontSize: '0.7rem',
            color: '#888',
            fontFamily: 'monospace',
          }}
        >
          {archetype.name} • ID: {selectedProcess.id}
        </div>
      </div>

      {/* Health Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: '#888' }}>HEALTH</span>
          <span
            style={{
              color: isAlive ? '#4ade80' : '#ef4444',
              fontWeight: 600,
            }}
          >
            {selectedProcess.stats.health}/{selectedProcess.stats.maxHealth}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#16213e',
            border: '1px solid #4ade8040',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${healthPercent}%`,
              height: '100%',
              backgroundColor:
                healthPercent > 50 ? '#4ade80' : healthPercent > 25 ? '#fbbf24' : '#ef4444',
              transition: 'width 0.3s ease, background-color 0.3s ease',
              boxShadow: `0 0 8px ${healthPercent > 50 ? '#4ade80' : healthPercent > 25 ? '#fbbf24' : '#ef4444'}`,
            }}
          />
        </div>
      </div>

      {/* Status */}
      <div
        style={{
          marginBottom: '12px',
          padding: '6px 8px',
          backgroundColor: '#16213e',
          border: '1px solid #333',
          borderRadius: '3px',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#888' }}>STATUS:</span>
        <span
          style={{
            color:
              selectedProcess.status === 'idle'
                ? '#888'
                : selectedProcess.status === 'moving'
                  ? '#4ecdc4'
                  : selectedProcess.status === 'attacking'
                    ? '#ef4444'
                    : selectedProcess.status === 'destroyed'
                      ? '#666'
                      : '#fbbf24',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {selectedProcess.status}
        </span>
      </div>

      {/* Position */}
      <div
        style={{
          marginBottom: '12px',
          padding: '6px 8px',
          backgroundColor: '#16213e',
          border: '1px solid #333',
          borderRadius: '3px',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#888' }}>POSITION:</span>
        <span style={{ color: '#7ecbff', fontWeight: 600 }}>
          ({selectedProcess.position.x}, {selectedProcess.position.y})
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          backgroundColor: '#16213e',
          border: '1px solid #333',
          borderRadius: '3px',
          padding: '8px',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#7ecbff',
            marginBottom: '8px',
            fontFamily: 'monospace',
          }}
        >
          STATS
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Attack:</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              {selectedProcess.stats.attack}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Defense:</span>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>
              {selectedProcess.stats.defense}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Speed:</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{selectedProcess.stats.speed}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Sight Range:</span>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>
              {selectedProcess.stats.sightRange}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Action Points:</span>
            <span style={{ color: '#4ecdc4', fontWeight: 600 }}>
              {selectedProcess.stats.actionPoints}/{selectedProcess.stats.maxActionPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Status Effects */}
      {selectedProcess.statusEffects.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            backgroundColor: '#16213e',
            border: '1px solid #333',
            borderRadius: '3px',
            padding: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#7ecbff',
              marginBottom: '6px',
              fontFamily: 'monospace',
            }}
          >
            EFFECTS
          </div>
          {selectedProcess.statusEffects.map(effect => (
            <div
              key={effect.id}
              style={{
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: effect.type === 'buff' ? '#4ade80' : '#ef4444',
                marginBottom: '4px',
              }}
            >
              {effect.name} {effect.duration !== -1 && `(${effect.duration})`}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
