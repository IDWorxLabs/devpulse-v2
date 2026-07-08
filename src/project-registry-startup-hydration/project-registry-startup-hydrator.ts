/**
 * Project Registry Startup Hydration — eager registry + persistent project restore.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashString } from '../build-history-integrity/build-history-hash.js';
import {
  bootstrapProjectRegistryV1,
  invalidateProjectRegistryV1Cache,
  type ProjectRegistryFile,
  type ProjectRegistryRecord,
} from '../project-registry-v1/index.js';
import { runRegistrySovereigntyStartupRepair } from '../project-registry-sovereignty/registry-sovereignty-engine.js';
import { countRegistryTierProjects } from '../project-registry-sovereignty/registry-validator.js';
import { resolveArtifactRootForProjectKind, resolveRepoRoot } from '../project-registry-sovereignty/registry-tier-paths.js';
import { PROJECT_KIND_USER } from '../project-registry-v1/project-kind.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { PERSISTENT_PROJECTS_DIR } from '../persistent-project-reality/persistent-project-reality-types.js';
import type {
  PersistentProjectHydrationRecord,
  ProjectRegistryHydrationPhase,
  ProjectRegistryHydrationSnapshot,
} from './project-registry-startup-hydration-types.js';
import { PROJECT_REGISTRY_HYDRATION_TARGET_MS } from './project-registry-startup-hydration-types.js';

let hydrationSnapshot: ProjectRegistryHydrationSnapshot | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function setPhase(
  phase: ProjectRegistryHydrationPhase,
  patch: Partial<ProjectRegistryHydrationSnapshot> = {},
): void {
  hydrationSnapshot = {
    readOnly: true,
    phase,
    startedAt: hydrationSnapshot?.startedAt ?? nowIso(),
    completedAt: phase === 'LOADING' || phase === 'RESTORING' ? null : nowIso(),
    durationMs: hydrationSnapshot?.startedAt
      ? Math.max(0, Date.now() - Date.parse(hydrationSnapshot.startedAt))
      : 0,
    registryProjectCount: hydrationSnapshot?.registryProjectCount ?? 0,
    activeProjectCount: hydrationSnapshot?.activeProjectCount ?? 0,
    persistentProjectCount: hydrationSnapshot?.persistentProjectCount ?? 0,
    hydratedProjectIds: hydrationSnapshot?.hydratedProjectIds ?? [],
    persistentProjects: hydrationSnapshot?.persistentProjects ?? [],
    error: hydrationSnapshot?.error ?? null,
    targetMs: PROJECT_REGISTRY_HYDRATION_TARGET_MS,
    withinTarget: hydrationSnapshot?.withinTarget ?? false,
    ...patch,
    phase,
  };
}

function readPersistentProjectRecord(
  rootDir: string,
  projectId: string,
): PersistentProjectHydrationRecord | null {
  const paths = persistentProjectPaths(rootDir, projectId);
  if (!existsSync(paths.projectJson)) return null;

  try {
    const parsed = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as {
      projectId?: string;
      projectName?: string;
      originalPrompt?: string;
      status?: string;
    };
    const originalPrompt = parsed.originalPrompt?.trim() || null;
    return {
      readOnly: true,
      projectId: parsed.projectId ?? projectId,
      projectName: parsed.projectName ?? projectId,
      originalPrompt,
      promptHash: originalPrompt ? hashString(originalPrompt) : null,
      hasSource: existsSync(paths.source),
      hasFileIndex: existsSync(paths.projectFileIndex),
      hasBuildHistoryLinks: existsSync(paths.buildHistoryLinks),
      hasFeatureContract: existsSync(paths.featureContract),
      status: parsed.status ?? null,
    };
  } catch {
    return null;
  }
}

function scanPersistentProjects(rootDir: string): PersistentProjectHydrationRecord[] {
  const userArtifactRoot = resolveArtifactRootForProjectKind(PROJECT_KIND_USER, rootDir);
  const dir = join(userArtifactRoot, PERSISTENT_PROJECTS_DIR);
  if (!existsSync(dir)) return [];

  const records: PersistentProjectHydrationRecord[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const record = readPersistentProjectRecord(userArtifactRoot, entry.name);
    if (record) records.push(record);
  }
  return records;
}

function enrichRegistryRecordFromPersistent(
  record: ProjectRegistryRecord,
  persistent: PersistentProjectHydrationRecord | undefined,
  rootDir: string,
): void {
  const paths = persistentProjectPaths(rootDir, record.projectId);
  if (!record.persistentWorkspacePath && existsSync(paths.root)) {
    record.persistentWorkspacePath = `.aidev-projects/${record.projectId}`;
  }
  if (!record.sourceRoot && existsSync(paths.source)) {
    record.sourceRoot = `.aidev-projects/${record.projectId}/source`;
  }
  if (!record.aidevMetadataPath && existsSync(paths.aidev)) {
    record.aidevMetadataPath = `.aidev-projects/${record.projectId}/.aidev`;
  }
  if (!record.summary && persistent?.projectName) {
    record.summary = persistent.originalPrompt
      ? persistent.originalPrompt.slice(0, 160)
      : `Workspace project — ${persistent.projectName}`;
  }
  void persistent;
}

export function resetProjectRegistryStartupHydrationForTests(): void {
  hydrationSnapshot = null;
}

export function getProjectRegistryHydrationSnapshot(): ProjectRegistryHydrationSnapshot {
  if (!hydrationSnapshot) {
    return {
      readOnly: true,
      phase: 'LOADING',
      startedAt: nowIso(),
      completedAt: null,
      durationMs: 0,
      registryProjectCount: 0,
      activeProjectCount: 0,
      persistentProjectCount: 0,
      hydratedProjectIds: [],
      persistentProjects: [],
      error: null,
      targetMs: PROJECT_REGISTRY_HYDRATION_TARGET_MS,
      withinTarget: false,
    };
  }
  return { ...hydrationSnapshot };
}

export function isProjectRegistryHydrationReady(): boolean {
  const phase = hydrationSnapshot?.phase;
  return phase === 'READY' || phase === 'EMPTY';
}

export function runProjectRegistryStartupHydration(rootDir: string): ProjectRegistryFile {
  const startedAt = nowIso();
  const startedMs = Date.now();
  setPhase('LOADING', { startedAt, error: null });

  try {
    setPhase('RESTORING');
    invalidateProjectRegistryV1Cache();
    const sovereignty = runRegistrySovereigntyStartupRepair(rootDir);
    const registryState = bootstrapProjectRegistryV1(rootDir);
    const persistentProjects = scanPersistentProjects(rootDir);
    const tierCounts = countRegistryTierProjects(rootDir);
    const persistentById = new Map(persistentProjects.map((p) => [p.projectId, p]));

    for (const record of registryState.projects) {
      if (record.status !== 'ACTIVE') continue;
      enrichRegistryRecordFromPersistent(record, persistentById.get(record.projectId), rootDir);
    }

    const activeProjects = registryState.projects.filter((project) => project.status === 'ACTIVE');
    const durationMs = Math.max(0, Date.now() - startedMs);
    const phase: ProjectRegistryHydrationPhase = activeProjects.length === 0 ? 'EMPTY' : 'READY';

    hydrationSnapshot = {
      readOnly: true,
      phase,
      startedAt,
      completedAt: nowIso(),
      durationMs,
      registryProjectCount: tierCounts.user,
      activeProjectCount: tierCounts.userActive,
      persistentProjectCount: tierCounts.persistentUser,
      hydratedProjectIds: activeProjects.map((project) => project.projectId),
      persistentProjects,
      error: null,
      targetMs: PROJECT_REGISTRY_HYDRATION_TARGET_MS,
      withinTarget: durationMs <= PROJECT_REGISTRY_HYDRATION_TARGET_MS,
    };

    console.info(
      `[project-registry-startup-hydration] phase=${phase} durationMs=${durationMs} userRegistry=${tierCounts.user} auditRegistry=${tierCounts.audit} systemRegistry=${tierCounts.system} persistentUser=${tierCounts.persistentUser} migrated=${sovereignty.migration.migrated.length} withinTarget=${hydrationSnapshot.withinTarget}`,
    );

    return registryState;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    hydrationSnapshot = {
      readOnly: true,
      phase: 'ERROR',
      startedAt,
      completedAt: nowIso(),
      durationMs: Math.max(0, Date.now() - startedMs),
      registryProjectCount: 0,
      activeProjectCount: 0,
      persistentProjectCount: 0,
      hydratedProjectIds: [],
      persistentProjects: [],
      error: message,
      targetMs: PROJECT_REGISTRY_HYDRATION_TARGET_MS,
      withinTarget: false,
    };
    throw err;
  }
}
