/**
 * Phase 27.03 — Launch readiness assessment auditor (V1).
 */

import { hasIntakeValidationCompletionBoundaryInRegistry } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { LaunchReadinessAssessmentAudit } from './launch-readiness-artifact-completion-boundary-repair-types.js';
import {
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
} from './launch-readiness-artifact-completion-boundary-repair-registry.js';

function hasPassedTrace(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  operationId: string,
): boolean {
  if (hasIntakeValidationCompletionBoundaryInRegistry(operationId)) {
    return true;
  }
  return traceEvents.some((event) => event.operationId === operationId && event.status === 'PASSED');
}

export function auditLaunchReadinessAssessment(input: {
  traceEvents?: readonly FounderTestRuntimeTraceEvent[];
} = {}): LaunchReadinessAssessmentAudit {
  const traceEvents = input.traceEvents ?? [];
  const assessmentPassed = hasPassedTrace(traceEvents, LAUNCH_READINESS_ASSESSMENT_COMPLETE);
  const assessmentWithWarnings = hasPassedTrace(
    traceEvents,
    LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
  );
  const assessmentFinished = assessmentPassed || assessmentWithWarnings;

  return {
    readOnly: true,
    assessmentFinished,
    assessmentPassed,
    assessmentWithWarnings,
    stoppingReason: assessmentFinished
      ? null
      : 'Launch readiness assessment complete boundary not satisfied',
  };
}
