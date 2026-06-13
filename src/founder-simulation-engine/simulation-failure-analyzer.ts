/**
 * Simulation Failure Analyzer — honest failure diagnosis (V1).
 */

import type {
  FounderSimulationScenario,
  FounderSimulationStageResult,
  SimulationFailureItem,
} from './founder-simulation-types.js';

const STAGE_MODULE_MAP: Record<string, string> = {
  UPLOAD_SYSTEM: 'upload-system',
  VISUAL_REFERENCE_INTELLIGENCE: 'visual-reference-intelligence',
  VOICE_NOTES_INTELLIGENCE: 'voice-notes-intelligence',
  REQUIREMENT_COMPLETENESS_INTELLIGENCE: 'requirement-completeness-intelligence',
  UNIFIED_INTAKE_INTELLIGENCE: 'unified-intake-intelligence',
  PLANNING_GATE_AUTHORITY: 'planning-gate-authority',
  PLANNING_BRIEF_GENERATOR: 'planning-brief-generator',
  ARCHITECTURE_BRIEF_GENERATOR: 'architecture-brief-generator',
  BUILD_PLAN_GENERATOR: 'build-plan-generator',
  FOUNDER_TEST_AUTOMATION: 'founder-test-automation',
};

let failureCounter = 0;

export function resetSimulationFailureCounterForTests(): void {
  failureCounter = 0;
}

export function analyzeSimulationFailures(input: {
  scenario: FounderSimulationScenario;
  stageResults: readonly FounderSimulationStageResult[];
}): SimulationFailureItem[] {
  const failures: SimulationFailureItem[] = [];

  for (const stage of input.stageResults) {
    if (stage.status !== 'FAILED' && stage.status !== 'BLOCKED' && stage.status !== 'LOW_CONFIDENCE') continue;

    failureCounter += 1;
    const failingModule = STAGE_MODULE_MAP[stage.stageId] ?? stage.stageId;
    const severity =
      stage.status === 'BLOCKED' || stage.stageId === 'PLANNING_GATE_AUTHORITY'
        ? 'CRITICAL'
        : stage.status === 'FAILED'
          ? 'HIGH'
          : 'MEDIUM';

    failures.push({
      readOnly: true,
      failureId: `sim-failure-${failureCounter}`,
      failingModule,
      likelyCause: stage.failureReason ?? `${stage.stageId} returned ${stage.status}`,
      severity,
      recommendedFix: recommendFix(stage, input.scenario),
      blocksFounderLaunch:
        stage.status === 'BLOCKED' ||
        stage.stageId === 'UNIFIED_INTAKE_INTELLIGENCE' ||
        stage.stageId === 'PLANNING_GATE_AUTHORITY',
      evidence: [stage.stageId, stage.status, ...(stage.evidence ?? [])],
    });
  }

  return failures;
}

function recommendFix(
  stage: FounderSimulationStageResult,
  scenario: FounderSimulationScenario,
): string {
  if (stage.stageId === 'UNIFIED_INTAKE_INTELLIGENCE' && scenario.scenarioType === 'INCOMPLETE_VAGUE') {
    return 'Founder must provide clearer product requirements before planning.';
  }
  if (stage.stageId === 'PLANNING_GATE_AUTHORITY' && stage.evidence.includes('REQUEST_CLARIFICATION')) {
    return 'Resolve platform or evidence conflicts before planning.';
  }
  if (stage.stageId === 'PLANNING_GATE_AUTHORITY' && stage.evidence.includes('REJECT_PLANNING')) {
    return 'Increase intake evidence quality; current input is insufficient for planning.';
  }
  if (stage.stageId === 'BUILD_PLAN_GENERATOR') {
    return 'Complete architecture brief readiness before build plan generation.';
  }
  return `Investigate ${stage.stageId} module behavior for scenario ${scenario.scenarioType}.`;
}
