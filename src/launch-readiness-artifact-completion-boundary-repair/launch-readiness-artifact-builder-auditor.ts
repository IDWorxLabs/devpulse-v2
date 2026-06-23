/**
 * Phase 27.03 — Launch readiness artifact builder auditor (V1).
 */

import { hasIntakeValidationCompletionBoundaryInRegistry } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { LaunchReadinessArtifactBuilderAudit } from './launch-readiness-artifact-completion-boundary-repair-types.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
} from './launch-readiness-artifact-completion-boundary-repair-registry.js';

function hasTraceStatus(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  operationId: string,
  status: 'RUNNING' | 'PASSED' | 'FAILED',
): boolean {
  return traceEvents.some((event) => event.operationId === operationId && event.status === status);
}

function hasPassedTrace(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  operationId: string,
): boolean {
  if (hasIntakeValidationCompletionBoundaryInRegistry(operationId)) {
    return true;
  }
  return hasTraceStatus(traceEvents, operationId, 'PASSED');
}

export function auditLaunchReadinessArtifactBuilder(input: {
  traceEvents?: readonly FounderTestRuntimeTraceEvent[];
  launchReadinessReportMarkdown?: string | null;
  artifactPersisted?: boolean;
  activeArtifactSubstepOperationId?: string | null;
  activeArtifactSubstepLabel?: string | null;
} = {}): LaunchReadinessArtifactBuilderAudit {
  const traceEvents = input.traceEvents ?? [];
  const reportMarkdownStarted =
    hasTraceStatus(traceEvents, BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN, 'RUNNING') ||
    input.activeArtifactSubstepOperationId === BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN;
  const reportMarkdownFinished = hasPassedTrace(traceEvents, BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN);
  const reportMarkdownPresent =
    typeof input.launchReadinessReportMarkdown === 'string' &&
    input.launchReadinessReportMarkdown.trim().length > 0;
  const launchArtifactsCreated = reportMarkdownPresent || reportMarkdownFinished;
  const launchArtifactsPersisted = input.artifactPersisted === true || launchArtifactsCreated;
  const artifactsBuiltEmitted = hasPassedTrace(traceEvents, LAUNCH_READINESS_ARTIFACTS_BUILT);

  let stoppingReason: string | null = null;
  if (reportMarkdownStarted && !reportMarkdownFinished) {
    stoppingReason = 'Report markdown generation started but did not finish';
  } else if (reportMarkdownFinished && !launchArtifactsCreated) {
    stoppingReason = 'Report markdown finished but launch artifacts were not created';
  } else if (launchArtifactsCreated && !artifactsBuiltEmitted) {
    stoppingReason = 'Launch artifacts created but launch-readiness-artifacts-built not emitted';
  } else if (launchArtifactsCreated && !launchArtifactsPersisted) {
    stoppingReason = 'Launch artifacts created but not persisted';
  }

  return {
    readOnly: true,
    reportMarkdownStarted,
    reportMarkdownFinished,
    launchArtifactsCreated,
    launchArtifactsPersisted,
    artifactsBuiltEmitted,
    activeArtifactSubstepOperationId: input.activeArtifactSubstepOperationId ?? null,
    activeArtifactSubstepLabel: input.activeArtifactSubstepLabel ?? null,
    reportMarkdownPresent,
    stoppingReason,
  };
}
