/**
 * Capability Planning Engine — scope planner.
 * New capability = new module. Avoid monolith growth.
 */

import type { CapabilityPlanningInput, CapabilityScopePlan } from './capability-planning-types.js';

let scopePlanCount = 0;

export function planCapabilityScope(input: CapabilityPlanningInput): CapabilityScopePlan {
  scopePlanCount += 1;

  const proposed = input.proposedCapability.toLowerCase();
  const isExtension = input.researchDecision === 'EXISTING_CAPABILITY_INSUFFICIENT'
    || input.researchDecision === 'OPTIMIZATION_REQUIRED'
    || proposed.includes('expansion')
    || proposed.includes('extend');

  const moduleType = isExtension ? 'extension_module' as const : 'new_module' as const;

  const integrationPoints: string[] = ['foundation_ownership_registry', 'capability_registry'];
  if (input.trustImpact) integrationPoints.push('trust_engine');
  if (input.world2Impact) integrationPoints.push('world2_coordinator');
  if (proposed.includes('verification') || proposed.includes('uvl')) {
    integrationPoints.push('unified_verification_lab');
  }
  if (proposed.includes('monitor')) integrationPoints.push('multi_project_monitoring');
  if (proposed.includes('builder') || proposed.includes('build')) {
    integrationPoints.push('autonomous_builder');
  }

  const ownershipBoundaries = [
    `devpulse_v2_${proposed.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    'single_owner_per_domain',
    'extension_only_when_applicable',
  ];

  return {
    moduleType,
    integrationPoints: [...new Set(integrationPoints)],
    ownershipBoundaries,
    monolithAvoidance: true,
  };
}

export function getScopePlanCount(): number {
  return scopePlanCount;
}

export function resetScopePlannerForTests(): void {
  scopePlanCount = 0;
}
