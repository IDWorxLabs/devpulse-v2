/**
 * Builder execution evidence collector — mandatory automatic evidence (Phase 24C).
 */

import { MAX_SESSION_EVIDENCE } from './controlled-builder-execution-engine-bounds.js';

export type ControlledExecutionEvidenceType =
  | 'SESSION_CREATED'
  | 'ACTION_STARTED'
  | 'ACTION_COMPLETED'
  | 'FILE_CREATED'
  | 'FILE_MODIFIED'
  | 'OUTPUT_GENERATED'
  | 'SESSION_COMPLETED'
  | 'SESSION_FAILED';

export interface ControlledExecutionEvidenceRecord {
  evidenceId: string;
  sessionId: string;
  workspaceId: string;
  actionId: string | null;
  evidenceType: ControlledExecutionEvidenceType;
  description: string;
  source: string;
  recordedAt: number;
}

const evidenceRecords: ControlledExecutionEvidenceRecord[] = [];
let evidenceCounter = 0;

export function resetControlledExecutionEvidenceForTests(): void {
  evidenceRecords.length = 0;
  evidenceCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `controlled-exec-evidence-${evidenceCounter}`;
}

export function collectControlledExecutionEvidence(input: {
  sessionId: string;
  workspaceId: string;
  actionId?: string | null;
  evidenceType: ControlledExecutionEvidenceType;
  description: string;
  source: string;
}): ControlledExecutionEvidenceRecord {
  const record: ControlledExecutionEvidenceRecord = {
    evidenceId: nextEvidenceId(),
    sessionId: input.sessionId,
    workspaceId: input.workspaceId,
    actionId: input.actionId ?? null,
    evidenceType: input.evidenceType,
    description: input.description,
    source: input.source,
    recordedAt: Date.now(),
  };
  evidenceRecords.unshift(record);
  if (evidenceRecords.length > MAX_SESSION_EVIDENCE) {
    evidenceRecords.length = MAX_SESSION_EVIDENCE;
  }
  return record;
}

export function listControlledExecutionEvidence(sessionId?: string): ControlledExecutionEvidenceRecord[] {
  if (!sessionId) return [...evidenceRecords];
  return evidenceRecords.filter((e) => e.sessionId === sessionId);
}

export function getControlledExecutionEvidenceCount(sessionId?: string): number {
  return listControlledExecutionEvidence(sessionId).length;
}

export function actionCompletionRequiresEvidence(success: boolean, evidenceIds: string[]): void {
  if (success && evidenceIds.length === 0) {
    throw new Error('No successful execution without evidence');
  }
}
