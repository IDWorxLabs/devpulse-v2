/**
 * Command Center HTTP Routing Forensic Audit V1 — event names.
 */

export const HTTP_ROUTING_FORENSIC_EVENTS = {
  HTTP_REQUEST_RECEIVED: 'HTTP_REQUEST_RECEIVED',
  HTTP_ROUTE_MATCHED: 'HTTP_ROUTE_MATCHED',
  HTTP_ROUTE_NOT_FOUND: 'HTTP_ROUTE_NOT_FOUND',
  HTTP_ROUTE_FORBIDDEN: 'HTTP_ROUTE_FORBIDDEN',
  HTTP_ROUTE_HANDLER_SELECTED: 'HTTP_ROUTE_HANDLER_SELECTED',
  HTTP_MIDDLEWARE_ENTER: 'HTTP_MIDDLEWARE_ENTER',
  HTTP_MIDDLEWARE_CONTINUE: 'HTTP_MIDDLEWARE_CONTINUE',
  HTTP_MIDDLEWARE_BLOCKED: 'HTTP_MIDDLEWARE_BLOCKED',
  HTTP_RESPONSE_SENT: 'HTTP_RESPONSE_SENT',
  HANDLER_ENTER: 'HANDLER_ENTER',
  PAYLOAD_PARSED: 'PAYLOAD_PARSED',
  BUILD_INTENT_ANALYZED: 'BUILD_INTENT_ANALYZED',
  BRIDGE_ENTER: 'BRIDGE_ENTER',
  ASE_ENTER: 'ASE_ENTER',
  HANDLER_RESPONSE: 'HANDLER_RESPONSE',
} as const;

export const COMMAND_CENTER_HTTP_FORBIDDEN_PATH_PREFIXES = [
  '/api/exec',
  '/api/run-command',
  '/api/write',
  '/api/deploy',
  '/api/auto-fix',
] as const;

/**
 * Returns true when a GET/HEAD static-path guard should reject the request.
 * Uses path-prefix matching only — never substring heuristics like includes('exec').
 */
export function isCommandCenterHttpPathForbidden(urlPath: string): boolean {
  return COMMAND_CENTER_HTTP_FORBIDDEN_PATH_PREFIXES.some(
    (prefix) => urlPath === prefix || urlPath.startsWith(`${prefix}/`),
  );
}

export function forbiddenReasonForPath(urlPath: string): string {
  const prefix = COMMAND_CENTER_HTTP_FORBIDDEN_PATH_PREFIXES.find(
    (p) => urlPath === p || urlPath.startsWith(`${p}/`),
  );
  if (prefix) {
    return `Path matches forbidden prefix ${prefix} (command-center-http-routing-forensic-audit-v1)`;
  }
  return 'Path not forbidden';
}
