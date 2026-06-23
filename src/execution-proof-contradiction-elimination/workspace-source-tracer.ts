/**
 * Phase 27.01 — Workspace source tracer (V1).
 */

import { isStaleExecutionWorkspace } from '../execution-proof-source-unification/authoritative-workspace-resolver.js';

export function traceWorkspaceSource(input: {
  workspaceId: string | null;
  authoritativeWorkspaceId: string | null;
  authorityId: string;
}): { aligned: boolean; sourceChain: string; stale: boolean } {
  if (!input.workspaceId) {
    return {
      aligned: Boolean(input.authoritativeWorkspaceId),
      sourceChain: `${input.authorityId} → workspace:SOURCE_NOT_DISCOVERABLE`,
      stale: false,
    };
  }

  const stale = isStaleExecutionWorkspace(input.workspaceId);
  const aligned =
    !stale &&
    Boolean(input.authoritativeWorkspaceId) &&
    input.workspaceId === input.authoritativeWorkspaceId;

  return {
    aligned,
    stale,
    sourceChain: stale
      ? `${input.authorityId} → workspace:historical(${input.workspaceId})`
      : aligned
        ? `${input.authorityId} → workspace:authoritative(${input.workspaceId})`
        : `${input.authorityId} → workspace:drift(${input.workspaceId}≠${input.authoritativeWorkspaceId})`,
  };
}
