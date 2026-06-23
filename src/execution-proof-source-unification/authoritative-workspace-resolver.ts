/**
 * Phase 26.94 — Authoritative workspace resolver (V1).
 */

import { KNOWN_STALE_EXECUTION_WORKSPACE_IDS } from './execution-proof-source-unification-registry.js';

export function resolveAuthoritativeExecutionWorkspaceId(input: {
  runtimeBridgeWorkspaceId?: string | null;
  founderFlowWorkspaceId?: string | null;
  buildWorkspaceId?: string | null;
  explicitWorkspaceId?: string | null;
}): string | null {
  return (
    input.explicitWorkspaceId ??
    input.founderFlowWorkspaceId ??
    input.runtimeBridgeWorkspaceId ??
    input.buildWorkspaceId ??
    null
  );
}

export function isStaleExecutionWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return false;
  return KNOWN_STALE_EXECUTION_WORKSPACE_IDS.some(
    (stale) => stale.toLowerCase() === workspaceId.toLowerCase(),
  );
}

export function describeWorkspaceSource(input: {
  workspaceId: string | null;
  authoritativeWorkspaceId: string | null;
  dataSource: string;
}): string {
  if (!input.workspaceId) return 'SOURCE_NOT_DISCOVERABLE';
  if (input.workspaceId === input.authoritativeWorkspaceId) return 'runtime bridge workspace';
  if (isStaleExecutionWorkspace(input.workspaceId)) return `historical workspace (${input.workspaceId})`;
  return `${input.dataSource} workspace (${input.workspaceId})`;
}
