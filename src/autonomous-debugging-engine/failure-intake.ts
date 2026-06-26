/**
 * Autonomous Debugging Engine — failure intake from prior gates.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { FailureIntakeRecord } from './autonomous-debugging-types.js';

let failureCounter = 0;

export function resetFailureIntakeForTests(): void {
  failureCounter = 0;
}

function nextFailureId(prefix: string): string {
  failureCounter += 1;
  return `fail-${prefix}-${failureCounter}`;
}

export function intakeFailures(input: {
  interactionProof: InteractionProofPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  simulateDataNotSaved?: boolean;
  simulateClippedButton?: boolean;
  simulatePromptDriftRepair?: boolean;
}): FailureIntakeRecord[] {
  const records: FailureIntakeRecord[] = [];
  const now = Date.now();

  for (const result of input.interactionProof.proofResults) {
    if (result.passed || result.skipJustification) continue;
    if (!result.failure) continue;
    records.push({
      readOnly: true,
      failureId: result.failure.failureId,
      sourceGate: 'INTERACTION_PROOF',
      failureType: result.failure.category,
      severity: result.failure.severity === 'BLOCKING' ? 'BLOCKING' : 'HIGH',
      requirementIds: result.failure.requirementIds,
      capabilityIds: result.failure.capabilityIds,
      featureSliceIds: [result.failure.featureSliceId],
      behaviorScenarioIds: result.failure.behaviorScenarioIds,
      virtualUserIds: result.failure.virtualUserJourneyIds,
      deviceProfileIds: result.failure.deviceProfiles,
      interactionIds: [result.failure.interactionId],
      affectedFiles: [result.failure.responsibleArtifact],
      observedResult: result.failure.observedResult,
      expectedResult: result.failure.expectedResult,
      rawEvidence: result.failure.likelyCause,
      timestamp: now,
    });
  }

  for (const profile of input.virtualDeviceLaboratory.profileResults) {
    if (profile.passed || profile.skipJustification || !profile.failure) continue;
    records.push({
      readOnly: true,
      failureId: nextFailureId('device'),
      sourceGate: 'VIRTUAL_DEVICE',
      failureType: profile.failure.category,
      severity: 'BLOCKING',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: profile.failure.featureSliceId ? [profile.failure.featureSliceId] : [],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: [profile.profileId],
      interactionIds: [],
      affectedFiles: [`src/features/${profile.failure.featureSliceId ?? 'layout'}`],
      observedResult: profile.failure.observedResult ?? profile.failure.category,
      expectedResult: 'Device profile validation pass',
      rawEvidence: profile.failure.likelyCause,
      timestamp: now,
    });
  }

  for (const journey of input.virtualUserSimulation.journeyResults) {
    if (journey.completionStatus === 'COMPLETED' || journey.skipJustification) continue;
    records.push({
      readOnly: true,
      failureId: nextFailureId('vuser'),
      sourceGate: 'VIRTUAL_USER',
      failureType: journey.failure?.category ?? 'VIRTUAL_USER_BLOCKED',
      severity: 'HIGH',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: journey.failure?.affectedFeatureSliceIds ?? [],
      behaviorScenarioIds: [],
      virtualUserIds: [journey.userId],
      deviceProfileIds: [],
      interactionIds: [],
      affectedFiles: [],
      observedResult: journey.failure?.observedOutcome ?? 'Journey blocked',
      expectedResult: 'Virtual user journey complete',
      rawEvidence: journey.failure?.likelyCause ?? 'Friction or accessibility blocked journey',
      timestamp: now,
    });
  }

  for (const sim of input.behaviorSimulation.scenarioResults) {
    if (sim.passed || sim.skipJustification) continue;
    records.push({
      readOnly: true,
      failureId: nextFailureId('behavior'),
      sourceGate: 'BEHAVIOR_SIMULATION',
      failureType: sim.failure?.category ?? 'BEHAVIOR_FAILURE',
      severity: 'HIGH',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: sim.scenarioId ? [sim.scenarioId] : [],
      behaviorScenarioIds: [sim.scenarioId],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      affectedFiles: [],
      observedResult: sim.failure?.observedResult ?? 'Behavior scenario failed',
      expectedResult: 'Behavior scenario pass',
      rawEvidence: sim.failure?.likelyCause ?? 'State or data effect missing',
      timestamp: now,
    });
  }

  if (input.incrementalBuild.blockedReason && input.incrementalBuild.permissionVerdict === 'BLOCKED') {
    records.push({
      readOnly: true,
      failureId: nextFailureId('incremental'),
      sourceGate: 'INCREMENTAL_BUILD',
      failureType: 'FEATURE_VALIDATION_FAILURE',
      severity: 'BLOCKING',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: input.incrementalBuild.buildPlan.featureSlices.map((s) => s.sliceId),
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      affectedFiles: [],
      observedResult: input.incrementalBuild.blockedReason,
      expectedResult: 'Incremental build ready for assembly',
      rawEvidence: input.incrementalBuild.blockedReason,
      timestamp: now,
    });
  }

  if (input.simulateDataNotSaved) {
    records.push({
      readOnly: true,
      failureId: nextFailureId('data'),
      sourceGate: 'BEHAVIOR_SIMULATION',
      failureType: 'DATA_NOT_CHANGED',
      severity: 'BLOCKING',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: ['expense-create'],
      behaviorScenarioIds: ['create-expense'],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      affectedFiles: ['src/features/expense-create/expense-create.service.ts'],
      observedResult: 'UI shows success but no data mutation occurs',
      expectedResult: 'Expense record persisted',
      rawEvidence: 'Missing persistence mutation in save handler',
      timestamp: now,
    });
  }

  if (input.simulateClippedButton && !records.some((r) => r.sourceGate === 'VIRTUAL_DEVICE')) {
    records.push({
      readOnly: true,
      failureId: nextFailureId('clipped'),
      sourceGate: 'VIRTUAL_DEVICE',
      failureType: 'CLIPPED_OR_COVERED',
      severity: 'BLOCKING',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: ['expense-create'],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: ['phone-portrait'],
      interactionIds: [],
      affectedFiles: ['src/features/expense-create/ExpenseCreateFeature.tsx'],
      observedResult: 'Save button clipped on phone portrait',
      expectedResult: 'Save button reachable on phone portrait',
      rawEvidence: 'Layout overflow or clipped control on mobile',
      timestamp: now,
    });
  }

  if (input.simulatePromptDriftRepair) {
    records.push({
      readOnly: true,
      failureId: nextFailureId('prompt-drift'),
      sourceGate: 'PROMPT_FAITHFULNESS',
      failureType: 'PROMPT_DRIFT',
      severity: 'BLOCKING',
      requirementIds: ['req-export-report'],
      capabilityIds: [],
      featureSliceIds: ['expense-export'],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      affectedFiles: ['feature-contract.json'],
      observedResult: 'Repair would remove required export reporting feature',
      expectedResult: 'Required prompt feature preserved',
      rawEvidence: 'Patch would remove a required prompt feature',
      timestamp: now,
    });
  }

  return records;
}
