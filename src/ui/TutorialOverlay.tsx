/**
 * TutorialOverlay - Shows the current tutorial step with instructions
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'
import { TUTORIAL_STEPS } from '@core/constants/TutorialConfig'

export const TutorialOverlay = memo(function TutorialOverlay() {
  const tutorialActive = useGameStore(state => state.tutorialActive)
  const currentStepIndex = useGameStore(state => state.currentStepIndex)
  const showDeviationReminder = useGameStore(state => state.showDeviationReminder)
  const deviationMessage = useGameStore(state => state.deviationMessage)
  const advanceStep = useGameStore(state => state.advanceStep)
  const setDeviationReminder = useGameStore(state => state.setDeviationReminder)

  if (!tutorialActive) {
    return null
  }

  const step = TUTORIAL_STEPS[currentStepIndex]
  if (!step) {
    return null
  }

  const isAcknowledged = step.completionCondition === 'acknowledged'
  const isComplete = step.id === 'complete'

  return (
    <>
      {/* Main tutorial panel */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: '#1a1a2e',
          border: '2px solid #7ecbff',
          borderRadius: '8px',
          boxShadow: '0 0 30px rgba(126, 203, 255, 0.3)',
          padding: '20px 24px',
          maxWidth: '400px',
          fontFamily: 'monospace',
        }}
      >
        {/* Step counter */}
        <div
          style={{
            color: '#888',
            fontSize: '0.7rem',
            marginBottom: '8px',
          }}
        >
          STEP {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
        </div>

        {/* Title */}
        <h2
          style={{
            color: '#7ecbff',
            fontSize: '1.1rem',
            fontWeight: 700,
            margin: '0 0 12px 0',
          }}
        >
          {step.title}
        </h2>

        {/* Description */}
        <p
          style={{
            color: '#ccc',
            fontSize: '0.85rem',
            margin: '0 0 12px 0',
            lineHeight: '1.4',
          }}
        >
          {step.description}
        </p>

        {/* Hint */}
        {step.hint && (
          <p
            style={{
              color: '#888',
              fontSize: '0.75rem',
              fontStyle: 'italic',
              margin: '0 0 16px 0',
            }}
          >
            {step.hint}
          </p>
        )}

        {/* Continue button (only for acknowledged steps) */}
        {isAcknowledged && (
          <button
            onClick={advanceStep}
            style={{
              backgroundColor: '#16213e',
              border: '2px solid #4ecdc4',
              color: '#4ecdc4',
              padding: '10px 20px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
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
            {isComplete ? 'START CAMPAIGN' : 'CONTINUE'}
          </button>
        )}
      </div>

      {/* Deviation reminder toast */}
      {showDeviationReminder && (
        <div
          onClick={() => setDeviationReminder(false)}
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            backgroundColor: '#fbbf24',
            color: '#000',
            padding: '12px 20px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {deviationMessage}
        </div>
      )}
    </>
  )
})
