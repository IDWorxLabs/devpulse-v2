/**
 * Phase 27.05 — Intake validation completion detector (V1).
 */

import type {
  IntakeValidationBoundaryAudit,
  IntakeValidationCompletionDetection,
  IntakeValidationStageTransitionFailureClass,
} from './intake-validation-stage-transition-repair-types.js';

export function detectIntakeValidationCompletion(
  boundaryAudit: IntakeValidationBoundaryAudit,
): IntakeValidationCompletionDetection {
  if (!boundaryAudit.rule1Satisfied) {
    return {
      readOnly: true,
      intakeValidationComplete: false,
      shouldEmitIntakeComplete: false,
      failureClass: 'INTAKE_COMPLETION_NOT_DETECTED',
      reason: boundaryAudit.reason ?? 'Launch readiness artifact chain incomplete',
    };
  }

  const intakeValidationComplete =
    boundaryAudit.intakeValidationComplete || boundaryAudit.rule1Satisfied;
  const shouldEmitIntakeComplete =
    boundaryAudit.rule1Satisfied &&
    !boundaryAudit.intakeValidationCompleteEmitted &&
    boundaryAudit.intakeStageRunning;

  let failureClass: IntakeValidationStageTransitionFailureClass = 'NONE';
  let reason: string | null = null;

  if (shouldEmitIntakeComplete) {
    failureClass = 'INTAKE_COMPLETION_NOT_EMITTED';
    reason = 'Rule 1 satisfied — intake-validation-complete must emit';
  } else if (intakeValidationComplete && boundaryAudit.intakeStageRunning) {
    failureClass = 'INTAKE_PASS_NOT_PROPAGATED';
    reason = 'Intake validation complete but Stage 2 still RUNNING';
  }

  return {
    readOnly: true,
    intakeValidationComplete,
    shouldEmitIntakeComplete,
    failureClass,
    reason,
  };
}
