/**
 * Real file operation executor — isolated workspace writes only (Phase 24D).
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  attachRealFileOperationResult,
  createRealFileOperation,
  isRealFileOperationAllowed,
  isRealFileOperationBlocked,
  type RealFileOperation,
  type RealFileOperationResult,
} from './real-file-operation-model.js';
import { recordRealFileExecutionEvidence } from './real-file-execution-evidence.js';
import {
  resolveSafeAbsolutePath,
  resolveSafeWorkspaceRoot,
} from './real-file-workspace-path-authority.js';

export interface ExecuteRealFileOperationInput {
  projectRootDir: string;
  workspaceId: string;
  sourceProject?: string;
  operation: RealFileOperation;
}

function evidenceFor(
  operation: RealFileOperation,
  evidenceType: Parameters<typeof recordRealFileExecutionEvidence>[0]['evidenceType'],
  summary: string,
): string {
  const record = recordRealFileExecutionEvidence({
    operationId: operation.operationId,
    workspaceId: operation.workspaceId,
    relativePath: operation.relativePath,
    evidenceType,
    summary,
    source: 'real-file-operation-executor',
  });
  return record.evidenceId;
}

function blockedResult(
  operation: RealFileOperation,
  summary: string,
  evidenceType: 'WRITE_BLOCKED' | 'PATH_BLOCKED',
): RealFileOperationResult {
  const evidenceIds = [evidenceFor(operation, evidenceType, summary)];
  return {
    success: false,
    summary,
    evidenceIds,
    blocked: true,
    blockReason: summary,
    bytesWritten: 0,
    bytesRead: 0,
  };
}

export function executeRealFileOperation(input: ExecuteRealFileOperationInput): RealFileOperation {
  const { projectRootDir, workspaceId, sourceProject, operation } = input;

  if (isRealFileOperationBlocked(operation.operationType)) {
    return attachRealFileOperationResult(
      operation,
      blockedResult(operation, `${operation.operationType} blocked in Phase 24D`, 'WRITE_BLOCKED'),
    );
  }

  if (!isRealFileOperationAllowed(operation.operationType)) {
    return attachRealFileOperationResult(
      operation,
      blockedResult(operation, `${operation.operationType} is not an approved Phase 24D operation`, 'WRITE_BLOCKED'),
    );
  }

  const pathVerdict = resolveSafeAbsolutePath(
    projectRootDir,
    workspaceId,
    operation.relativePath,
    sourceProject,
  );

  if (pathVerdict.result === 'REAL_FILE_WORKSPACE_PATH_FAIL' || !pathVerdict.normalizedRelativePath) {
    return attachRealFileOperationResult(
      operation,
      blockedResult(operation, pathVerdict.reason, 'PATH_BLOCKED'),
    );
  }

  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId, sourceProject);
  const evidenceIds = [
    recordRealFileExecutionEvidence({
      operationId: operation.operationId,
      workspaceId,
      relativePath: pathVerdict.normalizedRelativePath,
      evidenceType: 'WORKSPACE_PATH_VALIDATED',
      summary: pathVerdict.reason,
      source: 'real-file-workspace-path-authority',
    }).evidenceId,
  ];

  const absolutePath = resolve(rootVerdict.workspaceRoot, pathVerdict.normalizedRelativePath);
  const payload = operation.payload ?? '';
  let bytesWritten = 0;
  let bytesRead = 0;
  let summary = '';

  try {
    switch (operation.operationType) {
      case 'CREATE_FOLDER':
        mkdirSync(absolutePath, { recursive: true });
        summary = `Folder created: ${pathVerdict.normalizedRelativePath}`;
        evidenceIds.push(evidenceFor(operation, 'FOLDER_CREATED', summary));
        break;
      case 'CREATE_FILE':
        mkdirSync(dirname(absolutePath), { recursive: true });
        writeFileSync(absolutePath, payload, 'utf8');
        bytesWritten = Buffer.byteLength(payload, 'utf8');
        summary = `File created: ${pathVerdict.normalizedRelativePath}`;
        evidenceIds.push(evidenceFor(operation, 'FILE_CREATED', summary));
        break;
      case 'MODIFY_FILE':
        mkdirSync(dirname(absolutePath), { recursive: true });
        writeFileSync(absolutePath, payload, 'utf8');
        bytesWritten = Buffer.byteLength(payload, 'utf8');
        summary = `File modified: ${pathVerdict.normalizedRelativePath}`;
        evidenceIds.push(evidenceFor(operation, 'FILE_MODIFIED', summary));
        break;
      case 'APPEND_FILE':
        mkdirSync(dirname(absolutePath), { recursive: true });
        appendFileSync(absolutePath, payload, 'utf8');
        bytesWritten = Buffer.byteLength(payload, 'utf8');
        summary = `File appended: ${pathVerdict.normalizedRelativePath}`;
        evidenceIds.push(evidenceFor(operation, 'FILE_APPENDED', summary));
        break;
      case 'READ_FILE':
        if (!existsSync(absolutePath)) {
          return attachRealFileOperationResult(
            operation,
            blockedResult(operation, `File not found for read: ${pathVerdict.normalizedRelativePath}`, 'PATH_BLOCKED'),
          );
        }
        bytesRead = readFileSync(absolutePath).length;
        summary = `File read: ${pathVerdict.normalizedRelativePath} (${bytesRead} bytes)`;
        evidenceIds.push(evidenceFor(operation, 'FILE_READ', summary));
        break;
      default:
        return attachRealFileOperationResult(
          operation,
          blockedResult(operation, `Unhandled operation ${operation.operationType}`, 'WRITE_BLOCKED'),
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return attachRealFileOperationResult(
      operation,
      blockedResult(operation, `Real file operation failed: ${message}`, 'WRITE_BLOCKED'),
    );
  }

  return attachRealFileOperationResult(operation, {
    success: true,
    summary,
    evidenceIds,
    blocked: false,
    blockReason: null,
    bytesWritten,
    bytesRead,
  });
}

export function readRealFileInWorkspace(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  sourceProject?: string;
}): { ok: boolean; content: string; reason: string } {
  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'READ_FILE',
    requestedBy: 'real-file-operation-executor',
    sourceActionId: 'read-check',
  });
  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    sourceProject: input.sourceProject,
    operation,
  });
  if (!executed.result?.success) {
    return { ok: false, content: '', reason: executed.result?.summary ?? 'Read failed' };
  }
  const pathVerdict = resolveSafeAbsolutePath(
    input.projectRootDir,
    input.workspaceId,
    input.relativePath,
    input.sourceProject,
  );
  if (!pathVerdict.normalizedRelativePath) {
    return { ok: false, content: '', reason: pathVerdict.reason };
  }
  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, input.workspaceId, input.sourceProject);
  const absolutePath = join(rootVerdict.workspaceRoot, pathVerdict.normalizedRelativePath);
  return { ok: true, content: readFileSync(absolutePath, 'utf8'), reason: 'ok' };
}
