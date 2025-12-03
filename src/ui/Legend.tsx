/**
 * Legend - Shows game symbols and their meanings
 */

import { useState } from 'react'

interface LegendItem {
  name: string
  color: string
  description: string
}

const TILE_LEGEND: LegendItem[] = [
  { name: 'Floor', color: '#2a2a3a', description: 'Walkable tile' },
  { name: 'Blocked', color: '#1a1a1a', description: 'Impassable' },
  { name: 'Spawn', color: '#27c96b', description: 'Deploy units here' },
  { name: 'Exit', color: '#2779c9', description: 'Extraction point' },
  { name: 'Cache', color: '#c9a227', description: '+10 cycles on pickup' },
  { name: 'Corruption', color: '#6b2d5b', description: 'Hazardous terrain' },
]

const PROCESS_LEGEND: LegendItem[] = [
  { name: 'Scout', color: '#4ecdc4', description: 'Fast, high vision' },
  { name: 'Purifier', color: '#ff6b6b', description: 'High damage dealer' },
]

const MALWARE_LEGEND: LegendItem[] = [
  { name: 'Worm', color: '#4ade80', description: 'Replicates over time' },
  { name: 'Trojan', color: '#fb923c', description: 'Disguised, ambushes' },
  { name: 'Rootkit', color: '#a855f7', description: 'Entrenched, tough' },
  { name: 'Logic Bomb', color: '#ef4444', description: 'Explodes on trigger' },
]

export function Legend() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#7ecbff',
          fontFamily: 'monospace',
        }}>
          LEGEND
        </span>
        <span style={{
          color: '#666',
          fontSize: '0.8rem',
        }}>
          {isExpanded ? '[-]' : '[+]'}
        </span>
      </button>

      {isExpanded && (
        <div style={{
          padding: '0 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <LegendSection title="Tiles" items={TILE_LEGEND} />
          <LegendSection title="Processes" items={PROCESS_LEGEND} />
          <LegendSection title="Malware" items={MALWARE_LEGEND} />
        </div>
      )}
    </div>
  )
}

function LegendSection({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem',
        color: '#666',
        fontFamily: 'monospace',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {items.map(item => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{
              width: '14px',
              height: '14px',
              backgroundColor: item.color,
              borderRadius: '2px',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              color: '#aaa',
              minWidth: '60px',
            }}>
              {item.name}
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              color: '#666',
            }}>
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
