/**
 * World2 Execution Engine consolidation bridge — Phase Next V1.
 * World2 Disposable Workspace Pipeline is the canonical owner of workspace lifecycle.
 */

import {
  assessWorld2DisposableWorkspace,
  type World2DisposableWorkspaceAssessment,
} from '../world2-disposable-workspace/index.js';

export const WORLD2_EXECUTION_ENGINE_AUTHORITATIVE_OWNER =
  'World2 Disposable Workspace Pipeline (24E–24Y)';
export const WORLD2_EXECUTION_ENGINE_CONSOLIDATION_STATUS = 'MERGED' as const;

export interface World2ExecutionEngineConsolidationSnapshot {
  readOnly: true;
  authoritativeOwner: typeof WORLD2_EXECUTION_ENGINE_AUTHORITATIVE_OWNER;
  consolidationStatus: typeof WORLD2_EXECUTION_ENGINE_CONSOLIDATION_STATUS;
  singleWorld2ExecutionOwnershipPath: true;
  delegatedFrom: 'World2 Execution Engine';
  delegatedResponsibilities: readonly string[];
}

export function resolveAuthoritativeWorld2Execution(): World2ExecutionEngineConsolidationSnapshot {
  return {
    readOnly: true,
    authoritativeOwner: WORLD2_EXECUTION_ENGINE_AUTHORITATIVE_OWNER,
    consolidationStatus: WORLD2_EXECUTION_ENGINE_CONSOLIDATION_STATUS,
    singleWorld2ExecutionOwnershipPath: true,
    delegatedFrom: 'World2 Execution Engine',
    delegatedResponsibilities: [
      'Workspace Creation',
      'Workspace Isolation',
      'Workspace Execution',
      'Workspace Disposal',
      'Workspace Lifecycle',
    ],
  };
}

export function delegateWorld2ExecutionToPipeline(
  input: Parameters<typeof assessWorld2DisposableWorkspace>[0] = {},
): World2DisposableWorkspaceAssessment {
  return assessWorld2DisposableWorkspace(input);
}

export function applyPipelineExecutionDelegation(
  localExecutionState: string,
  pipelineAssessment: World2DisposableWorkspaceAssessment | null,
): string {
  if (!pipelineAssessment) return localExecutionState;
  if (pipelineAssessment.lifecycleAssessment.decision === 'DO_NOT_CREATE') {
    return 'BLOCKED_BY_PIPELINE';
  }
  return localExecutionState;
}
