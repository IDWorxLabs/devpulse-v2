/**
 * Build-from-prompt API — one-prompt live preview for AiDevEngine.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILD_FROM_PROMPT_API_PATH,
  BUILD_LIVE_PREVIEW_STATUS_API_PATH,
  getLastOnePromptLivePreviewBuildResult,
  getOnePromptLivePreviewPublicState,
  listGeneratedDevServers,
  runOnePromptLivePreviewBuild,
  setActiveProjectId,
} from '../src/one-prompt-live-preview/index.js';
import { listMultiProjectWorkspaces } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { readRequestBody } from './brain-api-handler.js';

const ROOT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function sendBuildJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'one-prompt-live-preview',
    'X-DevPulse-Phase': '27.3',
  });
  res.end(JSON.stringify(payload));
}

export async function handleBuildFromPromptRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      prompt?: string;
      message?: string;
      projectId?: string;
      projectName?: string;
    };
    const prompt = (body.prompt ?? body.message ?? '').trim();

    if (!prompt) {
      sendBuildJson(res, 400, { error: 'prompt or message is required' });
      return;
    }

    if (body.projectId) {
      setActiveProjectId(body.projectId);
    }

    const result = await runOnePromptLivePreviewBuild({
      rawPrompt: prompt,
      projectRootDir: ROOT_DIR,
      source: 'api',
      projectId: body.projectId,
      projectName: body.projectName,
    });

    sendBuildJson(res, 200, {
      ok: result.status === 'READY',
      endpoint: BUILD_FROM_PROMPT_API_PATH,
      activeProjectId: result.projectId,
      build: result,
      livePreview: getOnePromptLivePreviewPublicState(result.projectId),
      multiProjectWorkspaces: listMultiProjectWorkspaces(),
    });
  } catch {
    sendBuildJson(res, 400, { error: 'Invalid build-from-prompt request' });
  }
}

export function handleBuildLivePreviewStatusRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const projectId = url.searchParams.get('projectId');
  const workspaces = listMultiProjectWorkspaces();
  const activeProjectId = workspaces.find((session) => session.active)?.projectId ?? null;

  if (projectId) {
    const session = workspaces.find((item) => item.projectId === projectId) ?? null;
    const build = getLastOnePromptLivePreviewBuildResult(projectId);
    sendBuildJson(res, 200, {
      ok: true,
      endpoint: BUILD_LIVE_PREVIEW_STATUS_API_PATH,
      activeProjectId,
      projectId,
      session,
      livePreview: getOnePromptLivePreviewPublicState(projectId),
      lastBuild: build,
      previewRuntime: listGeneratedDevServers()
        .filter((server) => server.projectId === projectId)
        .map((server) => ({
          projectId: server.projectId,
          workspaceDir: server.workspaceDir,
          port: server.port,
          url: server.url,
        })),
    });
    return;
  }

  sendBuildJson(res, 200, {
    ok: true,
    endpoint: BUILD_LIVE_PREVIEW_STATUS_API_PATH,
    activeProjectId,
    livePreview: getOnePromptLivePreviewPublicState(activeProjectId),
    lastBuild: activeProjectId ? getLastOnePromptLivePreviewBuildResult(activeProjectId) : null,
    sessions: workspaces,
    previewRuntimes: listGeneratedDevServers().map((server) => ({
      projectId: server.projectId,
      workspaceDir: server.workspaceDir,
      port: server.port,
      url: server.url,
    })),
    multiProjectWorkspaces: workspaces,
  });
}
