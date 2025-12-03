/**
 * ExpeditionRewards - Modal showing reward breakdown after expedition ends
 */

import { memo, useState } from 'react'
import { useGameStore } from '@game/state/gameStore'
import { calculateExpeditionRewards } from '@game/state/progressionHelpers'
import { GeneratorOptions } from '@core/generation/SectorGenerator'

interface ExpeditionRewardsProps {
  onNewExpedition: () => void
}

export const ExpeditionRewards = memo(function ExpeditionRewards({
  onNewExpedition,
}: ExpeditionRewardsProps) {
  const expeditionResult = useGameStore(state => state.expeditionResult)
  const expeditionScore = useGameStore(state => state.expeditionScore)
  const selectedDifficulty = useGameStore(state => state.selectedDifficulty)
  const claimExpeditionRewards = useGameStore(state => state.claimExpeditionRewards)
  const generateNewSector = useGameStore(state => state.generateNewSector)

  const [claimed, setClaimed] = useState(false)
  const [rewards, setRewards] = useState<ReturnType<typeof calculateExpeditionRewards> | null>(null)

  // Don't show if expedition is still active
  if (expeditionResult === 'active') {
    return null
  }

  const isVictory = expeditionResult === 'victory'

  // Get reward multiplier based on difficulty
  const rewardMultipliers = {
    easy: 0.75,
    normal: 1.0,
    hard: 1.5,
  }
  const rewardMultiplier = rewardMultipliers[selectedDifficulty]

  // Calculate rewards preview
  const rewardPreview = calculateExpeditionRewards(
    expeditionScore.cachesCollected,
    expeditionScore.malwareDestroyed,
    expeditionScore.ticksSurvived,
    isVictory,
    rewardMultiplier
  )

  const handleClaimRewards = () => {
    const claimedRewards = claimExpeditionRewards()
    setRewards(claimedRewards)
    setClaimed(true)
  }

  const handleNewExpedition = () => {
    // Generate new sector with default options
    const defaultOptions: GeneratorOptions = {
      size: 'medium',
      difficulty: 'normal',
    }
    generateNewSector(defaultOptions)
    setClaimed(false)
    setRewards(null)
    onNewExpedition()
  }

  // Combined action: claim rewards and start new expedition in one click
  const handleClaimAndContinue = () => {
    claimExpeditionRewards()
    handleNewExpedition()
  }

  const displayRewards = rewards || rewardPreview

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: `4px solid ${isVictory ? '#4ade80' : '#ef4444'}`,
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: `0 0 60px ${isVictory ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: isVictory ? '#4ade80' : '#ef4444',
              marginBottom: '8px',
              fontFamily: 'monospace',
              textShadow: `0 0 30px ${isVictory ? 'rgba(74, 222, 128, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`,
              textTransform: 'uppercase',
            }}
          >
            {isVictory ? 'VICTORY!' : 'DEFEAT'}
          </div>
          <div
            style={{
              fontSize: '1rem',
              color: '#888',
              fontFamily: 'monospace',
            }}
          >
            {isVictory ? 'All malware eliminated' : 'All processes destroyed'}
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div
          style={{
            backgroundColor: '#16213e',
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#7ecbff',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Expedition Rewards
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            {/* Caches Collected */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#1a1a2e',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#888' }}>
                Caches Collected: {expeditionScore.cachesCollected} × 10
              </span>
              <span
                style={{
                  color: '#4ecdc4',
                  fontWeight: 700,
                }}
              >
                +{displayRewards.cacheReward} Data
              </span>
            </div>

            {/* Malware Destroyed */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#1a1a2e',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#888' }}>
                Malware Destroyed: {expeditionScore.malwareDestroyed} × 5
              </span>
              <span
                style={{
                  color: '#4ecdc4',
                  fontWeight: 700,
                }}
              >
                +{displayRewards.malwareReward} Data
              </span>
            </div>

            {/* Survival Bonus */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#1a1a2e',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#888' }}>Survival: {expeditionScore.ticksSurvived} ticks</span>
              <span
                style={{
                  color: '#4ecdc4',
                  fontWeight: 700,
                }}
              >
                +{displayRewards.survivalBonus} Data
              </span>
            </div>

            {/* Victory Bonus */}
            {isVictory && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '4px',
                  border: '1px solid #4ade80',
                }}
              >
                <span style={{ color: '#4ade80', fontWeight: 600 }}>Victory Bonus</span>
                <span
                  style={{
                    color: '#4ade80',
                    fontWeight: 700,
                  }}
                >
                  +{displayRewards.victoryBonus} Data
                </span>
              </div>
            )}

            {/* Total */}
            <div
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                backgroundColor: '#7ecbff20',
                border: '2px solid #7ecbff',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: '#7ecbff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Total Reward
              </span>
              <span
                style={{
                  color: '#4ecdc4',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                }}
              >
                {displayRewards.totalReward} Data
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!claimed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Primary: Combined action */}
            <button
              onClick={handleClaimAndContinue}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#16213e',
                border: '2px solid #4ade80',
                borderRadius: '6px',
                color: '#4ade80',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#4ade8020'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(74, 222, 128, 0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#16213e'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Claim & Continue
            </button>

            {/* Secondary: Just claim (to review rewards) */}
            <button
              onClick={handleClaimRewards}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #555',
                borderRadius: '6px',
                color: '#888',
                fontSize: '0.85rem',
                fontWeight: 500,
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#4ecdc4'
                e.currentTarget.style.color = '#4ecdc4'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#555'
                e.currentTarget.style.color = '#888'
              }}
            >
              Review Rewards First
            </button>
          </div>
        ) : (
          <button
            onClick={handleNewExpedition}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#16213e',
              border: '2px solid #7ecbff',
              borderRadius: '6px',
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
              e.currentTarget.style.boxShadow = '0 0 16px rgba(126, 203, 255, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#16213e'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            New Expedition
          </button>
        )}
      </div>
    </div>
  )
})
