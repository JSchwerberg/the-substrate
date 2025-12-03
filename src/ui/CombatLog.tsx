/**
 * CombatLog - Scrollable combat log display
 */

import { useGameStore } from '@game/state/gameStore'
import { useEffect, useRef } from 'react'

export function CombatLog() {
  const combatLog = useGameStore(state => state.combatLog)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [combatLog])

  if (combatLog.length === 0) {
    return null
  }

  // Show last 10 messages
  const recentMessages = combatLog.slice(-10)

  return (
    <div
      style={{
        backgroundColor: 'rgba(26, 26, 46, 0.92)',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '8px 12px',
        maxWidth: '600px',
        width: '100%',
        backdropFilter: 'blur(4px)',
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
        COMBAT LOG
      </div>

      <div
        ref={scrollRef}
        style={{
          maxHeight: '100px',
          overflowY: 'auto',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          lineHeight: '1.4',
          scrollBehavior: 'smooth',
        }}
      >
        {recentMessages.map((message, index) => {
          // Parse message for color coding
          const isDamage = message.includes('deals') && message.includes('damage')
          const isDestroyed = message.includes('destroyed')
          const isVictory = message.includes('VICTORY')
          const isDefeat = message.includes('DEFEAT')
          const isAwaken = message.includes('awakens')

          let color = '#aaa'
          if (isVictory) color = '#4ade80'
          else if (isDefeat) color = '#ef4444'
          else if (isDestroyed) color = '#ff6b6b'
          else if (isDamage) color = '#fbbf24'
          else if (isAwaken) color = '#a78bfa'

          return (
            <div
              key={`${index}-${message}`}
              style={{
                color,
                padding: '2px 0',
                opacity: 0.85 + (index / recentMessages.length) * 0.15, // Fade older messages slightly
              }}
            >
              <span
                style={{
                  color: '#666',
                  marginRight: '6px',
                }}
              >
                [
                {(combatLog.length - recentMessages.length + index + 1).toString().padStart(3, '0')}
                ]
              </span>
              {message}
            </div>
          )
        })}
      </div>

      {/* Scrollbar styling */}
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #16213e;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: #4ecdc4;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #7ecbff;
        }
      `}</style>
    </div>
  )
}
