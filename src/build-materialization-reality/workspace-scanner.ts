/**
 * Workspace Reality Scanner — workspace linkage to manifest and execution proof (Phase 26.74).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type { ArtifactRealityScanSummary, WorkspaceReality } from './build-materialization-reality-types.js';

export interface WorkspaceLinkageSummary {
  readOnly: true;
  workspaceExists: boolean;
  workspacePopulated: boolean;
  linkedToManifest: boolean;
  linkedToExecutionProof: boolean;
  linkedToRuntimeProof: boolean;
  linkedToPreviewProof: boolean;
  linkedToVerificationProof: boolean;
  missingLinkage: string[];
}

export function analyzeWorkspaceLinkage(input: {
  workspace: WorkspaceReality;
  contract: BuildReadyExecutionContract | null;
  connectedBuildReport: ConnectedBuildExecutionReport | null;
}): WorkspaceLinkageSummary {
  const missingLinkage: string[] = [];
  const paths = new Set(input.workspace.artifactFiles.map((f) => f.relativePath));

  const linkedToPreviewProof = [...paths].some(
    (p) => p.includes('/verification/run-verify') || p.includes('run-verify.mjs'),
  );
  const linkedToVerificationProof = [...paths].some(
    (p) => p.includes('verification/build-verification.json'),
  );

  if (!input.workspace.workspaceExists) {
    missingLinkage.push('workspace directory does not exist on disk');
  }
  if (!input.workspace.workspacePopulated) {
    missingLinkage.push('workspace has no observed files');
  }
  if (!input.workspace.linkedToManifest) {
    missingLinkage.push('build-manifest.json not found in workspace');
  }
  if (!input.workspace.linkedToExecutionProof) {
    missingLinkage.push('connected build execution proof does not link workspace');
  }
  if (!input.workspace.linkedToRuntimeProof) {
    missingLinkage.push('runtime/dev-server.mjs not found');
  }
  if (!linkedToPreviewProof) {
    missingLinkage.push('preview contract file (verification/run-verify.mjs) not found');
  }
  if (!linkedToVerificationProof) {
    missingLinkage.push('verification/build-verification.json not found');
  }

  return {
    readOnly: true,
    workspaceExists: input.workspace.workspaceExists,
    workspacePopulated: input.workspace.workspacePopulated,
    linkedToManifest: input.workspace.linkedToManifest,
    linkedToExecutionProof: input.workspace.linkedToExecutionProof,
    linkedToRuntimeProof: input.workspace.linkedToRuntimeProof,
    linkedToPreviewProof,
    linkedToVerificationProof,
    missingLinkage,
  };
}

export function selectPrimaryWorkspace(
  scan: ArtifactRealityScanSummary,
  contractId: string | null,
): WorkspaceReality | null {
  if (!contractId) return scan.workspaces[0] ?? null;
  return scan.workspaces.find((w) => w.workspaceId === contractId) ?? scan.workspaces[0] ?? null;
}

export function summarizeAllWorkspaces(scan: ArtifactRealityScanSummary): {
  populatedCount: number;
  manifestLinkedCount: number;
  executionProofLinkedCount: number;
} {
  return {
    populatedCount: scan.workspaces.filter((w) => w.workspacePopulated).length,
    manifestLinkedCount: scan.workspaces.filter((w) => w.linkedToManifest).length,
    executionProofLinkedCount: scan.workspaces.filter((w) => w.linkedToExecutionProof).length,
  };
}
