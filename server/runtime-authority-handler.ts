/**
 * Autonomous Runtime Authority V1 — HTTP handler.
 */

import type { ServerResponse } from 'node:http';
import { buildRuntimeAuthorityApiPayload } from '../src/autonomous-runtime-authority-v1/index.js';

export function sendRuntimeAuthorityJson(res: ServerResponse): void {
  const payload = buildRuntimeAuthorityApiPayload();
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'autonomous-runtime-authority',
    'X-DevPulse-Runtime-Authority': payload.ok ? 'READY' : 'VERIFYING',
  });
  res.end(JSON.stringify(payload));
}
