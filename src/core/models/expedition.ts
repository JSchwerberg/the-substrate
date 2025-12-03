/**
 * Expedition state - ties together sector, processes, and malware
 */

import { Sector, GridPosition } from './grid'
import { Process } from './process'
import { Malware } from './malware'

// ============= Expedition Events =============

export type ExpeditionEventType =
  | 'expedition_started'
  | 'expedition_ended'
  | 'process_spawned'
  | 'process_moved'
  | 'process_attacked'
  | 'process_damaged'
  | 'process_destroyed'
  | 'process_healed'
  | 'malware_spawned'
  | 'malware_activated'
  | 'malware_attacked'
  | 'malware_damaged'
  | 'malware_destroyed'
  | 'malware_ability_used'
  | 'cache_collected'
  | 'tile_revealed'
  | 'corruption_spread'
  | 'tick_completed'

export interface ExpeditionEvent {
  tick: number
  type: ExpeditionEventType
  actorId?: string
  targetId?: string
  position?: GridPosition
  value?: number
  message: string
}

// ============= Expedition Status =============

export type ExpeditionStatus =
  | 'preparing' // Setting up squad
  | 'active' // In progress
  | 'paused' // Paused by player
  | 'victory' // All objectives complete
  | 'defeat' // All processes destroyed
  | 'retreated' // Player retreated

// ============= Expedition Rewards =============

export interface ExpeditionRewards {
  dataHarvested: number
  cachesCollected: number
  malwareDestroyed: number
  tilesExplored: number
  bonusPoints: number
}

// ============= Expedition State =============

export interface Expedition {
  id: string
  sector: Sector

  // Entities
  processes: Map<string, Process>
  malware: Map<string, Malware>

  // Timing
  currentTick: number
  tickSpeed: number // ms per tick (lower = faster)
  isPaused: boolean

  // Status
  status: ExpeditionStatus

  // Event log
  eventLog: ExpeditionEvent[]
  maxLogSize: number

  // Intervention
  interventionEnergy: number
  interventionsUsed: number

  // Results
  rewards: ExpeditionRewards
}

// ============= Factory =============

let expeditionIdCounter = 0

export function createExpedition(sector: Sector): Expedition {
  return {
    id: `expedition-${++expeditionIdCounter}`,
    sector,
    processes: new Map(),
    malware: new Map(),
    currentTick: 0,
    tickSpeed: 500, // 500ms per tick (2 ticks per second)
    isPaused: true,
    status: 'preparing',
    eventLog: [],
    maxLogSize: 100,
    interventionEnergy: 100,
    interventionsUsed: 0,
    rewards: {
      dataHarvested: 0,
      cachesCollected: 0,
      malwareDestroyed: 0,
      tilesExplored: 0,
      bonusPoints: 0,
    },
  }
}

// ============= Event Logging =============

export function logEvent(
  expedition: Expedition,
  type: ExpeditionEventType,
  message: string,
  details?: {
    actorId?: string
    targetId?: string
    position?: GridPosition
    value?: number
  }
): void {
  const event: ExpeditionEvent = {
    tick: expedition.currentTick,
    type,
    message,
    ...details,
  }

  expedition.eventLog.push(event)

  // Trim log if too large
  if (expedition.eventLog.length > expedition.maxLogSize) {
    expedition.eventLog = expedition.eventLog.slice(-expedition.maxLogSize)
  }
}

// ============= Entity Management =============

export function addProcess(expedition: Expedition, process: Process): void {
  expedition.processes.set(process.id, process)
  logEvent(expedition, 'process_spawned', `${process.name} deployed`, {
    actorId: process.id,
    position: process.position,
  })
}

export function removeProcess(expedition: Expedition, processId: string): void {
  expedition.processes.delete(processId)
}

export function addMalware(expedition: Expedition, malware: Malware): void {
  expedition.malware.set(malware.id, malware)
}

export function removeMalware(expedition: Expedition, malwareId: string): void {
  expedition.malware.delete(malwareId)
}

// ============= Queries =============

export function getProcessAt(expedition: Expedition, position: GridPosition): Process | null {
  for (const process of expedition.processes.values()) {
    if (process.position.x === position.x && process.position.y === position.y) {
      return process
    }
  }
  return null
}

export function getMalwareAt(expedition: Expedition, position: GridPosition): Malware | null {
  for (const malware of expedition.malware.values()) {
    if (malware.position.x === position.x && malware.position.y === position.y) {
      return malware
    }
  }
  return null
}

export function getAliveProcesses(expedition: Expedition): Process[] {
  return Array.from(expedition.processes.values()).filter(p => p.status !== 'destroyed')
}

export function getAliveMalware(expedition: Expedition): Malware[] {
  return Array.from(expedition.malware.values()).filter(m => m.status !== 'destroyed')
}

export function getProcessesInRange(
  expedition: Expedition,
  position: GridPosition,
  range: number
): Process[] {
  return getAliveProcesses(expedition).filter(p => {
    const dx = Math.abs(p.position.x - position.x)
    const dy = Math.abs(p.position.y - position.y)
    return dx + dy <= range
  })
}

export function getMalwareInRange(
  expedition: Expedition,
  position: GridPosition,
  range: number
): Malware[] {
  return getAliveMalware(expedition).filter(m => {
    const dx = Math.abs(m.position.x - position.x)
    const dy = Math.abs(m.position.y - position.y)
    return dx + dy <= range
  })
}

// ============= Victory/Defeat Checks =============

export function checkVictoryConditions(expedition: Expedition): boolean {
  // Victory: All malware destroyed OR exit reached with data
  const aliveMalware = getAliveMalware(expedition)
  return aliveMalware.length === 0
}

export function checkDefeatConditions(expedition: Expedition): boolean {
  // Defeat: All processes destroyed
  const aliveProcesses = getAliveProcesses(expedition)
  return aliveProcesses.length === 0 && expedition.status === 'active'
}

export function updateExpeditionStatus(expedition: Expedition): void {
  if (expedition.status !== 'active') return

  if (checkDefeatConditions(expedition)) {
    expedition.status = 'defeat'
    logEvent(expedition, 'expedition_ended', 'All processes destroyed - Expedition failed')
  } else if (checkVictoryConditions(expedition)) {
    expedition.status = 'victory'
    logEvent(expedition, 'expedition_ended', 'Sector cleared - Victory!')
  }
}
