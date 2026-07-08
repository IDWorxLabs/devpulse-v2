/**
 * Fast Project Create V1 — HTTP handler for instant USER project creation.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  executeFastProjectCreate,
  FAST_PROJECT_CREATE_CONTRACT_VERSION,
  parseFastProjectCreateRequestBody,
} from '../src/fast-project-create-v1/index.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'fast-project-create-v1',
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

export const FAST_PROJECT_CREATE_POST_PATH = '/api/projects/fast-create';

export async function handleFastProjectCreateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
): Promise<void> {
  try {
    const body = await readJsonBody(req);
    const parsed = parseFastProjectCreateRequestBody(body);
    const result = executeFastProjectCreate({
      name: parsed.name,
      summary: parsed.summary,
      confirmFreshCopy: parsed.confirmFreshCopy,
      forceFreshProject: parsed.forceFreshProject,
      rootDir,
    });

    if (!result.ok) {
      sendJson(res, 409, result);
      return;
    }

    sendJson(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 400, {
      ok: false,
      error: message,
      contractVersion: FAST_PROJECT_CREATE_CONTRACT_VERSION,
    });
  }
}
