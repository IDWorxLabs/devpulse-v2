/**
 * Command Center HTTP Routing Forensic Audit V1 — request tracer factory.
 */

import type { IncomingMessage } from 'node:http';
import { attachForensicReport } from './forensic-authority.js';
import { HTTP_ROUTING_FORENSIC_EVENTS } from './forensic-events.js';
import {
  appendHttpForensicEvent,
  completeHttpRoutingForensicTrace,
  getHttpRoutingForensicTrace,
  storeHttpRoutingForensicTrace,
} from './forensic-store.js';
import type { HttpForensicEvent } from './forensic-types.js';
import { COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION } from './forensic-types.js';

export const HTTP_ROUTING_FORENSIC_REQUEST_HEADER = 'X-Command-Center-Request-Id';

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `http-forensic-${Date.now()}-${eventCounter}`;
}

function readRequestId(req: IncomingMessage): string {
  const header = req.headers[HTTP_ROUTING_FORENSIC_REQUEST_HEADER.toLowerCase()];
  if (typeof header === 'string' && header.trim()) return header.trim();
  if (Array.isArray(header) && header[0]?.trim()) return header[0].trim();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface HttpRoutingForensicTracer {
  requestId: string;
  method: string;
  path: string;
  record(
    name: keyof typeof HTTP_ROUTING_FORENSIC_EVENTS | string,
    detail: string,
    options?: {
      sourceFile?: string | null;
      sourceFunction?: string | null;
      metadata?: Record<string, string | number | boolean | null>;
    },
  ): void;
  recordMiddlewareEnter(name: string, sourceFile: string, sourceFunction: string): void;
  recordMiddlewareContinue(name: string): void;
  recordMiddlewareBlocked(
    name: string,
    reason: string,
    sourceFile: string,
    sourceFunction: string,
    sourceLine?: number,
  ): void;
  recordRouteMatched(handler: string, sourceFile: string, sourceLine?: number): void;
  recordRouteForbidden(reason: string, sourceFile: string, sourceFunction: string, sourceLine?: number): void;
  recordRouteNotFound(sourceFile: string, sourceFunction: string): void;
  recordHandlerSelected(handler: string): void;
  recordResponseSent(status: number): void;
  complete(): void;
}

export function beginHttpRoutingForensic(req: IncomingMessage, path: string): HttpRoutingForensicTracer {
  const requestId = readRequestId(req);
  const method = req.method ?? 'UNKNOWN';
  const events: HttpForensicEvent[] = [];

  const trace = attachForensicReport({
    readOnly: true,
    contractVersion: COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION,
    requestId,
    method,
    path,
    startedAt: Date.now(),
    completedAt: null,
    events,
    report: buildEmptyReport(requestId, method, path),
  });

  storeHttpRoutingForensicTrace(trace);

  const tracer: HttpRoutingForensicTracer = {
    requestId,
    method,
    path,
    record(name, detail, options) {
      const event: HttpForensicEvent = {
        readOnly: true,
        eventId: nextEventId(),
        requestId,
        timestamp: Date.now(),
        name,
        detail,
        sourceFile: options?.sourceFile ?? null,
        sourceFunction: options?.sourceFunction ?? null,
        metadata: options?.metadata,
      };
      events.push(event);
      storeHttpRoutingForensicTrace(attachForensicReport({ ...trace, events }));
    },
    recordMiddlewareEnter(name, sourceFile, sourceFunction) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_ENTER, name, {
        sourceFile,
        sourceFunction,
        metadata: { middleware: name },
      });
    },
    recordMiddlewareContinue(name) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_CONTINUE, name, {
        metadata: { middleware: name },
      });
    },
    recordMiddlewareBlocked(name, reason, sourceFile, sourceFunction, sourceLine) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED, reason, {
        sourceFile,
        sourceFunction,
        metadata: { middleware: name, sourceLine: sourceLine ?? null },
      });
    },
    recordRouteMatched(handler, sourceFile, sourceLine) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED, handler, {
        sourceFile,
        sourceFunction: 'createFounderRealityServer',
        metadata: { handler, sourceLine: sourceLine ?? null },
      });
    },
    recordRouteForbidden(reason, sourceFile, sourceFunction, sourceLine) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_FORBIDDEN, reason, {
        sourceFile,
        sourceFunction,
        metadata: { sourceLine: sourceLine ?? null },
      });
    },
    recordRouteNotFound(sourceFile, sourceFunction) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_NOT_FOUND, 'No route matched request path', {
        sourceFile,
        sourceFunction,
      });
    },
    recordHandlerSelected(handler) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_HANDLER_SELECTED, handler, {
        metadata: { handler },
      });
    },
    recordResponseSent(status) {
      tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT, `status=${status}`, {
        sourceFile: 'server/founder-reality-server.ts',
        sourceFunction: 'sendJson',
        metadata: { status },
      });
      tracer.complete();
    },
    complete() {
      completeHttpRoutingForensicTrace(requestId, Date.now());
      const current = attachForensicReport({ ...trace, events, completedAt: Date.now() });
      storeHttpRoutingForensicTrace(current);
    },
  };

  tracer.record(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_REQUEST_RECEIVED, `${method} ${path}`, {
    sourceFile: 'server/founder-reality-server.ts',
    sourceFunction: 'createFounderRealityServer',
  });

  return tracer;
}

function buildEmptyReport(requestId: string, method: string, path: string) {
  return {
    readOnly: true as const,
    reportType: 'COMMAND_CENTER_HTTP_FORENSIC_REPORT' as const,
    requestId,
    method,
    path,
    stages: [],
    firstFailure: null,
    routeRegistrationAuditId: null,
  };
}

export function recordHttpForensicStage(
  requestId: string | null | undefined,
  name: keyof typeof HTTP_ROUTING_FORENSIC_EVENTS | string,
  detail: string,
  sourceFile: string,
  sourceFunction: string,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  if (!requestId?.trim()) return;
  const id = requestId.trim();
  if (!getHttpRoutingForensicTrace(id)) {
    storeHttpRoutingForensicTrace(
      attachForensicReport({
        readOnly: true,
        contractVersion: COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION,
        requestId: id,
        method: 'UNKNOWN',
        path: 'UNKNOWN',
        startedAt: Date.now(),
        completedAt: null,
        events: [],
        report: buildEmptyReport(id, 'UNKNOWN', 'UNKNOWN'),
      }),
    );
  }
  appendHttpForensicEvent(id, {
    readOnly: true,
    eventId: nextEventId(),
    requestId: id,
    timestamp: Date.now(),
    name,
    detail,
    sourceFile,
    sourceFunction,
    metadata,
  });
  const updated = getHttpRoutingForensicTrace(id);
  if (updated) {
    storeHttpRoutingForensicTrace(attachForensicReport(updated));
  }
}
