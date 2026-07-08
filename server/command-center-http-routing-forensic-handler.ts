/**
 * Command Center HTTP Routing Forensic Audit V1 — HTTP handler.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { readRequestBody } from './brain-api-handler.js';
import {
  attachForensicReport,
  buildRouteRegistrationAuditReport,
  getHttpRoutingForensicTrace,
  getLatestHttpRoutingForensicTrace,
  HTTP_ROUTING_FORENSIC_LATEST_PATH,
  HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
  recordHttpForensicStage,
} from '../src/command-center-http-routing-forensic-audit-v1/index.js';

function sendForensicJson(res: ServerResponse, status: number, payload: unknown, requestId?: string): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Forensic': 'command-center-http-routing',
    ...(requestId ? { 'X-Command-Center-Request-Id': requestId } : {}),
  });
  res.end(JSON.stringify(payload));
}

export function handleHttpRoutingForensicLatestRequest(req: IncomingMessage, res: ServerResponse): void {
  const parsed = parseUrl(req.url ?? '', true);
  const requestId = typeof parsed.query.requestId === 'string' ? parsed.query.requestId : null;
  const trace = requestId ? getHttpRoutingForensicTrace(requestId) : getLatestHttpRoutingForensicTrace();

  if (!trace) {
    sendForensicJson(res, 200, {
      ok: true,
      endpoint: HTTP_ROUTING_FORENSIC_LATEST_PATH,
      trace: null,
      report: null,
    });
    return;
  }

  const enriched = attachForensicReport(trace);
  sendForensicJson(
    res,
    200,
    {
      ok: true,
      endpoint: HTTP_ROUTING_FORENSIC_LATEST_PATH,
      trace: enriched,
      report: enriched.report,
    },
    trace.requestId,
  );
}

export function handleHttpRoutingForensicRegistrationRequest(_req: IncomingMessage, res: ServerResponse): void {
  const report = buildRouteRegistrationAuditReport();
  sendForensicJson(res, 200, {
    ok: true,
    endpoint: HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
    report,
  });
}

export async function handleHttpRoutingForensicEventRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      requestId?: string;
      name?: string;
      detail?: string;
    };
    if (!body.requestId?.trim() || !body.name?.trim()) {
      sendForensicJson(res, 400, { error: 'requestId and name are required' });
      return;
    }
    recordHttpForensicStage(
      body.requestId.trim(),
      body.name.trim(),
      body.detail ?? body.name.trim(),
      'public/founder-reality/command-center-http-routing-forensic.js',
      'CommandCenterHttpRoutingForensic',
    );
    sendForensicJson(res, 200, { ok: true, requestId: body.requestId.trim() }, body.requestId.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid forensic event request';
    sendForensicJson(res, 400, { error: message });
  }
}
