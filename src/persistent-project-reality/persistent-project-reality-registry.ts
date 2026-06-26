/**
 * Persistent Project Reality V1 — project registry integration.
 */

import {
  loadProjectRegistryV1,
  readProjectRegistryState,
  writeProjectRegistryV1ForTests,
} from '../project-registry-v1/project-registry-v1-store.js';
import type { ProjectRegistryRecord } from '../project-registry-v1/project-registry-v1-types.js';
import type {
  PersistentProjectRealityEvidence,
  PersistentProjectRecord,
} from './persistent-project-reality-types.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function ensureRegistryProjectRecord(input: {
  rootDir: string;
  projectId: string;
  projectName: string;
}): ProjectRegistryRecord {
  const state = readProjectRegistryState(input.rootDir);
  const existing = state.projects.find((project) => project.projectId === input.projectId);
  if (existing) return existing;

  const stamp = nowIso();
  const record: ProjectRegistryRecord = {
    projectId: input.projectId,
    name: input.projectName,
    status: 'ACTIVE',
    createdAt: stamp,
    updatedAt: stamp,
    lastActivityAt: stamp,
    summary: `Persistent workspace — ${input.projectName}`,
  };
  state.projects.push(record);
  if (!state.activeProjectId) {
    state.activeProjectId = record.projectId;
  }
  writeProjectRegistryV1ForTests(state, input.rootDir);
  return record;
}

export function updateProjectRegistryPersistentReality(input: {
  rootDir: string;
  projectId: string;
  evidence: PersistentProjectRealityEvidence;
  projectRecord: PersistentProjectRecord;
}): ProjectRegistryRecord | null {
  const state = readProjectRegistryState(input.rootDir);
  const index = state.projects.findIndex((project) => project.projectId === input.projectId);
  if (index < 0) return null;

  const updated: ProjectRegistryRecord = {
    ...state.projects[index]!,
    updatedAt: input.projectRecord.updatedAt,
    lastActivityAt: input.projectRecord.updatedAt,
    persistentWorkspacePath: input.evidence.persistentProjectWorkspacePath,
    sourceRoot: input.evidence.persistentProjectSourceRoot,
    aidevMetadataPath: `${input.evidence.persistentProjectWorkspacePath}/.aidev`,
    activeBuildHistoryRunId: input.projectRecord.lastBuildRunId,
    lastSuccessfulBuildRunId: input.projectRecord.lastSuccessfulBuildRunId,
    exportReady: input.evidence.promotionStatus === 'PASS',
    projectRealityStatus:
      input.evidence.promotionStatus === 'PASS'
        ? 'PROMOTED'
        : input.evidence.promotionStatus === 'SKIPPED'
          ? 'PENDING'
          : 'FAILED',
  };

  state.projects[index] = updated;
  writeProjectRegistryV1ForTests(state, input.rootDir);
  loadProjectRegistryV1(input.rootDir);
  return updated;
}
