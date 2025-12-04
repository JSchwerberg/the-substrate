/**
 * TutorialPromptModal - Asks user if they want to play the tutorial
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'

export const TutorialPromptModal = memo(function TutorialPromptModal() {
  const showTutorialPrompt = useGameStore(state => state.showTutorialPrompt)
  const startTutorial = useGameStore(state => state.startTutorial)
  const skipTutorial = useGameStore(state => state.skipTutorial)

  if (!showTutorialPrompt) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      {/* Content box */}
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #7ecbff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '450px',
          textAlign: 'center',
        }}
      >
        {/* Title */}
        <h2
          style={{
            color: '#7ecbff',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 16px 0',
          }}
        >
          First Time?
        </h2>

        {/* Description */}
        <p
          style={{
            color: '#ccc',
            fontSize: '0.95rem',
            margin: '0 0 24px 0',
            lineHeight: '1.5',
          }}
        >
          Would you like to play the tutorial? (~2 minutes)
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          {/* Yes button */}
          <button
            onClick={startTutorial}
            style={{
              backgroundColor: '#16213e',
              border: '2px solid #4ecdc4',
              color: '#4ecdc4',
              padding: '12px 24px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#4ecdc4'
              e.currentTarget.style.color = '#16213e'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#16213e'
              e.currentTarget.style.color = '#4ecdc4'
            }}
          >
            YES, START TUTORIAL
          </button>

          {/* Skip button */}
          <button
            onClick={skipTutorial}
            style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #555',
              color: '#888',
              padding: '12px 24px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#16213e'
              e.currentTarget.style.color = '#aaa'
              e.currentTarget.style.borderColor = '#777'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#1a1a2e'
              e.currentTarget.style.color = '#888'
              e.currentTarget.style.borderColor = '#555'
            }}
          >
            SKIP
          </button>
        </div>
      </div>
    </div>
  )
})
