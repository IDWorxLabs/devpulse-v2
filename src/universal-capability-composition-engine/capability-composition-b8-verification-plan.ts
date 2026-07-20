/**
 * Universal Capability Composition Engine V1 — B8 verification plan integration.
 */

import type { CompositionVerificationRequirement, ProviderAssignment } from './universal-capability-composition-types.js';
import { UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE } from './universal-capability-composition-types.js';

export function buildCompositionVerificationRequirements(input: {
  providerAssignments: readonly ProviderAssignment[];
  moduleIds: readonly string[];
}): CompositionVerificationRequirement[] {
  const requirements: CompositionVerificationRequirement[] = [];

  for (const assignment of input.providerAssignments) {
    if (assignment.outcome !== 'SATISFIED') continue;
    requirements.push({
      scenarioId: `verify-${assignment.requirementId}`,
      capabilityKey: assignment.capabilityKey,
      providerId: assignment.providerId,
      expectedEffects: [
        `${assignment.capabilityKey}:materialized`,
        `${assignment.providerId}:executed`,
      ],
    });
  }

  for (const moduleId of input.moduleIds) {
    requirements.push({
      scenarioId: `verify-module-${moduleId}`,
      capabilityKey: 'module.registration',
      providerId: 'native.universal-crud-generation-engine.v1',
      expectedEffects: [`module:${moduleId}:registered`],
    });
  }

  return requirements.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));
}

export function verificationPlanMatchesComposition(input: {
  compositionScenarioIds: readonly string[];
  behaviorScenarioIds: readonly string[];
}): boolean {
  const approved = new Set(input.compositionScenarioIds);
  return input.behaviorScenarioIds.every((id) => approved.has(id) || id.startsWith('verify-module-'));
}

export function filterUnapprovedVerificationScenarios(input: {
  compositionScenarioIds: readonly string[];
  behaviorScenarioIds: readonly string[];
}): string[] {
  const approved = new Set(input.compositionScenarioIds);
  return input.behaviorScenarioIds.filter((id) => !approved.has(id) && !id.startsWith('verify-module-'));
}

export const B8_VERIFICATION_PLAN_SOURCE = UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE;
