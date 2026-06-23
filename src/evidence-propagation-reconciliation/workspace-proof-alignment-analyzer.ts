/**
 * Workspace proof alignment analyzer — cross-authority workspace alignment (Phase 26.88).
 */

import type { AuthorityEvidenceSource } from './evidence-propagation-reconciliation-types.js';

export interface WorkspaceProofAlignment {
  readOnly: true;
  authoritativeWorkspaceId: string | null;
  alignedAuthorityCount: number;
  misalignedAuthorityCount: number;
  misalignedAuthorities: string[];
  allAligned: boolean;
}

export function analyzeWorkspaceProofAlignment(input: {
  authoritativeWorkspaceId: string | null;
  sources: readonly AuthorityEvidenceSource[];
}): WorkspaceProofAlignment {
  const misaligned: string[] = [];
  for (const source of input.sources) {
    if (!source.workspaceId || !input.authoritativeWorkspaceId) continue;
    if (source.workspaceId !== input.authoritativeWorkspaceId) {
      misaligned.push(source.authorityId);
    }
  }
  const withWorkspace = input.sources.filter((s) => s.workspaceId).length;
  const aligned = withWorkspace - misaligned.length;
  return {
    readOnly: true,
    authoritativeWorkspaceId: input.authoritativeWorkspaceId,
    alignedAuthorityCount: aligned,
    misalignedAuthorityCount: misaligned.length,
    misalignedAuthorities: misaligned,
    allAligned: misaligned.length === 0,
  };
}
