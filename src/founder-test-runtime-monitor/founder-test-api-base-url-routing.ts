/**
 * Founder Test API base URL routing — shared origin for result/runtime endpoints (V1).
 */

export const FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS =
  'FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS';

export const FOUNDER_TEST_DEFAULT_API_ORIGIN = 'http://localhost:4321';

export const FOUNDER_TEST_VITE_DEV_PORTS = ['5173', '5174', '3000'] as const;

export const FOUNDER_TEST_RESULT_ROUTE = '/api/founder-test/result';
export const FOUNDER_TEST_RESULT_DEBUG_ROUTE = '/api/founder-test/result-debug';
export const FOUNDER_TEST_RESULT_REPORT_ROUTE = '/api/founder-test/result-report';
export const FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE = '/api/founder-test/result-download';
export const FOUNDER_TEST_RUNTIME_STATUS_ROUTE = '/api/founder-test/runtime-status';
export const FOUNDER_TEST_RUN_ROUTE = '/api/founder-test/run';

export function normalizeFounderTestApiBaseUrl(baseUrl: string | null | undefined): string {
  if (!baseUrl) return '';
  return String(baseUrl).trim().replace(/\/$/, '');
}

export function resolveFounderTestApiBaseUrl(input: {
  manifestApiBaseUrl?: string | null;
  overrideBaseUrl?: string | null;
  windowApiBaseUrl?: string | null;
  resolvedOrigin?: string | null;
  frontendPort?: string | null;
  frontendOrigin?: string | null;
}): string {
  const override = normalizeFounderTestApiBaseUrl(input.overrideBaseUrl);
  if (override) return override;

  const manifestBase = normalizeFounderTestApiBaseUrl(input.manifestApiBaseUrl);
  if (manifestBase) return manifestBase;

  const windowBase = normalizeFounderTestApiBaseUrl(input.windowApiBaseUrl);
  if (windowBase) return windowBase;

  const resolvedOrigin = normalizeFounderTestApiBaseUrl(input.resolvedOrigin);
  if (resolvedOrigin) return resolvedOrigin;

  const port = input.frontendPort ?? '';
  if (FOUNDER_TEST_VITE_DEV_PORTS.includes(port as (typeof FOUNDER_TEST_VITE_DEV_PORTS)[number])) {
    return FOUNDER_TEST_DEFAULT_API_ORIGIN;
  }

  return normalizeFounderTestApiBaseUrl(input.frontendOrigin);
}

export function buildFounderTestApiUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | null | undefined>,
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = normalizeFounderTestApiBaseUrl(baseUrl);
  let url = base ? `${base}${normalizedPath}` : normalizedPath;
  if (!params) return url;

  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  if (queryParts.length === 0) return url;
  url += url.includes('?') ? '&' : '?';
  url += queryParts.join('&');
  return url;
}

export function buildFounderTestResultFetchUrl(baseUrl: string, runId: string): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RESULT_ROUTE, { runId });
}

export function buildFounderTestResultDebugUrl(baseUrl: string, runId: string): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RESULT_DEBUG_ROUTE, { runId });
}

export function buildFounderTestResultReportUrl(baseUrl: string, runId: string): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RESULT_REPORT_ROUTE, { runId });
}

export function buildFounderTestResultDownloadUrl(baseUrl: string, runId: string): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE, { runId });
}

export function buildFounderTestRuntimeStatusUrl(
  baseUrl: string,
  runId?: string | null,
): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RUNTIME_STATUS_ROUTE, runId ? { runId } : undefined);
}

export function buildFounderTestRunUrl(baseUrl: string): string {
  return buildFounderTestApiUrl(baseUrl, FOUNDER_TEST_RUN_ROUTE);
}

export function buildFounderTestApiRoutingDiagnosticLines(input: {
  frontendOrigin: string;
  apiBaseUrl: string;
  runId?: string | null;
}): string[] {
  const runId = input.runId ?? 'n/a';
  const base = input.apiBaseUrl;
  return [
    `- Frontend origin: ${input.frontendOrigin}`,
    `- Resolved API base: ${base || 'same-origin-relative'}`,
    `- Runtime-status URL: ${buildFounderTestRuntimeStatusUrl(base, runId === 'n/a' ? null : runId)}`,
    `- Result URL: ${buildFounderTestResultFetchUrl(base, runId)}`,
    `- Result-debug URL: ${buildFounderTestResultDebugUrl(base, runId)}`,
  ];
}

export function founderTestResultAndRuntimeStatusShareBase(input: {
  resultUrl: string;
  runtimeStatusUrl: string;
}): boolean {
  try {
    const resultOrigin = new URL(input.resultUrl, FOUNDER_TEST_DEFAULT_API_ORIGIN).origin;
    const statusOrigin = new URL(input.runtimeStatusUrl, FOUNDER_TEST_DEFAULT_API_ORIGIN).origin;
    return resultOrigin === statusOrigin;
  } catch {
    return input.resultUrl.startsWith('/api/') && input.runtimeStatusUrl.startsWith('/api/');
  }
}
