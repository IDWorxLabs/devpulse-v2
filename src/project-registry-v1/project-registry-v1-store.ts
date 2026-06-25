/**
 * Project Registry V1 — file-backed canonical project store.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/index.js';
import {
  resolveProjectContext,
  setActiveProjectId,
  type MultiProjectWorkspaceSession,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import type {
  ProjectRegistryFile,
  ProjectRegistryRecord,
  ProjectRegistrySummary,
  ProjectRegistrySummaryItem,
} from './project-registry-v1-types.js';

const REGISTRY_DIR = '.aidevengine';
const REGISTRY_FILE = 'project-registry-v1.json';

let cachedRootDir: string | null = null;
let cachedState: ProjectRegistryFile | null = null;
let projectCounter = 0;

function registryPath(rootDir: string): string {
  return join(rootDir, REGISTRY_DIR, REGISTRY_FILE);
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
  return rootDir ?? cachedRootDir ?? process.cwd();
}

function persistState(state: ProjectRegistryFile, rootDir?: string): void {
  const resolvedRoot = resolveRootDir(rootDir);
  const path = registryPath(resolvedRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
  cachedRootDir = resolvedRoot;
  cachedState = state;
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

function toSummaryItem(record: ProjectRegistryRecord, activeProjectId: string | null): ProjectRegistrySummaryItem {
  return {
    projectId: record.projectId,
    name: record.name,
    status: record.status,
    summary: record.summary,
    createdAt: record.createdAt,
    lastActivityAt: record.lastActivityAt,
    isActive: record.projectId === activeProjectId && record.status === 'ACTIVE',
  };
}

export function resetProjectRegistryV1ForTests(rootDir?: string): void {
  cachedState = null;
  cachedRootDir = null;
  projectCounter = 0;
  const resolvedRoot = resolveRootDir(rootDir);
  const path = registryPath(resolvedRoot);
  if (existsSync(path)) {
    writeFileSync(path, JSON.stringify(emptyState(), null, 2), 'utf8');
  }
}

export function getProjectRegistryV1FilePath(rootDir?: string): string {
  return registryPath(resolveRootDir(rootDir));
}

export function loadProjectRegistryV1(rootDir?: string): ProjectRegistryFile {
  const state = loadState(rootDir);
  hydrateWorkspaceSessions(state);
  return state;
}

export function buildProjectRegistrySummary(rootDir?: string): ProjectRegistrySummary {
  const state = loadProjectRegistryV1(rootDir);
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

export function createRegistryProject(input: {
  name: string;
  summary?: string;
  rootDir?: string;
}): ProjectRegistryRecord {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error('Project name is required');
  }

  const state = loadState(input.rootDir);
  const stamp = nowIso();
  const record: ProjectRegistryRecord = {
    projectId: generateProjectId(trimmed),
    name: trimmed,
    status: 'ACTIVE',
    createdAt: stamp,
    updatedAt: stamp,
    lastActivityAt: stamp,
    summary: input.summary?.trim() || `Workspace project — ${trimmed}`,
  };

  state.projects.push(record);
  state.activeProjectId = record.projectId;
  persistState(state, input.rootDir);

  ensureVaultProject(record);
  ensureWorkspaceSession(record);
  setActiveProjectId(record.projectId);

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

  ensureWorkspaceSession(record);
  setActiveProjectId(record.projectId);

  return record;
}

export function getRegistryProject(projectId: string, rootDir?: string): ProjectRegistryRecord | null {
  const state = loadState(rootDir);
  return state.projects.find((p) => p.projectId === projectId) ?? null;
}
