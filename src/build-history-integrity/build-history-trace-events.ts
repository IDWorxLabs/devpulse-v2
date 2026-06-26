/**
 * Build History Integrity V1 — execution trace runtime evidence events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { BuildHistoryIntegrityEvidence } from './build-history-types.js';

const TRACE_STAGES = [
  { title: 'Build history recording started', when: () => true },
  { title: 'Build record written', when: (e: BuildHistoryIntegrityEvidence) => e.buildHistoryRecorded },
  { title: 'Manifest snapshot written', when: (e: BuildHistoryIntegrityEvidence) => e.buildHistoryRecorded },
  {
    title: 'Production validation snapshot written',
    when: (e: BuildHistoryIntegrityEvidence) => e.productionValidationSnapshotRecorded,
  },
  { title: 'Replay metadata written', when: (e: BuildHistoryIntegrityEvidence) => Boolean(e.replayMetadataPath) },
  { title: 'Audit timeline written', when: (e: BuildHistoryIntegrityEvidence) => Boolean(e.auditTimelinePath) },
  {
    title: 'Build history integrity verified',
    when: (e: BuildHistoryIntegrityEvidence) => e.buildHistoryIntegrityStatus === 'PASS',
  },
  {
    title: 'Build history recording completed',
    when: (e: BuildHistoryIntegrityEvidence) => e.buildHistoryRecorded,
  },
  {
    title: 'Build history recording failed',
    when: (e: BuildHistoryIntegrityEvidence) => e.buildHistoryIntegrityStatus === 'FAIL',
  },
] as const;

export function buildBuildHistoryTraceEvents(
  evidence: BuildHistoryIntegrityEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.recordedAt) || Date.now();
  let step = 0;

  return TRACE_STAGES.filter((stage) => stage.when(evidence)).map((stage) => {
    step += 1;
    const failed = evidence.buildHistoryIntegrityStatus === 'FAIL';
    return {
      eventId: `${buildId}-history-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'build_history_integrity',
      severity: stage.title.includes('failed') ? 'ERROR' : 'INFO',
      eventTitle: stage.title,
      technicalDetail:
        failed && stage.title.includes('failed')
          ? evidence.buildHistoryFailureReasons.join('; ').slice(0, 240)
          : `${evidence.buildHistoryRecordPath} — hash ${evidence.buildHistoryRecordHash.slice(0, 12)}…`,
      status: stage.title.includes('failed') ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        buildHistory: true,
        runId: evidence.buildHistoryRunId,
        immutable: evidence.buildHistoryImmutable,
      },
      informationalOnly: true,
      section: 'Validation',
      action: stage.title,
      detail: stage.title,
      stepIndex: step,
      stepTotal: TRACE_STAGES.length,
    };
  });
}

export function buildHistoryTraceTitles(): string[] {
  return TRACE_STAGES.map((stage) => stage.title);
}
