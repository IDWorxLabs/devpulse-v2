/**
 * Interaction Proof Engine — interaction inventory builder.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { InteractionInventoryRecord, InteractionSurface } from './interaction-proof-types.js';

export function buildInteractionInventory(input: {
  surfaces: readonly InteractionSurface[];
  behaviorSimulation?: BehaviorSimulationPipelineResult;
  virtualUserSimulation?: VirtualUserPipelineResult;
  virtualDeviceLaboratory?: VirtualDevicePipelineResult;
}): InteractionInventoryRecord[] {
  return input.surfaces.map((surface) => {
    const behaviorScenarios =
      input.behaviorSimulation?.scenarios
        .filter((s) => surface.label.toLowerCase().split(' ').some((w) => s.name.toLowerCase().includes(w)))
        .map((s) => s.scenarioId) ?? [];
    const journeyIds =
      input.virtualUserSimulation?.journeys
        .filter((j) => j.steps.some((step) => step.toLowerCase().includes(surface.label.split(' ')[0]?.toLowerCase() ?? '')))
        .map((j) => j.journeyId) ?? [];
    const deviceProfileIds = input.virtualDeviceLaboratory?.matrix.map((m) => m.profileId) ?? [];

    return {
      readOnly: true,
      interactionId: surface.interactionId,
      elementType: surface.elementType,
      label: surface.label,
      accessibleName: surface.accessibleName,
      role: surface.role,
      selectorStrategy: surface.selectorStrategy,
      route: surface.route,
      featureSliceId: surface.featureSliceId,
      requirementIds: [],
      capabilityIds: [],
      behaviorScenarioIds: behaviorScenarios,
      virtualUserJourneyIds: journeyIds,
      deviceProfileIds,
      expectedHandler: surface.expectedHandler,
      expectedEvent: surface.eventType,
      expectedStateEffect: `${surface.label} state updated`,
      expectedDataEffect: `${surface.label} data mutation`,
      expectedUiEffect: `${surface.label} UI confirmation`,
      riskLevel: surface.riskLevel,
      classification: surface.classification,
      proofStatus: 'FAILED' as const,
    };
  });
}
