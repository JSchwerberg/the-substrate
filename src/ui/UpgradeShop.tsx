/**
 * UpgradeShop - Purchase permanent upgrades using earned Data
 */

import { useGameStore } from '@game/state/gameStore'
import {
  getAllUpgradeTypes,
  getUpgradeName,
  getUpgradeDescription,
  formatUpgradeBonus,
} from '@game/state/progressionHelpers'
import type { UpgradeType } from '@game/state/gameStore'

const MAX_UPGRADE_LEVEL = 10

interface UpgradeShopProps {
  onClose: () => void
}

export function UpgradeShop({ onClose }: UpgradeShopProps) {
  const persistentData = useGameStore(state => state.persistentData)
  const upgrades = useGameStore(state => state.upgrades)
  const purchaseUpgrade = useGameStore(state => state.purchaseUpgrade)
  const getUpgradeCost = useGameStore(state => state.getUpgradeCost)

  const handlePurchase = (upgradeType: UpgradeType) => {
    const success = purchaseUpgrade(upgradeType)
    if (!success) {
      // Could add a visual feedback for insufficient funds
      console.log('Cannot afford upgrade')
    }
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #7ecbff',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(126, 203, 255, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '2px solid #333',
            paddingBottom: '16px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#7ecbff',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            Upgrade Shop
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.2rem',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#888', fontSize: '0.9rem' }}>DATA:</span>
            <span
              style={{
                color: '#4ecdc4',
                fontWeight: 700,
                fontSize: '1.3rem',
              }}
            >
              {persistentData.totalData}
            </span>
          </div>
        </div>

        {/* Upgrade Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {getAllUpgradeTypes().map((upgradeType) => {
            const currentLevel = upgrades[upgradeType]
            const cost = getUpgradeCost(upgradeType)
            const canAfford = persistentData.totalData >= cost
            const isMaxLevel = currentLevel >= MAX_UPGRADE_LEVEL

            return (
              <div
                key={upgradeType}
                style={{
                  backgroundColor: '#16213e',
                  border: '2px solid #333',
                  borderRadius: '6px',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Upgrade Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#7ecbff',
                      fontFamily: 'monospace',
                    }}
                  >
                    {getUpgradeName(upgradeType)}
                  </h3>
                  <div
                    style={{
                      padding: '4px 12px',
                      backgroundColor: isMaxLevel ? '#4ade80' : '#1a1a2e',
                      border: `1px solid ${isMaxLevel ? '#4ade80' : '#7ecbff'}`,
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isMaxLevel ? '#000' : '#7ecbff',
                      fontFamily: 'monospace',
                    }}
                  >
                    {isMaxLevel ? 'MAX' : `LV ${currentLevel}`}
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '0.75rem',
                    color: '#888',
                    lineHeight: '1.4',
                  }}
                >
                  {getUpgradeDescription(upgradeType)}
                </p>

                {/* Current Bonus */}
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #4ade80',
                    borderRadius: '4px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#888',
                      marginBottom: '2px',
                    }}
                  >
                    CURRENT BONUS:
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#4ade80',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {currentLevel === 0
                      ? 'None'
                      : formatUpgradeBonus(upgradeType, currentLevel)}
                  </div>
                </div>

                {/* Upgrade Button */}
                {!isMaxLevel && (
                  <button
                    onClick={() => handlePurchase(upgradeType)}
                    disabled={!canAfford}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: canAfford ? '#16213e' : '#1a1a2e',
                      border: `2px solid ${canAfford ? '#4ecdc4' : '#444'}`,
                      borderRadius: '4px',
                      color: canAfford ? '#4ecdc4' : '#666',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      opacity: canAfford ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (canAfford) {
                        e.currentTarget.style.backgroundColor = '#4ecdc420'
                        e.currentTarget.style.boxShadow =
                          '0 0 12px rgba(78, 205, 196, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canAfford) {
                        e.currentTarget.style.backgroundColor = '#16213e'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {canAfford ? (
                      <>
                        Upgrade - {cost} Data
                      </>
                    ) : (
                      <>
                        Insufficient Data ({cost} required)
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Career Statistics */}
        <div
          style={{
            backgroundColor: '#16213e',
            border: '2px solid #333',
            borderRadius: '6px',
            padding: '20px',
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
            }}
          >
            Career Statistics
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontFamily: 'monospace',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                TOTAL DATA EARNED
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  color: '#4ecdc4',
                  fontWeight: 700,
                }}
              >
                {persistentData.totalData}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                EXPEDITIONS WON
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  color: '#4ade80',
                  fontWeight: 700,
                }}
              >
                {persistentData.expeditionsCompleted}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                EXPEDITIONS LOST
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  color: '#ef4444',
                  fontWeight: 700,
                }}
              >
                {persistentData.expeditionsLost}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                MALWARE DESTROYED
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  color: '#fbbf24',
                  fontWeight: 700,
                }}
              >
                {persistentData.totalMalwareDestroyed}
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#16213e',
            border: '2px solid #7ecbff',
            borderRadius: '4px',
            color: '#7ecbff',
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7ecbff20'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(126, 203, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#16213e'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
