import { Application, extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Grid } from './components/Grid'
import { ProcessesLayer } from './components/ProcessSprite'
import { MalwareLayer } from './components/MalwareSprite'
import { useGameStore } from '@game/state/gameStore'
import { getTile, isWalkable } from '@core/models/grid'
import { RENDER } from '@core/constants/GameConfig'
import { TUTORIAL_STEPS } from '@core/constants/TutorialConfig'

// Extend PixiJS components for React
extend({ Container, Graphics })

const TILE_SIZE = RENDER.TILE_SIZE

interface ViewState {
  offsetX: number
  offsetY: number
  scale: number
}

interface TouchState {
  initialDistance: number
  initialScale: number
}

export function GameCanvas() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [view, setView] = useState<ViewState>({ offsetX: 0, offsetY: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchState = useRef<TouchState | null>(null)

  // Get state from store
  const currentSector = useGameStore(state => state.currentSector)
  const processes = useGameStore(state => state.processes)
  const malware = useGameStore(state => state.malware)
  const selectedProcessId = useGameStore(state => state.selectedProcessId)
  const expeditionActive = useGameStore(state => state.expeditionActive)
  const isPaused = useGameStore(state => state.isPaused)
  const tutorialActive = useGameStore(state => state.tutorialActive)
  const currentStepIndex = useGameStore(state => state.currentStepIndex)

  const generateNewSector = useGameStore(state => state.generateNewSector)
  const deployProcess = useGameStore(state => state.deployProcess)
  const selectProcess = useGameStore(state => state.selectProcess)
  const moveSelectedProcess = useGameStore(state => state.moveSelectedProcess)
  const startExpedition = useGameStore(state => state.startExpedition)
  const tick = useGameStore(state => state.tick)
  const togglePause = useGameStore(state => state.togglePause)

  // Generate initial sector on mount
  useEffect(() => {
    if (!currentSector) {
      generateNewSector({
        size: 'small',
        difficulty: 'easy',
        seed: Date.now(),
      })
    }
  }, [currentSector, generateNewSector])

  // Game loop - tick at configured interval when not paused
  useEffect(() => {
    if (!expeditionActive || isPaused) return

    const interval = setInterval(() => {
      tick()
    }, RENDER.TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [expeditionActive, isPaused, tick])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'r':
        case 'R':
          generateNewSector({
            size: 'small',
            difficulty: 'easy',
            seed: Date.now(),
          })
          break
        case '1':
          if (currentSector) deployProcess('scout', 0)
          break
        case '2':
          if (currentSector) deployProcess('purifier', 0)
          break
        case ' ':
          e.preventDefault()
          if (processes.length > 0) {
            if (!expeditionActive) {
              startExpedition()
            } else {
              togglePause()
            }
          }
          break
        case 'Tab':
          e.preventDefault()
          // Cycle through processes
          if (processes.length > 0) {
            const currentIndex = processes.findIndex(p => p.id === selectedProcessId)
            const nextIndex = (currentIndex + 1) % processes.length
            const nextProcess = processes[nextIndex]
            if (nextProcess) {
              selectProcess(nextProcess.id)
            }
          }
          break
        case 'Escape':
          selectProcess(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentSector,
    processes,
    selectedProcessId,
    expeditionActive,
    generateNewSector,
    deployProcess,
    selectProcess,
    startExpedition,
    togglePause,
  ])

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.min(window.innerWidth, 800),
        height: Math.min(window.innerHeight - 180, 500),
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate grid dimensions and centering
  const gridWidth = currentSector?.grid.width ?? 8
  const gridHeight = currentSector?.grid.height ?? 8
  const gridPixelWidth = gridWidth * TILE_SIZE
  const gridPixelHeight = gridHeight * TILE_SIZE
  const baseOffsetX = (dimensions.width - gridPixelWidth * view.scale) / 2
  const baseOffsetY = (dimensions.height - gridPixelHeight * view.scale) / 2

  // Build visible positions set for malware rendering
  const visiblePositions = useMemo(() => {
    const set = new Set<string>()
    if (!currentSector) return set

    for (let y = 0; y < currentSector.grid.height; y++) {
      const row = currentSector.grid.tiles[y]
      if (!row) continue
      for (let x = 0; x < currentSector.grid.width; x++) {
        const tile = row[x]
        if (tile && tile.visibility === 'visible') {
          set.add(`${x},${y}`)
        }
      }
    }
    return set
  }, [currentSector])

  // Convert screen position to grid position
  const screenToGrid = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return null

      const rect = containerRef.current.getBoundingClientRect()
      const localX = screenX - rect.left
      const localY = screenY - rect.top

      const worldX = (localX - baseOffsetX - view.offsetX) / view.scale
      const worldY = (localY - baseOffsetY - view.offsetY) / view.scale

      const gridX = Math.floor(worldX / TILE_SIZE)
      const gridY = Math.floor(worldY / TILE_SIZE)

      return { x: gridX, y: gridY }
    },
    [baseOffsetX, baseOffsetY, view]
  )

  // Handle click on canvas
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!currentSector) return

      const gridPos = screenToGrid(e.clientX, e.clientY)
      if (!gridPos) return

      const tile = getTile(currentSector.grid, gridPos)
      if (!tile) return

      // Check if clicking on a process
      const clickedProcess = processes.find(
        p => p.position.x === gridPos.x && p.position.y === gridPos.y
      )

      if (clickedProcess) {
        selectProcess(clickedProcess.id)
        return
      }

      // If a process is selected and tile is walkable, move there
      if (selectedProcessId && isWalkable(tile) && tile.visibility !== 'hidden') {
        moveSelectedProcess(gridPos)
      }
    },
    [currentSector, processes, selectedProcessId, screenToGrid, selectProcess, moveSelectedProcess]
  )

  // Touch/mouse handlers for panning
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    lastPointerPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !lastPointerPos.current) return

      const deltaX = e.clientX - lastPointerPos.current.x
      const deltaY = e.clientY - lastPointerPos.current.y

      setView(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
      }))

      lastPointerPos.current = { x: e.clientX, y: e.clientY }
    },
    [isDragging]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    lastPointerPos.current = null
  }, [])

  // Wheel handler for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setView(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * zoomFactor)),
    }))
  }, [])

  // Touch handlers for pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList): number => {
    const t0 = touches[0]
    const t1 = touches[1]
    if (!t0 || !t1) return 0
    const dx = t1.clientX - t0.clientX
    const dy = t1.clientY - t0.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        touchState.current = {
          initialDistance: getTouchDistance(e.touches),
          initialScale: view.scale,
        }
      }
    },
    [view.scale]
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.current) {
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      const scaleFactor = currentDistance / touchState.current.initialDistance
      const newScale = touchState.current.initialScale * scaleFactor
      setView(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, newScale)),
      }))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchState.current = null
  }, [])

  // Handle PixiJS Application initialization
  const handlePixiInit = useCallback(() => {
    // Use requestAnimationFrame to ensure PixiJS is fully initialized
    requestAnimationFrame(() => {
      setIsReady(true)
    })
  }, [])

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <Application
        width={dimensions.width}
        height={dimensions.height}
        background="#0f0f1a"
        antialias={false}
        resolution={window.devicePixelRatio || 1}
        autoDensity={true}
        onInit={handlePixiInit}
      >
        <pixiContainer
          x={baseOffsetX + view.offsetX}
          y={baseOffsetY + view.offsetY}
          scale={view.scale}
        >
          {isReady && currentSector && (
            <>
              <Grid key={currentSector.config.id} grid={currentSector.grid} tileSize={TILE_SIZE} />
              <MalwareLayer
                malware={malware}
                tileSize={TILE_SIZE}
                visiblePositions={visiblePositions}
              />
              <ProcessesLayer
                processes={processes}
                tileSize={TILE_SIZE}
                selectedId={selectedProcessId}
              />
              {/* Tutorial highlight layer */}
              {tutorialActive && (
                <pixiGraphics
                  draw={g => {
                    g.clear()
                    const step = TUTORIAL_STEPS[currentStepIndex]
                    if (step?.highlightPositions) {
                      for (const pos of step.highlightPositions) {
                        g.rect(pos.x * TILE_SIZE, pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                      }
                      g.stroke({ width: 3, color: 0xfbbf24, alpha: 0.8 })
                    }
                  }}
                />
              )}
            </>
          )}
        </pixiContainer>
      </Application>
    </div>
  )
}
