/**
 * Brain API handler — POST /api/brain/respond only. Local intelligence, no execution.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  buildBrainHealthPayload,
  buildBrainRuntimeVerificationReportFromResult,
} from '../src/command-center-brain/runtime-verification/index.js';

const MAX_BODY_BYTES = 16_384;

export function sendBrainHealth(res: ServerResponse): void {
  const payload = buildBrainHealthPayload();
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Brain': 'command-center',
    'X-DevPulse-Phase': '11.1A',
    'X-DevPulse-Brain-Capability': payload.serverCapability,
  });
  res.end(JSON.stringify(payload));
}

export function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function handleBrainRespondRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as { message?: string; timestamp?: number };

    if (!body.message?.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'message is required' }));
      return;
    }

    const result = processBrainRequest({
      message: body.message,
      timestamp: body.timestamp ?? Date.now(),
    });

    const runtimeReport = buildBrainRuntimeVerificationReportFromResult(result, {
      endpointReachable: true,
      responseRendered: false,
      notificationActivated: false,
    });

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-DevPulse-Brain': 'command-center',
      'X-DevPulse-Phase': '11.1A',
    });
    res.end(JSON.stringify({ ...result, runtimeReport }));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Invalid brain request' }));
  }
}
