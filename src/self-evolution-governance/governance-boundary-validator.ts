/**
 * Self Evolution Governance — boundary validator.
 */

import type { GovernanceBoundaryValidation, SelfEvolutionGovernanceInput } from './self-evolution-governance-types.js';
import { getCachedBoundaryValidation, setCachedBoundaryValidation } from './governance-cache.js';

let boundaryValidationCount = 0;

export function validateGovernanceBoundaries(input: SelfEvolutionGovernanceInput): GovernanceBoundaryValidation {
  const cacheKey = [input.evolutionRequest, input.world2Impact, ...(input.signals ?? [])].join('|');
  const cached = getCachedBoundaryValidation(cacheKey);
  if (cached) return cached;

  boundaryValidationCount += 1;

  const violations: string[] = [];

  const constitutionalCompliance = !input.signals?.includes('boundary:constitutional_violation');
  const ownershipCompliance = !input.signals?.includes('boundary:ownership_violation')
    && (input.signals?.includes('boundary:ownership_ok') || input.evolutionRequest.length > 0);
  const capabilityCompliance = !input.signals?.includes('boundary:capability_violation');
  const workspaceCompliance = !input.signals?.includes('boundary:workspace_violation');
  const world2Compliance = input.world2Impact !== true
    || (input.signals?.includes('boundary:world2_ok') ?? false)
    || (input.signals?.includes('world2:governed') ?? false);

  if (!constitutionalCompliance) violations.push('constitutional_violation');
  if (!ownershipCompliance) violations.push('ownership_violation');
  if (!capabilityCompliance) violations.push('capability_boundary_violation');
  if (!workspaceCompliance) violations.push('workspace_boundary_violation');
  if (!world2Compliance) violations.push('world2_boundary_violation');

  const result: GovernanceBoundaryValidation = {
    compliant: violations.length === 0,
    violations,
    constitutionalCompliance,
    ownershipCompliance,
    world2Compliance,
  };

  setCachedBoundaryValidation(cacheKey, result);
  return result;
}

export function getBoundaryValidationCount(): number {
  return boundaryValidationCount;
}

export function resetBoundaryValidatorForTests(): void {
  boundaryValidationCount = 0;
}
