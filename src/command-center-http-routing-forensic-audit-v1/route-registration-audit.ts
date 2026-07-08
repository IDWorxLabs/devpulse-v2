/**
 * Command Center HTTP Routing Forensic Audit V1 — route registration audit.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
} from '../command-center-chat-execution-audit-v1/audit-types.js';
import {
  HTTP_ROUTING_FORENSIC_EVENT_PATH,
  HTTP_ROUTING_FORENSIC_LATEST_PATH,
  HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
  type RouteRegistrationAuditReport,
  type RouteRegistrationEntry,
} from './forensic-types.js';
import { isCommandCenterHttpPathForbidden } from './forensic-events.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const SERVER_SOURCE = join(ROOT, 'server/founder-reality-server.ts');

export interface CommandCenterForensicRouteSpec {
  path: string;
  method: string;
  handler: string;
  registrationSource: string;
  authority: string;
}

export const COMMAND_CENTER_FORENSIC_ROUTE_SPECS: CommandCenterForensicRouteSpec[] = [
  {
    path: '/api/brain/respond',
    method: 'POST',
    handler: 'handleBrainRespondRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'brain-api-handler',
  },
  {
    path: '/api/projects/fast-create',
    method: 'POST',
    handler: 'handleFastProjectCreateRequest',
    registrationSource: 'server/project-api-router.ts',
    authority: 'fast-project-create-handler',
  },
  {
    path: COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
    method: 'GET',
    handler: 'handleChatExecutionAuditLatestRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'command-center-chat-execution-audit-handler',
  },
  {
    path: COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH,
    method: 'POST',
    handler: 'handleChatExecutionAuditEventRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'command-center-chat-execution-audit-handler',
  },
  {
    path: HTTP_ROUTING_FORENSIC_LATEST_PATH,
    method: 'GET',
    handler: 'handleHttpRoutingForensicLatestRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'command-center-http-routing-forensic-handler',
  },
  {
    path: HTTP_ROUTING_FORENSIC_EVENT_PATH,
    method: 'POST',
    handler: 'handleHttpRoutingForensicEventRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'command-center-http-routing-forensic-handler',
  },
  {
    path: HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
    method: 'GET',
    handler: 'handleHttpRoutingForensicRegistrationRequest',
    registrationSource: 'server/founder-reality-server.ts',
    authority: 'command-center-http-routing-forensic-handler',
  },
];

function routeRegisteredInServer(source: string, path: string, method: string): boolean {
  const pathLiteral = `urlPath === '${path}'`;
  const methodLiteral = `req.method === '${method}'`;
  return source.includes(pathLiteral) && source.includes(methodLiteral);
}

function countRouteRegistrations(source: string, path: string): number {
  const matches = source.match(new RegExp(`urlPath === '${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'));
  return matches?.length ?? 0;
}

function hasLegacyExecSubstringGuard(source: string): boolean {
  return /urlPath\.includes\(['"]exec['"]\)/.test(source);
}

export function buildRouteRegistrationAuditReport(rootDir = ROOT): RouteRegistrationAuditReport {
  const source = readFileSync(SERVER_SOURCE, 'utf8');
  const legacyExecGuard = hasLegacyExecSubstringGuard(source);

  const entries: RouteRegistrationEntry[] = COMMAND_CENTER_FORENSIC_ROUTE_SPECS.map((spec) => {
    const registered = routeRegisteredInServer(source, spec.path, spec.method);
    const duplicateCount = countRouteRegistrations(source, spec.path);
    const blockedByLegacyGuard =
      legacyExecGuard &&
      spec.method === 'GET' &&
      spec.path.includes('execution') &&
      !registered;

    return {
      readOnly: true,
      route: spec.path,
      method: spec.method,
      registered,
      handler: spec.handler,
      registrationSource: spec.registrationSource,
      authority: spec.authority,
      conflict: duplicateCount > 1,
      duplicateRegistration: duplicateCount > 1,
      overridden: false,
      shadowed: blockedByLegacyGuard,
      blocked: blockedByLegacyGuard || isCommandCenterHttpPathForbidden(spec.path),
      blockReason: blockedByLegacyGuard
        ? "Legacy urlPath.includes('exec') guard shadowed route — substring matched 'execution'"
        : isCommandCenterHttpPathForbidden(spec.path)
          ? 'Path matches forbidden prefix list'
          : null,
    };
  });

  return {
    readOnly: true,
    contractVersion: 'COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1',
    auditId: `route-reg-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export function readFounderRealityServerSource(rootDir = ROOT): string {
  return readFileSync(join(rootDir, 'server/founder-reality-server.ts'), 'utf8');
}
