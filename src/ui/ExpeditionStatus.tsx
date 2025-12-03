/**
 * ExpeditionStatus - Top bar showing expedition state
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'

export const ExpeditionStatus = memo(function ExpeditionStatus() {
  const currentTick = useGameStore(state => state.currentTick)
  const processes = useGameStore(state => state.processes)
  const malware = useGameStore(state => state.malware)
  const expeditionResult = useGameStore(state => state.expeditionResult)
  const isPaused = useGameStore(state => state.isPaused)
  const expeditionActive = useGameStore(state => state.expeditionActive)

  const aliveProcesses = processes.filter(p => p.status !== 'destroyed')
  const aliveMalware = malware.filter(m => m.status !== 'destroyed')

  return (
    <>
      {/* Status Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#1a1a2e',
          borderBottom: '2px solid #333',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'monospace',
        }}
      >
        {/* Left: Tick counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              color: '#7ecbff',
              fontWeight: 600,
            }}
          >
            TICK:{' '}
            <span
              style={{
                color: isPaused ? '#fbbf24' : '#4ade80',
                fontSize: '1rem',
                marginLeft: '4px',
              }}
            >
              {currentTick.toString().padStart(4, '0')}
            </span>
          </div>

          {expeditionActive && (
            <div
              style={{
                fontSize: '0.7rem',
                padding: '4px 10px',
                borderRadius: '3px',
                backgroundColor: isPaused ? '#78350f' : '#064e3b',
                color: isPaused ? '#fbbf24' : '#4ade80',
                fontWeight: 600,
                border: `1px solid ${isPaused ? '#fbbf24' : '#4ade80'}40`,
              }}
            >
              {isPaused ? 'PAUSED' : 'ACTIVE'}
            </div>
          )}
        </div>

        {/* Center: Process and Malware counts */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#888' }}>PROCESSES:</span>
            <span
              style={{
                color: aliveProcesses.length > 0 ? '#4ecdc4' : '#ef4444',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {aliveProcesses.length}/{processes.length}
            </span>
          </div>

          <div
            style={{
              width: '1px',
              backgroundColor: '#333',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#888' }}>MALWARE:</span>
            <span
              style={{
                color: aliveMalware.length > 0 ? '#ef4444' : '#4ade80',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {aliveMalware.length}
            </span>
          </div>
        </div>

        {/* Right: Status indicator */}
        <div
          style={{
            fontSize: '0.75rem',
            color: '#888',
          }}
        >
          {!expeditionActive && 'PREPARING...'}
          {expeditionActive && expeditionResult === 'active' && 'IN PROGRESS'}
        </div>
      </div>

      {/* Victory/Defeat Overlay */}
      {expeditionResult !== 'active' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a2e',
              border: `4px solid ${expeditionResult === 'victory' ? '#4ade80' : '#ef4444'}`,
              borderRadius: '8px',
              padding: '40px 60px',
              textAlign: 'center',
              boxShadow: `0 0 40px ${expeditionResult === 'victory' ? '#4ade8080' : '#ef444480'}`,
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: expeditionResult === 'victory' ? '#4ade80' : '#ef4444',
                marginBottom: '16px',
                fontFamily: 'monospace',
                textShadow: `0 0 20px ${expeditionResult === 'victory' ? '#4ade80' : '#ef4444'}`,
              }}
            >
              {expeditionResult === 'victory' ? 'VICTORY' : 'DEFEAT'}
            </div>

            <div
              style={{
                fontSize: '1rem',
                color: '#888',
                marginBottom: '24px',
                fontFamily: 'monospace',
              }}
            >
              {expeditionResult === 'victory'
                ? 'All malware eliminated'
                : 'All processes destroyed'}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                color: '#aaa',
              }}
            >
              <div>
                Final Tick: <span style={{ color: '#7ecbff', fontWeight: 600 }}>{currentTick}</span>
              </div>
              <div>
                Processes:{' '}
                <span style={{ color: '#4ecdc4', fontWeight: 600 }}>
                  {aliveProcesses.length}/{processes.length}
                </span>
              </div>
              <div>
                Malware:{' '}
                <span style={{ color: '#ef4444', fontWeight: 600 }}>{aliveMalware.length}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '32px',
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: 'monospace',
              }}
            >
              Press R to generate new sector
            </div>
          </div>
        </div>
      )}
    </>
  )
})
