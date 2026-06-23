/**
 * Phase 26.98 — Launch Readiness Artifact Completion Barrier Repair authority (V1).
 */

import { createHash } from 'node:crypto';
import { recordIntakeCompletionBoundaryOperation } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import {
  forceCompleteProductReadiness,
  invokeProductReadinessCompletionTail,
} from '../founder-test-product-readiness/product-readiness-orchestrator.js';
import {
  createSimulationBudgetTracker,
  SIMULATION_BUDGET_MS,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';
import { shouldForceCompleteProductReadiness } from '../founder-test-product-readiness/product-readiness-completion-boundary.js';
import {
  clearChatStressArtifactSubstepIfSettled,
  reconcileActiveArtifactSubstepAfterChatStressSettled,
} from '../founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import { auditLaunchArtifactStep } from './launch-artifact-step-auditor.js';
import {
  buildDegradedLaunchReadinessDiagnosticMarkdown,
  planLaunchArtifactCompletionRepair,
} from './launch-artifact-completion-repair-planner.js';
import { recordLaunchReadinessArtifactCompletionBarrierRepair } from './launch-artifact-completion-history.js';
import {
  detectLaunchReadinessCompletion,
  hasLaunchReadinessAssessmentCompleteEmitted,
  markLaunchReadinessAssessmentCompleteEmitted,
  resetLaunchReadinessCompletionDetectionForTests,
} from './launch-readiness-completion-detector.js';
import { detectProductReadinessBudgetResult } from './product-readiness-budget-result-detector.js';
import { analyzeLaunchArtifactTransition } from './launch-artifact-transition-analyzer.js';
import {
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CACHE_KEY_PREFIX,
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
} from './launch-readiness-artifact-completion-barrier-repair-registry.js';
import type {
  ApplyLaunchReadinessArtifactCompletionBarrierRepairInput,
  AssessLaunchReadinessArtifactCompletionBarrierRepairInput,
  LaunchReadinessArtifactCompletionBarrierRepairAssessment,
} from './launch-readiness-artifact-completion-barrier-repair-types.js';

let repairCounter = 0;

export function resetLaunchReadinessArtifactCompletionBarrierRepairCounterForTests(): void {
  repairCounter = 0;
}

export function resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests(): void {
  resetLaunchReadinessArtifactCompletionBarrierRepairCounterForTests();
  resetLaunchReadinessCompletionDetectionForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `launch-readiness-artifact-completion-barrier-repair-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, repairApplied: boolean): string {
  const digest = createHash('sha256')
    .update(
      [LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS, repairId, String(repairApplied)].join(
        '|',
      ),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessLaunchReadinessArtifactCompletionBarrierRepair(
  input: AssessLaunchReadinessArtifactCompletionBarrierRepairInput = {},
): LaunchReadinessArtifactCompletionBarrierRepairAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const repairId = nextRepairId();
  const snapshot = input.runtimeSnapshot ?? null;

  const stepAudit = auditLaunchArtifactStep(
    snapshot
      ? {
          chatStressStarted: snapshot.chatStressStartedCount,
          chatStressSettled: snapshot.chatStressSettledCount,
          chatStressPending: snapshot.chatStressPendingCount,
          activeArtifactSubstep: snapshot.activeArtifactBuildSubstep
            ? {
                operationId: 'product-readiness-chat-stress-started',
                operationLabel: snapshot.activeArtifactBuildSubstep,
                startedAt: new Date(nowMs).toISOString(),
                slowEmitted: false,
                stallEmitted: false,
              }
            : null,
        }
      : {},
    nowMs,
  );

  const budgetResultDetection = detectProductReadinessBudgetResult({
    simulationRuntimeHealth: input.simulationRuntimeHealth,
    productReadinessDegraded: input.productReadinessDegraded,
    traceEvents: snapshot?.traceEvents,
  });

  const completionDetection = detectLaunchReadinessCompletion({
    traceEvents: snapshot?.traceEvents,
    launchReadinessReportMarkdown: input.launchReadinessReportMarkdown,
  });

  const transitionAnalysis = analyzeLaunchArtifactTransition({
    runtimeSnapshot: snapshot,
    stepAudit,
    budgetResultDetection,
    completionDetection,
  });

  const repairPlan = planLaunchArtifactCompletionRepair({
    stepAudit,
    budgetResultDetection,
    completionDetection,
    transitionAnalysis,
  });

  const chainSatisfied =
    stepAudit.rule1Satisfied &&
    !stepAudit.chatSettledButArtifactActive &&
    hasLaunchReadinessAssessmentCompleteEmitted() &&
    !repairPlan.repairRequired;

  const report = {
    readOnly: true as const,
    repairId,
    generatedAt: new Date(nowMs).toISOString(),
    stepAudit,
    budgetResultDetection,
    completionDetection,
    transitionAnalysis,
    repairPlan,
    repairApplied: false,
    passToken: chainSatisfied ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS : null,
  };

  recordLaunchReadinessArtifactCompletionBarrierRepair(report);
  stableCacheKey(repairId, false);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function emitLaunchReadinessAssessmentCompleteOnce(input: {
  withWarnings?: boolean;
  detail?: string | null;
  onBuildTrace?: ApplyLaunchReadinessArtifactCompletionBarrierRepairInput['onBuildTrace'];
  onRuntimeTrace?: ApplyLaunchReadinessArtifactCompletionBarrierRepairInput['onRuntimeTrace'];
}): void {
  if (hasLaunchReadinessAssessmentCompleteEmitted()) {
    return;
  }

  const withWarnings = input.withWarnings === true;
  const operationId = withWarnings
    ? LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS
    : LAUNCH_READINESS_ASSESSMENT_COMPLETE;
  const operationLabel = withWarnings
    ? `Launch readiness assessment complete with warnings${input.detail ? `: ${input.detail}` : ''}`
    : 'Launch readiness assessment complete';

  input.onBuildTrace?.({
    operationId,
    operationLabel,
    phase: 'PASSED',
  });

  input.onRuntimeTrace?.({
    operationId,
    operationLabel,
    stageId: 'INTAKE_VALIDATION',
    status: 'PASSED',
  });

  recordIntakeCompletionBoundaryOperation(operationId);
  markLaunchReadinessAssessmentCompleteEmitted(withWarnings);
}

export async function applyLaunchReadinessArtifactCompletionBarrierRepair(
  input: ApplyLaunchReadinessArtifactCompletionBarrierRepairInput = {},
): Promise<LaunchReadinessArtifactCompletionBarrierRepairAssessment> {
  const assessment = assessLaunchReadinessArtifactCompletionBarrierRepair(input);
  const { repairPlan, stepAudit, budgetResultDetection } = assessment.report;

  if (!repairPlan.repairRequired) {
    return assessment;
  }

  if (repairPlan.clearChatStressArtifactSubstep) {
    clearChatStressArtifactSubstepIfSettled({
      operationLabel:
        stepAudit.activeArtifactSubstep?.operationLabel ??
        'Chat stress complete (settlement repair)',
      withWarnings: budgetResultDetection.simulationDegradedPartial,
    });
  }

  if (repairPlan.forceProductReadinessCompletion && shouldForceCompleteProductReadiness()) {
    const rootDir = input.rootDir ?? process.cwd();
    const founderTest = assessFounderTestIntegration({ rootDir });
    const budget = createSimulationBudgetTracker({
      budgetMs: SIMULATION_BUDGET_MS,
      startedAtMs: input.nowMs ?? Date.now(),
    });
    const tailInput = {
      rootDir,
      founderTest,
      chatStress: null,
      budget,
      simulationBudgetNotes: [
        'Launch readiness artifact completion barrier repair invoked product readiness tail.',
      ],
      founderTestContext: true as const,
      productReadinessRuntimePath: 'real-founder' as const,
      onSimulationTrace: input.onBuildTrace,
      chatStressForced: true,
    };

    if (repairPlan.actions.includes('force-product-readiness-completion-tail')) {
      await invokeProductReadinessCompletionTail(tailInput);
    } else {
      forceCompleteProductReadiness(tailInput);
    }
  }

  if (repairPlan.emitLaunchReadinessAssessmentComplete) {
    emitLaunchReadinessAssessmentCompleteOnce({
      onBuildTrace: input.onBuildTrace,
      onRuntimeTrace: input.onRuntimeTrace,
    });
  }

  if (repairPlan.emitLaunchReadinessAssessmentCompleteWithWarnings) {
    emitLaunchReadinessAssessmentCompleteOnce({
      withWarnings: true,
      detail: budgetResultDetection.reason,
      onBuildTrace: input.onBuildTrace,
      onRuntimeTrace: input.onRuntimeTrace,
    });
  }

  const degradedMarkdown = repairPlan.writeDegradedDiagnosticMarkdown
    ? buildDegradedLaunchReadinessDiagnosticMarkdown({
        simulationRuntimeHealth: input.simulationRuntimeHealth,
        chatStressStarted: stepAudit.chatStressStarted,
        chatStressSettled: stepAudit.chatStressSettled,
        chatStressPending: stepAudit.chatStressPending,
        detail: budgetResultDetection.reason,
      })
    : input.launchReadinessReportMarkdown ?? null;

  const refreshed = assessLaunchReadinessArtifactCompletionBarrierRepair({
    ...input,
    launchReadinessReportMarkdown: degradedMarkdown,
    productReadinessDegraded:
      input.productReadinessDegraded ?? budgetResultDetection.simulationDegradedPartial,
  });

  const pass =
    refreshed.report.stepAudit.rule1Satisfied &&
    !refreshed.report.stepAudit.chatSettledButArtifactActive &&
    hasLaunchReadinessAssessmentCompleteEmitted();

  const repairedReport = {
    ...refreshed.report,
    repairApplied: true,
    passToken: pass ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS : null,
  };

  recordLaunchReadinessArtifactCompletionBarrierRepair(repairedReport);

  return {
    readOnly: true,
    advisoryOnly: true,
    report: repairedReport,
  };
}

export function reconcileLaunchReadinessArtifactCompletionBarrierOnSnapshot(
  runtimeSnapshot: AssessLaunchReadinessArtifactCompletionBarrierRepairInput['runtimeSnapshot'],
  handlers: {
    onBuildTrace?: ApplyLaunchReadinessArtifactCompletionBarrierRepairInput['onBuildTrace'];
    onRuntimeTrace?: ApplyLaunchReadinessArtifactCompletionBarrierRepairInput['onRuntimeTrace'];
  } = {},
): LaunchReadinessArtifactCompletionBarrierRepairAssessment {
  reconcileActiveArtifactSubstepAfterChatStressSettled();

  const assessment = assessLaunchReadinessArtifactCompletionBarrierRepair({ runtimeSnapshot });

  if (!assessment.report.repairPlan.repairRequired) {
    return assessment;
  }

  if (assessment.report.repairPlan.clearChatStressArtifactSubstep) {
    clearChatStressArtifactSubstepIfSettled({
      withWarnings: assessment.report.budgetResultDetection.simulationDegradedPartial,
    });
  }

  if (
    assessment.report.repairPlan.emitLaunchReadinessAssessmentComplete ||
    assessment.report.repairPlan.emitLaunchReadinessAssessmentCompleteWithWarnings
  ) {
    emitLaunchReadinessAssessmentCompleteOnce({
      withWarnings:
        assessment.report.repairPlan.emitLaunchReadinessAssessmentCompleteWithWarnings,
      detail: assessment.report.budgetResultDetection.reason,
      onBuildTrace: handlers.onBuildTrace,
      onRuntimeTrace: handlers.onRuntimeTrace,
    });
  }

  return assessLaunchReadinessArtifactCompletionBarrierRepair({ runtimeSnapshot });
}

export function resolveLaunchReadinessAssessmentCompletePhase(input: {
  simulationDegradedPartial?: boolean;
  simulationRuntimeHealth?: string | null;
}): 'PASSED' | 'BUDGET_EXCEEDED' {
  if (
    input.simulationDegradedPartial ||
    input.simulationRuntimeHealth === 'SIMULATION_BUDGET_EXCEEDED'
  ) {
    return 'PASSED';
  }
  return 'PASSED';
}
