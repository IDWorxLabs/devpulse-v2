/**
 * Fast Project Create V1 — instant USER project + session creation without full registry hydration.
 */

import {
  PROJECT_REGISTRY_DUPLICATE_NAME_CODE,
  ProjectRegistryDuplicateNameError,
  buildProjectRegistrySummaryFast,
  createRegistryProject,
  getProjectRegistryV1FilePath,
  isUserFacingRegistryProject,
  readProjectRegistryState,
  validateCreateRegistryProjectName,
} from '../project-registry-v1/index.js';
import {
  ensureProjectSessionForProject,
  resolveProjectSessionContext,
} from '../project-session-continuity-v1/index.js';
import type {
  FastProjectCreateDuplicateResult,
  FastProjectCreateInput,
  FastProjectCreateResult,
  FastProjectCreateSuccessResult,
} from './fast-project-create-types.js';
import { FAST_PROJECT_CREATE_CONTRACT_VERSION } from './fast-project-create-types.js';

function resolveAvailableProjectName(baseName: string, rootDir?: string): string {
  const trimmed = baseName.trim() || 'Project';
  try {
    validateCreateRegistryProjectName(trimmed, rootDir);
    return trimmed;
  } catch (err) {
    if (!(err instanceof ProjectRegistryDuplicateNameError)) {
      throw err;
    }
  }

  for (let counter = 2; counter < 1000; counter += 1) {
    const candidate = `${trimmed} (${counter})`;
    try {
      validateCreateRegistryProjectName(candidate, rootDir);
      return candidate;
    } catch (err) {
      if (!(err instanceof ProjectRegistryDuplicateNameError)) {
        throw err;
      }
    }
  }

  throw new Error('Could not allocate a unique project name');
}

function buildMinimalRegistrySnapshot(rootDir?: string): FastProjectCreateSuccessResult['registrySnapshot'] {
  const state = readProjectRegistryState(rootDir);
  const summary = buildProjectRegistrySummaryFast(rootDir);
  const activeRecords = state.projects.filter((project) => project.status === 'ACTIVE');
  const updatedAt =
    activeRecords.reduce(
      (latest, project) => (project.updatedAt > latest ? project.updatedAt : latest),
      activeRecords[0]?.updatedAt ?? '',
    ) || new Date().toISOString();

  return {
    ...summary,
    items: summary.items.filter((item) => isUserFacingRegistryProject({ ...item, status: 'ACTIVE' })),
    registryPath: getProjectRegistryV1FilePath(rootDir),
    updatedAt,
  };
}

export function executeFastProjectCreate(input: FastProjectCreateInput): FastProjectCreateResult {
  const rootDir = input.rootDir;
  const requestedName = String(input.name ?? '').trim() || 'Project';
  const allocateFreshName = input.confirmFreshCopy === true || input.forceFreshProject === true;

  if (!allocateFreshName) {
    try {
      validateCreateRegistryProjectName(requestedName, rootDir);
    } catch (err) {
      if (err instanceof ProjectRegistryDuplicateNameError) {
        const duplicate: FastProjectCreateDuplicateResult = {
          ok: false,
          code: PROJECT_REGISTRY_DUPLICATE_NAME_CODE,
          error: err.message,
          existingProjectId: err.existingProjectId,
          existingProjectName: err.displayName,
          duplicateChoices: ['resume', 'fresh-copy', 'cancel'],
          contractVersion: FAST_PROJECT_CREATE_CONTRACT_VERSION,
        };
        return duplicate;
      }
      throw err;
    }
  }

  const resolvedName = allocateFreshName
    ? resolveAvailableProjectName(requestedName, rootDir)
    : requestedName;

  const record = createRegistryProject({
    name: resolvedName,
    summary: input.summary,
    rootDir,
    projectKind: 'USER',
  });

  if (!isUserFacingRegistryProject(record)) {
    throw new Error('Fast project create must produce a USER project');
  }

  const session = ensureProjectSessionForProject({
    projectId: record.projectId,
    projectName: record.name,
    rootDir,
  });

  const projectSession = resolveProjectSessionContext(record.projectId, session.sessionId, rootDir);
  if (!projectSession) {
    throw new Error('Failed to resolve project session after fast create');
  }

  return {
    ok: true,
    projectId: record.projectId,
    projectName: record.name,
    activeSessionId: session.sessionId,
    project: record,
    registrySnapshot: buildMinimalRegistrySnapshot(rootDir),
    projectSession,
    action: 'fast-create',
    contractVersion: FAST_PROJECT_CREATE_CONTRACT_VERSION,
  };
}
