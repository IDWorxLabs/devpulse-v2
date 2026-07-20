/**
 * Universal Capability Composition Engine V1 — plan validation.
 */

import type { UniversalCapabilityCompositionPlan } from './universal-capability-composition-types.js';
import { validatePlanFingerprint } from './capability-composition-plan-fingerprint.js';
import { validateDependencyClosure } from './capability-composition-dependency-graph.js';
import { validateContributionBoundaries } from './capability-composition-boundary-validator.js';
import { hasUnresolvedCriticalCollisions } from './capability-composition-collision-resolver.js';

export function isUniversalCapabilityCompositionPlanValid(
  plan: UniversalCapabilityCompositionPlan | null | undefined,
): boolean {
  if (!plan) return false;
  return validateCompositionPlanIntegrity(plan).length === 0;
}

export function requireUniversalCapabilityCompositionPlan(
  plan: UniversalCapabilityCompositionPlan | null | undefined,
): UniversalCapabilityCompositionPlan {
  if (!isUniversalCapabilityCompositionPlanValid(plan)) {
    const issues = plan ? validateCompositionPlanIntegrity(plan) : ['missing_composition_plan'];
    throw new Error(`invalid_composition_plan:${issues.join(';')}`);
  }
  return plan!;
}

export function validateCompositionPlanIntegrity(plan: UniversalCapabilityCompositionPlan): string[] {
  const errors: string[] = [];
  if (!plan.readOnly) errors.push('plan_not_readonly');
  if (!plan.compositionPlanId) errors.push('missing_composition_plan_id');
  if (!validatePlanFingerprint(plan)) errors.push('composition_fingerprint_drift');
  errors.push(...validateProviderAssignments(plan));
  errors.push(...validateDependencyClosure(plan.dependencyGraph));
  errors.push(...validateContributionBoundaries(plan.contributionBoundaries, plan.contributionAllowlist));
  if (hasUnresolvedCriticalCollisions(plan.collisionDecisions)) {
    errors.push('contribution_collision');
  }
  if (
    plan.productionReadiness === 'PRODUCTION_READY' &&
    plan.blockedRequirements.length > 0
  ) {
    errors.push('unresolved_required_capability');
  }
  return errors;
}

export function validateProviderAssignments(plan: UniversalCapabilityCompositionPlan): string[] {
  const errors: string[] = [];
  const assigned = new Map<string, string>();

  for (const assignment of plan.providerAssignments) {
    if (assignment.outcome !== 'SATISFIED') continue;
    if (!assignment.providerId) {
      errors.push(`missing_provider:${assignment.requirementId}`);
      continue;
    }
    const existing = assigned.get(assignment.capabilityKey);
    if (existing && existing !== assignment.providerId) {
      errors.push(`duplicate_provider_assignment:${assignment.capabilityKey}`);
    } else {
      assigned.set(assignment.capabilityKey, assignment.providerId);
    }
  }

  for (const pack of plan.selectedCapabilityPacks) {
    const found = plan.providerAssignments.some(
      (a) => a.outcome === 'SATISFIED' && a.packId === pack.packId,
    );
    if (!found) errors.push(`unselected_pack_in_plan:${pack.packId}`);
  }

  return errors;
}
