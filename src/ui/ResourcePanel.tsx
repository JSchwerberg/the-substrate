/**
 * ResourcePanel - Displays current resources with capacity bars
 */

import { useGameStore } from '@game/state/gameStore'

export function ResourcePanel() {
  const resources = useGameStore(state => state.resources)
  const capacity = useGameStore(state => state.capacity)

  const resourceConfigs = [
    {
      name: 'Cycles',
      current: resources.cycles,
      max: capacity.maxCycles,
      color: '#4ecdc4',
      bgColor: '#16213e',
    },
    {
      name: 'Memory',
      current: resources.memory,
      max: capacity.maxMemory,
      color: '#ff6b6b',
      bgColor: '#16213e',
    },
    {
      name: 'Energy',
      current: resources.energy,
      max: capacity.maxEnergy,
      color: '#fbbf24',
      bgColor: '#16213e',
    },
  ]

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '4px',
      padding: '12px',
      minWidth: '200px',
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#7ecbff',
        fontFamily: 'monospace',
      }}>
        RESOURCES
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {resourceConfigs.map(resource => {
          const percentage = (resource.current / resource.max) * 100

          return (
            <div key={resource.name}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}>
                <span style={{ color: '#888' }}>{resource.name}</span>
                <span style={{ color: resource.color, fontWeight: 600 }}>
                  {resource.current}/{resource.max}
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: resource.bgColor,
                border: `1px solid ${resource.color}40`,
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: resource.color,
                  transition: 'width 0.3s ease',
                  boxShadow: `0 0 8px ${resource.color}`,
                }}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
