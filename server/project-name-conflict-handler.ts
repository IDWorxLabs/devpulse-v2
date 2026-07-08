/**
 * Project Name Conflict Resolution V1 — HTTP handler.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
  applyProjectIdentityForBuild,
  ProjectNameConflictRejectedError,
  resolveProjectNameConflict,
  resolveRequestedProjectName,
} from '../src/project-name-conflict-resolution-v1/index.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'project-name-conflict-resolution-v1',
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

export async function handleProjectNameConflictResolutionRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
  repoRootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt ?? body.message ?? '').trim();
    const requestedName = resolveRequestedProjectName(body, prompt);
    if (!requestedName) {
      sendJson(res, 400, {
        ok: false,
        error: 'projectName, name, or requestedName is required',
        contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
      });
      return;
    }

    if (body.apply === true) {
      const identity = applyProjectIdentityForBuild({
        requestedName,
        rawPrompt: prompt,
        rootDir,
        repoRootDir,
        rejectDuplicates: body.rejectDuplicates === true,
        forceFreshRebuild: body.forceFreshRebuild === true,
        confirmFreshCopy: body.confirmFreshCopy === true,
      });
      sendJson(res, 200, { ok: true, projectIdentity: identity, contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION });
      return;
    }

    const plan = resolveProjectNameConflict({
      requestedName,
      rawPrompt: prompt,
      rootDir,
      repoRootDir,
      rejectDuplicates: body.rejectDuplicates === true,
      forceFreshRebuild: body.forceFreshRebuild === true,
      confirmFreshCopy: body.confirmFreshCopy === true,
    });
    sendJson(res, 200, {
      ok: !plan.shouldFail,
      plan,
      contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
    });
  } catch (err) {
    if (err instanceof ProjectNameConflictRejectedError) {
      sendJson(res, 409, {
        ok: false,
        projectIdentity: err.identity,
        error: err.message,
        contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
      });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 400, { ok: false, error: message, contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION });
  }
}
