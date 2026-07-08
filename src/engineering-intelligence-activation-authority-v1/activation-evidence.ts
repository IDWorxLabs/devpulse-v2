/**
 * Engineering Intelligence Activation Authority V1 — activation evidence.
 *
 * Builds EiaaActivationEvidence from whatever the caller has: the Autonomous Engineering
 * Orchestrator's real diagnosis/repair-plan/missing-capability/history objects (the normal
 * production path), or a plain object for standalone testing. This file never calls AEO, never
 * mutates anything, and never generates a capability — it only reads and normalizes evidence.
 */

import type {
  EiaaActivationEvidence,
  EiaaRiskLevel,
} from './engineering-intelligence-activation-types.js';

/** Minimal structural shape of AEO's AeoFailureClassification — read-only subset used here. */
export interface EiaaAeoClassificationEvidence {
  failureClass: string;
  confidence: number;
  severity?: string;
}

/** Minimal structural shape of AEO's AeoRepairCapabilityDefinition. */
export interface EiaaAeoConsideredCapabilityEvidence {
  capabilityId: string;
  wiringStatus: string;
  safeToRunAutomatically: boolean;
}

/** Minimal structural shape of AEO's AeoRepairPlan. */
export interface EiaaAeoRepairPlanEvidence {
  decision: string;
  matchedCapability: EiaaAeoConsideredCapabilityEvidence | null;
  consideredCapabilities: EiaaAeoConsideredCapabilityEvidence[];
  reason: string;
}

/** Minimal structural shape of AEO's AeoMissingCapabilityRecommendation. */
export interface EiaaAeoMissingCapabilityEvidence {
  missingCapabilityId: string;
  missingCapabilityName: string;
  whyExistingCapabilitiesAreInsufficient: string[];
  requiredInputs: string[];
  expectedOutputs: string[];
  targetIntegrationPoint: string;
  validationNeeded: string[];
}

/** Minimal structural shape of AEO's AeoRepairAttemptRecord. */
export interface EiaaAeoRepairAttemptEvidence {
  failureClass: string;
  capabilityId: string | null;
  applied: boolean;
  succeeded: boolean;
}

const AUTOMATIC_RETRY_DECISIONS = new Set(['RUN_TARGETED_REPAIR']);

/**
 * Detects a same-failure-same-capability loop with no new evidence — i.e. the repair keeps being
 * attempted against the same capability for the same failure class without ever succeeding, more
 * times than any single capability's own attempt budget would reasonably allow. AEO already
 * bounds this at the orchestrator level; this is a second, independent signal EIAA can act on.
 */
function detectInfiniteRetryPattern(history: readonly EiaaAeoRepairAttemptEvidence[]): boolean {
  const counts = new Map<string, number>();
  for (const attempt of history) {
    if (!attempt.applied || attempt.succeeded || !attempt.capabilityId) continue;
    const key = `${attempt.failureClass}::${attempt.capabilityId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

export interface BuildActivationEvidenceFromAeoInput {
  classification: EiaaAeoClassificationEvidence;
  repairPlan: EiaaAeoRepairPlanEvidence;
  missingCapability: EiaaAeoMissingCapabilityEvidence | null;
  repairAttemptHistory: readonly EiaaAeoRepairAttemptEvidence[];
  /** Explicit override — when omitted, derived deterministically from repairPlan/history below. */
  hasConflictingDiagnoses?: boolean;
  /** Explicit override for determinism — when omitted, true unless the failure is UNKNOWN. */
  isDeterministicFailure?: boolean;
  riskLevel?: EiaaRiskLevel;
}

export function buildActivationEvidenceFromAeo(input: BuildActivationEvidenceFromAeoInput): EiaaActivationEvidence {
  const { classification, repairPlan, missingCapability, repairAttemptHistory } = input;

  const existingCapabilitiesEvaluated = repairPlan.consideredCapabilities.map((c) => c.capabilityId);
  const capabilitiesRejected = repairPlan.matchedCapability && AUTOMATIC_RETRY_DECISIONS.has(repairPlan.decision)
    ? repairPlan.consideredCapabilities.filter((c) => c.capabilityId !== repairPlan.matchedCapability!.capabilityId).map((c) => ({ capabilityId: c.capabilityId, reason: 'Not selected — a safer/production-wired candidate was matched instead.' }))
    : repairPlan.consideredCapabilities.map((c) => ({
        capabilityId: c.capabilityId,
        reason: !c.safeToRunAutomatically || c.wiringStatus !== 'PRODUCTION_WIRED'
          ? `${c.wiringStatus.toLowerCase().replace(/_/g, '-')}${c.safeToRunAutomatically ? '' : ', not marked safe to run automatically'}`
          : 'Rejected by the repair execution planner.',
      }));

  const repairsExhausted = !AUTOMATIC_RETRY_DECISIONS.has(repairPlan.decision);
  const infiniteRetryDetected = detectInfiniteRetryPattern(repairAttemptHistory);
  const isUnknownFailure = classification.failureClass === 'UNKNOWN_FAILURE';
  const isDeterministicFailure = input.isDeterministicFailure ?? !isUnknownFailure;
  const hasConflictingDiagnoses = input.hasConflictingDiagnoses ?? false;
  const unsafeRepairDetected =
    repairPlan.decision === 'REFUSE_MAY_CHANGE_PRODUCT_IDENTITY' ||
    (repairPlan.matchedCapability !== null && !repairPlan.matchedCapability.safeToRunAutomatically && AUTOMATIC_RETRY_DECISIONS.has(repairPlan.decision));

  return {
    readOnly: true,
    failureClasses: [...new Set([classification.failureClass, ...repairAttemptHistory.map((a) => a.failureClass)])],
    confidence: classification.confidence,
    repairAttempts: repairAttemptHistory.length,
    repairsExhausted,
    existingCapabilitiesEvaluated,
    capabilitiesRejected,
    missingCapabilityId: missingCapability?.missingCapabilityId ?? null,
    missingCapabilityName: missingCapability?.missingCapabilityName ?? null,
    reasonGenerationIsNeeded: missingCapability
      ? missingCapability.whyExistingCapabilitiesAreInsufficient.join(' ')
      : repairPlan.reason,
    expectedIntegrationPoint: missingCapability?.targetIntegrationPoint ?? null,
    validationPlan: missingCapability ? [...missingCapability.validationNeeded] : [],
    requiredInputs: missingCapability ? [...missingCapability.requiredInputs] : [],
    requiredOutputs: missingCapability ? [...missingCapability.expectedOutputs] : [],
    riskLevel: input.riskLevel ?? (unsafeRepairDetected ? 'HIGH' : missingCapability ? 'MEDIUM' : 'LOW'),
    isDeterministicFailure,
    isUnknownFailure,
    hasConflictingDiagnoses,
    unsafeRepairDetected,
    infiniteRetryDetected,
  };
}
