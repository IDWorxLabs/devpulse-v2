/**
 * Autonomous Debugging Engine — repair plan generation.
 */

import type { NormalizedFailure, RepairPlan, RepairStrategy, RootCauseResult } from './autonomous-debugging-types.js';

let repairPlanCounter = 0;

export function resetRepairPlanGeneratorForTests(): void {
  repairPlanCounter = 0;
}

const STRATEGY_MAP: Record<string, RepairStrategy> = {
  INTERACTION_FAILURE: 'CONNECT_EXISTING_HANDLER',
  DATA_FAILURE: 'FIX_DATA_MUTATION',
  DEVICE_FAILURE: 'FIX_LAYOUT_OVERFLOW',
  ACCESSIBILITY_FAILURE: 'FIX_ACCESSIBLE_LABEL',
  BEHAVIOR_FAILURE: 'ADD_STATE_UPDATE',
  STATE_FAILURE: 'ADD_STATE_UPDATE',
  SERVICE_FAILURE: 'FIX_SERVICE_CALL',
  ROUTE_FAILURE: 'FIX_ROUTE_LINK',
  TYPECHECK_FAILURE: 'FIX_TYPE_ERROR',
  BUILD_FAILURE: 'FIX_BUILD_CONFIG',
  PROMPT_FAITHFULNESS_FAILURE: 'RESTORE_PROMPT_REQUIREMENT',
  CAPABILITY_GAP: 'ADD_CAPABILITY_PLAN',
  UNKNOWN_FAILURE: 'ESCALATE_TO_HUMAN',
};

export function generateRepairPlan(input: {
  failure: NormalizedFailure;
  rootCause: RootCauseResult;
}): RepairPlan {
  repairPlanCounter += 1;
  const strategy = STRATEGY_MAP[input.failure.category] ?? 'ESCALATE_TO_HUMAN';
  const artifact = input.rootCause.responsibleArtifact;

  return {
    readOnly: true,
    repairId: `repair-${repairPlanCounter}`,
    failureIds: [input.failure.id],
    rootCauseId: input.rootCause.rootCauseId,
    rootCauseSummary: input.rootCause.causeSummary,
    responsibleSubsystem: input.rootCause.responsibleSubsystem,
    repairStrategy: strategy,
    affectedFiles: [artifact],
    allowedFiles: [artifact, `${artifact.replace(/\.tsx?$/, '.service.ts')}`],
    forbiddenFiles: ['package.json', 'feature-contract.json', 'auth-config.ts'],
    patchScope: `Targeted repair for ${input.failure.category} on ${artifact}`,
    validationPlan: validationForCategory(input.failure.category),
    regressionPlan: [
      'Previous stable feature slices',
      'Shared routes',
      'Shared state',
      'Prompt faithfulness delta',
    ],
    rollbackPlan: `snapshot-before-${repairPlanCounter}`,
    safetyConstraints: ['No prompt requirement removal', 'No validation suppression'],
    expectedOutcome: input.failure.expected,
    confidence: input.rootCause.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
  };
}

function validationForCategory(category: string): string[] {
  switch (category) {
    case 'INTERACTION_FAILURE':
      return ['INTERACTION_PROOF', 'BEHAVIOR_SIMULATION'];
    case 'DATA_FAILURE':
      return ['BEHAVIOR_SIMULATION', 'INTERACTION_PROOF'];
    case 'DEVICE_FAILURE':
      return ['VIRTUAL_DEVICE_LABORATORY', 'INTERACTION_PROOF'];
    case 'ACCESSIBILITY_FAILURE':
      return ['INTERACTION_PROOF', 'VIRTUAL_USER_SIMULATION'];
    default:
      return ['TARGETED_FEATURE_VALIDATION'];
  }
}
