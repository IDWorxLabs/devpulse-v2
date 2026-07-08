/**
 * Patches ServerResponse.end to record HTTP_RESPONSE_SENT once per request.
 */

import type { ServerResponse } from 'node:http';
import type { HttpRoutingForensicTracer } from '../src/command-center-http-routing-forensic-audit-v1/index.js';

export function attachHttpForensicResponseTracing(
  res: ServerResponse,
  forensic: HttpRoutingForensicTracer,
): void {
  const originalEnd = res.end.bind(res);
  let recorded = false;

  res.end = ((...args: Parameters<ServerResponse['end']>) => {
    if (!recorded) {
      recorded = true;
      forensic.recordResponseSent(res.statusCode && res.statusCode > 0 ? res.statusCode : 200);
    }
    return originalEnd(...args);
  }) as ServerResponse['end'];
}

export function forensicRouteMatch(
  forensic: HttpRoutingForensicTracer,
  handler: string,
  sourceLine: number,
): void {
  forensic.recordRouteMatched(handler, 'server/founder-reality-server.ts', sourceLine);
  forensic.recordHandlerSelected(handler);
}
