/**
 * Persist per-project domain / build-intent metadata for alignment checks.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import type {
  ProjectContextMetadata,
  ProjectContextProfileConfidence,
} from './project-context-alignment-types.js';
import {
  extractProjectNameDomainSignals,
  extractPromptDomainSignals,
} from './prompt-domain-analyzer.js';

interface ProjectContextMetadataFile {
  version: 1;
  projects: Record<string, ProjectContextMetadata>;
}

function storePath(rootDir?: string): string {
  const base = rootDir ?? resolveProjectRegistryRootDir();
  return join(base, '.aidevengine', 'project-context-metadata-v1.json');
}

function loadFile(rootDir?: string): ProjectContextMetadataFile {
  const path = storePath(rootDir);
  if (!existsSync(path)) {
    return { version: 1, projects: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ProjectContextMetadataFile;
    if (parsed.version === 1 && parsed.projects) return parsed;
  } catch {
    /* fall through */
  }
  return { version: 1, projects: {} };
}

function saveFile(state: ProjectContextMetadataFile, rootDir?: string): void {
  const path = storePath(rootDir);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function getProjectContextMetadata(
  projectId: string,
  rootDir?: string,
): ProjectContextMetadata | null {
  const state = loadFile(rootDir);
  return state.projects[projectId] ?? null;
}

export function listProjectContextMetadata(rootDir?: string): ProjectContextMetadata[] {
  const state = loadFile(rootDir);
  return Object.values(state.projects);
}

export function upsertProjectContextMetadata(
  input: {
    projectId: string;
    name: string;
    prompt?: string;
    profile?: string | null;
    summary?: string | null;
    profileConfidence?: ProjectContextProfileConfidence;
  },
  rootDir?: string,
): ProjectContextMetadata {
  const state = loadFile(rootDir);
  const existing = state.projects[input.projectId];
  const promptSignals = input.prompt
    ? extractPromptDomainSignals(input.prompt, { activeProjectName: input.name })
    : null;
  const nameSignals = extractProjectNameDomainSignals(input.name);
  const domainIds = [
    ...new Set([
      ...(existing?.keywords ?? []),
      ...nameSignals.domainIds,
      ...(promptSignals?.domainIds ?? []),
    ]),
  ];
  const domain =
    promptSignals?.domainLabel && promptSignals.domainIds.length
      ? promptSignals.domainLabel
      : nameSignals.domainLabel !== 'general application'
        ? nameSignals.domainLabel
        : existing?.domain ?? nameSignals.domainLabel;
  const appType =
    promptSignals?.appType ?? nameSignals.appType ?? existing?.appType ?? 'application';
  const profile = input.profile ?? promptSignals?.profile ?? existing?.profile ?? null;
  const profileConfidence: ProjectContextProfileConfidence =
    input.profileConfidence ??
    (domainIds.length >= 2 || profile ? 'HIGH' : domainIds.length === 1 ? 'MEDIUM' : 'LOW');

  const record: ProjectContextMetadata = {
    readOnly: true,
    projectId: input.projectId,
    name: input.name,
    domain,
    appType,
    keywords: domainIds,
    profile,
    lastBuildIntentSummary:
      input.summary?.trim() ||
      (input.prompt ? input.prompt.trim().slice(0, 240) : null) ||
      existing?.lastBuildIntentSummary ||
      null,
    profileConfidence,
    updatedAt: new Date().toISOString(),
  };

  state.projects[input.projectId] = record;
  saveFile(state, rootDir);
  return record;
}

export function resetProjectContextMetadataForTests(rootDir: string): void {
  const path = storePath(rootDir);
  if (existsSync(path)) {
    writeFileSync(path, `${JSON.stringify({ version: 1, projects: {} }, null, 2)}\n`, 'utf8');
  }
}
