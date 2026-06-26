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
import { listMultiProjectWorkspaces } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { executeProjectTabContextSwitch } from '../src/project-context-switching/index.js';

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

function buildRegistryGetResponse(rootDir: string) {
  const state = readProjectRegistryState(rootDir);
  const summary = buildProjectRegistrySummaryFast(rootDir);
  const registryPath = getProjectRegistryV1FilePath(rootDir);
  const activeRecords = state.projects.filter((project) => project.status === 'ACTIVE');
  const updatedAt =
    activeRecords.reduce(
      (latest, project) => (project.updatedAt > latest ? project.updatedAt : latest),
      activeRecords[0]?.updatedAt ?? '',
    ) || new Date().toISOString();

  return {
    ok: true,
    registry: state,
    projects: summary,
    activeProjectId: state.activeProjectId,
    total: summary.count,
    active: summary.activeCount,
    registryPath,
    updatedAt,
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
  };
}

function buildFastRegistryResponse(rootDir: string) {
  return buildRegistryGetResponse(rootDir);
}

export function sendProjectRegistryJson(res: ServerResponse, rootDir: string): void {
  sendJson(res, 200, buildRegistryGetResponse(rootDir));
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
  sendProjectRegistryJson(res, rootDir);
}

export async function handleProjectRegistryMutation(
  req: IncomingMessage,
  res: ServerResponse,
  action: 'create' | 'rename' | 'archive' | 'set-active' | 'context-switch',
  rootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);
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
