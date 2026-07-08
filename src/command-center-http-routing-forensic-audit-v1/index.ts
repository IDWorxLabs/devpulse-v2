/**
 * Command Center HTTP Routing Forensic Audit V1 — public exports.
 */

export {
  HTTP_ROUTING_FORENSIC_EVENTS,
  COMMAND_CENTER_HTTP_FORBIDDEN_PATH_PREFIXES,
  isCommandCenterHttpPathForbidden,
  forbiddenReasonForPath,
} from './forensic-events.js';

export {
  COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS_TOKEN,
  COMMAND_CENTER_HTTP_ROUTING_FORENSIC_CONTRACT_VERSION,
  HTTP_ROUTING_FORENSIC_LATEST_PATH,
  HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
  HTTP_ROUTING_FORENSIC_EVENT_PATH,
} from './forensic-types.js';

export type {
  HttpForensicStageResult,
  HttpForensicEvent,
  HttpRoutingForensicTrace,
  CommandCenterHttpForensicReport,
  RouteRegistrationEntry,
  RouteRegistrationAuditReport,
} from './forensic-types.js';

export {
  buildRouteRegistrationAuditReport,
  COMMAND_CENTER_FORENSIC_ROUTE_SPECS,
  readFounderRealityServerSource,
} from './route-registration-audit.js';

export {
  appendHttpForensicEvent,
  completeHttpRoutingForensicTrace,
  getHttpRoutingForensicTrace,
  getLatestHttpRoutingForensicTrace,
  listHttpRoutingForensicTraces,
  resetHttpRoutingForensicStoreForTests,
  storeHttpRoutingForensicTrace,
} from './forensic-store.js';

export { buildCommandCenterHttpForensicReport, attachForensicReport } from './forensic-authority.js';

export {
  beginHttpRoutingForensic,
  recordHttpForensicStage,
  HTTP_ROUTING_FORENSIC_REQUEST_HEADER,
  type HttpRoutingForensicTracer,
} from './http-request-tracer.js';
