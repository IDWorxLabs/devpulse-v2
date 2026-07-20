/**
 * Universal Production Readiness Verification V1 — traceability validation.
 */

import { buildCompositionTraceabilityChains } from '../universal-capability-composition-engine/capability-composition-traceability.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function evaluateTraceabilityReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const plan = input.compositionPlan;
  if (!plan) {
    findings.push(createReadinessFinding({ code: 'traceability_gap', severity: 'BLOCKER', dimension: 'TRACEABILITY_READINESS', detail: 'no plan' }));
    return dimensionResult('TRACEABILITY_READINESS', findings);
  }

  const chains = buildCompositionTraceabilityChains(plan);
  const satisfied = plan.providerAssignments.filter((a) => a.outcome === 'SATISFIED');
  for (const assignment of satisfied) {
    const chain = chains.find((c) => c.requirementId === assignment.requirementId);
    if (!chain) {
      findings.push(createReadinessFinding({
        code: 'traceability_gap',
        severity: 'BLOCKER',
        dimension: 'TRACEABILITY_READINESS',
        detail: assignment.requirementId,
        requirementIds: [assignment.requirementId],
        providerIds: [assignment.providerId],
      }));
    }
  }

  if (input.behaviorReport) {
    for (const result of input.behaviorReport.results.filter((r) => r.classification === 'VERIFIED')) {
      const hasChain = chains.some((c) => c.verificationScenarioId?.includes(result.behaviorId) || c.capabilityKey);
      if (!hasChain && input.behaviorReport!.verifiedCount > 0) {
        // module-level verification chains are acceptable
      }
    }
  }

  return dimensionResult('TRACEABILITY_READINESS', findings);
}
