/**
 * Universal Behavioral Verification Engine V1 — evidence collection.
 */

import type {
  BehaviorVerificationEvidence,
  BehaviorVerificationStrategy,
  BehaviorVerificationClassification,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';
import { fingerprintBehavior } from './universal-behavior-types.js';
import type { RuntimeObservationSnapshot } from './behavior-runtime-observer.js';

export function collectBehaviorEvidence(input: {
  descriptor: UniversalBehaviorDescriptor;
  observation: RuntimeObservationSnapshot;
  verificationMethod: BehaviorVerificationStrategy;
  result: BehaviorVerificationClassification;
  observedOutputs: readonly string[];
  expectedOutputs: readonly string[];
}): BehaviorVerificationEvidence {
  const differences = input.expectedOutputs.filter((o) => !input.observedOutputs.includes(o));
  return {
    behaviorId: input.descriptor.behaviorId,
    runtimeEvidence: {
      stateBefore: input.observation.stateBefore,
      actionExecuted: input.observation.actionExecuted,
      stateAfter: input.observation.stateAfter,
      persistenceDelta: input.observation.persistenceDelta,
      workflowTransition: input.observation.workflowTransition,
      emittedEvents: input.observation.emittedEvents,
      navigationChanges: input.observation.navigationChanges,
      businessRuleEvaluation: input.observation.businessRuleEvaluation,
      runtimeTimingMs: input.observation.runtimeTimingMs,
      verificationLogs: input.observation.verificationLogs,
    },
    timestamp: new Date().toISOString(),
    verificationMethod: input.verificationMethod,
    result: input.result,
    observedOutputs: input.observedOutputs,
    expectedOutputs: input.expectedOutputs,
    differences,
    provenance: input.descriptor.provenance,
    fingerprint: fingerprintBehavior(input.descriptor),
  };
}

export function evidenceIsComplete(evidence: BehaviorVerificationEvidence): boolean {
  if (evidence.result === 'NOT_REQUIRED' || evidence.result === 'BLOCKED') return true;
  if (evidence.result === 'NOT_EXECUTED') return false;
  const runtime = evidence.runtimeEvidence;
  return (
    typeof runtime.actionExecuted === 'string' &&
    Array.isArray(runtime.verificationLogs) &&
    (runtime.verificationLogs as unknown[]).length > 0
  );
}

export function mergeEvidence(
  primary: BehaviorVerificationEvidence,
  supplemental: Partial<BehaviorVerificationEvidence>,
): BehaviorVerificationEvidence {
  return {
    ...primary,
    ...supplemental,
    runtimeEvidence: { ...primary.runtimeEvidence, ...(supplemental.runtimeEvidence ?? {}) },
    observedOutputs: supplemental.observedOutputs ?? primary.observedOutputs,
    expectedOutputs: supplemental.expectedOutputs ?? primary.expectedOutputs,
  };
}
