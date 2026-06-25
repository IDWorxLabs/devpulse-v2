/**
 * Persist build-intent execution runs for Operator Feed / Autonomous Builder surfaces.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';

export interface BuildIntentRunRecord {
  readOnly: true;
  buildRunId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  profile: string | null;
  status: 'BUILDING' | 'READY' | 'FAILED' | 'QUEUED';
  stage: string;
  workspacePath: string | null;
  previewUrl: string | null;
  activeProjectId: string;
  planTaskCount: number | null;
  architectureSummary: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BuildIntentRunStateFile {
  version: 1;
  runs: BuildIntentRunRecord[];
}

function resolveStoreRoot(rootDir?: string): string {
  if (rootDir) return rootDir;
  return resolveProjectRegistryRootDir();
}

function resolveStorePath(rootDir?: string): string {
  const base = resolveStoreRoot(rootDir);
  return join(base, '.aidevengine', 'build-intent-runs-v1.json');
}

function loadState(path: string): BuildIntentRunStateFile {
  if (!existsSync(path)) {
    return { version: 1, runs: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as BuildIntentRunStateFile;
    if (parsed.version === 1 && Array.isArray(parsed.runs)) return parsed;
  } catch {
    /* fall through */
  }
  return { version: 1, runs: [] };
}

function saveState(path: string, state: BuildIntentRunStateFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function recordBuildIntentRun(
  record: BuildIntentRunRecord,
  rootDir?: string,
): BuildIntentRunRecord {
  if (!record.projectId?.trim()) {
    throw new Error('BUILD_RUN write rejected — projectId is required');
  }
  if (record.activeProjectId !== record.projectId) {
    throw new Error(
      `BUILD_RUN write rejected — activeProjectId ${record.activeProjectId} does not match projectId ${record.projectId}`,
    );
  }
  const path = resolveStorePath(rootDir);
  const state = loadState(path);
  const existingIndex = state.runs.findIndex((run) => run.buildRunId === record.buildRunId);
  if (existingIndex >= 0) {
    state.runs[existingIndex] = record;
  } else {
    state.runs.unshift(record);
  }
  state.runs = state.runs.slice(0, 50);
  saveState(path, state);
  console.info(
    `BUILD_INTENT_RUN_RECORDED buildRunId=${record.buildRunId} projectId=${record.projectId} status=${record.status} stage=${record.stage}`,
  );
  return record;
}

export function getBuildIntentRun(buildRunId: string, rootDir?: string): BuildIntentRunRecord | null {
  const state = loadState(resolveStorePath(rootDir));
  return state.runs.find((run) => run.buildRunId === buildRunId) ?? null;
}

export function listBuildIntentRuns(rootDir?: string): BuildIntentRunRecord[] {
  return loadState(resolveStorePath(rootDir)).runs;
}

export function listBuildIntentRunsForProject(
  projectId: string,
  rootDir?: string,
): BuildIntentRunRecord[] {
  return listBuildIntentRuns(rootDir).filter((run) => run.projectId === projectId);
}

export function resetBuildIntentRunsForTests(rootDir: string): void {
  const path = resolveStorePath(rootDir);
  if (existsSync(path)) {
    writeFileSync(path, `${JSON.stringify({ version: 1, runs: [] }, null, 2)}\n`, 'utf8');
  }
}
