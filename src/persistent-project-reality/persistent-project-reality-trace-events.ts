/**
 * Persistent Project Reality V1 — execution trace runtime evidence events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { PersistentProjectRealityEvidence } from './persistent-project-reality-types.js';

const TRACE_STAGES = [
  { title: 'Persistent project resolution started', when: () => true },
  {
    title: 'Project record created/resolved',
    when: (e: PersistentProjectRealityEvidence) => Boolean(e.projectRecordPath),
  },
  {
    title: 'Source promotion started',
    when: (e: PersistentProjectRealityEvidence) => e.promotionStatus !== 'SKIPPED',
  },
  {
    title: 'Source files copied to persistent workspace',
    when: (e: PersistentProjectRealityEvidence) => e.promotionStatus === 'PASS',
  },
  {
    title: 'Project metadata written',
    when: (e: PersistentProjectRealityEvidence) => Boolean(e.persistentProjectWorkspacePath),
  },
  {
    title: 'Project file index written',
    when: (e: PersistentProjectRealityEvidence) => Boolean(e.projectFileIndexPath),
  },
  {
    title: 'Export metadata written',
    when: (e: PersistentProjectRealityEvidence) => Boolean(e.exportMetadataPath),
  },
  {
    title: 'Build history linked',
    when: (e: PersistentProjectRealityEvidence) => e.promotionStatus === 'PASS',
  },
  {
    title: 'Project registry updated',
    when: (e: PersistentProjectRealityEvidence) => e.persistentProjectRealityStatus === 'PASS',
  },
  {
    title: 'Persistent project reality verified',
    when: (e: PersistentProjectRealityEvidence) => e.persistentProjectRealityStatus === 'PASS',
  },
] as const;

export function buildPersistentProjectRealityTraceEvents(
  evidence: PersistentProjectRealityEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.recordedAt) || Date.now();
  let step = 0;

  return TRACE_STAGES.filter((stage) => stage.when(evidence)).map((stage) => {
    step += 1;
    const failed = evidence.persistentProjectRealityStatus === 'FAIL';
    return {
      eventId: `${buildId}-project-reality-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'persistent_project_reality',
      severity: failed ? 'ERROR' : 'INFO',
      eventTitle: stage.title,
      technicalDetail:
        failed && evidence.promotionFailureReasons.length > 0
          ? evidence.promotionFailureReasons.join('; ').slice(0, 240)
          : `${evidence.persistentProjectWorkspacePath} → ${evidence.persistentProjectSourceRoot}`,
      status: failed ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        persistentProjectReality: true,
        projectId: evidence.persistentProjectId,
        promotionStatus: evidence.promotionStatus,
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

export function persistentProjectRealityTraceTitles(): string[] {
  return TRACE_STAGES.map((stage) => stage.title);
}
