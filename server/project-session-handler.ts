/**
 * Project Session Continuity V1 — HTTP handlers.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { readRequestBody } from './brain-api-handler.js';
import {
  activateProjectSession,
  buildProjectSessionContinuityApiPayload,
  ensureBuildProjectSession,
  persistProjectSessionChat,
  resolveProjectSessionContext,
} from '../src/project-session-continuity-v1/index.js';

function sendSessionJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-session-continuity-v1',
  });
  res.end(JSON.stringify(payload));
}

export async function handleProjectSessionActiveRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendSessionJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const projectId = url.searchParams.get('projectId');
  const sessionId = url.searchParams.get('sessionId');
  const context = projectId
    ? resolveProjectSessionContext(projectId, sessionId)
    : buildProjectSessionContinuityApiPayload().activeSession;
  sendSessionJson(res, 200, {
    ok: true,
    contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
    activeSession: context,
    activeProjectId: context?.projectId ?? null,
    activeSessionId: context?.sessionId ?? null,
  });
}

export async function handleProjectSessionMessagesRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendSessionJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      projectId?: string;
      sessionId?: string;
      role?: 'user' | 'brain' | 'system';
      text?: string;
      html?: string | null;
      chatHistoryHtml?: string | null;
      timestamp?: number;
    };
    if (!body.projectId || !body.sessionId || !body.role || !body.text?.trim()) {
      sendSessionJson(res, 400, { error: 'projectId, sessionId, role, and text are required' });
      return;
    }
    const updated = persistProjectSessionChat({
      projectId: body.projectId,
      sessionId: body.sessionId,
      role: body.role,
      text: body.text.trim(),
      html: body.html ?? null,
      chatHistoryHtml: body.chatHistoryHtml ?? null,
      timestamp: body.timestamp,
    });
    if (!updated) {
      sendSessionJson(res, 404, { error: 'Session not found' });
      return;
    }
    sendSessionJson(res, 200, {
      ok: true,
      contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
      session: updated,
    });
  } catch {
    sendSessionJson(res, 400, { error: 'Invalid project session message request' });
  }
}

export async function handleProjectSessionEnsureBuildRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendSessionJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      prompt?: string;
      activeProjectId?: string | null;
      projectName?: string | null;
      confirmFreshCopy?: boolean;
      confirmResume?: boolean;
      resumeProjectId?: string | null;
    };
    const rawPrompt = (body.prompt ?? '').trim();
    if (!rawPrompt) {
      sendSessionJson(res, 400, { error: 'prompt is required' });
      return;
    }
    const result = ensureBuildProjectSession({
      rawPrompt,
      activeProjectId: body.activeProjectId ?? null,
      projectName: body.projectName ?? null,
      confirmFreshCopy: body.confirmFreshCopy === true,
      confirmResume: body.confirmResume === true,
      resumeProjectId: body.resumeProjectId ?? null,
    });
    if (result.duplicateResumeBlocked) {
      sendSessionJson(res, 200, {
        ok: false,
        contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
        duplicateResumeBlocked: true,
        projectResume: result.duplicateResumePayload,
      });
      return;
    }
    sendSessionJson(res, 200, {
      ok: true,
      contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
      ...result,
    });
  } catch {
    sendSessionJson(res, 400, { error: 'Invalid ensure-build request' });
  }
}

export async function handleProjectSessionActivateRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendSessionJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      projectId?: string;
      sessionId?: string | null;
    };
    if (!body.projectId?.trim()) {
      sendSessionJson(res, 400, { error: 'projectId is required' });
      return;
    }
    const context = activateProjectSession({
      projectId: body.projectId.trim(),
      sessionId: body.sessionId ?? null,
    });
    if (!context) {
      sendSessionJson(res, 403, {
        error: 'Project cannot become active user session',
        contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
      });
      return;
    }
    sendSessionJson(res, 200, {
      ok: true,
      contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
      activeSession: context,
      activeProjectId: context.projectId,
      activeSessionId: context.sessionId,
    });
  } catch {
    sendSessionJson(res, 400, { error: 'Invalid activate request' });
  }
}

export function isProjectSessionApiPath(urlPath: string): boolean {
  return (
    urlPath === '/api/project-sessions/active' ||
    urlPath === '/api/project-sessions/messages' ||
    urlPath === '/api/project-sessions/ensure-build' ||
    urlPath === '/api/project-sessions/activate'
  );
}

export async function handleProjectSessionRequest(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string,
): Promise<boolean> {
  if (urlPath === '/api/project-sessions/active') {
    await handleProjectSessionActiveRequest(req, res);
    return true;
  }
  if (urlPath === '/api/project-sessions/messages') {
    await handleProjectSessionMessagesRequest(req, res);
    return true;
  }
  if (urlPath === '/api/project-sessions/ensure-build') {
    await handleProjectSessionEnsureBuildRequest(req, res);
    return true;
  }
  if (urlPath === '/api/project-sessions/activate') {
    await handleProjectSessionActivateRequest(req, res);
    return true;
  }
  return false;
}
