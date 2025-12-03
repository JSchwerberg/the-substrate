/**
 * DeploymentPanel - Unit deployment UI with archetype preview
 */

import { useGameStore } from '@game/state/gameStore'
import { ARCHETYPES, ProcessArchetype } from '@core/models/process'

export function DeploymentPanel() {
  const deployProcess = useGameStore(state => state.deployProcess)
  const expeditionActive = useGameStore(state => state.expeditionActive)

  const handleDeploy = (archetype: ProcessArchetype) => {
    deployProcess(archetype, 0)
  }

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '4px',
      padding: '12px',
      minWidth: '240px',
      maxWidth: '280px',
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#7ecbff',
        fontFamily: 'monospace',
      }}>
        DEPLOY PROCESS
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {(Object.keys(ARCHETYPES) as ProcessArchetype[]).map((key, index) => {
          const archetype = ARCHETYPES[key]
          const keyHint = (index + 1).toString()

          return (
            <button
              key={key}
              onClick={() => handleDeploy(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px',
                backgroundColor: '#16213e',
                border: `2px solid #${archetype.color.toString(16).padStart(6, '0')}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e2947'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 4px 12px #${archetype.color.toString(16).padStart(6, '0')}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#16213e'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Key hint badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: `#${archetype.color.toString(16).padStart(6, '0')}`,
                color: '#000',
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}>
                {keyHint}
              </div>

              {/* Name */}
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: `#${archetype.color.toString(16).padStart(6, '0')}`,
                marginBottom: '6px',
                fontFamily: 'monospace',
              }}>
                {archetype.name.toUpperCase()}
              </div>

              {/* Description */}
              <div style={{
                fontSize: '0.7rem',
                color: '#888',
                marginBottom: '10px',
                lineHeight: '1.3',
              }}>
                {archetype.description}
              </div>

              {/* Stats grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 12px',
                width: '100%',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
              }}>
                <div style={{ color: '#888' }}>
                  HP: <span style={{ color: '#4ade80', fontWeight: 600 }}>
                    {archetype.baseStats.maxHealth}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  ATK: <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    {archetype.baseStats.attack}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  DEF: <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                    {archetype.baseStats.defense}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  SPD: <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {archetype.baseStats.speed}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  SIGHT: <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                    {archetype.baseStats.sightRange}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  AP: <span style={{ color: '#4ecdc4', fontWeight: 600 }}>
                    {archetype.baseStats.maxActionPoints}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {expeditionActive && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#16213e',
          border: '1px solid #4ade80',
          borderRadius: '4px',
          fontSize: '0.7rem',
          color: '#4ade80',
          textAlign: 'center',
          fontFamily: 'monospace',
        }}>
          EXPEDITION ACTIVE
        </div>
      )}
    </div>
  )
}
