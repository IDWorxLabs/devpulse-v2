/**
 * Audit Project Isolation V1 — detect and cleanup validator/audit registry pollution.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  inferProjectKindFromProjectId,
  isTestOrAuditRegistryProject,
  isUserFacingRegistryProject,
  resolveProjectKind,
  type ProjectKind,
} from '../project-registry-v1/project-kind.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
} from '../project-registry-v1/project-registry-v1-store.js';
import type { ProjectRegistryRecord } from '../project-registry-v1/project-registry-v1-types.js';
import { deleteProjectLifecycle } from '../project-lifecycle-management-v1/project-lifecycle-authority.js';

export const AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN =
  'AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS';

export interface TestProjectCleanupCandidate {
  projectId: string;
  name: string;
  projectKind: ProjectKind;
  source: 'registry' | 'orphan-directory';
}

export interface TestProjectCleanupResult {
  ok: boolean;
  preview: boolean;
  confirmed: boolean;
  candidates: TestProjectCleanupCandidate[];
  deletedProjectIds: string[];
  preservedUserProjectIds: string[];
  errors: string[];
}

const PERSISTENT_PROJECTS_DIR = '.aidev-projects';

export function listTestProjectCleanupCandidates(rootDir: string): TestProjectCleanupCandidate[] {
  const candidates = new Map<string, TestProjectCleanupCandidate>();
  const state = readProjectRegistryState(rootDir);

  for (const project of state.projects) {
    if (isUserFacingRegistryProject(project)) continue;
    candidates.set(project.projectId, {
      projectId: project.projectId,
      name: project.name,
      projectKind: resolveProjectKind(project),
      source: 'registry',
    });
  }

  const projectsDir = join(rootDir, PERSISTENT_PROJECTS_DIR);
  if (existsSync(projectsDir)) {
    for (const entry of readdirSync(projectsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const projectId = entry.name;
      const kind = inferProjectKindFromProjectId(projectId);
      if (kind === 'USER') continue;
      if (!candidates.has(projectId)) {
        candidates.set(projectId, {
          projectId,
          name: projectId,
          projectKind: kind,
          source: 'orphan-directory',
        });
      }
    }
  }

  return [...candidates.values()].sort((a, b) => a.projectId.localeCompare(b.projectId));
}

export async function cleanupTestProjects(input: {
  rootDir: string;
  confirmed?: boolean;
  preview?: boolean;
}): Promise<TestProjectCleanupResult> {
  const candidates = listTestProjectCleanupCandidates(input.rootDir);
  const preservedUserProjectIds = readProjectRegistryState(input.rootDir)
    .projects.filter((project) => isUserFacingRegistryProject(project))
    .map((project) => project.projectId);

  if (input.preview || !input.confirmed) {
    return {
      ok: true,
      preview: true,
      confirmed: false,
      candidates,
      deletedProjectIds: [],
      preservedUserProjectIds,
      errors: [],
    };
  }

  const deletedProjectIds: string[] = [];
  const errors: string[] = [];

  for (const candidate of candidates) {
    const registryRecord = readProjectRegistryState(input.rootDir).projects.find(
      (project) => project.projectId === candidate.projectId,
    );
    if (registryRecord && isUserFacingRegistryProject(registryRecord)) {
      errors.push(`Refused to delete user project ${candidate.projectId}`);
      continue;
    }
    if (registryRecord && isTestOrAuditRegistryProject(registryRecord)) {
      const result = await deleteProjectLifecycle({
        projectId: candidate.projectId,
        rootDir: input.rootDir,
        confirmed: true,
      });
      if (result.ok) {
        deletedProjectIds.push(candidate.projectId);
      } else if (result.error) {
        errors.push(`${candidate.projectId}: ${result.error}`);
      }
      continue;
    }
    if (candidate.source === 'orphan-directory') {
      const result = await deleteProjectLifecycle({
        projectId: candidate.projectId,
        rootDir: input.rootDir,
        confirmed: true,
      });
      if (result.ok) {
        deletedProjectIds.push(candidate.projectId);
      } else if (result.error) {
        errors.push(`${candidate.projectId}: ${result.error}`);
      }
    }
  }

  invalidateProjectRegistryV1Cache();

  return {
    ok: errors.length === 0,
    preview: false,
    confirmed: true,
    candidates,
    deletedProjectIds,
    preservedUserProjectIds,
    errors,
  };
}

export function filterUserFacingRegistryProjects(
  projects: ProjectRegistryRecord[],
): ProjectRegistryRecord[] {
  return projects.filter((project) => isUserFacingRegistryProject(project));
}
