/**
 * Founder Test result route existence proof — boundary classification (V1 diagnostic).
 * Proof-only; does not repair handoff.
 */

export const FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS =
  'FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS';

export const FOUNDER_TEST_PING_ROUTE = '/api/founder-test/ping';

export const FOUNDER_TEST_REGISTERED_RESULT_ROUTES = [
  '/api/founder-test/ping',
  '/api/founder-test/result',
  '/api/founder-test/result-debug',
  '/api/founder-test/runtime-status',
] as const;

export type FounderTestResultFailureBoundary =
  | 'route_missing'
  | 'route_unreachable'
  | 'wrong_api_base'
  | 'store_empty'
  | 'server_restarted'
  | 'report_never_persisted'
  | 'report_generation'
  | 'unknown';

export function classifyFounderTestResultFailureBoundary(input: {
  pingRouteReached?: boolean;
  resultDebugRouteReached?: boolean;
  requestedUrlOrigin?: string | null;
  expectedApiOrigin?: string | null;
  hasStoredResult?: boolean;
  hasReportMarkdown?: boolean;
  serverStartedAt?: string | null;
  runCompletedAt?: string | null;
  fetchErrorMessage?: string | null;
  httpStatus?: number | null;
}): FounderTestResultFailureBoundary {
  if (input.pingRouteReached === false) {
    if (input.fetchErrorMessage && /failed to fetch|network|abort|timeout/i.test(input.fetchErrorMessage)) {
      return 'route_unreachable';
    }
    return 'route_missing';
  }

  const expected = input.expectedApiOrigin?.replace(/\/$/, '') ?? '';
  const requested = input.requestedUrlOrigin?.replace(/\/$/, '') ?? '';
  if (
    expected &&
    requested &&
    expected !== requested &&
    input.pingRouteReached === true
  ) {
    return 'wrong_api_base';
  }

  if (
    input.serverStartedAt &&
    input.runCompletedAt &&
    new Date(input.serverStartedAt).getTime() > new Date(input.runCompletedAt).getTime()
  ) {
    return 'server_restarted';
  }

  if (input.resultDebugRouteReached === true && input.hasStoredResult === false) {
    if (input.hasReportMarkdown === false) {
      return 'report_never_persisted';
    }
    return 'store_empty';
  }

  if (input.resultDebugRouteReached === true && input.hasStoredResult === true && !input.hasReportMarkdown) {
    return 'report_never_persisted';
  }

  if (input.resultDebugRouteReached === true && input.hasStoredResult === true && input.hasReportMarkdown) {
    return 'unknown';
  }

  if (input.httpStatus === 404 && input.resultDebugRouteReached !== true) {
    return 'route_missing';
  }

  return 'unknown';
}

export function founderTestResultStoreIsInMemoryOnly(): true {
  return true;
}
