/**
 * Continuous Product Improvement Engine — improvement signal intake from prior gates.
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { ImprovementSignalRecord } from './continuous-improvement-types.js';

let signalCounter = 0;

export function resetImprovementSignalIntakeForTests(): void {
  signalCounter = 0;
}

function nextSignalId(prefix: string): string {
  signalCounter += 1;
  return `signal-${prefix}-${signalCounter}`;
}

export function intakeImprovementSignals(input: {
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  interactionProof: InteractionProofPipelineResult;
  autonomousDebugging: AutonomousDebuggingPipelineResult;
  simulateHighFrictionEmergency?: boolean;
  simulateLowEndPerformanceWarning?: boolean;
  simulateAccessibilityLabelWarning?: boolean;
  simulateMinorCopyImprovement?: boolean;
  simulateUnsafeImprovement?: boolean;
}): ImprovementSignalRecord[] {
  const records: ImprovementSignalRecord[] = [];
  const now = Date.now();
  const simulationOnly = Boolean(
    input.simulateHighFrictionEmergency ||
      input.simulateLowEndPerformanceWarning ||
      input.simulateAccessibilityLabelWarning ||
      input.simulateMinorCopyImprovement ||
      input.simulateUnsafeImprovement,
  );

  if (!simulationOnly) {
    for (const journey of input.virtualUserSimulation.journeyResults) {
      for (const friction of journey.frictionEvents) {
        if (friction.severity === 'BLOCKING' || friction.severity !== 'HIGH') continue;
        records.push({
          readOnly: true,
          signalId: nextSignalId('vuser-friction'),
          source: 'VIRTUAL_USER',
          kind: 'UX_FRICTION',
          severity: 'HIGH',
          requirementIds: [],
          capabilityIds: [],
          featureSliceIds: journey.failure?.affectedFeatureSliceIds ?? [],
          behaviorScenarioIds: [],
          virtualUserIds: [journey.userId],
          deviceProfileIds: [],
          interactionIds: [],
          observedResult: friction.description,
          expectedResult: 'Low-friction virtual user journey',
          evidence: `${friction.category}: ${friction.description}`,
          traceability: [journey.journeyId, friction.eventId],
          timestamp: now,
        });
      }
    }

    for (const profile of input.virtualDeviceLaboratory.profileResults) {
      if (profile.performance.status === 'WARN') {
        records.push({
          readOnly: true,
          signalId: nextSignalId('device-perf'),
          source: 'VIRTUAL_DEVICE',
          kind: 'PERFORMANCE_DEGRADATION',
          severity: 'MEDIUM',
          requirementIds: [],
          capabilityIds: [],
          featureSliceIds: profile.failure?.featureSliceId ? [profile.failure.featureSliceId] : [],
          behaviorScenarioIds: [],
          virtualUserIds: [],
          deviceProfileIds: [profile.profileId],
          interactionIds: [],
          observedResult: `Render time ${profile.performance.initialRenderMs}ms exceeds comfort threshold`,
          expectedResult: 'Acceptable render time on low-end mobile profile',
          evidence: `Device Laboratory performance warning on ${profile.deviceId}`,
          traceability: [profile.profileId, 'performance-warn'],
          timestamp: now,
        });
      }
    }

    for (const result of input.interactionProof.proofResults) {
      if (!result.passed || result.skipJustification) continue;
      if (result.accessibilityProof.passed) continue;
      if (result.failure?.severity === 'BLOCKING') continue;
      records.push({
        readOnly: true,
        signalId: nextSignalId('interaction-a11y'),
        source: 'INTERACTION_PROOF',
        kind: 'ACCESSIBILITY_WARNING',
        severity: 'MEDIUM',
        requirementIds: result.failure?.requirementIds ?? [],
        capabilityIds: result.failure?.capabilityIds ?? [],
        featureSliceIds: [result.failure?.featureSliceId ?? 'unknown'],
        behaviorScenarioIds: result.failure?.behaviorScenarioIds ?? [],
        virtualUserIds: [],
        deviceProfileIds: result.failure?.deviceProfiles ?? [],
        interactionIds: [result.failure?.interactionId ?? result.interactionId],
        observedResult: result.failure?.observedResult ?? 'Accessibility identity incomplete',
        expectedResult: 'Clear accessible label and role',
        evidence: result.failure?.likelyCause ?? 'Interaction accessibility warning',
        traceability: [result.interactionId],
        timestamp: now,
      });
    }

    for (const sim of input.behaviorSimulation.scenarioResults) {
      if (sim.passed || sim.skipJustification) continue;
      if (sim.failure?.severity === 'BLOCKING') continue;
      records.push({
        readOnly: true,
        signalId: nextSignalId('behavior'),
        source: 'BEHAVIOR_SIMULATION',
        kind: 'EDGE_CASE_GAP',
        severity: 'MEDIUM',
        requirementIds: [],
        capabilityIds: [],
        featureSliceIds: [sim.scenarioId],
        behaviorScenarioIds: [sim.scenarioId],
        virtualUserIds: [],
        deviceProfileIds: [],
        interactionIds: [],
        observedResult: sim.failure?.observedOutcome ?? 'Behavior edge case gap',
        expectedResult: sim.failure?.expectedOutcome ?? 'Scenario pass',
        evidence: sim.failure?.likelyCause ?? 'Non-blocking behavior gap',
        traceability: [sim.scenarioId],
        timestamp: now,
      });
    }

    for (const failure of input.autonomousDebugging.normalizedFailures) {
      if (failure.severity === 'BLOCKING') continue;
      records.push({
        readOnly: true,
        signalId: nextSignalId('debug-residual'),
        source: 'AUTONOMOUS_DEBUGGING',
        kind: 'WARNING',
        severity: 'LOW',
        requirementIds: [],
        capabilityIds: [],
        featureSliceIds: failure.affectedScope,
        behaviorScenarioIds: [],
        virtualUserIds: [],
        deviceProfileIds: [],
        interactionIds: [],
        observedResult: failure.observed,
        expectedResult: failure.expected,
        evidence: failure.evidence,
        traceability: [failure.id],
        timestamp: now,
      });
    }
  }

  if (input.simulateHighFrictionEmergency) {
    records.push({
      readOnly: true,
      signalId: nextSignalId('emergency-friction'),
      source: 'VIRTUAL_USER',
      kind: 'FRICTION',
      severity: 'HIGH',
      requirementIds: ['emergency-phrase'],
      capabilityIds: ['emergency-speech'],
      featureSliceIds: ['emergency-speech'],
      behaviorScenarioIds: ['emergency-phrase'],
      virtualUserIds: ['patient'],
      deviceProfileIds: [],
      interactionIds: ['emergency-phrase-trigger'],
      observedResult: 'Emergency phrase works but requires too many steps',
      expectedResult: 'Emergency phrase reachable in minimal steps',
      evidence: 'Virtual User Engine: HIGH friction on emergency workflow — step count exceeds attention budget',
      traceability: ['lisa-emergency-journey', 'friction-too-many-steps'],
      timestamp: now,
    });
  }

  if (input.simulateLowEndPerformanceWarning) {
    records.push({
      readOnly: true,
      signalId: nextSignalId('low-end-perf'),
      source: 'VIRTUAL_DEVICE',
      kind: 'PERFORMANCE_DEGRADATION',
      severity: 'MEDIUM',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: [],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: ['low-end-mobile-portrait'],
      interactionIds: [],
      observedResult: 'Low-end mobile profile passes but render time is degraded',
      expectedResult: 'Render time within mobile performance budget',
      evidence: 'Device Laboratory: performance warning on low-end mobile profile',
      traceability: ['low-end-mobile', 'render-degraded'],
      timestamp: now,
    });
  }

  if (input.simulateAccessibilityLabelWarning) {
    records.push({
      readOnly: true,
      signalId: nextSignalId('a11y-label'),
      source: 'INTERACTION_PROOF',
      kind: 'ACCESSIBILITY_WARNING',
      severity: 'MEDIUM',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: ['emergency-speech'],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: ['emergency-input'],
      observedResult: 'Input works but accessible label could be clearer',
      expectedResult: 'Descriptive accessible label for assistive technology',
      evidence: 'Interaction Proof: accessible label clarity warning',
      traceability: ['emergency-input', 'label-clarity'],
      timestamp: now,
    });
  }

  if (input.simulateUnsafeImprovement) {
    records.push({
      readOnly: true,
      signalId: nextSignalId('unsafe-ux'),
      source: 'LAUNCH_AUTHORITY',
      kind: 'UX_FRICTION',
      severity: 'HIGH',
      requirementIds: ['emergency-phrase'],
      capabilityIds: ['emergency-speech'],
      featureSliceIds: ['emergency-speech'],
      behaviorScenarioIds: ['emergency-phrase'],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      observedResult:
        'Improvement suggestion would remove a required prompt workflow to simplify UX',
      expectedResult: 'Retain required emergency phrase workflow',
      evidence: 'UX simplification would remove required prompt workflow',
      traceability: ['unsafe-ux-suggestion'],
      timestamp: now,
    });
  }

  if (input.simulateMinorCopyImprovement) {
    records.push({
      readOnly: true,
      signalId: nextSignalId('copy'),
      source: 'LAUNCH_AUTHORITY',
      kind: 'QUALITY_GAP',
      severity: 'LOW',
      requirementIds: [],
      capabilityIds: [],
      featureSliceIds: ['about'],
      behaviorScenarioIds: [],
      virtualUserIds: [],
      deviceProfileIds: [],
      interactionIds: [],
      observedResult: 'Minor copy could be more welcoming on about page',
      expectedResult: 'Polished product copy',
      evidence: 'Founder Test: low-impact copy refinement opportunity',
      traceability: ['about-page-copy'],
      timestamp: now,
    });
  }

  return records;
}
