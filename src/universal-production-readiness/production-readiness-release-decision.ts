/**
 * Universal Production Readiness Verification V1 — release decision.
 */

import type { ReadinessVerdict, ReleaseDecision } from './universal-production-readiness-types.js';
import type { ReadinessFinding } from './universal-production-readiness-types.js';

export function classifyReleaseDecision(
  verdict: ReadinessVerdict,
  blockers: readonly ReadinessFinding[],
  warnings: readonly ReadinessFinding[],
): ReleaseDecision {
  if (verdict === 'PRODUCTION_READY') return 'RELEASE_APPROVED';
  if (verdict === 'CONDITIONALLY_READY' && blockers.length === 0) {
    return 'RELEASE_APPROVED_WITH_NON_BLOCKING_WARNINGS';
  }
  if (verdict === 'INVALID_PRODUCTION_INPUT' || verdict === 'READINESS_EVALUATION_FAILED') {
    return 'RELEASE_INVALID';
  }
  if (verdict === 'BLOCKED_BY_REQUIRED_CAPABILITY') return 'RELEASE_REQUIRES_CAPABILITY_IMPLEMENTATION';
  if (verdict === 'BLOCKED_BY_CONFIGURATION') return 'RELEASE_REQUIRES_CONFIGURATION';
  if (verdict === 'BLOCKED_BY_BEHAVIORAL_FAILURE' || verdict === 'BLOCKED_BY_MISSING_EVIDENCE') {
    return 'RELEASE_REQUIRES_REVERIFICATION';
  }
  if (blockers.some((b) => b.repairCategory === 'engineering_repair')) {
    return 'RELEASE_REQUIRES_ENGINEERING_REPAIR';
  }
  return 'RELEASE_BLOCKED';
}
