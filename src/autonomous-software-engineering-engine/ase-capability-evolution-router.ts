/**
 * ASE — capability evolution router.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { MissingCapabilityEvolutionPipelineResult } from '../missing-capability-evolution-engine/missing-capability-evolution-types.js';

export function routeAseCapabilityEvolution(input: {
  capabilityPlanning: CapabilityPlanningPipelineResult;
  missingCapabilityEvolution: MissingCapabilityEvolutionPipelineResult;
}): {
  readOnly: true;
  evolutionRequired: boolean;
  evolutionComplete: boolean;
  unsafeEscalation: boolean;
  replanRequired: boolean;
  resumeGate: 'CAPABILITY_PLANNING' | 'INCREMENTAL_BUILD';
  duplicatePrevented: boolean;
} {
  const evolutionRequired =
    input.capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION';
  const evolutionComplete =
    input.missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_PASS' ||
    input.missingCapabilityEvolution.intakeItems.length === 0;
  const unsafeEscalation =
    input.missingCapabilityEvolution.permissionVerdict === 'NEEDS_HUMAN_REVIEW' ||
    input.missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_BLOCKED';
  const replanRequired = evolutionComplete && evolutionRequired;

  return {
    readOnly: true,
    evolutionRequired,
    evolutionComplete,
    unsafeEscalation,
    replanRequired,
    resumeGate: replanRequired ? 'CAPABILITY_PLANNING' : 'INCREMENTAL_BUILD',
    duplicatePrevented: input.missingCapabilityEvolution.reusedCapabilityIds.length > 0,
  };
}
