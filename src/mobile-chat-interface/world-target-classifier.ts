/**
 * World target classifier — classifies World 1 / World 2 routing for mobile chat.
 * Classification only. No execution.
 */

import type { MobileChatInput, WorldTarget } from './types.js';

export interface WorldTargetClassification {
  worldTarget: WorldTarget;
  recommendation: string;
  autoSelectResolved: boolean;
  suggestedTarget: WorldTarget | null;
}

export function classifyWorldTarget(input: MobileChatInput): WorldTargetClassification {
  if (input.worldTarget !== 'AUTO_SELECT' && input.worldTarget !== 'UNKNOWN') {
    return {
      worldTarget: input.worldTarget,
      recommendation: `Message routed to ${input.worldTarget}`,
      autoSelectResolved: true,
      suggestedTarget: null,
    };
  }

  if (input.worldTarget === 'UNKNOWN') {
    const suggested = suggestWorldTarget(input.messageText);
    return {
      worldTarget: 'UNKNOWN',
      recommendation: suggested
        ? `UNKNOWN world target — suggest ${suggested} based on message heuristic`
        : 'UNKNOWN world target — user must specify WORLD_1 or WORLD_2 for project creation',
      autoSelectResolved: false,
      suggestedTarget: suggested,
    };
  }

  const suggested = suggestWorldTarget(input.messageText);
  return {
    worldTarget: 'AUTO_SELECT',
    recommendation: suggested
      ? `AUTO_SELECT classified — recommend ${suggested}. No silent execution.`
      : 'AUTO_SELECT classified — recommend WORLD_2 for sandbox builds, WORLD_1 for DevPulse core',
    autoSelectResolved: false,
    suggestedTarget: suggested ?? 'WORLD_2',
  };
}

export function suggestWorldTarget(messageText: string): WorldTarget | null {
  const text = messageText.toLowerCase();
  if (
    text.includes('devpulse') ||
    text.includes('world 1') ||
    text.includes('world1') ||
    text.includes('core platform')
  ) {
    return 'WORLD_1';
  }
  if (
    text.includes('world 2') ||
    text.includes('world2') ||
    text.includes('sandbox') ||
    text.includes('new app') ||
    text.includes('build app')
  ) {
    return 'WORLD_2';
  }
  return null;
}

export function worldTargetKey(target: WorldTarget): string {
  return target;
}

export function isWorldTargetValidForCreation(target: WorldTarget): boolean {
  return target === 'WORLD_1' || target === 'WORLD_2';
}
