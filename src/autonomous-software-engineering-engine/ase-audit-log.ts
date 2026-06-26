/**
 * ASE — audit log.
 */

import type { AseAuditEntry, AseRouteTarget, AseStageId } from './ase-types.js';

let auditCounter = 0;
const auditLog: AseAuditEntry[] = [];

export function resetAseAuditLogForTests(): void {
  auditCounter = 0;
  auditLog.length = 0;
}

export function recordAseAuditDecision(input: {
  stage: AseStageId;
  inputEvidence: readonly string[];
  decision: string;
  reason: string;
  confidence: number;
  blockers?: readonly string[];
  nextRoute?: AseRouteTarget | null;
}): AseAuditEntry {
  auditCounter += 1;
  const entry: AseAuditEntry = {
    readOnly: true,
    decisionId: `ase-audit-${auditCounter}`,
    stage: input.stage,
    inputEvidence: input.inputEvidence,
    decision: input.decision,
    reason: input.reason,
    confidence: input.confidence,
    blockers: input.blockers ?? [],
    nextRoute: input.nextRoute ?? null,
    timestamp: Date.now(),
  };
  auditLog.push(entry);
  return entry;
}

export function getAseAuditLog(): readonly AseAuditEntry[] {
  return auditLog;
}

export function mergeAseAuditLog(preserved: readonly AseAuditEntry[]): void {
  for (const entry of preserved) {
    auditLog.push(entry);
  }
}
