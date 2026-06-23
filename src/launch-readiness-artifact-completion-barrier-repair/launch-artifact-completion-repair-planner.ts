/**
 * Phase 26.98 — Launch artifact completion repair planner (V1).
 */

import type {
  LaunchArtifactCompletionRepairPlan,
  LaunchArtifactStepAudit,
  LaunchArtifactTransitionAnalysis,
  LaunchReadinessCompletionDetection,
  ProductReadinessBudgetResultDetection,
} from './launch-readiness-artifact-completion-barrier-repair-types.js';
import {
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
} from './launch-readiness-artifact-completion-barrier-repair-registry.js';

export function planLaunchArtifactCompletionRepair(input: {
  stepAudit: LaunchArtifactStepAudit;
  budgetResultDetection: ProductReadinessBudgetResultDetection;
  completionDetection: LaunchReadinessCompletionDetection;
  transitionAnalysis: LaunchArtifactTransitionAnalysis;
}): LaunchArtifactCompletionRepairPlan {
  const actions: string[] = [];
  const { stepAudit, budgetResultDetection, completionDetection, transitionAnalysis } = input;

  if (!stepAudit.rule1Satisfied) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['await-chat-stress-settlement'],
      failureClass: 'NONE',
      clearChatStressArtifactSubstep: false,
      forceProductReadinessCompletion: false,
      emitLaunchReadinessAssessmentComplete: false,
      emitLaunchReadinessAssessmentCompleteWithWarnings: false,
      writeDegradedDiagnosticMarkdown: false,
      recordIntakePassWithWarnings: false,
      reason: stepAudit.reason,
    };
  }

  const clearChatStressArtifactSubstep = stepAudit.chatSettledButArtifactActive;
  if (clearChatStressArtifactSubstep) {
    actions.push('clear-chat-stress-artifact-substep');
  }

  const forceProductReadinessCompletion =
    budgetResultDetection.budgetResultDropped ||
    (budgetResultDetection.budgetExceeded && !budgetResultDetection.productReadinessCompletePropagated);
  if (forceProductReadinessCompletion) {
    actions.push('force-product-readiness-completion-tail');
  }

  const emitWithWarnings =
    budgetResultDetection.simulationDegradedPartial || transitionAnalysis.intakePassWithWarningsEligible;
  const emitLaunchReadinessAssessmentComplete =
    !completionDetection.launchReadinessAssessmentCompleteEmitted &&
    !completionDetection.launchReadinessAssessmentCompleteWithWarningsEmitted &&
    !emitWithWarnings;
  const emitLaunchReadinessAssessmentCompleteWithWarnings =
    !completionDetection.launchReadinessAssessmentCompleteEmitted &&
    !completionDetection.launchReadinessAssessmentCompleteWithWarningsEmitted &&
    emitWithWarnings;

  if (emitLaunchReadinessAssessmentComplete) {
    actions.push(`emit-${LAUNCH_READINESS_ASSESSMENT_COMPLETE}`);
  }
  if (emitLaunchReadinessAssessmentCompleteWithWarnings) {
    actions.push(`emit-${LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS}`);
  }

  const writeDegradedDiagnosticMarkdown =
    emitWithWarnings && !completionDetection.launchReadinessReportMarkdownPresent;
  if (writeDegradedDiagnosticMarkdown) {
    actions.push('write-degraded-launch-readiness-markdown');
  }

  const recordIntakePassWithWarnings = transitionAnalysis.intakePassWithWarningsEligible;
  if (recordIntakePassWithWarnings) {
    actions.push('record-intake-pass-with-warnings');
  }

  const repairRequired =
    clearChatStressArtifactSubstep ||
    forceProductReadinessCompletion ||
    emitLaunchReadinessAssessmentComplete ||
    emitLaunchReadinessAssessmentCompleteWithWarnings ||
    writeDegradedDiagnosticMarkdown ||
    transitionAnalysis.stageAdvancementBlocked;

  const failureClass =
    stepAudit.chatSettledButArtifactActive
      ? 'CHAT_SETTLED_BUT_ARTIFACT_ACTIVE'
      : budgetResultDetection.failureClass !== 'NONE'
        ? budgetResultDetection.failureClass
        : completionDetection.failureClass !== 'NONE'
          ? completionDetection.failureClass
          : transitionAnalysis.failureClass;

  return {
    readOnly: true,
    repairRequired,
    actions,
    failureClass,
    clearChatStressArtifactSubstep,
    forceProductReadinessCompletion,
    emitLaunchReadinessAssessmentComplete,
    emitLaunchReadinessAssessmentCompleteWithWarnings,
    writeDegradedDiagnosticMarkdown,
    recordIntakePassWithWarnings,
    reason:
      transitionAnalysis.reason ??
      completionDetection.reason ??
      budgetResultDetection.reason ??
      stepAudit.reason,
  };
}

export function buildDegradedLaunchReadinessDiagnosticMarkdown(input: {
  simulationRuntimeHealth?: string | null;
  chatStressStarted?: number;
  chatStressSettled?: number;
  chatStressPending?: number;
  detail?: string | null;
}): string {
  const lines = [
    '# Launch Readiness Diagnostic Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Runtime health: ${input.simulationRuntimeHealth ?? 'SIMULATION_BUDGET_EXCEEDED'}`,
    '',
    '## Chat stress settlement',
    '',
    `- Started: ${input.chatStressStarted ?? 0}`,
    `- Settled: ${input.chatStressSettled ?? 0}`,
    `- Pending: ${input.chatStressPending ?? 0}`,
    '',
    '## Note',
    '',
    'Product readiness completed with degraded evidence after SIMULATION_BUDGET_EXCEEDED.',
    'Budget exceeded is not a runtime stall — launch readiness assessment completed with warnings.',
  ];
  if (input.detail) {
    lines.push('', '## Detail', '', input.detail);
  }
  return lines.join('\n');
}
