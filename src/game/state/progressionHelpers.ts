/**
 * Helper utilities for the progression system
 */

import { UpgradeType, Upgrades, UPGRADE_COSTS, REWARDS } from './gameStore'

/**
 * Get a human-readable name for an upgrade type
 */
export function getUpgradeName(upgradeType: UpgradeType): string {
  const names: Record<UpgradeType, string> = {
    maxHealth: 'Max Health',
    attack: 'Attack',
    defense: 'Defense',
    startingCycles: 'Starting Cycles',
  }
  return names[upgradeType]
}

/**
 * Get a description for an upgrade type
 */
export function getUpgradeDescription(upgradeType: UpgradeType): string {
  const descriptions: Record<UpgradeType, string> = {
    maxHealth: 'Increases max health of deployed processes by 10 HP per level',
    attack: 'Increases attack damage of deployed processes by 2 per level',
    defense: 'Increases defense of deployed processes by 1 per level',
    startingCycles: 'Increases starting cycles for each expedition by 20 per level',
  }
  return descriptions[upgradeType]
}

/**
 * Get the bonus value for a single level of an upgrade
 */
export function getUpgradeBonusPerLevel(upgradeType: UpgradeType): number {
  const bonuses: Record<UpgradeType, number> = {
    maxHealth: 10,
    attack: 2,
    defense: 1,
    startingCycles: 20,
  }
  return bonuses[upgradeType]
}

/**
 * Calculate the total bonus from an upgrade
 */
export function calculateUpgradeBonus(upgradeType: UpgradeType, level: number): number {
  return getUpgradeBonusPerLevel(upgradeType) * level
}

/**
 * Get all upgrade types as an array
 */
export function getAllUpgradeTypes(): UpgradeType[] {
  return ['maxHealth', 'attack', 'defense', 'startingCycles']
}

/**
 * Format upgrade bonus for display
 */
export function formatUpgradeBonus(upgradeType: UpgradeType, level: number): string {
  const bonus = calculateUpgradeBonus(upgradeType, level)

  switch (upgradeType) {
    case 'maxHealth':
      return `+${bonus} HP`
    case 'attack':
      return `+${bonus} Attack`
    case 'defense':
      return `+${bonus} Defense`
    case 'startingCycles':
      return `+${bonus} Cycles`
  }
}

/**
 * Calculate expedition rewards without updating state
 */
export function calculateExpeditionRewards(
  cachesCollected: number,
  malwareDestroyed: number,
  ticksSurvived: number,
  isVictory: boolean,
  rewardMultiplier: number = 1.0
): {
  cacheReward: number
  malwareReward: number
  victoryBonus: number
  survivalBonus: number
  totalReward: number
} {
  const cacheReward = Math.floor(cachesCollected * REWARDS.CACHE_COLLECTED * rewardMultiplier)
  const malwareReward = Math.floor(malwareDestroyed * REWARDS.MALWARE_DESTROYED * rewardMultiplier)
  const victoryBonus = isVictory ? Math.floor(REWARDS.VICTORY_BONUS * rewardMultiplier) : 0
  const survivalBonus = Math.floor(Math.floor(ticksSurvived / 10) * REWARDS.SURVIVAL_BONUS_PER_10_TICKS * rewardMultiplier)
  const totalReward = cacheReward + malwareReward + victoryBonus + survivalBonus

  return {
    cacheReward,
    malwareReward,
    victoryBonus,
    survivalBonus,
    totalReward,
  }
}

/**
 * Get the cost for multiple upgrade levels
 */
export function getUpgradeCostRange(
  upgradeType: UpgradeType,
  fromLevel: number,
  toLevel: number
): number {
  let totalCost = 0
  for (let level = fromLevel; level < toLevel; level++) {
    totalCost += UPGRADE_COSTS[upgradeType](level)
  }
  return totalCost
}

/**
 * Check if player can afford an upgrade
 */
export function canAffordUpgrade(
  upgradeType: UpgradeType,
  currentLevel: number,
  totalData: number
): boolean {
  const cost = UPGRADE_COSTS[upgradeType](currentLevel)
  return totalData >= cost
}

/**
 * Get upgrade efficiency (bonus per data spent at this level)
 */
export function getUpgradeEfficiency(upgradeType: UpgradeType, level: number): number {
  const cost = UPGRADE_COSTS[upgradeType](level)
  const bonus = getUpgradeBonusPerLevel(upgradeType)
  return bonus / cost
}

/**
 * Get all upgrades sorted by efficiency at current levels
 */
export function getUpgradesByEfficiency(upgrades: Upgrades): {
  upgradeType: UpgradeType
  efficiency: number
  cost: number
  level: number
}[] {
  return getAllUpgradeTypes()
    .map(upgradeType => ({
      upgradeType,
      level: upgrades[upgradeType],
      cost: UPGRADE_COSTS[upgradeType](upgrades[upgradeType]),
      efficiency: getUpgradeEfficiency(upgradeType, upgrades[upgradeType]),
    }))
    .sort((a, b) => b.efficiency - a.efficiency)
}
