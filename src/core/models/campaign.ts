/**
 * Campaign data models for multi-sector gameplay
 */

import type { Grid, GridPosition, SectorConfig } from './grid'
import type { Process } from './process'

// ============= Sector State =============

export type SectorStatus = 'unexplored' | 'in_progress' | 'cleared' | 'lost'

/**
 * Persistent state for a sector across expeditions
 */
export interface SectorState {
  /** Unique sector identifier */
  id: string
  /** Display name */
  name: string
  /** Current status */
  status: SectorStatus
  /** Sector configuration for generation */
  config: SectorConfig
  /** Persisted grid state (fog, corruption, etc.) */
  grid: Grid | null
  /** Spawn points (persisted from generation) */
  spawnPoints: GridPosition[]
  /** IDs of malware that have been killed (don't respawn) */
  killedMalwareIds: string[]
  /** Corruption level 0-100 for campaign map display */
  corruptionPercent: number
  /** Position on campaign map (for rendering) */
  mapPosition: { x: number; y: number }
}

// ============= Campaign Structure =============

/**
 * Connection between two sectors in the campaign map
 */
export interface SectorConnection {
  /** First sector ID */
  from: string
  /** Second sector ID */
  to: string
}

/**
 * Campaign state - the full multi-sector game
 */
export interface Campaign {
  /** Unique campaign identifier */
  id: string
  /** All sectors in the campaign */
  sectors: SectorState[]
  /** Connections between sectors (for corruption spread) */
  connections: SectorConnection[]
  /** Currently selected sector ID (on campaign map) */
  selectedSectorId: string | null
  /** Sector currently being explored (in expedition) */
  activeSectorId: string | null
  /** Process pool - surviving processes available for deployment */
  processPool: Process[]
  /** Campaign creation timestamp */
  createdAt: number
  /** Last played timestamp */
  lastPlayedAt: number
}

// ============= Factory Functions =============

let campaignIdCounter = 0
let sectorIdCounter = 0

/**
 * Create a new sector state with default values
 */
export function createSectorState(
  name: string,
  config: Omit<SectorConfig, 'id'>,
  mapPosition: { x: number; y: number }
): SectorState {
  const id = `sector-${++sectorIdCounter}`
  return {
    id,
    name,
    status: 'unexplored',
    config: { ...config, id },
    grid: null,
    spawnPoints: [],
    killedMalwareIds: [],
    corruptionPercent: 0,
    mapPosition,
  }
}

/**
 * Generate a new campaign with 3 connected sectors
 */
export function generateCampaign(difficulty: 'easy' | 'normal' | 'hard'): Campaign {
  const id = `campaign-${++campaignIdCounter}`

  // Difficulty affects malware/corruption density
  const densityMultiplier = difficulty === 'easy' ? 0.5 : difficulty === 'hard' ? 1.5 : 1.0

  // Create 3 sectors in a triangle layout
  const sectors: SectorState[] = [
    createSectorState(
      'Alpha Sector',
      {
        name: 'Alpha Sector',
        size: 'medium',
        difficulty: difficulty === 'easy' ? 'easy' : 'normal',
        seed: Math.floor(Math.random() * 1000000),
        corruptionDensity: 0.1 * densityMultiplier,
        malwareDensity: 0.03 * densityMultiplier,
        cacheCount: 5,
      },
      { x: 150, y: 50 }
    ),
    createSectorState(
      'Beta Sector',
      {
        name: 'Beta Sector',
        size: 'medium',
        difficulty: 'normal',
        seed: Math.floor(Math.random() * 1000000),
        corruptionDensity: 0.15 * densityMultiplier,
        malwareDensity: 0.04 * densityMultiplier,
        cacheCount: 6,
      },
      { x: 50, y: 200 }
    ),
    createSectorState(
      'Gamma Sector',
      {
        name: 'Gamma Sector',
        size: 'medium',
        difficulty: difficulty === 'hard' ? 'hard' : 'normal',
        seed: Math.floor(Math.random() * 1000000),
        corruptionDensity: 0.2 * densityMultiplier,
        malwareDensity: 0.05 * densityMultiplier,
        cacheCount: 7,
      },
      { x: 250, y: 200 }
    ),
  ]

  // Connect sectors: Alpha-Beta, Alpha-Gamma, Beta-Gamma (triangle)
  const connections: SectorConnection[] = [
    { from: sectors[0]!.id, to: sectors[1]!.id },
    { from: sectors[0]!.id, to: sectors[2]!.id },
    { from: sectors[1]!.id, to: sectors[2]!.id },
  ]

  return {
    id,
    sectors,
    connections,
    selectedSectorId: sectors[0]!.id,
    activeSectorId: null,
    processPool: [],
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  }
}

// ============= Utility Functions =============

/**
 * Get a sector by ID from a campaign
 */
export function getSectorById(campaign: Campaign, sectorId: string): SectorState | undefined {
  return campaign.sectors.find(s => s.id === sectorId)
}

/**
 * Get connected sector IDs for a given sector
 */
export function getConnectedSectorIds(campaign: Campaign, sectorId: string): string[] {
  const connected: string[] = []
  for (const conn of campaign.connections) {
    if (conn.from === sectorId) {
      connected.push(conn.to)
    } else if (conn.to === sectorId) {
      connected.push(conn.from)
    }
  }
  return connected
}

/**
 * Check if two sectors are connected
 */
export function areSectorsConnected(
  campaign: Campaign,
  sectorId1: string,
  sectorId2: string
): boolean {
  return campaign.connections.some(
    conn =>
      (conn.from === sectorId1 && conn.to === sectorId2) ||
      (conn.from === sectorId2 && conn.to === sectorId1)
  )
}

/**
 * Update a sector's state in the campaign
 */
export function updateSectorInCampaign(
  campaign: Campaign,
  sectorId: string,
  updates: Partial<SectorState>
): Campaign {
  return {
    ...campaign,
    sectors: campaign.sectors.map(s => (s.id === sectorId ? { ...s, ...updates } : s)),
    lastPlayedAt: Date.now(),
  }
}

/**
 * Calculate campaign completion percentage
 */
export function getCampaignProgress(campaign: Campaign): number {
  const cleared = campaign.sectors.filter(s => s.status === 'cleared').length
  return Math.round((cleared / campaign.sectors.length) * 100)
}

/**
 * Check if campaign is lost (all sectors lost or critical sector lost)
 */
export function isCampaignLost(campaign: Campaign): boolean {
  // Campaign is lost if all sectors are lost
  return campaign.sectors.every(s => s.status === 'lost')
}

/**
 * Check if campaign is won (all sectors cleared)
 */
export function isCampaignWon(campaign: Campaign): boolean {
  return campaign.sectors.every(s => s.status === 'cleared')
}
