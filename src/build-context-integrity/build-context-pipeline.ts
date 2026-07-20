/** Pipeline integration for BuildContext integrity artifacts. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import {
  buildContextIntegrityWorkspaceArtifacts,
  evaluateProductionBuildContextIntegrity,
} from './production-build-context-integrity.js';

export function augmentWorkspaceWithBuildContextIntegrity(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  input: {
    readonly envelope: ApprovedProductionBuildEnvelope;
    readonly projectId?: string | null;
    readonly workspaceId?: string | null;
    readonly previousProductIdentities?: readonly string[];
    readonly previousWorkspaceTokens?: readonly string[];
    readonly traceabilityFingerprint?: string | null;
    readonly engineeringFingerprint?: string | null;
  },
): GeneratedWorkspaceFile[] {
  const report = evaluateProductionBuildContextIntegrity({
    envelope: input.envelope,
    workspaceFiles,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    previousProductIdentities: input.previousProductIdentities,
    previousWorkspaceTokens: input.previousWorkspaceTokens,
    traceabilityFingerprint: input.traceabilityFingerprint,
    engineeringFingerprint: input.engineeringFingerprint,
  });
  return [...workspaceFiles, ...buildContextIntegrityWorkspaceArtifacts(report)];
}
