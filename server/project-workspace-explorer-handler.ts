/**
 * Project Workspace Explorer V1 — read-only HTTP handlers.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import {
  getProjectWorkspaceFile,
  getProjectWorkspaceListing,
  getProjectWorkspaceSearch,
  isReadOnlyExplorerOperation,
  validateProjectId,
} from '../src/project-workspace-explorer/index.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-workspace-explorer-v1',
  });
  res.end(JSON.stringify(body, null, 2));
}

export const PROJECT_WORKSPACE_API_PREFIX = '/api/projects/' as const;

export function parseProjectWorkspaceApiPath(urlPath: string): {
  kind: 'workspace' | 'file' | null;
  projectId: string | null;
} {
  const match = urlPath.match(/^\/api\/projects\/([^/]+)\/(workspace|file)$/);
  if (!match) return { kind: null, projectId: null };
  return {
    kind: match[2] as 'workspace' | 'file',
    projectId: decodeURIComponent(match[1] ?? ''),
  };
}

export function handleProjectWorkspaceExplorerRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
  urlPath: string,
  searchParams: URLSearchParams,
): void {
  if (!isReadOnlyExplorerOperation(req.method ?? 'GET')) {
    sendJson(res, 405, { ok: false, error: 'Read-only — GET and HEAD only' });
    return;
  }

  const parsed = parseProjectWorkspaceApiPath(urlPath);
  if (!parsed.kind || !parsed.projectId) {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (!validateProjectId(parsed.projectId)) {
    sendJson(res, 400, { ok: false, error: 'Invalid projectId' });
    return;
  }

  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-DevPulse-Surface': 'project-workspace-explorer-v1',
    });
    res.end();
    return;
  }

  if (parsed.kind === 'workspace') {
    const searchQuery = searchParams.get('q')?.trim();
    if (searchQuery) {
      const result = getProjectWorkspaceSearch({
        rootDir,
        projectId: parsed.projectId,
        query: searchQuery,
      });
      sendJson(res, result.ok ? 200 : 404, result);
      return;
    }

    const folder = searchParams.get('folder') ?? '';
    const listing = getProjectWorkspaceListing({
      rootDir,
      projectId: parsed.projectId,
      folder,
    });
    sendJson(res, 200, listing);
    return;
  }

  const filePath = searchParams.get('path') ?? '';
  if (!filePath.trim()) {
    sendJson(res, 400, { ok: false, error: 'path query parameter is required' });
    return;
  }

  const fileResult = getProjectWorkspaceFile({
    rootDir,
    projectId: parsed.projectId,
    path: filePath,
  });
  sendJson(res, fileResult.ok ? 200 : 404, fileResult);
}
