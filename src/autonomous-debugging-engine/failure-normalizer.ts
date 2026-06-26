/**
 * Autonomous Debugging Engine — failure normalization.
 */

import type { FailureIntakeRecord, NormalizedFailure } from './autonomous-debugging-types.js';

const CATEGORY_MAP: Record<string, NormalizedFailure['category']> = {
  HANDLER_NOT_BOUND: 'INTERACTION_FAILURE',
  HANDLER_NOT_EXECUTED: 'INTERACTION_FAILURE',
  HANDLER_MISSING: 'INTERACTION_FAILURE',
  EVENT_NOT_FIRED: 'INTERACTION_FAILURE',
  ACCESSIBLE_NAME_MISSING: 'ACCESSIBILITY_FAILURE',
  DATA_NOT_CHANGED: 'DATA_FAILURE',
  STATE_NOT_CHANGED: 'STATE_FAILURE',
  UI_NOT_CHANGED: 'UI_FAILURE',
  CLIPPED_OR_COVERED: 'DEVICE_FAILURE',
  NOT_REACHABLE: 'DEVICE_FAILURE',
  DEVICE_SPECIFIC_FAILURE: 'DEVICE_FAILURE',
  VIRTUAL_USER_BLOCKED: 'VIRTUAL_USER_FAILURE',
  BEHAVIOR_FAILURE: 'BEHAVIOR_FAILURE',
  FEATURE_VALIDATION_FAILURE: 'FEATURE_VALIDATION_FAILURE',
  CAPABILITY_GAP: 'CAPABILITY_GAP',
  PROMPT_DRIFT: 'PROMPT_FAITHFULNESS_FAILURE',
};

export function normalizeFailures(records: readonly FailureIntakeRecord[]): NormalizedFailure[] {
  return records.map((record) => {
    const category =
      CATEGORY_MAP[record.failureType] ??
      (record.sourceGate === 'VIRTUAL_DEVICE'
        ? 'DEVICE_FAILURE'
        : record.sourceGate === 'INTERACTION_PROOF'
          ? 'INTERACTION_FAILURE'
          : record.sourceGate === 'BEHAVIOR_SIMULATION'
            ? 'BEHAVIOR_FAILURE'
            : 'UNKNOWN_FAILURE');

    return {
      readOnly: true,
      id: record.failureId,
      source: record.sourceGate,
      category,
      severity: record.severity,
      blockedGate: record.sourceGate,
      affectedScope: [
        ...record.featureSliceIds,
        ...record.interactionIds,
        ...record.deviceProfileIds,
      ],
      traceability: [
        ...record.requirementIds,
        ...record.capabilityIds,
        ...record.behaviorScenarioIds,
      ],
      expected: record.expectedResult,
      observed: record.observedResult,
      evidence: record.rawEvidence,
      repairHints: inferRepairHints(record.failureType, record.rawEvidence),
      safetyFlags: inferSafetyFlags(record.failureType),
    };
  });
}

function inferRepairHints(failureType: string, evidence: string): string[] {
  if (/HANDLER_NOT_BOUND|HANDLER_MISSING|EVENT_NOT_FIRED/i.test(failureType)) {
    return ['Connect handler to button', 'Verify onClick binding'];
  }
  if (/DATA_NOT_CHANGED|DATA_NOT/i.test(failureType)) {
    return ['Add persistence mutation', 'Verify service save call'];
  }
  if (/CLIPPED|OVERFLOW|NOT_REACHABLE/i.test(failureType)) {
    return ['Fix layout overflow', 'Adjust mobile styles'];
  }
  if (/ACCESSIBLE_NAME/i.test(failureType)) {
    return ['Add aria-label', 'Associate label with input'];
  }
  if (/PROMPT|DRIFT/i.test(evidence)) {
    return ['Restore prompt requirement', 'Do not remove required feature'];
  }
  return ['Inspect responsible artifact'];
}

function inferSafetyFlags(failureType: string): string[] {
  const flags: string[] = [];
  if (/PROMPT|REQUIREMENT|CAPABILITY/i.test(failureType)) flags.push('PROMPT_FAITHFULNESS_SENSITIVE');
  if (/AUTH|PAYMENT|SECURITY/i.test(failureType)) flags.push('SECURITY_SENSITIVE');
  return flags;
}
