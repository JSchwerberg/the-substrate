/**
 * Tutorial step definitions
 * Defines the sequence of tutorial steps and their completion conditions
 */

import type { TutorialStep } from '@game/state/types'

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Substrate',
    description:
      'Your mission: deploy processes to explore hostile sectors, destroy malware, and secure data caches. This tutorial will teach you the basics.',
    hint: 'Click "Continue" when ready to begin.',
    allowedActions: ['any'],
    completionCondition: 'acknowledged',
  },
  {
    id: 'deploy_scout',
    title: 'Deploy a Scout',
    description:
      'Scouts are fast units with high visibility range. Deploy one at the spawn point to begin exploring.',
    hint: 'Click the Scout archetype in the Deployment Panel, then click the highlighted spawn point.',
    allowedActions: ['deploy_scout'],
    highlightPositions: [{ x: 0, y: 3 }],
    highlightElements: ['scout-button', 'spawn-point'],
    completionCondition: 'process_deployed',
    completionParams: { archetype: 'scout' },
  },
  {
    id: 'select_unit',
    title: 'Select Your Scout',
    description:
      'Click on your deployed Scout to select it. Selected units show their movement range and stats.',
    hint: 'Click on the Scout unit you just deployed.',
    allowedActions: ['select_process'],
    completionCondition: 'process_selected',
  },
  {
    id: 'move_unit',
    title: 'Move Your Scout',
    description:
      'Click on the highlighted tile to move your Scout. Units move automatically during each game tick.',
    hint: 'Click the highlighted tile at position (3, 3) to set a movement target.',
    allowedActions: ['move_process'],
    highlightPositions: [{ x: 3, y: 3 }],
    completionCondition: 'process_at_position',
    completionParams: { x: 3, y: 3 },
  },
  {
    id: 'fog_of_war',
    title: 'Fog of War',
    description:
      "Tiles outside your units' sight range remain hidden. As you explore, the fog reveals terrain and enemies.",
    hint: 'Move your Scout to position (5, 3) to reveal more of the map.',
    allowedActions: ['move_process', 'pause', 'unpause'],
    highlightPositions: [{ x: 5, y: 3 }],
    completionCondition: 'tile_revealed',
    completionParams: { x: 5, y: 3 },
  },
  {
    id: 'combat',
    title: 'Combat',
    description:
      'When your process is adjacent to malware, it will automatically attack. Worms are weak but can replicate over time.',
    hint: 'Move your Scout next to the Worm to engage in combat. Destroy it to proceed.',
    allowedActions: ['move_process', 'pause', 'unpause'],
    completionCondition: 'malware_destroyed',
    completionParams: { count: 1 },
  },
  {
    id: 'dormant_malware',
    title: 'Dormant Malware',
    description:
      'Trojans disguise themselves as data caches. They remain dormant until you get close, then reveal themselves and attack.',
    hint: 'Approach the Trojan carefully. It will activate when you get close.',
    allowedActions: ['move_process', 'pause', 'unpause'],
    completionCondition: 'dormant_activated',
  },
  {
    id: 'reach_exit',
    title: 'Reach the Exit',
    description:
      'Navigate to the exit point to complete this sector. Exit points are marked on the right edge of the map.',
    hint: 'Move your Scout to the exit at position (7, 3).',
    allowedActions: ['move_process', 'pause', 'unpause'],
    highlightPositions: [{ x: 7, y: 3 }],
    completionCondition: 'process_at_exit',
  },
  {
    id: 'complete',
    title: 'Tutorial Complete!',
    description:
      'You have completed the tutorial. You are now ready to take on the full campaign. Good luck, and may your processes run true.',
    hint: 'Click "Continue" to begin your campaign.',
    allowedActions: ['any'],
    completionCondition: 'acknowledged',
  },
]
