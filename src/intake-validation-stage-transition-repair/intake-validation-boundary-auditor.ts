/**
 * Phase 27.05 — Intake validation boundary auditor (V1).
 */

import { hasIntakeValidationCompletionBoundaryInRegistry } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { hasPassedTraceEvent } from '../founder-test-runtime-monitor/stage2-completion-tracker.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { IntakeValidationBoundaryAudit } from './intake-validation-stage-transition-repair-types.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  INTAKE_VALIDATION_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
} from './intake-validation-stage-transition-repair-registry.js';

function assessmentComplete(traceEvents: FounderTestRuntimeSnapshot['traceEvents']): boolean {
  return (
    hasPassedTraceEvent(traceEvents, LAUNCH_READINESS_ASSESSMENT_COMPLETE) ||
    hasPassedTraceEvent(traceEvents, LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS)
  );
}

export function auditIntakeValidationBoundary(input: {
  runtimeSnapshot?: Pick<FounderTestRuntimeSnapshot, 'stages' | 'traceEvents'> | null;
}): IntakeValidationBoundaryAudit {
  const traceEvents = input.runtimeSnapshot?.traceEvents ?? [];
  const intakeStage = input.runtimeSnapshot?.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION');

  const launchReadinessAssessmentComplete = assessmentComplete(traceEvents);
  const launchReadinessReportBuilt = hasPassedTraceEvent(
    traceEvents,
    BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  );
  const launchReadinessArtifactsBuilt =
    hasPassedTraceEvent(traceEvents, LAUNCH_READINESS_ARTIFACTS_BUILT) ||
    hasIntakeValidationCompletionBoundaryInRegistry(LAUNCH_READINESS_ARTIFACTS_BUILT);
  const intakeValidationCompleteEmitted = hasPassedTraceEvent(traceEvents, INTAKE_VALIDATION_COMPLETE);
  const intakeStageRunning = intakeStage?.status === 'RUNNING';
  const intakeStagePassed = intakeStage?.status === 'PASSED';

  const rule1Satisfied =
    launchReadinessAssessmentComplete &&
    launchReadinessReportBuilt &&
    launchReadinessArtifactsBuilt;

  const intakeValidationComplete =
    rule1Satisfied || intakeValidationCompleteEmitted || intakeStagePassed;

  let reason: string | null = null;
  if (rule1Satisfied && !intakeValidationCompleteEmitted && intakeStageRunning) {
    reason = 'Rule 1 satisfied but intake-validation-complete not emitted while Stage 2 RUNNING';
  } else if (!launchReadinessArtifactsBuilt && intakeStageRunning) {
    reason = 'Launch readiness artifacts built boundary not satisfied';
  }

  return {
    readOnly: true,
    launchReadinessAssessmentComplete,
    launchReadinessReportBuilt,
    launchReadinessArtifactsBuilt,
    intakeValidationComplete,
    intakeValidationCompleteEmitted,
    intakeStageRunning,
    intakeStagePassed,
    rule1Satisfied,
    reason,
  };
}
