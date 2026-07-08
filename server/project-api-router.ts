/**
 * Project API router — registers lifecycle and registry routes before static/405 fallbacks.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  handleProjectRegistryGetRequest,
  handleProjectRegistryMutation,
  isProjectRegistryGetPath,
} from './project-registry-handler.js';
import {
  handleProjectLifecycleGet,
  handleProjectLifecycleMutation,
} from './project-lifecycle-handler.js';
import {
  FAST_PROJECT_CREATE_POST_PATH,
  handleFastProjectCreateRequest,
} from './fast-project-create-handler.js';
import { handleProjectNameConflictResolutionRequest } from './project-name-conflict-handler.js';
import { PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH } from '../src/project-name-conflict-resolution-v1/index.js';

const LIFECYCLE_POST_ACTIONS = new Set(['delete', 'duplicate', 'restore']);
const REGISTRY_POST_ACTIONS = new Set([
  'create',
  'rename',
  'archive',
  'set-active',
  'context-switch',
  'cleanup-test-projects',
]);

type LifecyclePostAction = 'delete' | 'duplicate' | 'restore';
type RegistryPostAction =
  | 'create'
  | 'rename'
  | 'archive'
  | 'set-active'
  | 'context-switch'
  | 'cleanup-test-projects';

function sendProjectApiJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-api-router',
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendProjectApiMethodNotAllowed(
  res: ServerResponse,
  urlPath: string,
  allowed: string,
): void {
  sendProjectApiJson(res, 405, {
    error: `Method not allowed for ${urlPath} — ${allowed}`,
    path: urlPath,
  });
}

function sendProjectApiHeadOk(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-api-router',
  });
  res.end();
}

export const PROJECT_LIFECYCLE_POST_PATHS = [
  '/api/projects/delete',
  '/api/projects/duplicate',
  '/api/projects/restore',
] as const;

/**
 * Handles project registry and lifecycle HTTP routes. Returns true when the path is owned by this router.
 */
export async function tryHandleProjectApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string,
  rootDir: string,
  searchParams?: URLSearchParams,
): Promise<boolean> {
  if (isProjectRegistryGetPath(urlPath)) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      handleProjectRegistryGetRequest(req, res, rootDir, searchParams);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only GET or HEAD');
    return true;
  }

  if (urlPath === FAST_PROJECT_CREATE_POST_PATH) {
    if (req.method === 'POST') {
      await handleFastProjectCreateRequest(req, res, rootDir);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only POST');
    return true;
  }

  if (urlPath === PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH) {
    if (req.method === 'POST') {
      await handleProjectNameConflictResolutionRequest(req, res, rootDir, rootDir);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only POST');
    return true;
  }

  const postMatch = urlPath.match(/^\/api\/projects\/([a-z-]+)$/);
  if (postMatch) {
    const action = postMatch[1];

    if (LIFECYCLE_POST_ACTIONS.has(action)) {
      if (req.method === 'POST') {
        await handleProjectLifecycleMutation(req, res, action as LifecyclePostAction, rootDir);
        return true;
      }
      sendProjectApiMethodNotAllowed(res, urlPath, 'only POST');
      return true;
    }

    if (REGISTRY_POST_ACTIONS.has(action)) {
      if (req.method === 'POST') {
        await handleProjectRegistryMutation(req, res, action as RegistryPostAction, rootDir);
        return true;
      }
      sendProjectApiMethodNotAllowed(res, urlPath, 'only POST');
      return true;
    }
  }

  if (urlPath === '/api/projects/lifecycle/ownership-audit') {
    if (req.method === 'GET') {
      handleProjectLifecycleGet(res, rootDir, 'ownership-audit');
      return true;
    }
    if (req.method === 'HEAD') {
      sendProjectApiHeadOk(res);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only GET or HEAD');
    return true;
  }

  if (urlPath === '/api/projects/lifecycle/delete-orphan') {
    if (req.method === 'POST') {
      await handleProjectLifecycleMutation(req, res, 'delete-orphan', rootDir);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only POST');
    return true;
  }

  if (urlPath.startsWith('/api/projects/lifecycle/artifacts/')) {
    const subPath = urlPath.slice('/api/projects/lifecycle/'.length);
    if (req.method === 'GET') {
      handleProjectLifecycleGet(res, rootDir, subPath);
      return true;
    }
    if (req.method === 'HEAD') {
      sendProjectApiHeadOk(res);
      return true;
    }
    sendProjectApiMethodNotAllowed(res, urlPath, 'only GET or HEAD');
    return true;
  }

  return false;
}
