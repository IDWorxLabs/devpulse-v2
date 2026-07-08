/**
 * Command Center HTTP Routing Forensic Audit V1 — types.
 */

import type { HTTP_ROUTING_FORENSIC_EVENTS } from './forensic-events.js';

export const COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS_TOKEN =
  'COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS' as const;

export const COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION =
  'COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1' as const;

export const HTTP_ROUTING_FORENSIC_LATEST_PATH =
  '/api/command-center/http-routing-forensic/latest' as const;

export const HTTP_ROUTING_FORENSIC_REGISTRATION_PATH =
  '/api/command-center/http-routing-forensic/route-registration' as const;

export const HTTP_ROUTING_FORENSIC_EVENT_PATH =
  '/api/command-center/http-routing-forensic/event' as const;

export type HttpForensicStageStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface HttpForensicStageResult {
  readOnly: true;
  stage: string;
  reached: boolean;
  status: HttpForensicStageStatus;
  blockingReason: string | null;
  sourceFile: string | null;
  sourceFunction: string | null;
  sourceLine: number | null;
}

export interface HttpForensicEvent {
  readOnly: true;
  eventId: string;
  requestId: string;
  timestamp: number;
  name: keyof typeof HTTP_ROUTING_FORENSIC_EVENTS | string;
  detail: string;
  sourceFile?: string | null;
  sourceFunction?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface HttpRoutingForensicTrace {
  readOnly: true;
  contractVersion: typeof COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION;
  requestId: string;
  method: string;
  path: string;
  startedAt: number;
  completedAt: number | null;
  events: HttpForensicEvent[];
  report: CommandCenterHttpForensicReport;
}

export interface CommandCenterHttpForensicReport {
  readOnly: true;
  reportType: 'COMMAND_CENTER_HTTP_FORENSIC_REPORT';
  requestId: string;
  method: string;
  path: string;
  stages: HttpForensicStageResult[];
  firstFailure: HttpForensicStageResult | null;
  routeRegistrationAuditId: string | null;
}

export interface RouteRegistrationEntry {
  readOnly: true;
  route: string;
  method: string;
  registered: boolean;
  handler: string;
  registrationSource: string;
  authority: string;
  conflict: boolean;
  duplicateRegistration: boolean;
  overridden: boolean;
  shadowed: boolean;
  blocked: boolean;
  blockReason: string | null;
}

export interface RouteRegistrationAuditReport {
  readOnly: true;
  contractVersion: typeof COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION;
  auditId: string;
  generatedAt: string;
  entries: RouteRegistrationEntry[];
}
