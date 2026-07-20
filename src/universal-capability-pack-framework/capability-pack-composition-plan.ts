/**
 * Universal Capability Pack Framework V1 — composition plan builder.
 */

import { resolvePackDependencies } from './capability-pack-dependency-resolver.js';
import { resolveAllCapabilityRequirements, classifyNativeSatisfaction } from './capability-pack-resolver.js';
import { getPack } from './capability-pack-registry.js';
import { mergePackConfiguration, validatePackConfiguration } from './capability-pack-configuration.js';
import { validatePackCompatibility } from './capability-pack-compatibility-validator.js';
import type {
  CapabilityCompositionPlan,
  CapabilityPackMaterializationInput,
  CapabilityRequirementDescriptor,
  PackLifecycleStage,
  RequirementResolutionOutcome,
} from './universal-capability-pack-types.js';
import { fingerprintCompositionPlan, UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE } from './universal-capability-pack-types.js';

export function buildCapabilityCompositionPlan(input: {
  requirements: readonly CapabilityRequirementDescriptor[];
  materializationInput: CapabilityPackMaterializationInput;
}): CapabilityCompositionPlan {
  const resolutions = resolveAllCapabilityRequirements(input.requirements);
  const satisfiedByB1B6 = input.requirements.filter((r) => classifyNativeSatisfaction(r.capabilityKey)).map((r) => r.requirementId);

  const selectedPackIds = new Set<string>();
  const blockedRequirements: string[] = [];
  const unresolvedRequirements: string[] = [];

  for (const resolution of resolutions) {
    if (resolution.outcome === 'SATISFIED' && resolution.selectedPackId) {
      selectedPackIds.add(resolution.selectedPackId);
    } else if (resolution.outcome === 'BLOCKED_BY_MISSING_PACK' || resolution.outcome === 'BLOCKED_BY_COMPATIBILITY') {
      blockedRequirements.push(resolution.requirementId);
    } else if (resolution.outcome !== 'INFORMATIONAL' && resolution.outcome !== 'NOT_REQUIRED') {
      unresolvedRequirements.push(resolution.requirementId);
    }
  }

  // Validate each selected pack: compatibility + configuration.
  const validPackIds: string[] = [];
  for (const packId of [...selectedPackIds].sort()) {
    const pack = getPack(packId);
    if (!pack) {
      blockedRequirements.push(packId);
      continue;
    }
    const compatIssues = validatePackCompatibility(pack, input.materializationInput);
    const configIssues = validatePackConfiguration(pack, mergePackConfiguration(pack));
    if (compatIssues.length > 0 || configIssues.length > 0) {
      blockedRequirements.push(packId);
      continue;
    }
    validPackIds.push(packId);
  }

  const depResolution = resolvePackDependencies(validPackIds);
  const dependencyOrder = depResolution.issues.some((i) => i.code === 'circular_dependency') ? [] : depResolution.installationOrder;

  let lifecycleStage: PackLifecycleStage = 'RESOLVED';
  if (depResolution.issues.length > 0) lifecycleStage = 'BLOCKED';
  else if (validPackIds.length > 0) lifecycleStage = 'CONFIGURED';

  const plan: CapabilityCompositionPlan = {
    readOnly: true,
    fingerprint: '',
    requirements: input.requirements.map((r) => ({
      ...r,
      supportClassification: mapResolutionOutcome(resolutions.find((res) => res.requirementId === r.requirementId)?.outcome ?? 'NOT_REQUIRED'),
    })),
    satisfiedByB1B6,
    selectedPacks: validPackIds.map((packId) => {
      const pack = getPack(packId)!;
      return { packId, packVersion: pack.packVersion, configuration: mergePackConfiguration(pack) };
    }),
    dependencyOrder,
    resolutions,
    unresolvedRequirements,
    blockedRequirements,
    lifecycleStage,
    provenance: [UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE, input.materializationInput.buildId],
  };

  return { ...plan, fingerprint: fingerprintCompositionPlan(plan) };
}

function mapResolutionOutcome(outcome: RequirementResolutionOutcome): RequirementResolutionOutcome {
  return outcome;
}
