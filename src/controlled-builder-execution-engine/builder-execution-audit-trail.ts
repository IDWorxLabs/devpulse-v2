/**
 * Builder execution audit trail — bounded session activity log (Phase 24C).
 */

import { MAX_AUDIT_TRAIL_RECORDS } from './controlled-builder-execution-engine-bounds.js';

export type BuilderExecutionAuditEventType =
  | 'SESSION_CREATED'
  | 'SESSION_STARTED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED'
  | 'SESSION_COMPLETED'
  | 'SESSION_FAILED'
  | 'SESSION_CANCELLED'
  | 'ACTION_EXECUTED'
  | 'EVIDENCE_GENERATED'
  | 'ISOLATION_CHECK'
  | 'ACTION_BLOCKED';

export interface BuilderExecutionAuditEntry {
  auditId: string;
  sessionId: string;
  workspaceId: string;
  eventType: BuilderExecutionAuditEventType;
  detail: string;
  recordedAt: number;
}

const auditTrail: BuilderExecutionAuditEntry[] = [];
let auditCounter = 0;

export function resetBuilderExecutionAuditTrailForTests(): void {
  auditTrail.length = 0;
  auditCounter = 0;
}

function nextAuditId(): string {
  auditCounter += 1;
  return `builder-exec-audit-${auditCounter}`;
}

export function recordBuilderExecutionAudit(input: {
  sessionId: string;
  workspaceId: string;
  eventType: BuilderExecutionAuditEventType;
  detail: string;
}): BuilderExecutionAuditEntry {
  const entry: BuilderExecutionAuditEntry = {
    auditId: nextAuditId(),
    sessionId: input.sessionId,
    workspaceId: input.workspaceId,
    eventType: input.eventType,
    detail: input.detail,
    recordedAt: Date.now(),
  };
  auditTrail.unshift(entry);
  if (auditTrail.length > MAX_AUDIT_TRAIL_RECORDS) {
    auditTrail.length = MAX_AUDIT_TRAIL_RECORDS;
  }
  return entry;
}

export function getBuilderExecutionAuditTrail(sessionId?: string): BuilderExecutionAuditEntry[] {
  if (!sessionId) return [...auditTrail];
  return auditTrail.filter((e) => e.sessionId === sessionId);
}

export function getBuilderExecutionAuditCount(sessionId?: string): number {
  return getBuilderExecutionAuditTrail(sessionId).length;
}
