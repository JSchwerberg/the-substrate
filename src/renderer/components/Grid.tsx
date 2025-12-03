import { useCallback, useMemo } from 'react'
import { Graphics } from 'pixi.js'
import { Grid as GridModel, Tile, TileType, VisibilityState, GridPosition } from '@core/models/grid'

interface GridProps {
  grid: GridModel
  tileSize: number
  selectedTile?: GridPosition | null
  onTileClick?: (position: GridPosition) => void
}

// Tile colors by type
const TILE_COLORS: Record<TileType, number> = {
  empty: 0x2a2a3a,
  blocked: 0x1a1a1a,
  corruption: 0x6b2d5b,
  data_cache: 0xc9a227,
  spawn_point: 0x27c96b,
  exit_point: 0x2779c9,
}

// Visibility modifiers
const VISIBILITY_ALPHA: Record<VisibilityState, number> = {
  hidden: 0,
  revealed: 0.5,
  visible: 1,
}

// Fog color
const FOG_COLOR = 0x0a0a12

export function Grid({ grid, tileSize, selectedTile }: GridProps) {
  // Memoize the draw function to prevent unnecessary redraws
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()

      // Draw tiles
      for (let y = 0; y < grid.height; y++) {
        const row = grid.tiles[y]
        if (!row) continue

        for (let x = 0; x < grid.width; x++) {
          const tile = row[x]
          if (!tile) continue

          const px = x * tileSize
          const py = y * tileSize
          const padding = 1

          // Draw base tile (always, for grid structure)
          if (tile.visibility === 'hidden') {
            // Hidden tiles show only fog
            g.rect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
            g.fill(FOG_COLOR)
          } else {
            // Visible/revealed tiles show their type
            const baseColor = TILE_COLORS[tile.type]
            const alpha = VISIBILITY_ALPHA[tile.visibility]

            g.rect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
            g.fill({ color: baseColor, alpha })

            // Add corruption overlay if tile has corruption level
            if (tile.corruptionLevel > 0 && tile.type !== 'corruption') {
              const corruptionAlpha = (tile.corruptionLevel / 100) * 0.4 * alpha
              g.rect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
              g.fill({ color: 0x6b2d5b, alpha: corruptionAlpha })
            }

            // Dim overlay for revealed but not visible
            if (tile.visibility === 'revealed') {
              g.rect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
              g.fill({ color: 0x000000, alpha: 0.4 })
            }
          }
        }
      }

      // Draw grid lines
      g.setStrokeStyle({ width: 1, color: 0x3a3a4a, alpha: 0.3 })
      for (let x = 0; x <= grid.width; x++) {
        g.moveTo(x * tileSize, 0)
        g.lineTo(x * tileSize, grid.height * tileSize)
      }
      for (let y = 0; y <= grid.height; y++) {
        g.moveTo(0, y * tileSize)
        g.lineTo(grid.width * tileSize, y * tileSize)
      }
      g.stroke()

      // Draw selection highlight
      if (selectedTile) {
        const sx = selectedTile.x * tileSize
        const sy = selectedTile.y * tileSize
        g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.8 })
        g.rect(sx + 1, sy + 1, tileSize - 2, tileSize - 2)
        g.stroke()
      }
    },
    [grid, tileSize, selectedTile]
  )

  return <pixiGraphics draw={draw} eventMode="static" />
}

// Viewer/entity marker component
interface ViewerMarkerProps {
  position: GridPosition
  tileSize: number
  color?: number
}

export function ViewerMarker({ position, tileSize, color = 0x4ecdc4 }: ViewerMarkerProps) {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()

      const cx = position.x * tileSize + tileSize / 2
      const cy = position.y * tileSize + tileSize / 2
      const radius = tileSize * 0.35

      // Draw circle for viewer
      g.circle(cx, cy, radius)
      g.fill(color)

      // Draw outline
      g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.8 })
      g.circle(cx, cy, radius)
      g.stroke()
    },
    [position, tileSize, color]
  )

  return <pixiGraphics draw={draw} />
}

// Simple Grid component for backwards compatibility (demo grid)
interface SimpleGridProps {
  width: number
  height: number
  tileSize: number
}

export function SimpleGrid({ width, height, tileSize }: SimpleGridProps) {
  // Create a demo grid
  const demoGrid = useMemo((): GridModel => {
    const tiles: Tile[][] = []
    for (let y = 0; y < height; y++) {
      const row: Tile[] = []
      for (let x = 0; x < width; x++) {
        let type: TileType = 'empty'

        // Demo layout
        if (x === 0 && y === Math.floor(height / 2)) {
          type = 'spawn_point'
        } else if (x === width - 1 && y === Math.floor(height / 2)) {
          type = 'exit_point'
        } else if ((x === 3 && y === 2) || (x === 5 && y === 5)) {
          type = 'data_cache'
        } else if ((x === 4 && y === 3) || (x === 4 && y === 4) || (x === 3 && y === 4)) {
          type = 'corruption'
        } else if ((x === 2 && y === 1) || (x === 6 && y === 6)) {
          type = 'blocked'
        }

        row.push({
          type,
          visibility: 'visible', // All visible for demo
          corruptionLevel: type === 'corruption' ? 50 : 0,
          entityIds: [],
        })
      }
      tiles.push(row)
    }
    return { width, height, tiles }
  }, [width, height])

  return <Grid grid={demoGrid} tileSize={tileSize} />
}
