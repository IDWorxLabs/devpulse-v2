/**
 * Command Center HTTP Routing Forensic Audit V1 — report builder.
 */

import { HTTP_ROUTING_FORENSIC_EVENTS } from './forensic-events.js';
import type {
  CommandCenterHttpForensicReport,
  HttpForensicEvent,
  HttpForensicStageResult,
  HttpRoutingForensicTrace,
} from './forensic-types.js';

const STAGE_ORDER = [
  'Browser reached',
  'HTTP server reached',
  'Router reached',
  'Middleware reached',
  'Endpoint registered',
  'Handler entered',
  'Bridge entered',
  'ASE entered',
  'Response sent',
  'Browser received',
] as const;

function hasEvent(events: HttpForensicEvent[], name: string): boolean {
  return events.some((event) => event.name === name);
}

function findBlockingEvent(events: HttpForensicEvent[]): HttpForensicEvent | null {
  const blocked = events.filter(
    (event) =>
      event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_FORBIDDEN ||
      event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED ||
      event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_NOT_FOUND,
  );
  return blocked.length > 0 ? blocked[blocked.length - 1] : null;
}

function stageFromEvents(
  stage: (typeof STAGE_ORDER)[number],
  events: HttpForensicEvent[],
  method: string,
): HttpForensicStageResult {
  const blocking = findBlockingEvent(events);

  switch (stage) {
    case 'Browser reached':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, 'BROWSER_FETCH_START') || method !== 'GET',
        status: hasEvent(events, 'BROWSER_FETCH_START') || method !== 'GET' ? 'PASS' : 'UNKNOWN',
        blockingReason: null,
        sourceFile: 'public/founder-reality/app.js',
        sourceFunction: 'askBrain',
        sourceLine: null,
      };
    case 'HTTP server reached':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_REQUEST_RECEIVED),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_REQUEST_RECEIVED) ? 'PASS' : 'FAIL',
        blockingReason: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_REQUEST_RECEIVED)
          ? null
          : 'Request never reached HTTP server',
        sourceFile: 'server/founder-reality-server.ts',
        sourceFunction: 'createFounderRealityServer',
        sourceLine: null,
      };
    case 'Router reached':
      return {
        readOnly: true,
        stage,
        reached:
          hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED) ||
          hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_NOT_FOUND) ||
          hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_FORBIDDEN),
        status:
          hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED) ||
          hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_HANDLER_SELECTED)
            ? 'PASS'
            : blocking?.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_FORBIDDEN ||
                blocking?.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_NOT_FOUND
              ? 'FAIL'
              : 'UNKNOWN',
        blockingReason:
          blocking?.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_FORBIDDEN ||
          blocking?.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_NOT_FOUND
            ? blocking.detail
            : null,
        sourceFile: blocking?.sourceFile ?? 'server/founder-reality-server.ts',
        sourceFunction: blocking?.sourceFunction ?? 'createFounderRealityServer',
        sourceLine: typeof blocking?.metadata?.sourceLine === 'number' ? blocking.metadata.sourceLine : null,
      };
    case 'Middleware reached':
      return {
        readOnly: true,
        stage,
        reached: events.some((event) => String(event.name).startsWith('HTTP_MIDDLEWARE_')),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED)
          ? 'FAIL'
          : hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_CONTINUE)
            ? 'PASS'
            : events.some((event) => String(event.name).startsWith('HTTP_MIDDLEWARE_'))
              ? 'PASS'
              : 'UNKNOWN',
        blockingReason: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED)
          ? (events.find((event) => event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED)
              ?.detail ?? null)
          : null,
        sourceFile:
          events.find((event) => event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED)
            ?.sourceFile ?? 'server/founder-reality-server.ts',
        sourceFunction:
          events.find((event) => event.name === HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED)
            ?.sourceFunction ?? 'createFounderRealityServer',
        sourceLine: null,
      };
    case 'Endpoint registered':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED) ? 'PASS' : 'FAIL',
        blockingReason: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED)
          ? null
          : 'No registered route matched request path',
        sourceFile: 'server/founder-reality-server.ts',
        sourceFunction: 'createFounderRealityServer',
        sourceLine: null,
      };
    case 'Handler entered':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_ENTER),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_ENTER) ? 'PASS' : 'UNKNOWN',
        blockingReason: null,
        sourceFile: 'server/brain-api-handler.ts',
        sourceFunction: 'handleBrainRespondRequest',
        sourceLine: null,
      };
    case 'Bridge entered':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.BRIDGE_ENTER),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.BRIDGE_ENTER) ? 'PASS' : 'UNKNOWN',
        blockingReason: null,
        sourceFile: 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
        sourceFunction: 'executeChatToBuildBridge',
        sourceLine: null,
      };
    case 'ASE entered':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.ASE_ENTER),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.ASE_ENTER) ? 'PASS' : 'UNKNOWN',
        blockingReason: null,
        sourceFile: 'src/aidev-engine/aidev-engine-authority.ts',
        sourceFunction: 'executeAutonomousSoftwareEngineering',
        sourceLine: null,
      };
    case 'Response sent':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT),
        status: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT) ? 'PASS' : 'FAIL',
        blockingReason: hasEvent(events, HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT)
          ? null
          : 'HTTP response was never sent',
        sourceFile: 'server/founder-reality-server.ts',
        sourceFunction: 'sendJson',
        sourceLine: null,
      };
    case 'Browser received':
      return {
        readOnly: true,
        stage,
        reached: hasEvent(events, 'BROWSER_FETCH_RESPONSE') || hasEvent(events, 'BROWSER_FETCH_ERROR'),
        status:
          hasEvent(events, 'BROWSER_FETCH_RESPONSE') || hasEvent(events, 'BROWSER_FETCH_ERROR')
            ? 'PASS'
            : 'UNKNOWN',
        blockingReason: hasEvent(events, 'BROWSER_FETCH_ERROR')
          ? (events.find((event) => event.name === 'BROWSER_FETCH_ERROR')?.detail ?? null)
          : null,
        sourceFile: 'public/founder-reality/app.js',
        sourceFunction: 'askBrain',
        sourceLine: null,
      };
    default:
      return {
        readOnly: true,
        stage,
        reached: false,
        status: 'UNKNOWN',
        blockingReason: null,
        sourceFile: null,
        sourceFunction: null,
        sourceLine: null,
      };
  }
}

export function buildCommandCenterHttpForensicReport(
  trace: HttpRoutingForensicTrace,
  routeRegistrationAuditId: string | null = null,
): CommandCenterHttpForensicReport {
  const stages = STAGE_ORDER.map((stage) => stageFromEvents(stage, trace.events, trace.method));
  const firstFailure =
    stages.find((stage) => stage.status === 'FAIL') ??
    (findBlockingEvent(trace.events)
      ? stages.find((stage) => !stage.reached && stage.blockingReason)
      : null) ??
    null;

  return {
    readOnly: true,
    reportType: 'COMMAND_CENTER_HTTP_FORENSIC_REPORT',
    requestId: trace.requestId,
    method: trace.method,
    path: trace.path,
    stages,
    firstFailure,
    routeRegistrationAuditId,
  };
}

export function attachForensicReport(trace: HttpRoutingForensicTrace): HttpRoutingForensicTrace {
  return {
    ...trace,
    report: buildCommandCenterHttpForensicReport(trace),
  };
}
