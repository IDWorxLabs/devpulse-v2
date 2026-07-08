/**
 * Project Registry V1 — file-backed canonical project store.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/index.js';
import {
  ProjectRegistryDuplicateNameError,
  PROJECT_REGISTRY_DUPLICATES_REPAIRED,
  PROJECT_REGISTRY_LOADED,
  PROJECT_REGISTRY_PROJECT_PERSISTED,
  PROJECT_REGISTRY_TEST_ROOT_SEGMENT,
  type ProjectRegistryDuplicateRepairResult,
  type ProjectRegistryFile,
  type ProjectRegistryRecord,
  type ProjectRegistrySummary,
  type ProjectRegistrySummaryItem,
} from './project-registry-v1-types.js';
import {
  resolveProjectContext,
  setActiveProjectId,
  type MultiProjectWorkspaceSession,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import {
  isFlatTierRegistryRoot,
  runRegistrySovereigntyOnMutation,
} from '../project-registry-sovereignty/index.js';
import { normalizeProjectRegistryName } from '../project-registry-sovereignty/registry-classifier.js';

const REGISTRY_DIR = '.aidevengine';
const REGISTRY_FILE = 'project-registry-v1.json';
const OPERATOR_LOG_FILE = 'project-registry-operator-log.jsonl';

let cachedRootDir: string | null = null;
let cachedState: ProjectRegistryFile | null = null;
let projectCounter = 0;
let sovereigntyRepairInProgress = false;

function registryPath(rootDir: string): string {
  if (isFlatTierRegistryRoot(rootDir)) {
    return join(rootDir, REGISTRY_FILE);
  }
  return join(rootDir, REGISTRY_DIR, REGISTRY_FILE);
}

function operatorLogPath(rootDir: string): string {
  if (isFlatTierRegistryRoot(rootDir)) {
    return join(rootDir, OPERATOR_LOG_FILE);
  }
  return join(rootDir, REGISTRY_DIR, OPERATOR_LOG_FILE);
}

function emptyState(): ProjectRegistryFile {
  return { version: 1, activeProjectId: null, projects: [] };
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateProjectId(name: string): string {
  projectCounter += 1;
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'project';
  return `${slug}-${Date.now()}-${projectCounter}`;
}

function resolveRootDir(rootDir?: string): string {
  if (rootDir) return rootDir;
  if (cachedRootDir) return cachedRootDir;
  return resolveProjectRegistryRootDir();
}

let defaultRegistryRootDir: string | null = null;

export function setDefaultProjectRegistryRootDir(rootDir: string): void {
  defaultRegistryRootDir = rootDir;
}

export function resolveProjectRegistryRootDir(): string {
  const override = process.env.AIDEVENGINE_REGISTRY_ROOT?.trim();
  if (override) return override;
  if (defaultRegistryRootDir) return defaultRegistryRootDir;
  return process.cwd();
}

export function isProjectRegistryTestRoot(rootDir: string): boolean {
  const normalized = rootDir.replace(/\\/g, '/');
  return (
    normalized.includes(PROJECT_REGISTRY_TEST_ROOT_SEGMENT) ||
    normalized.includes('/devpulse-registry-test-')
  );
}

export function createProjectRegistryTestRoot(parentDir: string): string {
  const root = join(parentDir, `${PROJECT_REGISTRY_TEST_ROOT_SEGMENT}-${Date.now()}-${process.pid}`);
  mkdirSync(join(root, REGISTRY_DIR), { recursive: true });
  return root;
}

function logProjectRegistryLoaded(state: ProjectRegistryFile, rootDir: string): void {
  const activeCount = state.projects.filter((project) => project.status === 'ACTIVE').length;
  const path = registryPath(rootDir);
  console.info(
    `[project-registry-v1] ${PROJECT_REGISTRY_LOADED} count=${state.projects.length} active=${activeCount} path=${path}`,
  );
}

function logProjectRegistryProjectPersisted(record: ProjectRegistryRecord, rootDir: string): void {
  console.info(
    `[project-registry-v1] ${PROJECT_REGISTRY_PROJECT_PERSISTED} projectId=${record.projectId} name=${record.name} path=${registryPath(rootDir)}`,
  );
}

function persistState(
  state: ProjectRegistryFile,
  rootDir?: string,
  options?: { skipSovereignty?: boolean },
): void {
  const resolvedRoot = resolveRootDir(rootDir);
  const path = registryPath(resolvedRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
  cachedRootDir = resolvedRoot;
  cachedState = state;
  if (
    !options?.skipSovereignty &&
    !isFlatTierRegistryRoot(resolvedRoot) &&
    !sovereigntyRepairInProgress
  ) {
    sovereigntyRepairInProgress = true;
    try {
      runRegistrySovereigntyOnMutation(resolvedRoot);
    } finally {
      sovereigntyRepairInProgress = false;
    }
  }
}

function loadState(rootDir?: string): ProjectRegistryFile {
  const resolvedRoot = resolveRootDir(rootDir);
  if (cachedState && cachedRootDir === resolvedRoot) {
    return cachedState;
  }
  const path = registryPath(resolvedRoot);
  if (!existsSync(path)) {
    cachedRootDir = resolvedRoot;
    cachedState = emptyState();
    return cachedState;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ProjectRegistryFile;
    cachedRootDir = resolvedRoot;
    cachedState =
      parsed.version === 1 && Array.isArray(parsed.projects)
        ? parsed
        : emptyState();
    projectCounter = cachedState.projects.length;
    const repair = repairDuplicateActiveProjects(cachedState);
    if (repair.mutated) {
      persistState(cachedState, resolvedRoot, { skipSovereignty: true });
    }
    if (repair.repairedCount > 0) {
      logProjectRegistryDuplicatesRepaired(repair, resolvedRoot);
    }
    logProjectRegistryLoaded(cachedState, resolvedRoot);
    return cachedState;
  } catch {
    cachedRootDir = resolvedRoot;
    cachedState = emptyState();
    return cachedState;
  }
}

function ensureVaultProject(record: ProjectRegistryRecord): void {
  const vault = getDevPulseV2ProjectVaultAuthority();
  if (vault.getProject(record.projectId)) return;
  vault.ensureProjectWithId({
    projectId: record.projectId,
    name: record.name,
    summary: record.summary || `Workspace project — ${record.name}`,
  });
}

function ensureWorkspaceSession(record: ProjectRegistryRecord): MultiProjectWorkspaceSession {
  const ctx = resolveProjectContext({
    projectId: record.projectId,
    projectName: record.name,
    createIfMissing: true,
  });
  return ctx.session;
}

function hydrateWorkspaceSessions(state: ProjectRegistryFile): void {
  for (const record of state.projects) {
    if (record.status === 'ACTIVE') {
      ensureWorkspaceSession(record);
    }
  }
  if (state.activeProjectId) {
    setActiveProjectId(state.activeProjectId);
  }
}

function touchRecord(record: ProjectRegistryRecord): void {
  const stamp = nowIso();
  record.updatedAt = stamp;
  record.lastActivityAt = stamp;
}

function normalizeProjectName(name: string): string {
  return normalizeProjectRegistryName(name);
}

function pickPrimaryActiveProject(group: ProjectRegistryRecord[]): ProjectRegistryRecord {
  return group
    .slice()
    .sort((a, b) => {
      const byCreated = a.createdAt.localeCompare(b.createdAt);
      if (byCreated !== 0) return byCreated;
      return a.projectId.localeCompare(b.projectId);
    })[0]!;
}

function ensureActiveProjectSelection(state: ProjectRegistryFile): boolean {
  let mutated = false;
  if (state.activeProjectId) {
    const current = state.projects.find((p) => p.projectId === state.activeProjectId);
    if (!current || current.status !== 'ACTIVE') {
      const fallback = state.projects.find((p) => p.status === 'ACTIVE');
      state.activeProjectId = fallback?.projectId ?? null;
      mutated = true;
    }
  } else {
    const fallback = state.projects.find((p) => p.status === 'ACTIVE');
    if (fallback) {
      state.activeProjectId = fallback.projectId;
      mutated = true;
    }
  }
  return mutated;
}

function logProjectRegistryDuplicatesRepaired(
  repair: ProjectRegistryDuplicateRepairResult,
  rootDir: string,
): void {
  const entry = {
    event: PROJECT_REGISTRY_DUPLICATES_REPAIRED,
    at: nowIso(),
    count: repair.repairedCount,
    names: repair.archivedNames,
    archivedProjectIds: repair.archivedProjectIds,
    keptProjectIds: repair.keptProjectIds,
  };
  const message = `${PROJECT_REGISTRY_DUPLICATES_REPAIRED} count=${repair.repairedCount} names=${repair.archivedNames.join(', ')}`;
  console.info(`[project-registry-v1] ${message}`);
  const path = operatorLogPath(rootDir);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(entry)}\n`, 'utf8');
}

export function repairDuplicateActiveProjects(state: ProjectRegistryFile): ProjectRegistryDuplicateRepairResult {
  let repairedCount = 0;
  let mutated = false;
  const archivedNames: string[] = [];
  const archivedProjectIds: string[] = [];
  const keptProjectIds: string[] = [];

  for (const record of state.projects) {
    const trimmed = record.name.trim();
    if (trimmed !== record.name) {
      record.name = trimmed;
      touchRecord(record);
      mutated = true;
    }
  }

  const activeByNormalizedName = new Map<string, ProjectRegistryRecord[]>();
  for (const record of state.projects) {
    if (record.status !== 'ACTIVE') continue;
    const normalized = normalizeProjectName(record.name);
    const group = activeByNormalizedName.get(normalized) ?? [];
    group.push(record);
    activeByNormalizedName.set(normalized, group);
  }

  for (const group of activeByNormalizedName.values()) {
    if (group.length <= 1) continue;
    const primary = pickPrimaryActiveProject(group);
    keptProjectIds.push(primary.projectId);
    for (const duplicate of group) {
      if (duplicate.projectId === primary.projectId) continue;
      duplicate.status = 'ARCHIVED';
      touchRecord(duplicate);
      archivedNames.push(duplicate.name);
      archivedProjectIds.push(duplicate.projectId);
      repairedCount += 1;
      mutated = true;
      if (state.activeProjectId === duplicate.projectId) {
        state.activeProjectId = primary.projectId;
        mutated = true;
      }
    }
  }

  if (ensureActiveProjectSelection(state)) {
    mutated = true;
  }

  return {
    repairedCount,
    archivedNames,
    archivedProjectIds,
    keptProjectIds,
    mutated,
  };
}

function findActiveProjectByNormalizedName(
  state: ProjectRegistryFile,
  normalizedName: string,
  excludeProjectId?: string,
): ProjectRegistryRecord | undefined {
  return state.projects.find(
    (p) =>
      p.status === 'ACTIVE' &&
      p.projectId !== excludeProjectId &&
      normalizeProjectName(p.name) === normalizedName,
  );
}

function assertActiveProjectNameAvailable(
  state: ProjectRegistryFile,
  name: string,
  excludeProjectId?: string,
): void {
  const normalized = normalizeProjectName(name);
  const existing = findActiveProjectByNormalizedName(state, normalized, excludeProjectId);
  if (existing) {
    throw new ProjectRegistryDuplicateNameError(existing.name, existing.projectId);
  }
}

function toSummaryItem(record: ProjectRegistryRecord, activeProjectId: string | null): ProjectRegistrySummaryItem {
  return {
    projectId: record.projectId,
    name: record.name,
    projectKind: record.projectKind,
    status: record.status,
    summary: record.summary,
    createdAt: record.createdAt,
    lastActivityAt: record.lastActivityAt,
    isActive: record.projectId === activeProjectId && record.status === 'ACTIVE',
  };
}

export function resetProjectRegistryV1ForTests(rootDir?: string): void {
  invalidateProjectRegistryV1Cache();
  const resolvedRoot = resolveRootDir(rootDir);
  if (!isProjectRegistryTestRoot(resolvedRoot)) {
    console.warn(`[project-registry-v1] skip registry reset — not a test root: ${resolvedRoot}`);
    return;
  }
  const path = registryPath(resolvedRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(emptyState(), null, 2), 'utf8');
}

export function readProjectRegistryState(rootDir?: string): ProjectRegistryFile {
  return loadState(rootDir);
}

export function loadProjectRegistryV1(rootDir?: string): ProjectRegistryFile {
  const state = loadState(rootDir);
  hydrateWorkspaceSessions(state);
  return state;
}

export function buildProjectRegistrySummary(rootDir?: string): ProjectRegistrySummary {
  const state = loadProjectRegistryV1(rootDir);
  return buildSummaryFromState(state);
}

export function invalidateProjectRegistryV1Cache(): void {
  cachedState = null;
  cachedRootDir = null;
  projectCounter = 0;
}

export function writeProjectRegistryV1ForTests(state: ProjectRegistryFile, rootDir?: string): void {
  invalidateProjectRegistryV1Cache();
  persistState(state, rootDir, { skipSovereignty: true });
}

export function getProjectRegistryOperatorLogPath(rootDir?: string): string {
  return operatorLogPath(resolveRootDir(rootDir));
}

export function getProjectRegistryV1FilePath(rootDir?: string): string {
  return registryPath(resolveRootDir(rootDir));
}

function scheduleRegistryProjectMaterialization(record: ProjectRegistryRecord, rootDir?: string): void {
  setImmediate(() => {
    try {
      ensureVaultProject(record);
      ensureWorkspaceSession(record);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[project-registry-v1] background materialization failed for ${record.projectId}: ${message}`);
    }
  });
  void rootDir;
}

function buildSummaryFromState(state: ProjectRegistryFile): ProjectRegistrySummary {
  const activeProjects = state.projects.filter((p) => p.status === 'ACTIVE');
  const hasActiveSelection =
    Boolean(state.activeProjectId) &&
    activeProjects.some((p) => p.projectId === state.activeProjectId);
  return {
    count: activeProjects.length,
    activeCount: hasActiveSelection ? 1 : 0,
    items: activeProjects
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
      .map((p) => toSummaryItem(p, state.activeProjectId)),
    activeProjectId: state.activeProjectId,
  };
}

export function buildProjectRegistrySummaryFromState(state: ProjectRegistryFile): ProjectRegistrySummary {
  return buildSummaryFromState(state);
}

export function buildProjectRegistrySummaryFast(rootDir?: string): ProjectRegistrySummary {
  const state = loadState(rootDir);
  return buildSummaryFromState(state);
}

export function bootstrapProjectRegistryV1(rootDir?: string): ProjectRegistryFile {
  invalidateProjectRegistryV1Cache();
  return loadProjectRegistryV1(rootDir);
}

export function validateCreateRegistryProjectName(name: string, rootDir?: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Project name is required');
  }

  const state = loadState(rootDir);
  assertActiveProjectNameAvailable(state, trimmed);
  return trimmed;
}

export function createRegistryProject(input: {
  name: string;
  summary?: string;
  rootDir?: string;
  projectKind?: ProjectRegistryRecord['projectKind'];
}): ProjectRegistryRecord {
  const trimmed = validateCreateRegistryProjectName(input.name, input.rootDir);

  const state = loadState(input.rootDir);
  const stamp = nowIso();
  const record: ProjectRegistryRecord = {
    projectId: generateProjectId(trimmed),
    name: trimmed,
    projectKind: input.projectKind ?? 'USER',
    status: 'ACTIVE',
    createdAt: stamp,
    updatedAt: stamp,
    lastActivityAt: stamp,
    summary: input.summary?.trim() || `Workspace project — ${trimmed}`,
  };

  state.projects.push(record);
  state.activeProjectId = record.projectId;
  persistState(state, input.rootDir);
  logProjectRegistryProjectPersisted(record, resolveRootDir(input.rootDir));

  setActiveProjectId(record.projectId);
  scheduleRegistryProjectMaterialization(record, input.rootDir);

  return record;
}

export function renameRegistryProject(input: {
  projectId: string;
  name: string;
  rootDir?: string;
}): ProjectRegistryRecord {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error('Project name is required');
  }

  const state = loadState(input.rootDir);
  const record = state.projects.find((p) => p.projectId === input.projectId);
  if (!record) {
    throw new Error('Project not found');
  }
  if (record.status === 'ARCHIVED') {
    throw new Error('Cannot rename archived project');
  }

  assertActiveProjectNameAvailable(state, trimmed, record.projectId);

  record.name = trimmed;
  touchRecord(record);
  persistState(state, input.rootDir);

  const session = ensureWorkspaceSession(record);
  session.projectName = trimmed;

  const vault = getDevPulseV2ProjectVaultAuthority();
  vault.renameProject(record.projectId, trimmed);

  return record;
}

export function archiveRegistryProject(input: { projectId: string; rootDir?: string }): ProjectRegistryRecord {
  const state = loadState(input.rootDir);
  const record = state.projects.find((p) => p.projectId === input.projectId);
  if (!record) {
    throw new Error('Project not found');
  }

  record.status = 'ARCHIVED';
  touchRecord(record);

  if (state.activeProjectId === record.projectId) {
    const nextActive = state.projects.find((p) => p.status === 'ACTIVE' && p.projectId !== record.projectId);
    state.activeProjectId = nextActive?.projectId ?? null;
    if (nextActive) {
      setActiveProjectId(nextActive.projectId);
    }
  }

  persistState(state, input.rootDir);
  return record;
}

export function setRegistryActiveProject(input: { projectId: string; rootDir?: string }): ProjectRegistryRecord {
  const state = loadState(input.rootDir);
  const record = state.projects.find((p) => p.projectId === input.projectId);
  if (!record) {
    throw new Error('Project not found');
  }
  if (record.status === 'ARCHIVED') {
    throw new Error('Cannot activate archived project');
  }

  state.activeProjectId = record.projectId;
  touchRecord(record);
  persistState(state, input.rootDir);

  setActiveProjectId(record.projectId);
  scheduleRegistryProjectMaterialization(record, input.rootDir);

  return record;
}

export function getRegistryProject(projectId: string, rootDir?: string): ProjectRegistryRecord | null {
  const state = loadState(rootDir);
  return state.projects.find((p) => p.projectId === projectId) ?? null;
}
