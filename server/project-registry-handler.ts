/**
 * Project Registry V1 — HTTP handlers for canonical project workspace registry.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PROJECT_REGISTRY_DUPLICATE_NAME_CODE,
  archiveRegistryProject,
  buildProjectRegistrySummaryFast,
  createRegistryProject,
  readProjectRegistryState,
  ProjectRegistryDuplicateNameError,
  renameRegistryProject,
  getRegistryProject,
  getProjectRegistryV1FilePath,
  validateCreateRegistryProjectName,
} from '../src/project-registry-v1/index.js';
import {
  listMultiProjectWorkspacesForRegistry,
  pruneWorkspaceSessionsNotInRegistry,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { executeProjectTabContextSwitch } from '../src/project-context-switching/index.js';
import {
  deriveProjectBuildState,
  listProjectBuildStates,
} from '../src/project-resume-state/index.js';
import {
  getProjectRegistryHydrationSnapshot,
  isProjectRegistryHydrationReady,
} from '../src/project-registry-startup-hydration/index.js';
import {
  isUserFacingRegistryProject,
  resolveProjectKind,
} from '../src/project-registry-v1/project-kind.js';
import { countRegistryTierProjects, listUserFacingActiveProjectIds } from '../src/project-registry-sovereignty/index.js';
import { executeRegistrySovereigntyCleanup } from '../src/project-registry-sovereignty/registry-sovereignty-engine.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-registry-v1',
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

export function buildRegistryGetResponse(
  rootDir: string,
  options?: { includeSystemProjects?: boolean },
) {
  const includeSystemProjects = options?.includeSystemProjects === true;
  const hydration = getProjectRegistryHydrationSnapshot();
  const state = readProjectRegistryState(rootDir);
  const summary = buildProjectRegistrySummaryFast(rootDir);
  const registryPath = getProjectRegistryV1FilePath(rootDir);
  const sovereignUserProjectIds = new Set(listUserFacingActiveProjectIds(rootDir));
  const activeRecords = state.projects.filter((project) => project.status === 'ACTIVE');
  const visibleActiveRecords = includeSystemProjects
    ? activeRecords
    : activeRecords.filter((project) => sovereignUserProjectIds.has(project.projectId));
  const updatedAt =
    activeRecords.reduce(
      (latest, project) => (project.updatedAt > latest ? project.updatedAt : latest),
      activeRecords[0]?.updatedAt ?? '',
    ) || new Date().toISOString();

  const projectsWithBuildState = summary.items
    .filter((item) =>
      includeSystemProjects ? true : isUserFacingRegistryProject({ ...item, status: 'ACTIVE' }),
    )
    .map((item) => {
    const buildState = deriveProjectBuildState(item.projectId, rootDir);
    return {
      ...item,
      projectKind: item.projectKind ?? resolveProjectKind({ projectId: item.projectId, projectKind: item.projectKind }),
      buildState: buildState?.buildState ?? 'NEEDS_WORK',
      resumable: buildState?.resumable ?? false,
      repairable: buildState?.repairable ?? false,
      bannerMessage: buildState?.bannerMessage ?? null,
      primaryActions: buildState?.primaryActions ?? [],
      hasOriginalPrompt: buildState?.evidence.hasOriginalPrompt ?? false,
    };
  });

  const archivedProjects = state.projects
    .filter((project) => project.status === 'ARCHIVED')
    .map((project) => ({
      projectId: project.projectId,
      name: project.name,
      status: project.status,
      summary: project.summary,
      createdAt: project.createdAt,
      lastActivityAt: project.lastActivityAt,
      isActive: false,
    }));

  const registryProjectIds = visibleActiveRecords.map((project) => project.projectId);
  pruneWorkspaceSessionsNotInRegistry(registryProjectIds);

  const filteredActiveProjectId =
    state.activeProjectId &&
    visibleActiveRecords.some((project) => project.projectId === state.activeProjectId)
      ? state.activeProjectId
      : visibleActiveRecords[0]?.projectId ?? null;

  return {
    ok: true,
    hydrationStatus: hydration.phase,
    hydration: hydration,
    hydrationReady: isProjectRegistryHydrationReady(),
    registry: {
      ...state,
      projects: includeSystemProjects
        ? state.projects
        : state.projects.filter(
            (project) => project.status !== 'ACTIVE' || isUserFacingRegistryProject(project),
          ),
    },
    registrySovereignty: countRegistryTierProjects(rootDir),
    projects: {
      ...summary,
      count: visibleActiveRecords.length,
      activeCount: filteredActiveProjectId ? 1 : 0,
      items: projectsWithBuildState,
    },
    includeSystemProjects,
    hiddenSystemProjectCount: activeRecords.length - visibleActiveRecords.length,
    archivedProjects,
    projectBuildStates: listProjectBuildStates(rootDir),
    activeProjectId: filteredActiveProjectId,
    total: visibleActiveRecords.length,
    active: filteredActiveProjectId ? 1 : 0,
    registryPath,
    updatedAt,
    multiProjectWorkspaces: listMultiProjectWorkspacesForRegistry(registryProjectIds),
  };
}

function buildFastRegistryResponse(rootDir: string) {
  return buildRegistryGetResponse(rootDir);
}

export function sendProjectRegistryJson(
  res: ServerResponse,
  rootDir: string,
  options?: { includeSystemProjects?: boolean },
): void {
  sendJson(res, 200, buildRegistryGetResponse(rootDir, options));
}

export const PROJECT_REGISTRY_GET_PATHS = [
  '/api/projects/registry',
  '/api/projects/registry.json',
  '/api/projects',
] as const;

export function isProjectRegistryGetPath(urlPath: string): boolean {
  return PROJECT_REGISTRY_GET_PATHS.includes(urlPath as (typeof PROJECT_REGISTRY_GET_PATHS)[number]);
}

export function handleProjectRegistryGetRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
  searchParams?: URLSearchParams,
): void {
  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-DevPulse-Surface': 'project-registry-v1',
    });
    res.end();
    return;
  }
  const includeSystemProjects = searchParams?.get('includeSystemProjects') === 'true';
  sendProjectRegistryJson(res, rootDir, { includeSystemProjects });
}

export async function handleProjectRegistryMutation(
  req: IncomingMessage,
  res: ServerResponse,
  action: 'create' | 'rename' | 'archive' | 'set-active' | 'context-switch' | 'cleanup-test-projects',
  rootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);
    if (action === 'cleanup-test-projects') {
      const sovereignty = await executeRegistrySovereigntyCleanup({
        rootDir,
        confirmed: body.confirmed === true,
        preview: body.preview === true || body.confirmed !== true,
      });
      sendJson(res, 200, {
        ...buildFastRegistryResponse(rootDir),
        action: 'cleanup-test-projects',
        cleanup: {
          ok: sovereignty.ok,
          preview: sovereignty.preview,
          confirmed: sovereignty.confirmed,
          candidates: sovereignty.migration.migrated.map((entry) => ({
            projectId: entry.projectId,
            name: entry.name,
            projectKind: entry.projectKind,
            source: entry.from,
          })),
          deletedProjectIds: [...sovereignty.deletedArtifactProjectIds],
          preservedUserProjectIds: [...sovereignty.preservedUserProjectIds],
          errors: [...sovereignty.errors],
        },
        registrySovereignty: sovereignty,
      });
      return;
    }
    if (action === 'create') {
      const name = String(body.name ?? '').trim();
      const summary = body.summary ? String(body.summary) : undefined;
      try {
        validateCreateRegistryProjectName(name, rootDir);
      } catch (validationErr) {
        if (validationErr instanceof ProjectRegistryDuplicateNameError) {
          sendJson(res, 409, {
            ok: false,
            error: validationErr.message,
            code: PROJECT_REGISTRY_DUPLICATE_NAME_CODE,
            existingProjectId: validationErr.existingProjectId,
            existingProjectName: validationErr.displayName,
          });
          return;
        }
        throw validationErr;
      }
      const record = createRegistryProject({ name, summary, rootDir });
      sendJson(res, 200, { ...buildFastRegistryResponse(rootDir), project: record, action: 'create' });
      return;
    }

    const projectId = String(body.projectId ?? '').trim();
    if (!projectId) {
      sendJson(res, 400, { ok: false, error: 'projectId is required' });
      return;
    }

    if (action === 'rename') {
      const name = String(body.name ?? '').trim();
      const record = renameRegistryProject({ projectId, name, rootDir });
      sendJson(res, 200, { ...buildFastRegistryResponse(rootDir), project: record, action: 'rename' });
      return;
    }

    if (action === 'archive') {
      const record = archiveRegistryProject({ projectId, rootDir });
      sendJson(res, 200, { ...buildFastRegistryResponse(rootDir), project: record, action: 'archive' });
      return;
    }

    if (action === 'context-switch' || action === 'set-active') {
      const switchResult = executeProjectTabContextSwitch({ projectId, rootDir, source: 'api' });
      if (!switchResult.ok) {
        sendJson(res, 400, { ok: false, error: switchResult.error ?? 'context switch failed' });
        return;
      }
      const record = getRegistryProject(projectId, rootDir);
      sendJson(res, 200, {
        ...buildFastRegistryResponse(rootDir),
        project: record,
        action: action === 'context-switch' ? 'context-switch' : 'set-active',
        projectContext: switchResult.projectContext,
        projectContextReset: {
          clearedAlignmentWarnings: true,
          clearedGreetingOverlap: true,
          commandCenterWorkspaceMode: true,
        },
        executionTraceEvents: switchResult.executionTraceEvents,
      });
      return;
    }
  } catch (err) {
    if (err instanceof ProjectRegistryDuplicateNameError) {
      sendJson(res, 409, {
        ok: false,
        error: err.message,
        code: PROJECT_REGISTRY_DUPLICATE_NAME_CODE,
        existingProjectId: err.existingProjectId,
        existingProjectName: err.displayName,
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'project registry mutation failed';
    sendJson(res, 400, { ok: false, error: message });
  }
}

export async function readRegistryFileForValidation(rootDir: string): Promise<string | null> {
  const path = join(rootDir, '.aidevengine', 'project-registry-v1.json');
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}
