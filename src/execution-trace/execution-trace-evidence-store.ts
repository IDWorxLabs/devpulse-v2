/**
 * Evidence store — Execution Trace → structured facts for Chat LLM consumption.
 */

import type {
  ExecutionTraceEvent,
  ExecutionTraceEvidenceBundle,
  ExecutionTraceEvidenceSummary,
} from './execution-trace-types.js';

function buildSummary(events: ExecutionTraceEvent[]): ExecutionTraceEvidenceSummary {
  const artifacts = new Set<string>();
  const completedStages = new Set<string>();
  let previewUrl: string | null = null;
  let buildStatus: string | null = null;

  for (const event of events) {
    if (event.status === 'Completed' || event.status === 'PASS') {
      completedStages.add(event.runtimeStage);
    }
    if (event.artifactLinks) {
      for (const link of event.artifactLinks) artifacts.add(link);
    }
    if (event.metadata?.previewUrl && typeof event.metadata.previewUrl === 'string') {
      previewUrl = event.metadata.previewUrl;
    }
    if (event.metadata?.buildStatus && typeof event.metadata.buildStatus === 'string') {
      buildStatus = event.metadata.buildStatus;
    }
    if (event.evidence?.startsWith('http')) {
      previewUrl = event.evidence;
    }
  }

  return {
    eventCount: events.length,
    errorCount: events.filter((e) => e.severity === 'ERROR').length,
    warningCount: events.filter((e) => e.severity === 'WARN').length,
    completedStages: [...completedStages],
    artifacts: [...artifacts],
    previewUrl,
    buildStatus,
  };
}

export function createExecutionTraceEvidenceBundle(input: {
  events: ExecutionTraceEvent[];
  buildRunId?: string;
  projectId?: string | null;
}): ExecutionTraceEvidenceBundle {
  const sorted = [...input.events].sort((a, b) => a.timestamp - b.timestamp);
  return {
    readOnly: true,
    source: 'runtime',
    buildRunId: input.buildRunId,
    projectId: input.projectId,
    events: sorted,
    summary: buildSummary(sorted),
  };
}

/** Compact evidence for LLM prompts — no conversational language. */
export function executionTraceEvidenceForLlm(
  bundle: ExecutionTraceEvidenceBundle,
): Record<string, unknown> {
  return {
    readOnly: true,
    source: 'execution_trace',
    buildRunId: bundle.buildRunId ?? null,
    projectId: bundle.projectId ?? null,
    summary: bundle.summary,
    milestones: bundle.events
      .filter((e) => e.severity !== 'DEBUG')
      .map((e) => ({
        timestamp: e.timestamp,
        stage: e.runtimeStage,
        title: e.eventTitle,
        detail: e.technicalDetail,
        status: e.status ?? null,
        severity: e.severity,
        artifacts: e.artifactLinks ?? [],
        metadata: e.metadata ?? {},
      })),
  };
}
