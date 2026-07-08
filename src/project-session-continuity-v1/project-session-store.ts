/**
 * Project Session Continuity V1 — durable session persistence.
 * Storage: .aidevengine/project-sessions/<projectId>/<sessionId>.json
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import type {
  ProjectSessionActivePointer,
  ProjectSessionChatMessage,
  ProjectSessionRecord,
} from './project-session-continuity-types.js';
import {
  PROJECT_SESSION_ACTIVE_POINTER_FILE,
  PROJECT_SESSION_STORE_DIR,
  PROJECT_SESSION_STORE_VERSION,
} from './project-session-continuity-types.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function resolveProjectSessionRootDir(rootDir?: string): string {
  return join(resolveProjectRegistryRootDir(rootDir), PROJECT_SESSION_STORE_DIR);
}

export function resolveProjectSessionFilePath(
  projectId: string,
  sessionId: string,
  rootDir?: string,
): string {
  return join(resolveProjectSessionRootDir(rootDir), projectId, `${sessionId}.json`);
}

export function resolveActiveSessionPointerPath(rootDir?: string): string {
  return join(resolveProjectSessionRootDir(rootDir), PROJECT_SESSION_ACTIVE_POINTER_FILE);
}

function ensureSessionDir(projectId: string, rootDir?: string): string {
  const dir = join(resolveProjectSessionRootDir(rootDir), projectId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function writeSessionRecord(record: ProjectSessionRecord, rootDir?: string): ProjectSessionRecord {
  ensureSessionDir(record.projectId, rootDir);
  const path = resolveProjectSessionFilePath(record.projectId, record.sessionId, rootDir);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return record;
}

export function readProjectSessionRecord(
  projectId: string,
  sessionId: string,
  rootDir?: string,
): ProjectSessionRecord | null {
  const path = resolveProjectSessionFilePath(projectId, sessionId, rootDir);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ProjectSessionRecord;
    if (parsed.version !== PROJECT_SESSION_STORE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readActiveSessionPointer(rootDir?: string): ProjectSessionActivePointer | null {
  const path = resolveActiveSessionPointerPath(rootDir);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ProjectSessionActivePointer;
  } catch {
    return null;
  }
}

export function writeActiveSessionPointer(
  input: { projectId: string; sessionId: string },
  rootDir?: string,
): ProjectSessionActivePointer {
  const root = resolveProjectSessionRootDir(rootDir);
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
  const pointer: ProjectSessionActivePointer = {
    activeProjectId: input.projectId,
    activeSessionId: input.sessionId,
    updatedAt: nowIso(),
  };
  writeFileSync(resolveActiveSessionPointerPath(rootDir), `${JSON.stringify(pointer, null, 2)}\n`, 'utf8');
  return pointer;
}

export function listProjectSessionIds(projectId: string, rootDir?: string): string[] {
  const dir = join(resolveProjectSessionRootDir(rootDir), projectId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));
}

export function findLatestActiveSessionForProject(
  projectId: string,
  rootDir?: string,
): ProjectSessionRecord | null {
  const sessionIds = listProjectSessionIds(projectId, rootDir);
  let latest: ProjectSessionRecord | null = null;
  for (const sessionId of sessionIds) {
    const record = readProjectSessionRecord(projectId, sessionId, rootDir);
    if (!record || record.status !== 'ACTIVE') continue;
    if (!latest || record.updatedAt > latest.updatedAt) {
      latest = record;
    }
  }
  return latest;
}

export function createProjectSessionRecord(input: {
  projectId: string;
  projectName: string;
  currentPrompt?: string | null;
  rootDir?: string;
}): ProjectSessionRecord {
  const stamp = nowIso();
  const record: ProjectSessionRecord = {
    version: PROJECT_SESSION_STORE_VERSION,
    sessionId: randomUUID(),
    projectId: input.projectId,
    projectName: input.projectName,
    projectKind: 'USER',
    createdAt: stamp,
    updatedAt: stamp,
    status: 'ACTIVE',
    currentPrompt: input.currentPrompt?.trim() || null,
    activeBuildRunId: null,
    previewUrl: null,
    previewBindingReason: null,
    previewRepairAction: null,
    executionTraceLink: null,
    buildStatus: null,
    workspacePath: null,
    buildProfile: null,
    chatMessages: [],
    chatHistoryHtml: null,
    aeeAelEvents: [],
  };
  writeSessionRecord(record, input.rootDir);
  writeActiveSessionPointer({ projectId: record.projectId, sessionId: record.sessionId }, input.rootDir);
  return record;
}

export function updateProjectSessionRecord(
  projectId: string,
  sessionId: string,
  patch: Partial<
    Pick<
      ProjectSessionRecord,
      | 'currentPrompt'
      | 'activeBuildRunId'
      | 'previewUrl'
      | 'previewBindingReason'
      | 'previewRepairAction'
      | 'executionTraceLink'
      | 'buildStatus'
      | 'workspacePath'
      | 'buildProfile'
      | 'chatHistoryHtml'
      | 'projectName'
    >
  >,
  rootDir?: string,
): ProjectSessionRecord | null {
  const existing = readProjectSessionRecord(projectId, sessionId, rootDir);
  if (!existing) return null;
  const updated: ProjectSessionRecord = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };
  return writeSessionRecord(updated, rootDir);
}

export function appendProjectSessionChatMessage(
  input: {
    projectId: string;
    sessionId: string;
    role: ProjectSessionChatMessage['role'];
    text: string;
    html?: string | null;
    timestamp?: number;
  },
  rootDir?: string,
): ProjectSessionRecord | null {
  const existing = readProjectSessionRecord(input.projectId, input.sessionId, rootDir);
  if (!existing) return null;
  const message: ProjectSessionChatMessage = {
    id: randomUUID(),
    role: input.role,
    text: input.text,
    html: input.html ?? null,
    timestamp: input.timestamp ?? Date.now(),
  };
  const updated: ProjectSessionRecord = {
    ...existing,
    chatMessages: [...existing.chatMessages, message],
    updatedAt: nowIso(),
  };
  return writeSessionRecord(updated, rootDir);
}

export function resetProjectSessionStoreForTests(rootDir?: string): void {
  void rootDir;
}

export function writeProjectSessionRecordForTests(
  record: ProjectSessionRecord,
  rootDir?: string,
): ProjectSessionRecord {
  return writeSessionRecord(record, rootDir);
}
