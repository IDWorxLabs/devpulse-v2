/**
 * Workspace Reality Audit V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { WorkspaceRealityAuditEvidence } from './workspace-reality-audit-types.js';

export function applyWorkspaceRealityAuditToManifest(
  manifest: GeneratedAppManifest,
  evidence: WorkspaceRealityAuditEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    workspaceRealityAuditStatus: evidence.workspaceRealityAuditStatus,
    workspaceRealityAuditScore: evidence.workspaceRealityAuditScore,
    workspaceRealityAuditArtifactPath: evidence.workspaceRealityAuditArtifactPath,
    workspaceRealityReportPath: evidence.workspaceRealityReportPath,
    workspaceRealityFailureReasons: evidence.workspaceRealityFailureReasons,
    workspaceRealityRecordedAt: evidence.workspaceRealityRecordedAt,
  };
}
