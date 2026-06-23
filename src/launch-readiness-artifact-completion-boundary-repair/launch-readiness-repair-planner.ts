/**
 * Phase 27.03 — Launch readiness artifact boundary repair planner (V1).
 */

import type {
  LaunchReadinessArtifactBoundaryRepairPlan,
  LaunchReadinessArtifactBuilderAudit,
  LaunchReadinessAssessmentAudit,
  LaunchReadinessBoundaryDetection,
  LaunchReadinessTransitionAnalysis,
} from './launch-readiness-artifact-completion-boundary-repair-types.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
} from './launch-readiness-artifact-completion-boundary-repair-registry.js';

export function planLaunchReadinessArtifactBoundaryRepair(input: {
  assessmentAudit: LaunchReadinessAssessmentAudit;
  artifactBuilderAudit: LaunchReadinessArtifactBuilderAudit;
  boundaryDetection: LaunchReadinessBoundaryDetection;
  transitionAnalysis: LaunchReadinessTransitionAnalysis;
}): LaunchReadinessArtifactBoundaryRepairPlan {
  const { assessmentAudit, artifactBuilderAudit, boundaryDetection, transitionAnalysis } = input;
  const actions: string[] = [];

  if (!assessmentAudit.assessmentFinished) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['await-launch-readiness-assessment'],
      failureClass: boundaryDetection.failureClass,
      emitReportMarkdownPassed: false,
      emitArtifactsBuilt: false,
      writeDegradedReportMarkdown: false,
      clearActiveArtifactSubstep: false,
      recordArtifactsBuiltBoundary: false,
      reason: assessmentAudit.stoppingReason,
    };
  }

  const emitReportMarkdownPassed = !artifactBuilderAudit.reportMarkdownFinished;
  const emitArtifactsBuilt = !artifactBuilderAudit.artifactsBuiltEmitted;
  const writeDegradedReportMarkdown =
    emitReportMarkdownPassed && boundaryDetection.failureClass === 'REPORT_GENERATION_CRASH';
  const clearActiveArtifactSubstep =
    artifactBuilderAudit.activeArtifactSubstepOperationId === BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN ||
    (artifactBuilderAudit.reportMarkdownStarted && !artifactBuilderAudit.reportMarkdownFinished);
  const recordArtifactsBuiltBoundary = emitArtifactsBuilt;

  if (emitReportMarkdownPassed) {
    actions.push(`emit-${BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN}-passed`);
  }
  if (writeDegradedReportMarkdown) {
    actions.push('write-degraded-report-markdown');
  }
  if (clearActiveArtifactSubstep) {
    actions.push('clear-active-artifact-substep');
  }
  if (emitArtifactsBuilt) {
    actions.push(`emit-${LAUNCH_READINESS_ARTIFACTS_BUILT}`);
  }
  if (recordArtifactsBuiltBoundary) {
    actions.push('record-intake-artifacts-built-boundary');
  }

  const repairRequired =
    transitionAnalysis.stageAdvancementBlocked &&
    (emitReportMarkdownPassed || emitArtifactsBuilt || clearActiveArtifactSubstep);

  return {
    readOnly: true,
    repairRequired,
    actions,
    failureClass: transitionAnalysis.failureClass,
    emitReportMarkdownPassed,
    emitArtifactsBuilt,
    writeDegradedReportMarkdown,
    clearActiveArtifactSubstep,
    recordArtifactsBuiltBoundary,
    reason: transitionAnalysis.reason ?? boundaryDetection.reason,
  };
}

export function buildDegradedLaunchReadinessReportMarkdown(input: {
  generatedAt?: string;
  verdict?: string | null;
  detail?: string | null;
}): string {
  const lines = [
    '# Launch Readiness Report (Degraded)',
    '',
    `Generated: ${input.generatedAt ?? new Date().toISOString()}`,
    '',
    '## Status',
    '',
    'Launch readiness assessment completed but report markdown generation required degraded fallback.',
    '',
    `Launch readiness verdict: ${input.verdict ?? 'UNKNOWN'}`,
    '',
    '## Note',
    '',
    'Report markdown generation failed or stalled. Degraded artifact emitted to unblock intake validation.',
  ];
  if (input.detail) {
    lines.push('', '## Detail', '', input.detail);
  }
  return lines.join('\n');
}
