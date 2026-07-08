/**
 * Persistent Project Reality V1 — orchestrates promotion, registry, and evidence.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  promotePersistentProjectReality,
  recordPersistentProjectFailureEvidence,
} from './persistent-project-reality-promoter.js';
import { resolveRegistryRootForPersistentProject } from '../audit-project-isolation/audit-registry-root.js';
import {
  ensureRegistryProjectRecord,
  updateProjectRegistryPersistentReality,
} from './persistent-project-reality-registry.js';
import type {
  PersistentProjectPromotionResult,
  PersistentProjectRealityEvidence,
} from './persistent-project-reality-types.js';

export function recordPersistentProjectReality(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
  projectId: string;
  projectName: string;
  promoteSource: boolean;
  projectKind?: 'USER' | 'AUDIT' | 'SYSTEM_TEST';
}): PersistentProjectPromotionResult {
  if (!input.promoteSource) {
    recordPersistentProjectFailureEvidence({
      projectRootDir: input.projectRootDir,
      buildWorkspaceDir: input.workspaceDir,
      manifest: input.manifest,
      projectId: input.projectId,
      projectName: input.projectName,
    });
    return promotePersistentProjectReality({
      projectRootDir: input.projectRootDir,
      buildWorkspaceDir: input.workspaceDir,
      manifest: input.manifest,
      projectId: input.projectId,
      projectName: input.projectName,
      promoteSource: false,
    });
  }

  const result = promotePersistentProjectReality({
    projectRootDir: input.projectRootDir,
    buildWorkspaceDir: input.workspaceDir,
    manifest: input.manifest,
    projectId: input.projectId,
    projectName: input.projectName,
    promoteSource: input.promoteSource,
  });
  const { registryRoot, projectKind, artifactRoot } = resolveRegistryRootForPersistentProject({
    projectRootDir: input.projectRootDir,
    explicitProjectKind: input.projectKind,
  });
  ensureRegistryProjectRecord({
    rootDir: registryRoot,
    projectId: input.projectId,
    projectName: input.projectName,
    projectKind,
  });
  updateProjectRegistryPersistentReality({
    rootDir: registryRoot,
    projectId: input.projectId,
    evidence: result.evidence,
    projectRecord: result.projectRecord,
  });
  return result;
}

export function buildFailurePersistentProjectEvidence(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
  projectId: string;
  projectName: string;
}): PersistentProjectRealityEvidence {
  recordPersistentProjectFailureEvidence({
    projectRootDir: input.projectRootDir,
    buildWorkspaceDir: input.workspaceDir,
    manifest: input.manifest,
    projectId: input.projectId,
    projectName: input.projectName,
  });
  return promotePersistentProjectReality({
    projectRootDir: input.projectRootDir,
    buildWorkspaceDir: input.workspaceDir,
    manifest: input.manifest,
    projectId: input.projectId,
    projectName: input.projectName,
    promoteSource: false,
  }).evidence;
}
