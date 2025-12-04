/**
 * MainMenu - Campaign start screen with difficulty selection
 */

import { memo, useState } from 'react'
import { useGameStore } from '@game/state/gameStore'
import type { Difficulty } from '@game/state/types'

const DIFFICULTY_INFO: Record<
  Difficulty,
  { color: string; description: string; details: string[] }
> = {
  easy: {
    color: '#4ade80',
    description: 'Lower malware density, reduced aggression',
    details: ['50% malware spawns', '50% corruption density', 'Ideal for learning'],
  },
  normal: {
    color: '#fbbf24',
    description: 'Balanced challenge for tactical gameplay',
    details: ['Standard malware spawns', 'Standard corruption', 'Recommended start'],
  },
  hard: {
    color: '#ef4444',
    description: 'High malware density, aggressive AI',
    details: ['150% malware spawns', '150% corruption density', 'Expert challenge'],
  },
}

export const MainMenu = memo(function MainMenu() {
  const campaign = useGameStore(state => state.campaign)
  const startNewCampaign = useGameStore(state => state.startNewCampaign)
  const setGameScreen = useGameStore(state => state.setGameScreen)

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal')

  const handleStartNewCampaign = () => {
    startNewCampaign(selectedDifficulty)
  }

  const handleContinueCampaign = () => {
    setGameScreen('campaign_map')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f0f1a',
        fontFamily: 'monospace',
        padding: '24px',
      }}
    >
      {/* Title */}
      <h1
        style={{
          margin: '0 0 48px 0',
          fontSize: '3.5rem',
          fontWeight: 700,
          color: '#7ecbff',
          textTransform: 'uppercase',
          letterSpacing: '8px',
          textShadow: '0 0 20px rgba(126, 203, 255, 0.5)',
        }}
      >
        THE SUBSTRATE
      </h1>

      {/* Main Menu Container */}
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #7ecbff',
          borderRadius: '8px',
          padding: '32px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 0 40px rgba(126, 203, 255, 0.3)',
        }}
      >
        {/* Difficulty Selector */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#7ecbff',
              textTransform: 'uppercase',
            }}
          >
            Select Difficulty
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(['easy', 'normal', 'hard'] as const).map(difficulty => {
              const isSelected = selectedDifficulty === difficulty
              const info = DIFFICULTY_INFO[difficulty]

              return (
                <div
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  style={{
                    backgroundColor: isSelected ? '#16213e' : '#1a1a2e',
                    border: `2px solid ${isSelected ? info.color : '#333'}`,
                    borderRadius: '6px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#555'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#333'
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: info.color,
                        textTransform: 'uppercase',
                      }}
                    >
                      {difficulty}
                    </h3>
                    {isSelected && (
                      <div
                        style={{
                          padding: '4px 8px',
                          backgroundColor: info.color,
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#000',
                        }}
                      >
                        SELECTED
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '0.8rem',
                      color: '#888',
                      lineHeight: '1.4',
                    }}
                  >
                    {info.description}
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      padding: '0 0 0 20px',
                      fontSize: '0.75rem',
                      color: '#666',
                      lineHeight: '1.6',
                    }}
                  >
                    {info.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Start New Campaign Button */}
          <button
            onClick={handleStartNewCampaign}
            style={{
              padding: '14px',
              backgroundColor: '#16213e',
              border: '2px solid #4ecdc4',
              borderRadius: '4px',
              color: '#4ecdc4',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#4ecdc420'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(78, 205, 196, 0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#16213e'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Start New Campaign
          </button>

          {/* Continue Campaign Button (if campaign exists) */}
          {campaign && (
            <button
              onClick={handleContinueCampaign}
              style={{
                padding: '14px',
                backgroundColor: '#16213e',
                border: '2px solid #7ecbff',
                borderRadius: '4px',
                color: '#7ecbff',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#7ecbff20'
                e.currentTarget.style.boxShadow = '0 0 12px rgba(126, 203, 255, 0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#16213e'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Continue Campaign
            </button>
          )}
        </div>

        {/* Campaign Info (if exists) */}
        {campaign && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#16213e',
              border: '2px solid #333',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
              ACTIVE CAMPAIGN
            </div>
            <div style={{ fontSize: '0.9rem', color: '#4ecdc4', fontWeight: 700 }}>
              {campaign.id}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
              Last played: {new Date(campaign.lastPlayedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
