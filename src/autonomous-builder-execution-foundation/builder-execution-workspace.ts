/**
 * Builder execution workspace model — isolated World 2 workspace (Phase 24B).
 */

import { FORBIDDEN_EXECUTION_TARGET, MAX_EXECUTION_WORKSPACES } from './autonomous-builder-execution-foundation-bounds.js';

export type BuilderExecutionState =
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_READY'
  | 'EXECUTION_RUNNING'
  | 'EXECUTION_PAUSED'
  | 'EXECUTION_COMPLETE'
  | 'EXECUTION_FAILED';

export interface BuilderExecutionWorkspace {
  workspaceId: string;
  projectId: string;
  sourceProject: string;
  executionState: BuilderExecutionState;
  executionStartedAt: number | null;
  executionCompletedAt: number | null;
  fileCount: number;
  actionCount: number;
  evidenceCount: number;
  isolatedFromProduction: true;
  isolationNote: string;
  createdAt: number;
}

const workspaces = new Map<string, BuilderExecutionWorkspace>();
let workspaceCounter = 0;

export function resetBuilderExecutionWorkspacesForTests(): void {
  workspaces.clear();
  workspaceCounter = 0;
}

function nextWorkspaceId(): string {
  workspaceCounter += 1;
  return `builder-exec-ws-${workspaceCounter}`;
}

export function assertIsolatedExecutionTarget(sourceProject: string): void {
  if (sourceProject.toLowerCase().includes('devpulse production')) {
    throw new Error(`Forbidden execution target: ${FORBIDDEN_EXECUTION_TARGET}`);
  }
}

export function createBuilderExecutionWorkspace(input: {
  projectId: string;
  sourceProject: string;
  initialState?: BuilderExecutionState;
}): BuilderExecutionWorkspace {
  assertIsolatedExecutionTarget(input.sourceProject);

  const workspace: BuilderExecutionWorkspace = {
    workspaceId: nextWorkspaceId(),
    projectId: input.projectId,
    sourceProject: input.sourceProject,
    executionState: input.initialState ?? 'WORKSPACE_CREATED',
    executionStartedAt: null,
    executionCompletedAt: null,
    fileCount: 0,
    actionCount: 0,
    evidenceCount: 0,
    isolatedFromProduction: true,
    isolationNote: WORLD2_ISOLATION_NOTE,
    createdAt: Date.now(),
  };

  workspaces.set(workspace.workspaceId, workspace);
  if (workspaces.size > MAX_EXECUTION_WORKSPACES) {
    const oldest = [...workspaces.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) workspaces.delete(oldest.workspaceId);
  }

  return workspace;
}

export const WORLD2_ISOLATION_NOTE =
  'World 2 isolated workspace — not DevPulse production workspace';

export function getBuilderExecutionWorkspace(workspaceId: string): BuilderExecutionWorkspace | null {
  return workspaces.get(workspaceId) ?? null;
}

export function updateBuilderExecutionWorkspace(
  workspaceId: string,
  patch: Partial<
    Pick<
      BuilderExecutionWorkspace,
      | 'executionState'
      | 'executionStartedAt'
      | 'executionCompletedAt'
      | 'fileCount'
      | 'actionCount'
      | 'evidenceCount'
    >
  >,
): BuilderExecutionWorkspace | null {
  const current = workspaces.get(workspaceId);
  if (!current) return null;
  const updated = { ...current, ...patch };
  workspaces.set(workspaceId, updated);
  return updated;
}

export function listBuilderExecutionWorkspaces(): BuilderExecutionWorkspace[] {
  return [...workspaces.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getBuilderExecutionWorkspaceCount(): number {
  return workspaces.size;
}
