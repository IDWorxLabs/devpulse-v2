/**
 * Real file execution evidence collector (Phase 24D).
 */

import { MAX_REAL_FILE_EVIDENCE } from './real-file-workspace-execution-bounds.js';

export type RealFileEvidenceType =
  | 'WORKSPACE_PATH_VALIDATED'
  | 'FOLDER_CREATED'
  | 'FILE_CREATED'
  | 'FILE_MODIFIED'
  | 'FILE_APPENDED'
  | 'FILE_READ'
  | 'WRITE_BLOCKED'
  | 'PATH_BLOCKED';

export interface RealFileExecutionEvidenceRecord {
  evidenceId: string;
  operationId: string | null;
  workspaceId: string;
  relativePath: string | null;
  evidenceType: RealFileEvidenceType;
  timestamp: number;
  summary: string;
  source: string;
}

const evidenceRecords: RealFileExecutionEvidenceRecord[] = [];
let evidenceCounter = 0;

export function resetRealFileExecutionEvidenceForTests(): void {
  evidenceRecords.length = 0;
  evidenceCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `real-file-evidence-${evidenceCounter}`;
}

export function recordRealFileExecutionEvidence(input: {
  operationId?: string | null;
  workspaceId: string;
  relativePath?: string | null;
  evidenceType: RealFileEvidenceType;
  summary: string;
  source: string;
}): RealFileExecutionEvidenceRecord {
  const record: RealFileExecutionEvidenceRecord = {
    evidenceId: nextEvidenceId(),
    operationId: input.operationId ?? null,
    workspaceId: input.workspaceId,
    relativePath: input.relativePath ?? null,
    evidenceType: input.evidenceType,
    timestamp: Date.now(),
    summary: input.summary,
    source: input.source,
  };
  evidenceRecords.unshift(record);
  if (evidenceRecords.length > MAX_REAL_FILE_EVIDENCE) {
    evidenceRecords.length = MAX_REAL_FILE_EVIDENCE;
  }
  return record;
}

export function listRealFileExecutionEvidence(workspaceId?: string): RealFileExecutionEvidenceRecord[] {
  if (!workspaceId) return [...evidenceRecords];
  return evidenceRecords.filter((e) => e.workspaceId === workspaceId);
}

export function getRealFileExecutionEvidenceCount(workspaceId?: string): number {
  return listRealFileExecutionEvidence(workspaceId).length;
}
