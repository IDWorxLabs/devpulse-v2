/**
 * Engineering Intelligence Activation Authority V1 — activation decision engine.
 *
 * Turns evidence + policy evaluation into one of exactly three decisions. This is the only place
 * in EIAA that produces a decision, and it never generates a capability — ALLOW only ever
 * produces a structured *request* describing what the Engineering Intelligence Runtime would need
 * to do, for a separate system to execute and separately validate.
 */

import { evaluateActivationPolicy } from './activation-policy.js';
import {
  EIAA_DEFAULT_POLICY_CONFIG,
} from './engineering-intelligence-activation-types.js';
import type {
  EiaaActivationDecision,
  EiaaActivationEvidence,
  EiaaActivationPolicyConfig,
  EiaaPolicyCheckResult,
  EiaaRuntimeInvocationRequest,
} from './engineering-intelligence-activation-types.js';

export interface EiaaDecisionResult {
  readOnly: true;
  decision: EiaaActivationDecision;
  confidence: number;
  reason: string;
  satisfiedChecks: EiaaPolicyCheckResult[];
  failedChecks: EiaaPolicyCheckResult[];
  rejectedActivationReasons: string[];
  recommendedAction: string;
  runtimeRequest: EiaaRuntimeInvocationRequest | null;
}

function buildRuntimeInvocationRequest(evidence: EiaaActivationEvidence): EiaaRuntimeInvocationRequest {
  return {
    readOnly: true,
    missingCapabilityId: evidence.missingCapabilityId ?? 'unknown-missing-capability',
    missingCapabilityName: evidence.missingCapabilityName ?? 'Unknown missing capability',
    failureTaxonomyClass: evidence.failureClasses[0] ?? 'UNKNOWN_FAILURE',
    requiredInputs: [...evidence.requiredInputs],
    requiredOutputs: [...evidence.requiredOutputs],
    integrationPoint: evidence.expectedIntegrationPoint ?? '',
    validationStrategy: [...evidence.validationPlan],
    capabilitySpecification: evidence.reasonGenerationIsNeeded,
  };
}

function decisionConfidenceFromChecks(satisfied: number, total: number, evidenceConfidence: number): number {
  if (total === 0) return evidenceConfidence;
  const ratio = satisfied / total;
  return Math.round(ratio * 100);
}

/**
 * Decide whether autonomous capability generation may be authorized.
 *
 * Order of evaluation (each is an independent safety gate — any one of the first four is an
 * automatic hard stop before the eight-point policy is even consulted):
 *   1. Unknown failure                → DENY
 *   2. Unsafe repair detected         → DENY
 *   3. Infinite retry pattern detected → DENY
 *   4. Conflicting diagnoses          → REQUIRE_HUMAN_REVIEW
 *   5. Otherwise, all eight activation-policy checks must pass → ALLOW, else DENY.
 */
export function decideActivation(
  evidence: EiaaActivationEvidence,
  config: EiaaActivationPolicyConfig = EIAA_DEFAULT_POLICY_CONFIG,
): EiaaDecisionResult {
  const policyResult = evaluateActivationPolicy(evidence, config);

  if (evidence.isUnknownFailure) {
    return {
      readOnly: true,
      decision: 'DENY_ENGINEERING_INTELLIGENCE',
      confidence: 95,
      reason: 'Failure could not be classified (UNKNOWN_FAILURE) — generating a capability for an unclassified failure is never safe.',
      satisfiedChecks: policyResult.satisfiedChecks,
      failedChecks: policyResult.failedChecks,
      rejectedActivationReasons: ['UNKNOWN_FAILURE: activation is never permitted for an unclassified failure.'],
      recommendedAction: 'Improve failure diagnosis coverage until the failure can be classified, then re-run AEO.',
      runtimeRequest: null,
    };
  }

  if (evidence.unsafeRepairDetected) {
    return {
      readOnly: true,
      decision: 'DENY_ENGINEERING_INTELLIGENCE',
      confidence: 90,
      reason: 'The only available repair path was flagged unsafe to run automatically — activation is denied rather than risk an unsafe repair or an unnecessary generation.',
      satisfiedChecks: policyResult.satisfiedChecks,
      failedChecks: policyResult.failedChecks,
      rejectedActivationReasons: ['UNSAFE_REPAIR_DETECTED: a candidate repair capability is unsafe to run automatically.'],
      recommendedAction: 'Route to human review of the unsafe repair capability before considering capability generation.',
      runtimeRequest: null,
    };
  }

  if (evidence.infiniteRetryDetected) {
    return {
      readOnly: true,
      decision: 'DENY_ENGINEERING_INTELLIGENCE',
      confidence: 90,
      reason: 'Repair/retry history shows the same failure and capability looping without new evidence — this is an infinite-retry pattern, not a case for capability generation.',
      satisfiedChecks: policyResult.satisfiedChecks,
      failedChecks: policyResult.failedChecks,
      rejectedActivationReasons: ['INFINITE_RETRY_DETECTED: repeated identical repair attempts detected without progress.'],
      recommendedAction: 'Stop retrying automatically; a human must break the loop before any further automation is considered.',
      runtimeRequest: null,
    };
  }

  if (evidence.hasConflictingDiagnoses) {
    return {
      readOnly: true,
      decision: 'REQUIRE_HUMAN_REVIEW',
      confidence: 60,
      reason: 'Two or more plausible but materially different failure diagnoses were produced for the same evidence — a human must resolve the ambiguity before capability generation can be authorized.',
      satisfiedChecks: policyResult.satisfiedChecks,
      failedChecks: policyResult.failedChecks,
      rejectedActivationReasons: ['CONFLICTING_DIAGNOSES: diagnosis is ambiguous.'],
      recommendedAction: 'A human reviewer should disambiguate the diagnosis before EIAA is re-consulted.',
      runtimeRequest: null,
    };
  }

  const confidence = decisionConfidenceFromChecks(
    policyResult.satisfiedChecks.length,
    policyResult.checks.length,
    evidence.confidence,
  );

  if (!policyResult.allSatisfied) {
    return {
      readOnly: true,
      decision: 'DENY_ENGINEERING_INTELLIGENCE',
      confidence,
      reason: `Activation policy not fully satisfied — ${policyResult.failedChecks.length} of ${policyResult.checks.length} check(s) failed.`,
      satisfiedChecks: policyResult.satisfiedChecks,
      failedChecks: policyResult.failedChecks,
      rejectedActivationReasons: policyResult.failedChecks.map((c) => `${c.checkId}: ${c.detail}`),
      recommendedAction: 'Resolve the failed activation-policy checks (repair existing capabilities, gather more evidence, or define the missing capability more precisely) before requesting activation again.',
      runtimeRequest: null,
    };
  }

  return {
    readOnly: true,
    decision: 'ALLOW_ENGINEERING_INTELLIGENCE',
    confidence,
    reason: 'All activation-policy checks are satisfied: the missing capability is well-defined, no existing repair capability can safely handle this failure, retries are exhausted, and a validation strategy exists.',
    satisfiedChecks: policyResult.satisfiedChecks,
    failedChecks: policyResult.failedChecks,
    rejectedActivationReasons: [],
    recommendedAction: 'Invoke the Engineering Intelligence Runtime with the generated request. Generated output must still be separately validated before installation.',
    runtimeRequest: buildRuntimeInvocationRequest(evidence),
  };
}
