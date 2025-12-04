/**
 * Campaign slice - manages campaign state and sector navigation
 */

import { StateCreator } from 'zustand'
import { generateCampaign, getSectorById, updateSectorInCampaign } from '@core/models/campaign'
import type { CampaignSlice, Difficulty } from '../types'
import type { GameState } from '../gameStore'
import type { Process } from '@core/models/process'

export const createCampaignSlice: StateCreator<GameState, [], [], CampaignSlice> = (set, get) => ({
  // Initial state
  campaign: null,
  gameScreen: 'main_menu',

  // Start a new campaign with given difficulty
  startNewCampaign: (difficulty: Difficulty) => {
    const campaign = generateCampaign(difficulty)
    set({
      campaign,
      gameScreen: 'campaign_map',
    })
  },

  // Select a sector on the campaign map
  selectSector: (sectorId: string) => {
    const { campaign } = get()
    if (!campaign) {
      return
    }

    set({
      campaign: {
        ...campaign,
        selectedSectorId: sectorId,
      },
    })
  },

  // Start an expedition in the selected sector
  startSectorExpedition: () => {
    const { campaign } = get()
    if (!campaign || !campaign.selectedSectorId) {
      return
    }

    const sector = getSectorById(campaign, campaign.selectedSectorId)
    if (!sector) {
      return
    }

    // Update sector status to in_progress if unexplored
    const updatedCampaign =
      sector.status === 'unexplored'
        ? updateSectorInCampaign(campaign, sector.id, { status: 'in_progress' })
        : campaign

    set({
      campaign: {
        ...updatedCampaign,
        activeSectorId: campaign.selectedSectorId,
      },
      gameScreen: 'expedition',
    })

    // Generate the sector for the expedition
    get().generateNewSector({
      size: sector.config.size,
      difficulty: sector.config.difficulty,
      seed: sector.config.seed,
      name: sector.name,
    })
  },

  // End the current sector expedition with a result
  endSectorExpedition: (result: 'victory' | 'defeat') => {
    const { campaign } = get()
    if (!campaign || !campaign.activeSectorId) {
      return
    }

    const sector = getSectorById(campaign, campaign.activeSectorId)
    if (!sector) {
      return
    }

    // Save current sector state before ending
    get().saveSectorState()

    // On victory, add surviving processes to the pool
    if (result === 'victory') {
      const processes = get().processes
      const surviving = processes.filter(p => p.status !== 'destroyed')
      if (surviving.length > 0) {
        get().addToProcessPool(surviving)
      }
    }

    // Update sector status based on result
    const newStatus = result === 'victory' ? 'cleared' : 'lost'
    const updatedCampaign = updateSectorInCampaign(campaign, sector.id, { status: newStatus })

    set({
      campaign: {
        ...updatedCampaign,
        activeSectorId: null,
      },
      gameScreen: 'campaign_map',
    })
  },

  // Return to campaign map from expedition (without ending it)
  returnToCampaignMap: () => {
    const { campaign } = get()
    if (!campaign) {
      return
    }

    set({
      campaign: {
        ...campaign,
        activeSectorId: null,
      },
      gameScreen: 'campaign_map',
    })
  },

  // Set the current game screen
  setGameScreen: (screen: 'main_menu' | 'campaign_map' | 'expedition') => {
    set({ gameScreen: screen })
  },

  // Save current sector state to the campaign
  saveSectorState: () => {
    const { campaign, currentSector, malware } = get()
    if (!campaign || !campaign.activeSectorId || !currentSector) {
      console.warn('Cannot save sector state: no active sector')
      return
    }

    const sector = getSectorById(campaign, campaign.activeSectorId)
    if (!sector) {
      console.warn(`Cannot save sector state: sector ${campaign.activeSectorId} not found`)
      return
    }

    // Get IDs of destroyed malware (they should not respawn)
    const killedMalwareIds = malware.filter(m => m.status === 'destroyed').map(m => m.id)

    // Update sector with current grid and killed malware
    const updatedCampaign = updateSectorInCampaign(campaign, sector.id, {
      grid: currentSector.grid,
      killedMalwareIds: [...sector.killedMalwareIds, ...killedMalwareIds],
    })

    set({ campaign: updatedCampaign })

    // Auto-save progression with campaign state
    get().autoSaveProgression()

    console.info(`Saved state for sector ${sector.name}`)
  },

  // Load sector state for a given sector
  loadSectorState: (sectorId: string) => {
    const { campaign } = get()
    if (!campaign) {
      console.warn('Cannot load sector state: no active campaign')
      return
    }

    const sector = getSectorById(campaign, sectorId)
    if (!sector) {
      console.warn(`Cannot load sector state: sector ${sectorId} not found`)
      return
    }

    // Note: Full restoration requires coordination with generateNewSector
    // For now, just log that we would restore the state
    // The sector's saved grid and killedMalwareIds will be used by generateNewSector
    console.info(
      `Sector ${sector.name} has saved state: ${sector.grid ? 'grid saved' : 'no grid'}, ${sector.killedMalwareIds.length} malware killed`
    )
  },

  // Add processes to the campaign pool (filters out destroyed)
  addToProcessPool: (processes: Process[]) => {
    const { campaign } = get()
    if (!campaign) {
      return
    }

    // Filter out destroyed processes
    const validProcesses = processes.filter(p => p.status !== 'destroyed')

    set({
      campaign: {
        ...campaign,
        processPool: [...campaign.processPool, ...validProcesses],
        lastPlayedAt: Date.now(),
      },
    })
  },

  // Remove a process from the campaign pool
  removeFromProcessPool: (processId: string) => {
    const { campaign } = get()
    if (!campaign) {
      return
    }

    set({
      campaign: {
        ...campaign,
        processPool: campaign.processPool.filter(p => p.id !== processId),
        lastPlayedAt: Date.now(),
      },
    })
  },

  // Abandon the current campaign and return to main menu
  abandonCampaign: () => {
    set({
      campaign: null,
      gameScreen: 'main_menu',
    })
  },
})
