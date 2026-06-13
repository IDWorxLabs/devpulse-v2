/**
 * Execution Evidence Consolidator — aggregates upstream chain evidence (V1).
 */

import {
  checkReadinessAlignment,
} from '../cross-system-orchestration-proof/readiness-alignment-check.js';
import { extractAuthoritySnapshots } from '../cross-system-orchestration-proof/project-consistency-tracker.js';
import type { ProveOrchestrationInput } from '../cross-system-orchestration-proof/orchestration-proof-types.js';
import type {
  AssessExecutionReadinessInput,
  ExecutionAuthorityReadinessSignal,
  ExecutionEvidenceSnapshot,
} from './execution-readiness-types.js';

const READINESS_SCORE_BY_LABEL: Record<string, number> = {
  READY_FOR_EXECUTION: 95,
  READY_FOR_EXECUTION_PLANNING: 90,
  READY_FOR_EXECUTION_GATE: 95,
  ARCHITECTURE_READY: 86,
  ARCHITECTURE_DRAFT_READY: 78,
  PLANNING_READY: 84,
  DRAFT_BUILD_PLAN: 80,
  READY_FOR_PLANNING: 80,
  READY_FOR_BUILD_PLAN: 82,
  READY_WITH_ACTIONS: 72,
  DRAFT_READY: 68,
  NEEDS_CLARIFICATION: 50,
  HIGH_RISK: 45,
  NOT_READY: 30,
};

function readinessToScore(readiness: string | null): number | null {
  if (!readiness) return null;
  const upper = readiness.toUpperCase();
  if (READINESS_SCORE_BY_LABEL[upper] != null) return READINESS_SCORE_BY_LABEL[upper];
  for (const [key, score] of Object.entries(READINESS_SCORE_BY_LABEL)) {
    if (upper.includes(key)) return score;
  }
  return 50;
}

function pushSignal(
  signals: ExecutionAuthorityReadinessSignal[],
  authorityId: string,
  reached: boolean,
  readiness: string | null,
  confidence: number | null,
  evidence: string[],
): void {
  signals.push({
    readOnly: true,
    authorityId,
    reached,
    readiness,
    confidence,
    evidence,
  });
}

export function hasMinimumExecutionEvidence(input: AssessExecutionReadinessInput): boolean {
  if (!input.unifiedIntakeAnalysis) return false;
  return Boolean(
    input.planningGateAnalysis ||
      input.orchestrationProofAnalysis ||
      input.founderTestAnalysis ||
      input.founderSimulationResult,
  );
}

export function consolidateExecutionEvidence(input: AssessExecutionReadinessInput): ExecutionEvidenceSnapshot {
  const signals: ExecutionAuthorityReadinessSignal[] = [];
  const sources = new Set<string>();

  const intake = input.unifiedIntakeAnalysis;
  if (intake) {
    pushSignal(
      signals,
      'UNIFIED_INTAKE_INTELLIGENCE',
      true,
      intake.intakeReadinessCategory,
      intake.unifiedIntakeConfidence,
      [...intake.projectUnderstanding.evidenceSources],
    );
    for (const source of intake.evidence.activeSources) sources.add(source);
  }

  const gate = input.planningGateAnalysis;
  if (gate) {
    pushSignal(
      signals,
      'PLANNING_GATE_AUTHORITY',
      true,
      gate.planningReadiness.planningReadinessCategory,
      gate.planningGateExplanation.confidence,
      [...gate.planningGateExplanation.evidenceUsed],
    );
    for (const source of gate.planningGateExplanation.evidenceUsed) sources.add(source);
  }

  const planningBrief = input.planningBrief;
  if (planningBrief) {
    pushSignal(
      signals,
      'PLANNING_BRIEF_GENERATOR',
      true,
      planningBrief.planningBriefReadiness,
      planningBrief.planningBriefConfidence,
      [...planningBrief.evidenceSources],
    );
    for (const source of planningBrief.evidenceSources) sources.add(source);
  }

  const architectureBrief = input.architectureBrief;
  if (architectureBrief) {
    pushSignal(
      signals,
      'ARCHITECTURE_BRIEF_GENERATOR',
      true,
      architectureBrief.architectureBriefReadiness,
      architectureBrief.architectureBriefConfidence,
      [...architectureBrief.evidenceSources],
    );
    for (const source of architectureBrief.evidenceSources) sources.add(source);
  }

  const buildPlan = input.buildPlan;
  if (buildPlan) {
    pushSignal(
      signals,
      'BUILD_PLAN_GENERATOR',
      true,
      buildPlan.buildPlanReadiness,
      buildPlan.buildPlanConfidence,
      [...buildPlan.evidenceSources],
    );
    for (const source of buildPlan.evidenceSources) sources.add(source);
  }

  const founderTest = input.founderTestAnalysis;
  if (founderTest) {
    pushSignal(
      signals,
      'FOUNDER_TEST_AUTOMATION',
      true,
      founderTest.executionReadiness.executionReadinessState,
      founderTest.executionReadiness.confidenceScore,
      ['FOUNDER_TEST_REALITY_SWEEP'],
    );
    sources.add('FOUNDER_TEST_AUTOMATION');
  }

  const simulation = input.founderSimulationResult;
  const orchestration = input.orchestrationProofAnalysis;

  let clarificationRequestCount = gate?.planningGateQuestions.length ?? 0;
  let knownGapCount = planningBrief?.knownGaps.length ?? 0;

  if (input.requirementCompletenessAnalysis) {
    clarificationRequestCount += input.requirementCompletenessAnalysis.clarifyingQuestions.length;
    knownGapCount += input.requirementCompletenessAnalysis.missingRequirements.length;
  }

  let readinessEscalationCount = 0;
  let planningGateAligned = true;

  if (gate && orchestration) {
    const proofInput: ProveOrchestrationInput = {
      unifiedIntakeAnalysis: intake ?? null,
      planningGateAnalysis: gate,
      planningBrief: planningBrief ?? null,
      architectureBrief: architectureBrief ?? null,
      buildPlan: buildPlan ?? null,
      founderTestAnalysis: founderTest ?? null,
      skipHistoryRecording: true,
    };
    const snapshots = extractAuthoritySnapshots(proofInput);
    const alignment = checkReadinessAlignment({
      gateDecision: gate.planningGateDecision,
      snapshots,
      clarificationGapCount: knownGapCount,
    });
    readinessEscalationCount = alignment.escalations.length;
    planningGateAligned = alignment.aligned;
  } else if (gate?.planningGateDecision === 'REJECT_PLANNING') {
    planningGateAligned = false;
  }

  const readinessScores = signals
    .map((signal) => readinessToScore(signal.readiness))
    .filter((score): score is number => score != null);
  const confidenceScores = signals
    .map((signal) => signal.confidence)
    .filter((score): score is number => score != null);

  const averageReadinessScore =
    readinessScores.length === 0
      ? 0
      : Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length);
  const averageConfidence =
    confidenceScores.length === 0
      ? 0
      : Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length);

  return {
    readOnly: true,
    sources: [...sources],
    readinessSignals: signals,
    planningGateDecision: gate?.planningGateDecision ?? null,
    planningGateAligned,
    orchestrationProofScore: orchestration?.orchestrationProofScore ?? null,
    orchestrationProofCategory: orchestration?.orchestrationProofCategory ?? null,
    founderSimulationVerdict: simulation?.finalVerdict ?? null,
    founderSimulationReadinessScore: simulation?.readinessScore ?? null,
    clarificationRequestCount,
    knownGapCount,
    readinessEscalationCount,
    averageConfidence,
    averageReadinessScore,
    informationLossCount: orchestration?.systemOrchestrationProof.informationLosses.length ?? 0,
    orchestrationFailureCount: orchestration?.orchestrationFailures.length ?? 0,
  };
}
