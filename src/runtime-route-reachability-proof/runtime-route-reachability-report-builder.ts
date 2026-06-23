/**
 * Runtime Route Reachability Proof — report builder (Phase 26.83).
 */

import {
  RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION,
  RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT_TITLE,
  RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT_TITLE,
  TRUTH_RULES,
} from './runtime-route-reachability-proof-registry.js';
import type { RuntimeRouteReachabilityProofReport } from './runtime-route-reachability-proof-types.js';

export function buildRuntimeRouteReachabilityProofReportMarkdown(
  report: RuntimeRouteReachabilityProofReport,
): string {
  const lines = [
    `# ${RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Proof ID: ${report.proofId}`,
    `Workspace: ${report.workspaceId}`,
    '',
    '## Core Question',
    '',
    report.coreQuestion,
    '',
    '## Startup Gate',
    '',
    `- applicationBootsBeforeProbe: **${report.applicationBootsBeforeProbe}**`,
    `- startup probe health: ${report.startupProbe?.healthResponded ?? 'n/a'}`,
    `- startup firstResponseStatus: ${report.startupProbe?.firstResponseStatus ?? 'n/a'}`,
    '',
    '## Route Discovery',
    '',
    '| Path | Source | Expectation | Confidence |',
    '| --- | --- | --- | --- |',
    ...report.discoveredRoutes.map(
      (r) => `| ${r.path} | ${r.source} | ${r.expectation} | ${r.confidence} |`,
    ),
    '',
    '## Route Probe Session',
    '',
    `- baseUrl: ${report.probeSession.baseUrl ?? 'none'}`,
    `- port: ${report.probeSession.port ?? 'none'}`,
    `- runtimeBootedBeforeProbe: ${report.probeSession.runtimeBootedBeforeProbe}`,
    `- probeSkipped: ${report.probeSession.probeSkipped}`,
    `- cleanupStatus: ${report.probeSession.cleanupStatus}`,
    '',
    '| Route | Status | Verdict | Response Type | Elapsed ms |',
    '| --- | --- | --- | --- | --- |',
    ...report.probeSession.probeResults.map(
      (p) =>
        `| ${p.routePath} | ${p.statusCode ?? 'n/a'} | ${p.verdict} | ${p.responseType} | ${p.elapsedMs} |`,
    ),
    '',
    '## Classification',
    '',
    `- failureClass: **${report.failureClass}**`,
    `- routesReachable: **${report.routesReachable}**`,
    `- rootRouteReachable: ${report.rootRouteReachable}`,
    `- uiRenderProven: ${report.uiRenderProven}`,
    `- routeFailureReason: ${report.routeFailureReason}`,
    '',
    '## Recommended Actions',
    '',
    ...report.recommendedNextActions.map((a) => `- ${a}`),
    '',
    `Cache key: \`${report.cacheKey}\``,
  ];
  return lines.join('\n');
}

export function buildRuntimeRouteReachabilityReconciliationReportMarkdown(input: {
  report: RuntimeRouteReachabilityProofReport;
  failureBoundaryBefore: string;
  failureBoundaryAfter: string;
  rootCauseBefore: string;
  rootCauseAfter: string;
}): string {
  const { report } = input;
  return [
    `# ${RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Workspace: ${report.workspaceId}`,
    '',
    '## Truth Rules Applied',
    '',
    ...TRUTH_RULES.map((r) => `- ${r}`),
    '',
    '## Reconciliation',
    '',
    '| Field | Before | After |',
    '| --- | --- | --- |',
    `| failureBoundary | ${input.failureBoundaryBefore} | **${input.failureBoundaryAfter}** |`,
    `| rootCause | ${input.rootCauseBefore} | **${input.rootCauseAfter}** |`,
    `| routesReachable | false (stale) | **${report.routesReachable}** |`,
    `| failureClass | ROUTE (generic) | **${report.failureClass}** |`,
    '',
    '## Route Proof Summary',
    '',
    `- ${RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION}`,
    `- routesReachable=${report.routesReachable}`,
    `- uiRenderProven=${report.uiRenderProven} (JSON health ≠ UI proof)`,
    `- root route usable: ${report.rootRouteReachable}`,
    '',
    report.routesReachable
      ? 'Failure boundary advances beyond ROUTE when routes are reachable.'
      : 'Failure boundary remains ROUTE with exact route failure class.',
  ].join('\n');
}
