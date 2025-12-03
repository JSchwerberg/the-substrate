import './index.css'
import { useState, useEffect } from 'react'
import { GameCanvas } from '@renderer/GameCanvas'
import { useGameStore } from '@game/state/gameStore'
import { ErrorBoundary } from '@ui/ErrorBoundary'
import {
  ResourcePanel,
  DeploymentPanel,
  ProcessInfoPanel,
  ExpeditionStatus,
  CombatLog,
  BehaviorRuleEditor,
  UpgradeShop,
  ExpeditionRewards,
  DifficultySelector,
  LoadingScreen,
} from '@ui/index'

function App() {
  const selectedProcessId = useGameStore(state => state.selectedProcessId)
  const expeditionResult = useGameStore(state => state.expeditionResult)
  const currentSector = useGameStore(state => state.currentSector)
  const loadSavedData = useGameStore(state => state.loadSavedData)
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [showUpgradeShop, setShowUpgradeShop] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved progression on app startup
  useEffect(() => {
    loadSavedData()
  }, [loadSavedData])

  // Hide loading screen once sector is generated
  useEffect(() => {
    if (currentSector) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setIsLoading(false), 300)
      return () => clearTimeout(timer)
    }
  }, [currentSector])

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f0f1a',
          overflow: 'hidden',
        }}
      >
        {/* Top: Expedition Status */}
        <ExpeditionStatus />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left Sidebar: Deployment or Process Info */}
          <div
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#0f0f1a',
              borderRight: '1px solid #333',
              minWidth: '280px',
            }}
          >
            {/* Show Process Info if selected, otherwise show Deployment and Difficulty */}
            {selectedProcessId ? (
              <ProcessInfoPanel />
            ) : (
              <>
                <DeploymentPanel />
                <DifficultySelector />
              </>
            )}
          </div>

          {/* Center: Game Canvas */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <ErrorBoundary title="Rendering Error" showReload>
              <GameCanvas />
            </ErrorBoundary>
          </div>

          {/* Right Sidebar: Resources */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#0f0f1a',
              borderLeft: '1px solid #333',
              minWidth: '240px',
            }}
          >
            <ResourcePanel />
          </div>
        </div>

        {/* Bottom: Combat Log */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#0f0f1a',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CombatLog />
        </div>

        {/* Behavior Rule Editor Panel (Overlay) */}
        {showRuleEditor && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowRuleEditor(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <BehaviorRuleEditor />
            </div>
          </div>
        )}

        {/* Expedition Rewards Modal */}
        {expeditionResult !== 'active' && <ExpeditionRewards onNewExpedition={() => {}} />}

        {/* Upgrade Shop Modal */}
        {showUpgradeShop && <UpgradeShop onClose={() => setShowUpgradeShop(false)} />}

        {/* Footer: Controls hint */}
        <footer
          style={{
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            color: '#555',
            borderTop: '1px solid #222',
            fontFamily: 'monospace',
          }}
        >
          <span>
            <strong>CONTROLS:</strong> 1=Scout | 2=Purifier | SPACE=Pause/Resume | TAB=Cycle Units |
            CLICK=Move | R=New Sector
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowUpgradeShop(!showUpgradeShop)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#16213e',
                border: '1px solid #4ecdc4',
                borderRadius: '3px',
                color: '#4ecdc4',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#4ecdc420'
                e.currentTarget.style.boxShadow = '0 0 8px #4ecdc440'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#16213e'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {showUpgradeShop ? 'CLOSE' : 'SHOP'}
            </button>
            <button
              onClick={() => setShowRuleEditor(!showRuleEditor)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#16213e',
                border: '1px solid #7ecbff',
                borderRadius: '3px',
                color: '#7ecbff',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#7ecbff20'
                e.currentTarget.style.boxShadow = '0 0 8px #7ecbff40'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#16213e'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {showRuleEditor ? 'CLOSE' : 'RULES'}
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App
