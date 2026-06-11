/**
 * Real file workspace execution authority (Phase 24D).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuilderAction } from '../autonomous-builder-execution-foundation/index.js';
import { getBuilderExecutionWorkspace } from '../autonomous-builder-execution-foundation/index.js';
import {
  mapControlledActionToRealFileOperation,
} from './controlled-to-real-file-execution-bridge.js';
import {
  REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE,
  REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN,
} from './real-file-workspace-execution-bounds.js';
import { executeRealFileOperation } from './real-file-operation-executor.js';
import {
  getRealFileExecutionEvidenceCount,
  listRealFileExecutionEvidence,
  recordRealFileExecutionEvidence,
  resetRealFileExecutionEvidenceForTests,
} from './real-file-execution-evidence.js';
import {
  createRealFileOperation,
  resetRealFileOperationCounterForTests,
} from './real-file-operation-model.js';
import {
  getRealFileWorkspaceExecutionSummary,
  type RealFileWorkspaceExecutionSummary,
} from './real-file-workspace-execution-proof-integration.js';
import {
  createRealFileWorkspaceExecutionSession,
  getRealFileWorkspaceExecutionSessionCount,
  listRealFileWorkspaceExecutionSessions,
  resetRealFileWorkspaceExecutionSessionsForTests,
  updateRealFileWorkspaceExecutionSession,
} from './real-file-workspace-execution-session.js';
import { resolveSafeWorkspaceRoot } from './real-file-workspace-path-authority.js';

export {
  REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN,
  REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE,
};

export interface RealFileWorkspaceExecutionAssessment {
  summary: RealFileWorkspaceExecutionSummary;
  sessionCount: number;
  evidenceCount: number;
  realFileExecutionActive: boolean;
  assessedAt: number;
}

export function resetRealFileWorkspaceExecutionForTests(): void {
  resetRealFileWorkspaceExecutionSessionsForTests();
  resetRealFileExecutionEvidenceForTests();
  resetRealFileOperationCounterForTests();
}

export interface RunRealFileWorkspaceExecutionInput {
  projectRootDir: string;
  workspaceId: string;
  projectId: string;
  sourceProject?: string;
  actions?: BuilderAction[];
}

export function runRealFileWorkspaceExecution(
  input: RunRealFileWorkspaceExecutionInput,
): RealFileWorkspaceExecutionAssessment {
  const workspace = getBuilderExecutionWorkspace(input.workspaceId);
  const sourceProject = input.sourceProject ?? workspace?.sourceProject ?? 'World 2 isolated target app';

  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, input.workspaceId, sourceProject);
  if (rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_FAIL') {
    recordRealFileExecutionEvidence({
      workspaceId: input.workspaceId,
      evidenceType: 'PATH_BLOCKED',
      summary: rootVerdict.reason,
      source: 'real-file-workspace-path-authority',
    });
    return assessRealFileWorkspaceExecution();
  }

  const session = createRealFileWorkspaceExecutionSession({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    workspaceRoot: rootVerdict.workspaceRoot,
    initialState: 'READY',
  });

  updateRealFileWorkspaceExecutionSession(session.sessionId, {
    state: 'RUNNING',
    startedAt: Date.now(),
  });

  const defaultActions: BuilderAction[] = input.actions ?? [];
  const operations =
    defaultActions.length > 0
      ? defaultActions
          .map((action) => mapControlledActionToRealFileOperation(action))
          .filter((op): op is NonNullable<typeof op> => op !== null)
      : [
          mapControlledActionToRealFileOperation({
            actionId: 'bridge-folder',
            workspaceId: input.workspaceId,
            actionType: 'CREATE_FOLDER',
            requestedBy: 'real-file-workspace-execution-authority',
            sourceRequirement: 'session-setup',
            targetPath: 'src/generated',
            payloadSummary: 'Create output folder',
            status: 'QUEUED',
            evidenceProduced: [],
            executionResult: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })!,
          mapControlledActionToRealFileOperation({
            actionId: 'bridge-screen',
            workspaceId: input.workspaceId,
            actionType: 'GENERATE_SCREEN',
            requestedBy: 'real-file-workspace-execution-authority',
            sourceRequirement: 'session-setup',
            targetPath: 'src/screens/AppScreen.tsx',
            payloadSummary: 'Generate screen file',
            status: 'QUEUED',
            evidenceProduced: [],
            executionResult: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })!,
        ];

  let completed = 0;
  let blocked = 0;

  for (const operation of operations.slice(0, 12)) {
    const executed = executeRealFileOperation({
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      sourceProject,
      operation,
    });
    if (executed.result?.blocked) blocked += 1;
    else if (executed.result?.success) completed += 1;
    else blocked += 1;
  }

  const evidenceCount = getRealFileExecutionEvidenceCount(input.workspaceId);
  const finalState = completed > 0 && blocked === 0 ? 'COMPLETED' : completed > 0 ? 'COMPLETED' : blocked > 0 ? 'BLOCKED' : 'FAILED';

  updateRealFileWorkspaceExecutionSession(session.sessionId, {
    state: finalState,
    operationsAttempted: operations.length,
    operationsCompleted: completed,
    operationsBlocked: blocked,
    evidenceCount,
    finalStatus: finalState,
    completedAt: Date.now(),
  });

  return assessRealFileWorkspaceExecution();
}

export function assessRealFileWorkspaceExecution(): RealFileWorkspaceExecutionAssessment {
  const sessions = listRealFileWorkspaceExecutionSessions();
  const evidence = listRealFileExecutionEvidence();
  const realFileExecutionActive =
    sessions.some((s) => s.state === 'COMPLETED' && s.operationsCompleted > 0) &&
    evidence.some((e) => e.evidenceType === 'FILE_CREATED' || e.evidenceType === 'FILE_MODIFIED');

  return {
    summary: getRealFileWorkspaceExecutionSummary(realFileExecutionActive),
    sessionCount: getRealFileWorkspaceExecutionSessionCount(),
    evidenceCount: evidence.length,
    realFileExecutionActive,
    assessedAt: Date.now(),
  };
}

export function isRealFileWorkspaceExecutionActive(): boolean {
  return assessRealFileWorkspaceExecution().realFileExecutionActive;
}

export function verifyRealFileExists(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
}): boolean {
  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, input.workspaceId);
  if (rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_FAIL') return false;
  const absolutePath = join(rootVerdict.workspaceRoot, input.relativePath.replace(/\\/g, '/'));
  return existsSync(absolutePath);
}

export function createBlockedOperationProbe(workspaceId: string): ReturnType<typeof createRealFileOperation> {
  return createRealFileOperation({
    workspaceId,
    relativePath: 'probe.txt',
    operationType: 'DELETE_FILE',
    requestedBy: 'validator',
    sourceActionId: 'blocked-probe',
  });
}

export function readBoundedGeneratedWorkspaceListing(
  projectRootDir: string,
  workspaceId: string,
  relativePath: string,
  maxBytes = 4096,
): string {
  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId);
  if (rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_FAIL') return '';
  const absolutePath = join(rootVerdict.workspaceRoot, relativePath);
  if (!existsSync(absolutePath)) return '';
  const buf = readFileSync(absolutePath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}
