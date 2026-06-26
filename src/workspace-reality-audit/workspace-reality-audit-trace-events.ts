/**
 * Workspace Reality Audit V1 — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { WorkspaceRealityAuditEvidence } from './workspace-reality-audit-types.js';

const TRACE_STAGES = [
  'Workspace reality audit started',
  'Source tree scanned',
  'Import graph checked',
  'Route graph checked',
  'Registry consistency checked',
  'Contract usage checked',
  'Asset reality checked',
  'Metadata consistency checked',
  'Export safety checked',
  'Workspace reality verdict issued',
] as const;

export function buildWorkspaceRealityAuditTraceEvents(
  evidence: WorkspaceRealityAuditEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.workspaceRealityRecordedAt) || Date.now();
  const failed = evidence.workspaceRealityAuditStatus === 'FAIL';
  const include = Boolean(evidence.workspaceRealityRecordedAt);

  return TRACE_STAGES.filter((_, index) => include || index === 0).map((title, index) => {
    const step = index + 1;
    return {
      eventId: `${buildId}-workspace-reality-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'workspace_reality_audit',
      severity: failed ? 'ERROR' : 'INFO',
      eventTitle: title,
      technicalDetail: `${evidence.workspaceRealityAuditScore}% — ${evidence.workspaceRealityAuditStatus}`,
      status: failed ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        workspaceRealityAudit: true,
        score: evidence.workspaceRealityAuditScore,
        status: evidence.workspaceRealityAuditStatus,
      },
      informationalOnly: true,
      section: 'Validation',
      action: title,
      detail: title,
      stepIndex: step,
      stepTotal: TRACE_STAGES.length,
    };
  });
}

export function workspaceRealityAuditTraceTitles(): string[] {
  return [...TRACE_STAGES];
}
