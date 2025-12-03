/**
 * DeploymentPanel - Unit deployment UI with archetype preview
 */

import { memo } from 'react'
import { useGameStore, getMemoryCost, calculateUsedMemory } from '@game/state/gameStore'
import { ARCHETYPES, ProcessArchetype } from '@core/models/process'
import { DEPLOY_COST, ENERGY_DEPLOYMENT_COSTS, INTERVENTIONS } from '@core/constants/GameConfig'
import type { InterventionType } from '@core/constants/GameConfig'

export const DeploymentPanel = memo(function DeploymentPanel() {
  const deployProcess = useGameStore(state => state.deployProcess)
  const executeIntervention = useGameStore(state => state.executeIntervention)
  const expeditionActive = useGameStore(state => state.expeditionActive)
  const midExpeditionDeployCount = useGameStore(state => state.midExpeditionDeployCount)
  const resources = useGameStore(state => state.resources)
  const capacity = useGameStore(state => state.capacity)
  const processes = useGameStore(state => state.processes)
  const selectedProcessId = useGameStore(state => state.selectedProcessId)

  const usedMemory = calculateUsedMemory(processes)

  const handleDeploy = (archetype: ProcessArchetype) => {
    deployProcess(archetype, 0)
  }

  const getDeploymentCost = (archetype: ProcessArchetype) => {
    if (expeditionActive) {
      // Mid-expedition: energy cost with exponential scaling
      const baseEnergyCost =
        archetype === 'scout' ? ENERGY_DEPLOYMENT_COSTS.SCOUT : ENERGY_DEPLOYMENT_COSTS.PURIFIER
      const scaledEnergyCost = Math.floor(
        baseEnergyCost *
          Math.pow(ENERGY_DEPLOYMENT_COSTS.SCALING_MULTIPLIER, midExpeditionDeployCount)
      )
      return { resource: 'ENERGY', amount: scaledEnergyCost }
    } else {
      // Pre-expedition: cycles cost
      const cyclesCost = archetype === 'scout' ? DEPLOY_COST.SCOUT : DEPLOY_COST.PURIFIER
      return { resource: 'CYCLES', amount: cyclesCost }
    }
  }

  const canAfford = (archetype: ProcessArchetype) => {
    const cost = getDeploymentCost(archetype)
    const memoryCost = getMemoryCost(archetype)

    // Check memory capacity
    if (usedMemory + memoryCost > capacity.maxMemory) {
      return false
    }

    // Check resource cost
    if (cost.resource === 'ENERGY') {
      return resources.energy >= cost.amount
    } else {
      return resources.cycles >= cost.amount
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '12px',
        minWidth: '240px',
        maxWidth: '280px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#7ecbff',
          fontFamily: 'monospace',
        }}
      >
        DEPLOY PROCESS
      </h3>

      {/* Memory capacity indicator */}
      <div
        style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#0f1621',
          borderRadius: '4px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#888',
            marginBottom: '4px',
          }}
        >
          <span>MEMORY</span>
          <span
            style={{
              color: usedMemory >= capacity.maxMemory ? '#ef4444' : '#a78bfa',
            }}
          >
            {usedMemory}/{capacity.maxMemory}
          </span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: '#1a1a2e',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(usedMemory / capacity.maxMemory) * 100}%`,
              backgroundColor: usedMemory >= capacity.maxMemory ? '#ef4444' : '#a78bfa',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {(Object.keys(ARCHETYPES) as ProcessArchetype[]).map((key, index) => {
          const archetype = ARCHETYPES[key]
          const keyHint = (index + 1).toString()
          const cost = getDeploymentCost(key)
          const affordable = canAfford(key)

          return (
            <button
              key={key}
              onClick={() => handleDeploy(key)}
              disabled={!affordable}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px',
                backgroundColor: affordable ? '#16213e' : '#0f1621',
                border: `2px solid #${archetype.color.toString(16).padStart(6, '0')}`,
                borderRadius: '4px',
                cursor: affordable ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                position: 'relative',
                opacity: affordable ? 1 : 0.5,
              }}
              onMouseEnter={e => {
                if (affordable) {
                  e.currentTarget.style.backgroundColor = '#1e2947'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 12px #${archetype.color.toString(16).padStart(6, '0')}40`
                }
              }}
              onMouseLeave={e => {
                if (affordable) {
                  e.currentTarget.style.backgroundColor = '#16213e'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {/* Key hint badge */}
              <div
                style={{
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
                }}
              >
                {keyHint}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: `#${archetype.color.toString(16).padStart(6, '0')}`,
                  marginBottom: '6px',
                  fontFamily: 'monospace',
                }}
              >
                {archetype.name.toUpperCase()}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#888',
                  marginBottom: '10px',
                  lineHeight: '1.3',
                }}
              >
                {archetype.description}
              </div>

              {/* Stats grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  width: '100%',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ color: '#888' }}>
                  HP:{' '}
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>
                    {archetype.baseStats.maxHealth}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  ATK:{' '}
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    {archetype.baseStats.attack}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  DEF:{' '}
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                    {archetype.baseStats.defense}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  SPD:{' '}
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {archetype.baseStats.speed}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  SIGHT:{' '}
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                    {archetype.baseStats.sightRange}
                  </span>
                </div>
                <div style={{ color: '#888' }}>
                  AP:{' '}
                  <span style={{ color: '#4ecdc4', fontWeight: 600 }}>
                    {archetype.baseStats.maxActionPoints}
                  </span>
                </div>
              </div>

              {/* Cost display */}
              <div
                style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #333',
                  width: '100%',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    color: affordable ? '#fbbf24' : '#ef4444',
                    fontWeight: 600,
                  }}
                >
                  {cost.resource}: {cost.amount}
                </span>
                <span
                  style={{
                    color:
                      usedMemory + getMemoryCost(key) > capacity.maxMemory ? '#ef4444' : '#a78bfa',
                    fontWeight: 600,
                  }}
                >
                  MEM: {getMemoryCost(key)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {expeditionActive && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#16213e',
            border: '1px solid #4ade80',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: '#4ade80',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          EXPEDITION ACTIVE
        </div>
      )}

      {/* Interventions - only show during active expedition */}
      {expeditionActive && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #333',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#fbbf24',
              fontFamily: 'monospace',
            }}
          >
            INTERVENTIONS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(Object.keys(INTERVENTIONS) as InterventionType[]).map(type => {
              const intervention = INTERVENTIONS[type]
              const canAffordIntervention = resources.energy >= intervention.cost
              const hasSelection = !!selectedProcessId
              const canUse = canAffordIntervention && hasSelection

              return (
                <button
                  key={type}
                  onClick={() => executeIntervention(type)}
                  disabled={!canUse}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: canUse ? '#16213e' : '#0f1621',
                    border: `1px solid ${canUse ? '#fbbf24' : '#333'}`,
                    borderRadius: '4px',
                    cursor: canUse ? 'pointer' : 'not-allowed',
                    opacity: canUse ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (canUse) {
                      e.currentTarget.style.backgroundColor = '#1e2947'
                      e.currentTarget.style.borderColor = '#fbbf24'
                    }
                  }}
                  onMouseLeave={e => {
                    if (canUse) {
                      e.currentTarget.style.backgroundColor = '#16213e'
                    }
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: canUse ? '#fbbf24' : '#666',
                        fontFamily: 'monospace',
                      }}
                    >
                      {type}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#888',
                        fontFamily: 'monospace',
                      }}
                    >
                      {intervention.description}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: canAffordIntervention ? '#fbbf24' : '#ef4444',
                      fontFamily: 'monospace',
                    }}
                  >
                    {intervention.cost} E
                  </div>
                </button>
              )
            })}
          </div>

          {!selectedProcessId && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '0.65rem',
                color: '#888',
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            >
              Select a unit to use interventions
            </div>
          )}
        </div>
      )}
    </div>
  )
})
