/**
 * CampaignMap - Shows campaign sectors and allows navigation
 */

import { memo } from 'react'
import { useGameStore } from '@game/state/gameStore'
import type { SectorStatus } from '@core/models/campaign'

const STATUS_COLORS: Record<SectorStatus, string> = {
  unexplored: '#888',
  in_progress: '#fbbf24',
  cleared: '#4ade80',
  lost: '#ef4444',
}

const STATUS_LABELS: Record<SectorStatus, string> = {
  unexplored: 'UNEXPLORED',
  in_progress: 'IN PROGRESS',
  cleared: 'CLEARED',
  lost: 'LOST',
}

export const CampaignMap = memo(function CampaignMap() {
  const campaign = useGameStore(state => state.campaign)
  const selectSector = useGameStore(state => state.selectSector)
  const startSectorExpedition = useGameStore(state => state.startSectorExpedition)

  if (!campaign) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0f0f1a',
          color: '#888',
          fontFamily: 'monospace',
          fontSize: '1.2rem',
        }}
      >
        No campaign active
      </div>
    )
  }

  const selectedSector = campaign.sectors.find(s => s.id === campaign.selectedSectorId)

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#0f0f1a',
        fontFamily: 'monospace',
      }}
    >
      {/* Map View */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: '24px',
            borderBottom: '2px solid #333',
            paddingBottom: '16px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#7ecbff',
              textTransform: 'uppercase',
            }}
          >
            Campaign Map
          </h1>
          <div
            style={{
              marginTop: '8px',
              fontSize: '0.9rem',
              color: '#888',
            }}
          >
            Campaign ID: {campaign.id}
          </div>
        </div>

        {/* SVG Map */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1a1a2e',
            border: '2px solid #333',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 400 300"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
          >
            {/* Draw connection lines */}
            {campaign.connections.map((conn, idx) => {
              const fromSector = campaign.sectors.find(s => s.id === conn.from)
              const toSector = campaign.sectors.find(s => s.id === conn.to)
              if (!fromSector || !toSector) return null

              return (
                <line
                  key={idx}
                  x1={fromSector.mapPosition.x}
                  y1={fromSector.mapPosition.y}
                  x2={toSector.mapPosition.x}
                  y2={toSector.mapPosition.y}
                  stroke="#333"
                  strokeWidth="2"
                />
              )
            })}

            {/* Draw sector nodes */}
            {campaign.sectors.map(sector => {
              const isSelected = sector.id === campaign.selectedSectorId
              const color = STATUS_COLORS[sector.status]

              return (
                <g key={sector.id}>
                  {/* Outer glow for selected */}
                  {isSelected && (
                    <circle
                      cx={sector.mapPosition.x}
                      cy={sector.mapPosition.y}
                      r="42"
                      fill="none"
                      stroke="#7ecbff"
                      strokeWidth="3"
                      opacity="0.6"
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    cx={sector.mapPosition.x}
                    cy={sector.mapPosition.y}
                    r="30"
                    fill="#16213e"
                    stroke={color}
                    strokeWidth={isSelected ? '4' : '2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectSector(sector.id)}
                  />

                  {/* Sector name */}
                  <text
                    x={sector.mapPosition.x}
                    y={sector.mapPosition.y - 45}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {sector.name}
                  </text>

                  {/* Corruption % */}
                  <text
                    x={sector.mapPosition.x}
                    y={sector.mapPosition.y + 5}
                    textAnchor="middle"
                    fill={color}
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {sector.corruptionPercent}%
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Sector Info Panel */}
      <div
        style={{
          width: '400px',
          backgroundColor: '#1a1a2e',
          borderLeft: '2px solid #333',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: '24px',
        }}
      >
        {selectedSector ? (
          <>
            {/* Sector Header */}
            <div>
              <h2
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#7ecbff',
                  textTransform: 'uppercase',
                }}
              >
                {selectedSector.name}
              </h2>
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  backgroundColor: '#16213e',
                  border: `2px solid ${STATUS_COLORS[selectedSector.status]}`,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: STATUS_COLORS[selectedSector.status],
                }}
              >
                {STATUS_LABELS[selectedSector.status]}
              </div>
            </div>

            {/* Sector Stats */}
            <div
              style={{
                backgroundColor: '#16213e',
                border: '2px solid #333',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#7ecbff',
                  textTransform: 'uppercase',
                }}
              >
                Sector Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
                    CORRUPTION LEVEL
                  </div>
                  <div style={{ fontSize: '1.1rem', color: '#ef4444', fontWeight: 700 }}>
                    {selectedSector.corruptionPercent}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
                    DIFFICULTY
                  </div>
                  <div style={{ fontSize: '1.1rem', color: '#fbbf24', fontWeight: 700 }}>
                    {selectedSector.config.difficulty.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
                    SECTOR SIZE
                  </div>
                  <div style={{ fontSize: '1.1rem', color: '#4ecdc4', fontWeight: 700 }}>
                    {selectedSector.config.size.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
                    DATA CACHES
                  </div>
                  <div style={{ fontSize: '1.1rem', color: '#4ade80', fontWeight: 700 }}>
                    {selectedSector.config.cacheCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Process Pool */}
            <div
              style={{
                backgroundColor: '#16213e',
                border: '2px solid #333',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#7ecbff',
                  textTransform: 'uppercase',
                }}
              >
                Available Processes
              </h3>
              <div style={{ fontSize: '1.1rem', color: '#4ecdc4', fontWeight: 700 }}>
                {campaign.processPool.length} process{campaign.processPool.length !== 1 ? 'es' : ''}
              </div>
            </div>

            {/* Enter Sector Button */}
            {selectedSector.status !== 'cleared' && selectedSector.status !== 'lost' && (
              <button
                onClick={startSectorExpedition}
                style={{
                  marginTop: 'auto',
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
                Enter Sector
              </button>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#888',
              fontSize: '0.9rem',
            }}
          >
            Select a sector to view details
          </div>
        )}
      </div>
    </div>
  )
})
