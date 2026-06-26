/**
 * Persistent Project Reality V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { PersistentProjectRealityEvidence } from './persistent-project-reality-types.js';

export function applyPersistentProjectRealityToManifest(
  manifest: GeneratedAppManifest,
  evidence: PersistentProjectRealityEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    workspacePath:
      evidence.promotionStatus === 'PASS' && evidence.persistentProjectSourceRoot
        ? evidence.persistentProjectSourceRoot
        : manifest.workspacePath,
    persistentProjectRealityStatus: evidence.persistentProjectRealityStatus,
    persistentProjectId: evidence.persistentProjectId,
    persistentProjectWorkspacePath: evidence.persistentProjectWorkspacePath,
    persistentProjectSourceRoot: evidence.persistentProjectSourceRoot,
    projectFileIndexPath: evidence.projectFileIndexPath,
    exportMetadataPath: evidence.exportMetadataPath,
    promotedFromBuildWorkspace: evidence.promotedFromBuildWorkspace,
    promotionStatus: evidence.promotionStatus,
    promotionFailureReasons: evidence.promotionFailureReasons,
    persistentProjectRecordedAt: evidence.recordedAt,
    activeWorkspacePath:
      evidence.promotionStatus === 'PASS'
        ? evidence.persistentProjectWorkspacePath
        : manifest.activeWorkspacePath ?? null,
  };
}
