import { useCallback } from 'react'
import { Graphics } from 'pixi.js'
import { Process, getHealthPercent } from '@core/models/process'

interface ProcessSpriteProps {
  process: Process
  tileSize: number
  selected?: boolean
}

export function ProcessSprite({ process, tileSize, selected = false }: ProcessSpriteProps) {
  const draw = useCallback((g: Graphics) => {
    g.clear()

    const cx = process.position.x * tileSize + tileSize / 2
    const cy = process.position.y * tileSize + tileSize / 2
    const radius = tileSize * 0.35

    // Draw selection ring if selected
    if (selected) {
      g.setStrokeStyle({ width: 3, color: 0xffffff, alpha: 0.9 })
      g.circle(cx, cy, radius + 4)
      g.stroke()
    }

    // Draw main body
    g.circle(cx, cy, radius)
    g.fill(process.color)

    // Draw outline
    g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.6 })
    g.circle(cx, cy, radius)
    g.stroke()

    // Draw archetype indicator (inner symbol)
    if (process.archetype === 'scout') {
      // Scout: small dot in center (eye)
      g.circle(cx, cy, radius * 0.25)
      g.fill(0xffffff)
    } else if (process.archetype === 'purifier') {
      // Purifier: cross/plus sign
      const lineLen = radius * 0.5
      g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.9 })
      g.moveTo(cx - lineLen, cy)
      g.lineTo(cx + lineLen, cy)
      g.moveTo(cx, cy - lineLen)
      g.lineTo(cx, cy + lineLen)
      g.stroke()
    }

    // Draw health bar if damaged
    const healthPercent = getHealthPercent(process)
    if (healthPercent < 100) {
      const barWidth = tileSize * 0.8
      const barHeight = 4
      const barX = cx - barWidth / 2
      const barY = cy + radius + 6

      // Background
      g.rect(barX, barY, barWidth, barHeight)
      g.fill({ color: 0x000000, alpha: 0.7 })

      // Health fill
      const healthWidth = (barWidth * healthPercent) / 100
      const healthColor = healthPercent > 50 ? 0x4ade80 : healthPercent > 25 ? 0xfbbf24 : 0xef4444
      g.rect(barX, barY, healthWidth, barHeight)
      g.fill(healthColor)

      // Border
      g.setStrokeStyle({ width: 1, color: 0xffffff, alpha: 0.5 })
      g.rect(barX, barY, barWidth, barHeight)
      g.stroke()
    }

    // Draw status indicator
    if (process.status === 'moving') {
      // Moving: small arrow
      const arrowY = cy - radius - 8
      g.setStrokeStyle({ width: 2, color: 0x4ade80 })
      g.moveTo(cx, arrowY - 4)
      g.lineTo(cx, arrowY + 4)
      g.moveTo(cx - 3, arrowY)
      g.lineTo(cx, arrowY - 4)
      g.lineTo(cx + 3, arrowY)
      g.stroke()
    } else if (process.status === 'attacking') {
      // Attacking: small sword/slash
      const attackY = cy - radius - 8
      g.setStrokeStyle({ width: 2, color: 0xef4444 })
      g.moveTo(cx - 4, attackY + 4)
      g.lineTo(cx + 4, attackY - 4)
      g.stroke()
    }
  }, [process, tileSize, selected])

  // Don't render destroyed processes
  if (process.status === 'destroyed') {
    return null
  }

  return <pixiGraphics draw={draw} />
}

// Multiple processes renderer
interface ProcessesLayerProps {
  processes: Process[]
  tileSize: number
  selectedId?: string | null
}

export function ProcessesLayer({ processes, tileSize, selectedId }: ProcessesLayerProps) {
  return (
    <>
      {processes
        .filter(p => p.status !== 'destroyed')
        .map(process => (
          <ProcessSprite
            key={process.id}
            process={process}
            tileSize={tileSize}
            selected={process.id === selectedId}
          />
        ))}
    </>
  )
}
