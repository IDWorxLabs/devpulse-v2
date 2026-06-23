/**
 * Phase 26.98 — Launch readiness completion detector (V1).
 */

import { hasIntakeValidationCompletionBoundaryInRegistry } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { LaunchReadinessCompletionDetection } from './launch-readiness-artifact-completion-barrier-repair-types.js';
import {
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
} from './launch-readiness-artifact-completion-barrier-repair-registry.js';

let launchReadinessAssessmentCompleteEmitted = false;
let launchReadinessAssessmentCompleteWithWarningsEmitted = false;

export function resetLaunchReadinessCompletionDetectionForTests(): void {
  launchReadinessAssessmentCompleteEmitted = false;
  launchReadinessAssessmentCompleteWithWarningsEmitted = false;
}

export function markLaunchReadinessAssessmentCompleteEmitted(withWarnings = false): void {
  if (withWarnings) {
    launchReadinessAssessmentCompleteWithWarningsEmitted = true;
  } else {
    launchReadinessAssessmentCompleteEmitted = true;
  }
}

export function hasLaunchReadinessAssessmentCompleteEmitted(): boolean {
  return (
    launchReadinessAssessmentCompleteEmitted ||
    launchReadinessAssessmentCompleteWithWarningsEmitted ||
    hasIntakeValidationCompletionBoundaryInRegistry(LAUNCH_READINESS_ASSESSMENT_COMPLETE) ||
    hasIntakeValidationCompletionBoundaryInRegistry(LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS)
  );
}

function hasPassedTrace(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  operationId: string,
): boolean {
  if (hasIntakeValidationCompletionBoundaryInRegistry(operationId)) {
    return true;
  }
  return traceEvents.some((event) => event.operationId === operationId && event.status === 'PASSED');
}

export function detectLaunchReadinessCompletion(input: {
  traceEvents?: readonly FounderTestRuntimeTraceEvent[];
  launchReadinessReportMarkdown?: string | null;
} = {}): LaunchReadinessCompletionDetection {
  const traceEvents = input.traceEvents ?? [];
  const assessmentCompleteEmitted =
    hasPassedTrace(traceEvents, LAUNCH_READINESS_ASSESSMENT_COMPLETE) ||
    launchReadinessAssessmentCompleteEmitted;
  const assessmentCompleteWithWarningsEmitted =
    hasPassedTrace(traceEvents, LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS) ||
    launchReadinessAssessmentCompleteWithWarningsEmitted;
  const launchReadinessArtifactsBuiltEmitted = hasPassedTrace(
    traceEvents,
    'launch-readiness-artifacts-built',
  );
  const launchReadinessReportMarkdownPresent =
    typeof input.launchReadinessReportMarkdown === 'string' &&
    input.launchReadinessReportMarkdown.trim().length > 0;

  let failureClass: LaunchReadinessCompletionDetection['failureClass'] = 'NONE';
  let reason: string | null = null;

  if (
    !assessmentCompleteEmitted &&
    !assessmentCompleteWithWarningsEmitted
  ) {
    failureClass = 'LAUNCH_READINESS_COMPLETION_NOT_EMITTED';
    reason = 'Launch readiness assessment complete boundary not emitted';
  } else if (
    assessmentCompleteWithWarningsEmitted &&
    !launchReadinessReportMarkdownPresent
  ) {
    failureClass = 'DIAGNOSTIC_ARTIFACT_NOT_STORED';
    reason = 'Degraded launch readiness completion emitted without report markdown';
  }

  return {
    readOnly: true,
    launchReadinessAssessmentCompleteEmitted: assessmentCompleteEmitted,
    launchReadinessAssessmentCompleteWithWarningsEmitted: assessmentCompleteWithWarningsEmitted,
    launchReadinessArtifactsBuiltEmitted,
    launchReadinessReportMarkdownPresent,
    failureClass,
    reason,
  };
}
