/**
 * Capability Planning Engine Era 3 — capability composition.
 */

import type { CapabilityGap, ComposedCapabilityPlan, RiskLevel } from './capability-planning-types.js';

let composeCounter = 0;

export function resetCapabilityCompositionEngineForTests(): void {
  composeCounter = 0;
}

const COMPOSITION_RECIPES: Array<{
  pattern: RegExp;
  name: string;
  sources: string[];
  integration: string[];
  deps: string[];
}> = [
  {
    pattern: /emergency phrase|emergency speech/i,
    name: 'Emergency Communication',
    sources: ['cap-quick-phrases', 'cap-tts', 'cap-message-history', 'cap-caregiver-workflow', 'cap-a11y-interaction'],
    integration: ['Wire quick phrases to TTS', 'Log to communication history', 'Expose caregiver alert path'],
    deps: ['cap-tts', 'cap-message-history'],
  },
  {
    pattern: /blink communication|eye track/i,
    name: 'Assistive Blink Input',
    sources: ['cap-blink-input', 'cap-eye-tracking', 'cap-a11y-interaction', 'cap-large-touch'],
    integration: ['Connect blink engine to eye tracking board', 'Apply accessibility interaction layer'],
    deps: ['cap-eye-tracking'],
  },
  {
    pattern: /reporting|dashboard/i,
    name: 'Reporting Surface',
    sources: ['cap-reporting', 'cap-crud'],
    integration: ['Bind dashboard to CRUD entities', 'Optional export action when CSV capability is generated'],
    deps: ['cap-crud'],
  },
  {
    pattern: /synchronization engine|offline sync|offline persistence|cloud synchronization|conflict resolution|retry queue/i,
    name: 'Synchronization Engine',
    sources: [
      'cap-local-storage',
      'cap-sync-engine',
      'cap-conflict-resolution',
      'cap-retry-queue',
      'cap-offline-persistence',
    ],
    integration: [
      'Wire local persistence to Synchronization Engine change queue',
      'Apply conflict resolution strategy on version divergence',
      'Retry queued mutations when connectivity returns',
      'Expose sync health diagnostics in runtime',
    ],
    deps: ['cap-local-storage', 'cap-sync-engine'],
  },
];

export function composeCapabilitiesFromGaps(
  gaps: readonly CapabilityGap[],
): ComposedCapabilityPlan[] {
  const compositions: ComposedCapabilityPlan[] = [];

  for (const gap of gaps) {
    if (gap.decision !== 'COMPOSE_FROM_EXISTING') continue;

    const recipe = COMPOSITION_RECIPES.find((r) => r.pattern.test(gap.requiredCapability.name));
    composeCounter += 1;

    if (recipe) {
      compositions.push({
        readOnly: true,
        composedId: `composed-${composeCounter}`,
        name: recipe.name,
        sourceCapabilityIds: recipe.sources,
        integrationPlan: recipe.integration,
        dependencies: recipe.deps,
        validationPlan: ['STATIC', 'INTEGRATION', 'BEHAVIOR', 'ACCESSIBILITY'],
        risk: gap.risk,
        expectedCoverage: Math.min(1, gap.coveragePercentage + 0.2),
      });
      continue;
    }

    if (gap.matchedCapabilityId) {
      compositions.push({
        readOnly: true,
        composedId: `composed-${composeCounter}`,
        name: gap.requiredCapability.name,
        sourceCapabilityIds: [gap.matchedCapabilityId],
        integrationPlan: [`Extend ${gap.matchedCapabilityId} to satisfy ${gap.requiredCapability.name}`],
        dependencies: [gap.matchedCapabilityId],
        validationPlan: ['STATIC', 'INTEGRATION'],
        risk: gap.risk,
        expectedCoverage: gap.coveragePercentage,
      });
    }
  }

  return compositions;
}
