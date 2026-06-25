/**
 * Project Registry V1 — HTTP handlers for canonical project workspace registry.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  archiveRegistryProject,
  buildProjectRegistrySummary,
  createRegistryProject,
  loadProjectRegistryV1,
  renameRegistryProject,
  setRegistryActiveProject,
} from '../src/project-registry-v1/index.js';
import {
  getActiveProjectId,
  listMultiProjectWorkspaces,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';

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

function buildRegistryResponse(rootDir: string) {
  const summary = buildProjectRegistrySummary(rootDir);
  return {
    ok: true,
    registry: loadProjectRegistryV1(rootDir),
    projects: summary,
    activeProjectId: getActiveProjectId(),
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
  };
}

export function sendProjectRegistryJson(res: ServerResponse, rootDir: string): void {
  sendJson(res, 200, buildRegistryResponse(rootDir));
}

export async function handleProjectRegistryMutation(
  req: IncomingMessage,
  res: ServerResponse,
  action: 'create' | 'rename' | 'archive' | 'set-active',
  rootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);
    if (action === 'create') {
      const name = String(body.name ?? '').trim();
      const summary = body.summary ? String(body.summary) : undefined;
      const record = createRegistryProject({ name, summary, rootDir });
      sendJson(res, 200, { ...buildRegistryResponse(rootDir), project: record, action: 'create' });
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
      sendJson(res, 200, { ...buildRegistryResponse(rootDir), project: record, action: 'rename' });
      return;
    }

    if (action === 'archive') {
      const record = archiveRegistryProject({ projectId, rootDir });
      sendJson(res, 200, { ...buildRegistryResponse(rootDir), project: record, action: 'archive' });
      return;
    }

    const record = setRegistryActiveProject({ projectId, rootDir });
    sendJson(res, 200, { ...buildRegistryResponse(rootDir), project: record, action: 'set-active' });
  } catch (err) {
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
