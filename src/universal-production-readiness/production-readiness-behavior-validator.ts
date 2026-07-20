/**
 * Universal Production Readiness Verification V1 — B8 behavioral verification validation.
 */

import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function evaluateBehavioralReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const report = input.behaviorReport;

  if (!report) {
    findings.push(createReadinessFinding({
      code: 'behavior_verification_missing',
      severity: 'BLOCKER',
      dimension: 'BEHAVIORAL_READINESS',
      detail: 'B8 behavior report absent',
    }));
    return dimensionResult('BEHAVIORAL_READINESS', findings);
  }

  if (report.staticShellCount > 0) {
    findings.push(createReadinessFinding({
      code: 'static_behavior_shell',
      severity: 'BLOCKER',
      dimension: 'BEHAVIORAL_READINESS',
      detail: `staticShellCount=${report.staticShellCount}`,
    }));
  }

  for (const result of report.results) {
    if (result.classification === 'NOT_REQUIRED' || result.classification === 'BLOCKED') continue;
    if (result.classification === 'FAILED') {
      findings.push(createReadinessFinding({
        code: 'behavior_verification_failed',
        severity: 'BLOCKER',
        dimension: 'BEHAVIORAL_READINESS',
        detail: result.behaviorId,
        behaviorIds: [result.behaviorId],
      }));
    } else if (result.classification === 'NOT_EXECUTED') {
      findings.push(createReadinessFinding({
        code: 'required_behavior_not_executed',
        severity: 'BLOCKER',
        dimension: 'BEHAVIORAL_READINESS',
        detail: result.behaviorId,
        behaviorIds: [result.behaviorId],
      }));
    } else if (result.classification === 'PARTIALLY_VERIFIED') {
      findings.push(createReadinessFinding({
        code: 'behavior_verification_failed',
        severity: 'REQUIRED_GAP',
        dimension: 'BEHAVIORAL_READINESS',
        detail: result.behaviorId,
        behaviorIds: [result.behaviorId],
      }));
    } else if (result.classification === 'UNSUPPORTED') {
      findings.push(createReadinessFinding({
        code: 'behavior_verification_failed',
        severity: 'BLOCKER',
        dimension: 'BEHAVIORAL_READINESS',
        detail: result.behaviorId,
        behaviorIds: [result.behaviorId],
      }));
    }
  }

  const requiredFailures = report.results.filter(
    (r) => ['FAILED', 'NOT_EXECUTED', 'UNSUPPORTED', 'PARTIALLY_VERIFIED'].includes(r.classification),
  );
  if (requiredFailures.length === 0 && report.verifiedCount > 0) {
    // passed
  } else if (report.verifiedCount === 0 && report.totalBehaviors > 0) {
    findings.push(createReadinessFinding({
      code: 'behavior_verification_missing',
      severity: 'BLOCKER',
      dimension: 'BEHAVIORAL_READINESS',
      detail: 'no verified behaviors',
    }));
  }

  return dimensionResult('BEHAVIORAL_READINESS', findings);
}
