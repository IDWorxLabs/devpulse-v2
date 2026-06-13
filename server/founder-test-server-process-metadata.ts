/**
 * Founder Test server process metadata — restart / uptime proof (V1 diagnostic).
 */

import { FOUNDER_REALITY_HOST, FOUNDER_REALITY_PORT } from './founder-reality-manifest.js';

export const FOUNDER_TEST_SERVER_STARTED_AT = new Date().toISOString();

export function getFounderTestServerUptimeSeconds(nowMs = Date.now()): number {
  const startedMs = new Date(FOUNDER_TEST_SERVER_STARTED_AT).getTime();
  return Math.max(0, Math.floor((nowMs - startedMs) / 1000));
}

export function buildFounderTestPingResponse(nowMs = Date.now()): Record<string, unknown> {
  return {
    readOnly: true,
    routeReached: true,
    serverStartedAt: FOUNDER_TEST_SERVER_STARTED_AT,
    processId: process.pid,
    uptimeSeconds: getFounderTestServerUptimeSeconds(nowMs),
    listeningPort: FOUNDER_REALITY_PORT,
    listeningHost: FOUNDER_REALITY_HOST,
    resultStorePersistence: 'memory',
    storeVolatile: true,
  };
}
