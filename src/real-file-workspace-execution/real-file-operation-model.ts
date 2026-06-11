/**
 * Real file operation model (Phase 24D).
 */

import {
  PHASE_24D_ALLOWED_OPERATIONS,
  PHASE_24D_BLOCKED_OPERATIONS,
} from './real-file-workspace-execution-bounds.js';

export type RealFileOperationType = (typeof PHASE_24D_ALLOWED_OPERATIONS)[number];
export type RealFileBlockedOperationType = (typeof PHASE_24D_BLOCKED_OPERATIONS)[number];

export interface RealFileOperationResult {
  success: boolean;
  summary: string;
  evidenceIds: string[];
  blocked: boolean;
  blockReason: string | null;
  bytesWritten: number;
  bytesRead: number;
}

export interface RealFileOperation {
  operationId: string;
  workspaceId: string;
  relativePath: string;
  operationType: RealFileOperationType | RealFileBlockedOperationType;
  requestedBy: string;
  sourceActionId: string;
  evidenceRequired: true;
  payload?: string;
  result: RealFileOperationResult | null;
  createdAt: number;
  updatedAt: number;
}

let operationCounter = 0;

export function resetRealFileOperationCounterForTests(): void {
  operationCounter = 0;
}

export function nextRealFileOperationId(): string {
  operationCounter += 1;
  return `real-file-op-${operationCounter}`;
}

export function isRealFileOperationAllowed(
  operationType: string,
): operationType is RealFileOperationType {
  return (PHASE_24D_ALLOWED_OPERATIONS as readonly string[]).includes(operationType);
}

export function isRealFileOperationBlocked(operationType: string): boolean {
  return (PHASE_24D_BLOCKED_OPERATIONS as readonly string[]).includes(operationType);
}

export function createRealFileOperation(input: {
  workspaceId: string;
  relativePath: string;
  operationType: RealFileOperationType | RealFileBlockedOperationType;
  requestedBy: string;
  sourceActionId: string;
  payload?: string;
}): RealFileOperation {
  const now = Date.now();
  return {
    operationId: nextRealFileOperationId(),
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: input.operationType,
    requestedBy: input.requestedBy,
    sourceActionId: input.sourceActionId,
    evidenceRequired: true,
    payload: input.payload,
    result: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function attachRealFileOperationResult(
  operation: RealFileOperation,
  result: RealFileOperationResult,
): RealFileOperation {
  if (result.success && result.evidenceIds.length === 0) {
    throw new Error('No successful real file operation without evidence');
  }
  return {
    ...operation,
    result,
    updatedAt: Date.now(),
  };
}
