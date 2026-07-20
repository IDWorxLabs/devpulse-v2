/**
 * Universal Production Readiness Verification V1 — B10 composition validation.
 */

import { validatePlanFingerprint } from '../universal-capability-composition-engine/capability-composition-plan-fingerprint.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function evaluateCompositionReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const plan = input.compositionPlan;

  if (!plan) {
    findings.push(createReadinessFinding({
      code: 'composition_plan_missing',
      severity: 'BLOCKER',
      dimension: 'COMPOSITION_READINESS',
      detail: 'B10 composition plan absent',
    }));
    return dimensionResult('COMPOSITION_READINESS', findings);
  }

  if (!validatePlanFingerprint(plan)) {
    findings.push(createReadinessFinding({
      code: 'composition_fingerprint_mismatch',
      severity: 'BLOCKER',
      dimension: 'COMPOSITION_READINESS',
      detail: 'Composition plan fingerprint invalid',
    }));
  }

  for (const reqId of plan.blockedRequirements) {
    const req = plan.capabilityRequirements.find((r) => r.requirementId === reqId);
    findings.push(createReadinessFinding({
      code: 'required_capability_blocked',
      severity: 'BLOCKER',
      dimension: 'COMPOSITION_READINESS',
      detail: reqId,
      requirementIds: [reqId],
      capabilityKeys: req ? [req.capabilityKey] : [],
      repairCategory: 'capability_implementation',
    }));
  }

  for (const reqId of plan.unresolvedRequirements) {
    const req = plan.capabilityRequirements.find((r) => r.requirementId === reqId);
    if (req?.criticality === 'REQUIRED') {
      findings.push(createReadinessFinding({
        code: 'required_capability_unassigned',
        severity: 'BLOCKER',
        dimension: 'COMPOSITION_READINESS',
        detail: reqId,
        requirementIds: [reqId],
        capabilityKeys: [req.capabilityKey],
      }));
    }
  }

  for (const collision of plan.collisionDecisions.filter((c) => !c.resolved)) {
    findings.push(createReadinessFinding({
      code: 'contribution_collision',
      severity: 'BLOCKER',
      dimension: 'COMPOSITION_READINESS',
      detail: collision.detail,
      providerIds: collision.providerIds,
    }));
  }

  if (plan.productionReadiness !== 'PRODUCTION_READY' && plan.blockedRequirements.length > 0) {
    findings.push(createReadinessFinding({
      code: 'required_capability_blocked',
      severity: 'BLOCKER',
      dimension: 'COMPOSITION_READINESS',
      detail: plan.productionReadiness,
    }));
  }

  return dimensionResult('COMPOSITION_READINESS', findings);
}
