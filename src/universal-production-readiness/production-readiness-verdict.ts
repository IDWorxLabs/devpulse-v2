/**
 * Universal Production Readiness Verification V1 — verdict classification.
 */

import type { ReadinessFinding, ReadinessVerdict } from './universal-production-readiness-types.js';
import type { ProductionReadinessScores } from './universal-production-readiness-types.js';
import { meetsProductionReadyThreshold, BLOCKED_CAPABILITY_DIAGNOSTIC_MAP } from './production-readiness-policy.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';

export function inspectReadinessBlockers(findings: readonly ReadinessFinding[]): ReadinessFinding[] {
  return findings.filter((f) => ['BLOCKER', 'CRITICAL_FAILURE', 'REQUIRED_GAP'].includes(f.severity));
}

export function inspectReadinessWarnings(findings: readonly ReadinessFinding[]): ReadinessFinding[] {
  return findings.filter((f) => f.severity === 'WARNING');
}

export function classifyReadinessVerdict(input: {
  inputErrors: readonly string[];
  blockers: readonly ReadinessFinding[];
  warnings: readonly ReadinessFinding[];
  scores: ProductionReadinessScores;
  readinessInput: ProductionReadinessInput;
}): ReadinessVerdict {
  if (input.inputErrors.length > 0) {
    if (input.inputErrors.includes('production_envelope_missing')) return 'INVALID_PRODUCTION_INPUT';
    if (input.inputErrors.includes('composition_plan_missing') || input.inputErrors.includes('behavior_verification_missing')) {
      return 'BLOCKED_BY_MISSING_EVIDENCE';
    }
    return 'INVALID_PRODUCTION_INPUT';
  }

  const plan = input.readinessInput.compositionPlan;
  if (plan && plan.blockedRequirements.length > 0) {
    const blockedKey = plan.capabilityRequirements.find((r) => plan.blockedRequirements.includes(r.requirementId))?.capabilityKey;
    if (blockedKey && BLOCKED_CAPABILITY_DIAGNOSTIC_MAP[blockedKey]) {
      return 'BLOCKED_BY_REQUIRED_CAPABILITY';
    }
    return 'BLOCKED_BY_REQUIRED_CAPABILITY';
  }

  const blockerCodes = new Set(input.blockers.map((b) => b.code));
  if (blockerCodes.has('behavior_verification_failed') || blockerCodes.has('required_behavior_not_executed') || blockerCodes.has('static_behavior_shell')) {
    return 'BLOCKED_BY_BEHAVIORAL_FAILURE';
  }
  if (blockerCodes.has('contribution_missing') || blockerCodes.has('undeclared_contribution') || blockerCodes.has('provider_materialization_missing')) {
    return 'BLOCKED_BY_MATERIALIZATION_FAILURE';
  }
  if (blockerCodes.has('runtime_registration_missing') || blockerCodes.has('runtime_initialization_failed')) {
    return 'BLOCKED_BY_RUNTIME_FAILURE';
  }
  if (blockerCodes.has('data_integrity_failure')) return 'BLOCKED_BY_DATA_INTEGRITY_FAILURE';
  if (blockerCodes.has('contribution_collision')) return 'BLOCKED_BY_COLLISION';
  if (blockerCodes.has('false_capability_coverage') || blockerCodes.has('production_coverage_incomplete')) {
    return 'NOT_PRODUCTION_READY';
  }
  if (input.blockers.length > 0) return 'NOT_PRODUCTION_READY';

  if (input.warnings.length > 0 && meetsProductionReadyThreshold(input.scores)) {
    return 'CONDITIONALLY_READY';
  }

  if (meetsProductionReadyThreshold(input.scores) && plan?.productionReadiness === 'PRODUCTION_READY') {
    return 'PRODUCTION_READY';
  }

  if (plan && plan.productionReadiness !== 'PRODUCTION_READY') {
    return 'BLOCKED_BY_REQUIRED_CAPABILITY';
  }

  return input.warnings.length > 0 ? 'CONDITIONALLY_READY' : 'NOT_PRODUCTION_READY';
}
