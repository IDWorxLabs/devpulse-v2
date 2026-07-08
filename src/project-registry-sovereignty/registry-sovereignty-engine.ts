/**
 * Registry Sovereignty V1 — constitutional orchestrator for scan, migrate, repair, and cache rebuild.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { deleteProjectLifecycle } from '../project-lifecycle-management-v1/project-lifecycle-authority.js';
import {
  inferProjectKindFromProjectId,
  isUserFacingRegistryProject,
  PROJECT_KIND_USER,
  resolveProjectKind,
} from '../project-registry-v1/project-kind.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
} from '../project-registry-v1/project-registry-v1-store.js';
import { PERSISTENT_PROJECTS_DIR } from '../persistent-project-reality/persistent-project-reality-types.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { rebuildUserWorkspaceCache, listUserFacingActiveProjectIds } from './registry-cache-authority.js';
import { scanRegistryIntegrity } from './registry-integrity-checker.js';
import { migratePollutedUserRegistry } from './registry-migration-engine.js';
import { buildRegistrySovereigntyReport } from './registry-report-builder.js';
import { resolveRepoRoot, resolveUserRegistryRoot } from './registry-tier-paths.js';
import type {
  RegistrySovereigntyCleanupInput,
  RegistrySovereigntyCleanupResult,
  RegistrySovereigntyReport,
  RegistrySovereigntyTrigger,
} from './types.js';
import { countRegistryTierProjects } from './registry-validator.js';

function listUserRootPollutedArtifactIds(rootDir: string): string[] {
  const repoRoot = resolveRepoRoot(rootDir);
  const polluted = new Set<string>();

  for (const project of readProjectRegistryState(resolveUserRegistryRoot(repoRoot)).projects) {
    if (!isUserFacingRegistryProject(project) && project.status === 'ACTIVE') {
      polluted.add(project.projectId);
    }
  }

  for (const dirName of [PERSISTENT_PROJECTS_DIR, GENERATED_BUILDER_WORKSPACES_DIR]) {
    const dir = join(repoRoot, dirName);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const kind = inferProjectKindFromProjectId(entry.name);
      if (kind !== PROJECT_KIND_USER) polluted.add(entry.name);
    }
  }

  return [...polluted.values()].sort();
}

export function runRegistrySovereigntyEngine(input?: {
  rootDir?: string;
  preview?: boolean;
  trigger?: RegistrySovereigntyTrigger;
}): RegistrySovereigntyReport {
  const repoRoot = resolveRepoRoot(input?.rootDir);
  const preview = input?.preview === true;
  const trigger = input?.trigger ?? 'runtime';
  const issues = scanRegistryIntegrity(repoRoot);

  if (preview) {
    const counts = countRegistryTierProjects(repoRoot);
    return buildRegistrySovereigntyReport({
      trigger,
      preview: true,
      issues,
      migration: {
        readOnly: true,
        mutated: false,
        migrated: [],
        duplicateRepairs: [],
        repairedActiveProjectId: readProjectRegistryState(resolveUserRegistryRoot(repoRoot)).activeProjectId,
        previousActiveProjectId: readProjectRegistryState(resolveUserRegistryRoot(repoRoot)).activeProjectId,
        counts,
      },
      preservedUserProjectIds: listUserFacingActiveProjectIds(repoRoot),
    });
  }

  const migration = migratePollutedUserRegistry(repoRoot);
  rebuildUserWorkspaceCache(repoRoot);
  invalidateProjectRegistryV1Cache();

  return buildRegistrySovereigntyReport({
    trigger,
    preview: false,
    issues: scanRegistryIntegrity(repoRoot),
    migration: { ...migration, counts: countRegistryTierProjects(repoRoot) },
    preservedUserProjectIds: listUserFacingActiveProjectIds(repoRoot),
  });
}

export function runRegistrySovereigntyStartupRepair(rootDir: string): RegistrySovereigntyReport {
  return runRegistrySovereigntyEngine({ rootDir, trigger: 'startup' });
}

export function runRegistrySovereigntyOnMutation(rootDir?: string): RegistrySovereigntyReport {
  return runRegistrySovereigntyEngine({ rootDir, trigger: 'persist' });
}

export async function executeRegistrySovereigntyCleanup(
  input: RegistrySovereigntyCleanupInput,
): Promise<RegistrySovereigntyCleanupResult> {
  const repoRoot = resolveRepoRoot(input.rootDir);
  const preview = input.preview === true || input.confirmed !== true;
  const migrationReport = runRegistrySovereigntyEngine({
    rootDir: repoRoot,
    preview,
    trigger: 'cleanup',
  });

  if (preview) {
    return {
      ...migrationReport,
      confirmed: false,
    };
  }

  const artifactTargets = listUserRootPollutedArtifactIds(repoRoot);
  const deletedArtifactProjectIds: string[] = [];
  const errors: string[] = [];

  for (const projectId of artifactTargets) {
    const registryRecord = readProjectRegistryState(resolveUserRegistryRoot(repoRoot)).projects.find(
      (project) => project.projectId === projectId,
    );
    if (registryRecord && resolveProjectKind(registryRecord) === PROJECT_KIND_USER) {
      errors.push(`Refused to delete user project artifacts ${projectId}`);
      continue;
    }
    const result = await deleteProjectLifecycle({
      projectId,
      rootDir: repoRoot,
      confirmed: true,
    });
    if (result.ok) {
      deletedArtifactProjectIds.push(projectId);
    } else if (result.error) {
      errors.push(`${projectId}: ${result.error}`);
    }
  }

  rebuildUserWorkspaceCache(repoRoot);
  invalidateProjectRegistryV1Cache();
  const finalMigration = migratePollutedUserRegistry(repoRoot);

  return {
    ...buildRegistrySovereigntyReport({
      trigger: 'cleanup',
      preview: false,
      issues: scanRegistryIntegrity(repoRoot),
      migration: { ...finalMigration, counts: countRegistryTierProjects(repoRoot) },
      deletedArtifactProjectIds,
      preservedUserProjectIds: listUserFacingActiveProjectIds(repoRoot),
      errors,
    }),
    confirmed: true,
  };
}

export function enforceUserRegistrySovereigntyOnWrite(
  rootDir?: string,
): void {
  runRegistrySovereigntyOnMutation(rootDir);
}
