/**
 * Universal Production Readiness Verification V1 — B9 capability coverage validation.
 */

import { detectFalseCoverage } from '../universal-capability-coverage/capability-coverage-diagnostics.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';
import { providerSelectedByComposition } from '../universal-capability-composition-engine/capability-composition-b9-coverage-integration.js';
import { PRODUCTION_READINESS_POLICY } from './production-readiness-policy.js';

export function evaluateCapabilityReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const snapshot = input.coverageSnapshot;
  const plan = input.compositionPlan;

  if (!snapshot) {
    findings.push(createReadinessFinding({
      code: 'capability_coverage_missing',
      severity: 'BLOCKER',
      dimension: 'CAPABILITY_READINESS',
      detail: 'B9 coverage snapshot absent',
    }));
    return dimensionResult('CAPABILITY_READINESS', findings);
  }

  const falseCoverage = detectFalseCoverage(snapshot.capabilities);
  for (const fc of falseCoverage) {
    findings.push(createReadinessFinding({
      code: 'false_capability_coverage',
      severity: 'BLOCKER',
      dimension: 'CAPABILITY_READINESS',
      detail: fc,
      capabilityKeys: [fc.replace('false_coverage:', '')],
    }));
  }

  for (const cap of snapshot.capabilities) {
    if (cap.supportClassification === 'NOT_IMPLEMENTED' && cap.maturityLevel !== 'NOT_PRESENT') {
      findings.push(createReadinessFinding({
        code: 'false_capability_coverage',
        severity: 'BLOCKER',
        dimension: 'CAPABILITY_READINESS',
        detail: cap.capabilityKey,
        capabilityKeys: [cap.capabilityKey],
      }));
    }

    if (plan && !providerSelectedByComposition(plan, cap.providedBy) && cap.behavioralCoverage > 0) {
      findings.push(createReadinessFinding({
        code: 'capability_coverage_inflated',
        severity: 'BLOCKER',
        dimension: 'CAPABILITY_READINESS',
        detail: `${cap.capabilityKey}:${cap.providedBy}`,
        capabilityKeys: [cap.capabilityKey],
        providerIds: [cap.providedBy],
      }));
    }

    const req = plan?.capabilityRequirements.find((r) => r.capabilityKey === cap.capabilityKey);
    if (req?.criticality === 'REQUIRED' && cap.productionReadiness !== true) {
      findings.push(createReadinessFinding({
        code: 'production_coverage_incomplete',
        severity: 'BLOCKER',
        dimension: 'CAPABILITY_READINESS',
        detail: cap.capabilityKey,
        capabilityKeys: [cap.capabilityKey],
      }));
    }
  }

  if (snapshot.scorecard.productionCoveragePercent < PRODUCTION_READINESS_POLICY.productionCoverageThreshold && plan?.blockedRequirements.length === 0) {
    findings.push(createReadinessFinding({
      code: 'production_coverage_incomplete',
      severity: 'WARNING',
      dimension: 'CAPABILITY_READINESS',
      detail: `productionCoverage=${snapshot.scorecard.productionCoveragePercent}`,
    }));
  }

  return dimensionResult('CAPABILITY_READINESS', findings);
}
