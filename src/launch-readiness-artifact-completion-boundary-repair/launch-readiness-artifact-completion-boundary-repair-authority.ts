/**
 * Phase 27.03 — Launch Readiness Artifact Completion Boundary Repair authority (V1).
 */

import { createHash } from 'node:crypto';
import { recordIntakeCompletionBoundaryOperation } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { completeArtifactBuildSubstep } from '../founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import { auditLaunchReadinessAssessment } from './launch-readiness-assessment-auditor.js';
import { auditLaunchReadinessArtifactBuilder } from './launch-readiness-artifact-builder-auditor.js';
import { detectLaunchReadinessArtifactBoundary } from './launch-readiness-boundary-detector.js';
import { analyzeLaunchReadinessTransition } from './launch-readiness-transition-analyzer.js';
import {
  buildDegradedLaunchReadinessReportMarkdown,
  planLaunchReadinessArtifactBoundaryRepair,
} from './launch-readiness-repair-planner.js';
import { recordLaunchReadinessArtifactCompletionBoundaryRepair } from './launch-readiness-artifact-completion-history.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX,
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
} from './launch-readiness-artifact-completion-boundary-repair-registry.js';
import type {
  ApplyLaunchReadinessArtifactCompletionBoundaryRepairSyncInput,
  AssessLaunchReadinessArtifactCompletionBoundaryRepairInput,
  LaunchReadinessArtifactChainResult,
  LaunchReadinessArtifactCompletionBoundaryRepairAssessment,
} from './launch-readiness-artifact-completion-boundary-repair-types.js';

let repairCounter = 0;

export function resetLaunchReadinessArtifactCompletionBoundaryRepairCounterForTests(): void {
  repairCounter = 0;
}

export function resetLaunchReadinessArtifactCompletionBoundaryRepairModuleForTests(): void {
  resetLaunchReadinessArtifactCompletionBoundaryRepairCounterForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `launch-readiness-artifact-completion-boundary-repair-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, repairApplied: boolean): string {
  const digest = createHash('sha256')
    .update(
      [LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS, repairId, String(repairApplied)].join(
        '|',
      ),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessLaunchReadinessArtifactCompletionBoundaryRepair(
  input: AssessLaunchReadinessArtifactCompletionBoundaryRepairInput = {},
): LaunchReadinessArtifactCompletionBoundaryRepairAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const repairId = nextRepairId();
  const snapshot = input.runtimeSnapshot ?? null;

  const assessmentAudit = auditLaunchReadinessAssessment({
    traceEvents: snapshot?.traceEvents,
  });

  const artifactBuilderAudit = auditLaunchReadinessArtifactBuilder({
    traceEvents: snapshot?.traceEvents,
    launchReadinessReportMarkdown: input.launchReadinessReportMarkdown,
    artifactPersisted: input.artifactPersisted,
    activeArtifactSubstepOperationId: snapshot?.activeArtifactBuildSubstepOperationId ?? null,
    activeArtifactSubstepLabel: snapshot?.activeArtifactBuildSubstep ?? null,
  });

  const boundaryDetection = detectLaunchReadinessArtifactBoundary({
    assessmentAudit,
    artifactBuilderAudit,
    missingCompletionBoundary: snapshot?.missingCompletionBoundary ?? null,
  });

  const transitionAnalysis = analyzeLaunchReadinessTransition({
    runtimeSnapshot: snapshot,
    assessmentAudit,
    artifactBuilderAudit,
    boundaryDetection,
  });

  const repairPlan = planLaunchReadinessArtifactBoundaryRepair({
    assessmentAudit,
    artifactBuilderAudit,
    boundaryDetection,
    transitionAnalysis,
  });

  const chainSatisfied =
    assessmentAudit.assessmentFinished &&
    artifactBuilderAudit.reportMarkdownFinished &&
    artifactBuilderAudit.launchArtifactsCreated &&
    artifactBuilderAudit.artifactsBuiltEmitted &&
    !repairPlan.repairRequired;

  const report = {
    readOnly: true as const,
    repairId,
    generatedAt: new Date(nowMs).toISOString(),
    assessmentAudit,
    artifactBuilderAudit,
    boundaryDetection,
    transitionAnalysis,
    repairPlan,
    repairApplied: false,
    passToken: chainSatisfied ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS : null,
  };

  recordLaunchReadinessArtifactCompletionBoundaryRepair(report);
  stableCacheKey(repairId, false);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function applyLaunchReadinessArtifactCompletionBoundaryRepairSync(
  input: ApplyLaunchReadinessArtifactCompletionBoundaryRepairSyncInput,
): LaunchReadinessArtifactChainResult {
  const onBuildTrace = input.onBuildTrace;
  let reportMarkdownDegraded = input.degraded === true;
  let failureClass: LaunchReadinessArtifactChainResult['failureClass'] = 'NONE';
  let repairApplied = false;
  let markdown = '';

  onBuildTrace?.({
    operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
    operationLabel: 'Building launch readiness report markdown',
    phase: 'RUNNING',
  });

  try {
    markdown = input.buildMarkdown?.() ?? '';
    if (!markdown.trim()) {
      throw new Error('Launch readiness report markdown was empty');
    }
    onBuildTrace?.({
      operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
      operationLabel: 'Building launch readiness report markdown',
      phase: 'PASSED',
    });
  } catch (err) {
    reportMarkdownDegraded = true;
    failureClass = 'REPORT_GENERATION_CRASH';
    repairApplied = true;
    const message = err instanceof Error ? err.message : 'report markdown generation failed';
    markdown = buildDegradedLaunchReadinessReportMarkdown({
      generatedAt: input.launchReadinessReport.generatedAt,
      verdict: input.launchReadinessReport.launchReadinessVerdict,
      detail: input.degradedDetail ?? message,
    });
    onBuildTrace?.({
      operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
      operationLabel: 'Building launch readiness report markdown',
      phase: 'PASSED',
      errorMessage: `Degraded fallback: ${message}`,
    });
  }

  onBuildTrace?.({
    operationId: LAUNCH_READINESS_ARTIFACTS_BUILT,
    operationLabel: 'Launch readiness artifacts built',
    phase: 'PASSED',
    errorMessage: reportMarkdownDegraded ? input.degradedDetail ?? 'degraded report markdown' : undefined,
  });

  recordIntakeCompletionBoundaryOperation(LAUNCH_READINESS_ARTIFACTS_BUILT);

  completeArtifactBuildSubstep({
    operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
    operationLabel: 'Building launch readiness report markdown',
    status: 'PASSED',
  });

  return {
    readOnly: true,
    markdown,
    reportMarkdownDegraded,
    artifactsBuiltEmitted: true,
    repairApplied,
    failureClass,
  };
}

export function reconcileLaunchReadinessArtifactCompletionBoundaryOnSnapshot(
  runtimeSnapshot: AssessLaunchReadinessArtifactCompletionBoundaryRepairInput['runtimeSnapshot'],
  handlers: {
    onBuildTrace?: ApplyLaunchReadinessArtifactCompletionBoundaryRepairSyncInput['onBuildTrace'];
    onRuntimeTrace?: (event: {
      operationId: string;
      operationLabel: string;
      stageId: string;
      status: 'PASSED' | 'RUNNING';
    }) => void;
  } = {},
): LaunchReadinessArtifactCompletionBoundaryRepairAssessment {
  const assessment = assessLaunchReadinessArtifactCompletionBoundaryRepair({ runtimeSnapshot });

  if (!assessment.report.repairPlan.repairRequired) {
    return assessment;
  }

  const { repairPlan, artifactBuilderAudit } = assessment.report;

  if (repairPlan.clearActiveArtifactSubstep && artifactBuilderAudit.activeArtifactSubstepOperationId) {
    completeArtifactBuildSubstep({
      operationId: artifactBuilderAudit.activeArtifactSubstepOperationId,
      operationLabel:
        artifactBuilderAudit.activeArtifactSubstepLabel ?? 'Building launch readiness report markdown',
      status: 'PASSED',
      errorMessage: repairPlan.reason ?? undefined,
    });
  }

  if (repairPlan.emitReportMarkdownPassed) {
    handlers.onBuildTrace?.({
      operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
      operationLabel: 'Building launch readiness report markdown',
      phase: 'PASSED',
      errorMessage: repairPlan.writeDegradedReportMarkdown ? repairPlan.reason ?? undefined : undefined,
    });
    handlers.onRuntimeTrace?.({
      operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
      operationLabel: 'Building launch readiness report markdown',
      stageId: 'INTAKE_VALIDATION',
      status: 'PASSED',
    });
  }

  if (repairPlan.emitArtifactsBuilt) {
    handlers.onBuildTrace?.({
      operationId: LAUNCH_READINESS_ARTIFACTS_BUILT,
      operationLabel: 'Launch readiness artifacts built',
      phase: 'PASSED',
      errorMessage: repairPlan.writeDegradedReportMarkdown ? repairPlan.reason ?? undefined : undefined,
    });
    handlers.onRuntimeTrace?.({
      operationId: LAUNCH_READINESS_ARTIFACTS_BUILT,
      operationLabel: 'Launch readiness artifacts built',
      stageId: 'INTAKE_VALIDATION',
      status: 'PASSED',
    });
  }

  if (repairPlan.recordArtifactsBuiltBoundary) {
    recordIntakeCompletionBoundaryOperation(LAUNCH_READINESS_ARTIFACTS_BUILT);
  }

  const refreshed = assessLaunchReadinessArtifactCompletionBoundaryRepair({ runtimeSnapshot });
  const pass =
    refreshed.report.assessmentAudit.assessmentFinished &&
    refreshed.report.artifactBuilderAudit.artifactsBuiltEmitted;

  const repairedReport = {
    ...refreshed.report,
    repairApplied: true,
    passToken: pass ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS : null,
  };

  recordLaunchReadinessArtifactCompletionBoundaryRepair(repairedReport);
  stableCacheKey(repairedReport.repairId, true);

  return {
    readOnly: true,
    advisoryOnly: true,
    report: repairedReport,
  };
}
