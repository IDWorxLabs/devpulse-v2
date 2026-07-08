/**
 * Runtime Truth Authority V1 — HTTP handler for GET /api/runtime/truth.
 */

import type { ServerResponse } from 'node:http';
import { buildRuntimeTruthPayload } from '../src/runtime-truth-authority/runtime-truth-verifier.js';

export function sendRuntimeTruthJson(res: ServerResponse, rootDir: string): void {
  const payload = buildRuntimeTruthPayload(rootDir);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'runtime-truth-authority',
    'X-DevPulse-Runtime-Id': payload.runtimeIdentity.runtimeId,
    'X-DevPulse-Runtime-Freshness': payload.freshness.status,
    'X-DevPulse-Runtime-Alive': 'true',
  });
  res.end(JSON.stringify(payload));
}
