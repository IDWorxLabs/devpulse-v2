/**
 * Phase 26.98 — Launch artifact transition analyzer (V1).
 */

import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import { resolveMissingIntakeCompletionBoundary } from '../founder-test-runtime-monitor/stage2-completion-tracker.js';
import type { LaunchArtifactTransitionAnalysis } from './launch-readiness-artifact-completion-barrier-repair-types.js';
import type {
  LaunchArtifactStepAudit,
  ProductReadinessBudgetResultDetection,
} from './launch-readiness-artifact-completion-barrier-repair-types.js';
import type { LaunchReadinessCompletionDetection } from './launch-readiness-artifact-completion-barrier-repair-types.js';

export function analyzeIntakePassWithWarningsEligibility(input: {
  executionProofLoaded?: boolean;
  founderSummaryLoaded?: boolean;
  readinessAuthoritiesLoaded?: boolean;
  productReadinessDegraded?: boolean;
  launchReadinessReportMarkdownPresent?: boolean;
}): boolean {
  return (
    input.executionProofLoaded !== false &&
    input.founderSummaryLoaded !== false &&
    input.readinessAuthoritiesLoaded !== false &&
    input.productReadinessDegraded === true &&
    input.launchReadinessReportMarkdownPresent === true
  );
}

export function analyzeLaunchArtifactTransition(input: {
  runtimeSnapshot?: {
    state?: string;
    stages?: readonly { stageId: string; status: string }[];
    traceEvents?: readonly { operationId: string; status: string }[];
    activeArtifactBuildSubstep?: string | null;
  } | null;
  stepAudit: LaunchArtifactStepAudit;
  budgetResultDetection: ProductReadinessBudgetResultDetection;
  completionDetection: LaunchReadinessCompletionDetection;
}): LaunchArtifactTransitionAnalysis {
  const intakeStage = input.runtimeSnapshot?.stages?.find(
    (stage) => stage.stageId === 'INTAKE_VALIDATION',
  );
  const intakeValidationRunning = intakeStage?.status === 'RUNNING';
  const traceEvents = (input.runtimeSnapshot?.traceEvents ?? []) as readonly Pick<
    FounderTestRuntimeTraceEvent,
    'operationId' | 'status'
  >[];
  const missingCompletionBoundary = resolveMissingIntakeCompletionBoundary(
    traceEvents as readonly FounderTestRuntimeTraceEvent[],
  );
  const activeArtifactSubstepLabel =
    input.stepAudit.activeArtifactSubstep?.operationLabel ??
    input.runtimeSnapshot?.activeArtifactBuildSubstep ??
    null;

  const executionProofLoaded = traceEvents.some(
    (event) => event.operationId === 'loading-autonomous-build-proof' && event.status === 'PASSED',
  );
  const founderSummaryLoaded = traceEvents.some(
    (event) => event.operationId === 'loading-founder-summary' && event.status === 'PASSED',
  );
  const readinessAuthoritiesLoaded = traceEvents.some(
    (event) =>
      event.operationId === 'loading-readiness-authorities' && event.status === 'PASSED',
  );

  const intakePassWithWarningsEligible = analyzeIntakePassWithWarningsEligibility({
    executionProofLoaded,
    founderSummaryLoaded,
    readinessAuthoritiesLoaded,
    productReadinessDegraded: input.budgetResultDetection.simulationDegradedPartial,
    launchReadinessReportMarkdownPresent: input.completionDetection.launchReadinessReportMarkdownPresent,
  });

  let failureClass: LaunchArtifactTransitionAnalysis['failureClass'] = 'NONE';
  let reason: string | null = null;
  let stageAdvancementBlocked = false;

  if (input.stepAudit.chatSettledButArtifactActive) {
    failureClass = 'CHAT_SETTLED_BUT_ARTIFACT_ACTIVE';
    stageAdvancementBlocked = true;
    reason = input.stepAudit.reason;
  } else if (
    input.budgetResultDetection.budgetExceeded &&
    !input.completionDetection.launchReadinessAssessmentCompleteEmitted &&
    !input.completionDetection.launchReadinessAssessmentCompleteWithWarningsEmitted
  ) {
    failureClass = 'INTAKE_COMPLETION_BLOCKED_BY_DEGRADED_RESULT';
    stageAdvancementBlocked = true;
    reason = 'Budget exceeded blocked launch readiness completion emission';
  } else if (activeArtifactSubstepLabel != null && input.stepAudit.rule1Satisfied) {
    failureClass = 'ARTIFACT_SUBSTEP_NOT_CLEARED';
    stageAdvancementBlocked = true;
    reason = `Active artifact sub-step not cleared: ${activeArtifactSubstepLabel}`;
  } else if (
    intakePassWithWarningsEligible &&
    missingCompletionBoundary === 'Launch readiness assessment complete'
  ) {
    failureClass = 'DEGRADED_RESULT_NOT_PROPAGATED';
    stageAdvancementBlocked = true;
    reason = 'Degraded evidence present but launch readiness completion boundary missing';
  }

  return {
    readOnly: true,
    intakeValidationRunning,
    intakePassWithWarningsEligible,
    missingCompletionBoundary,
    activeArtifactSubstepLabel,
    stageAdvancementBlocked,
    failureClass,
    reason,
  };
}
