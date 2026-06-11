/**
 * Workspace isolation authority — hard fail on production targets (Phase 24C).
 */

import {
  FORBIDDEN_EXECUTION_TARGET,
  getBuilderExecutionWorkspace,
} from '../autonomous-builder-execution-foundation/index.js';

export type WorkspaceIsolationResult = 'WORKSPACE_ISOLATION_PASS' | 'WORKSPACE_ISOLATION_FAIL';

export interface WorkspaceIsolationVerdict {
  result: WorkspaceIsolationResult;
  reason: string;
  workspaceId: string;
  isolatedFromProduction: boolean;
}

export function verifyWorkspaceIsolation(input: {
  workspaceId: string;
  sourceProject?: string;
}): WorkspaceIsolationVerdict {
  const workspace = getBuilderExecutionWorkspace(input.workspaceId);
  if (!workspace) {
    return {
      result: 'WORKSPACE_ISOLATION_FAIL',
      reason: 'Execution target does not belong to an execution workspace',
      workspaceId: input.workspaceId,
      isolatedFromProduction: false,
    };
  }

  const source = input.sourceProject ?? workspace.sourceProject;
  if (source.toLowerCase().includes('devpulse production')) {
    return {
      result: 'WORKSPACE_ISOLATION_FAIL',
      reason: `Forbidden execution target: ${FORBIDDEN_EXECUTION_TARGET}`,
      workspaceId: input.workspaceId,
      isolatedFromProduction: false,
    };
  }

  if (!workspace.isolatedFromProduction) {
    return {
      result: 'WORKSPACE_ISOLATION_FAIL',
      reason: 'Execution workspace is not marked isolated from production',
      workspaceId: input.workspaceId,
      isolatedFromProduction: false,
    };
  }

  return {
    result: 'WORKSPACE_ISOLATION_PASS',
    reason: 'Execution target is isolated, not production, and belongs to execution workspace',
    workspaceId: input.workspaceId,
    isolatedFromProduction: true,
  };
}
