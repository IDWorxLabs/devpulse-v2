/**
 * Phase 27.03 — Launch readiness boundary detector (V1).
 */

import type {
  LaunchReadinessArtifactBuilderAudit,
  LaunchReadinessAssessmentAudit,
  LaunchReadinessBoundaryDetection,
  LaunchReadinessArtifactChainStepId,
  LaunchReadinessArtifactBoundaryFailureClass,
} from './launch-readiness-artifact-completion-boundary-repair-types.js';

export function detectLaunchReadinessArtifactBoundary(input: {
  assessmentAudit: LaunchReadinessAssessmentAudit;
  artifactBuilderAudit: LaunchReadinessArtifactBuilderAudit;
  missingCompletionBoundary?: string | null;
}): LaunchReadinessBoundaryDetection {
  const { assessmentAudit, artifactBuilderAudit } = input;

  if (!assessmentAudit.assessmentFinished) {
    return {
      readOnly: true,
      exactStoppingStep: 'assessment-complete',
      missingCompletionBoundary: assessmentAudit.stoppingReason,
      failureClass: 'STATE_MACHINE_STALLED',
      reason: assessmentAudit.stoppingReason,
    };
  }

  if (!artifactBuilderAudit.reportMarkdownStarted) {
    return {
      readOnly: true,
      exactStoppingStep: 'report-markdown-started',
      missingCompletionBoundary: 'Building launch readiness report markdown',
      failureClass: 'REPORT_GENERATION_CRASH',
      reason: 'Assessment complete but report markdown generation never started',
    };
  }

  if (!artifactBuilderAudit.reportMarkdownFinished) {
    const failureClass: LaunchReadinessArtifactBoundaryFailureClass =
      artifactBuilderAudit.activeArtifactSubstepOperationId === 'building-launch-readiness-report-markdown'
        ? 'REPORT_GENERATION_CRASH'
        : 'STATE_MACHINE_STALLED';
    return {
      readOnly: true,
      exactStoppingStep: 'report-markdown-finished',
      missingCompletionBoundary: 'Building launch readiness report markdown',
      failureClass,
      reason: artifactBuilderAudit.stoppingReason ?? 'Report markdown generation did not finish',
    };
  }

  if (!artifactBuilderAudit.launchArtifactsCreated) {
    return {
      readOnly: true,
      exactStoppingStep: 'launch-artifacts-created',
      missingCompletionBoundary: 'Launch readiness artifacts built',
      failureClass: 'ARTIFACT_BUILD_FAILED',
      reason: artifactBuilderAudit.stoppingReason ?? 'Launch artifacts were not created',
    };
  }

  if (!artifactBuilderAudit.launchArtifactsPersisted) {
    return {
      readOnly: true,
      exactStoppingStep: 'launch-artifacts-persisted',
      missingCompletionBoundary: 'Launch readiness artifacts built',
      failureClass: 'ARTIFACT_PERSIST_FAILED',
      reason: artifactBuilderAudit.stoppingReason ?? 'Launch artifacts were not persisted',
    };
  }

  if (!artifactBuilderAudit.artifactsBuiltEmitted) {
    return {
      readOnly: true,
      exactStoppingStep: 'artifacts-built-emitted',
      missingCompletionBoundary: 'Launch readiness artifacts built',
      failureClass: 'ARTIFACT_COMPLETION_NOT_EMITTED',
      reason: 'Launch artifacts exist but launch-readiness-artifacts-built was not emitted',
    };
  }

  const missing = input.missingCompletionBoundary?.trim();
  if (missing && missing.toLowerCase().includes('intake')) {
    return {
      readOnly: true,
      exactStoppingStep: 'intake-validation-complete-emitted',
      missingCompletionBoundary: missing,
      failureClass: 'INTAKE_COMPLETION_NOT_PROPAGATED',
      reason: `Intake validation completion not propagated: ${missing}`,
    };
  }

  if (missing && missing.toLowerCase().includes('planning')) {
    return {
      readOnly: true,
      exactStoppingStep: 'planning-gate-started',
      missingCompletionBoundary: missing,
      failureClass: 'COMPLETION_EVENT_DROPPED',
      reason: `Planning gate transition blocked: ${missing}`,
    };
  }

  if (missing) {
    return {
      readOnly: true,
      exactStoppingStep: resolveStoppingStepFromLabel(missing),
      missingCompletionBoundary: missing,
      failureClass: 'UNKNOWN_ARTIFACT_BOUNDARY_FAILURE',
      reason: missing,
    };
  }

  return {
    readOnly: true,
    exactStoppingStep: null,
    missingCompletionBoundary: null,
    failureClass: 'NONE',
    reason: null,
  };
}

function resolveStoppingStepFromLabel(
  label: string,
): LaunchReadinessArtifactChainStepId | null {
  const normalized = label.toLowerCase();
  if (normalized.includes('assessment complete')) return 'assessment-complete';
  if (normalized.includes('report markdown') || normalized.includes('building launch readiness')) {
    return 'report-markdown-finished';
  }
  if (normalized.includes('artifacts built')) return 'artifacts-built-emitted';
  if (normalized.includes('intake validation')) return 'intake-validation-complete-emitted';
  if (normalized.includes('planning gate')) return 'planning-gate-started';
  return null;
}
