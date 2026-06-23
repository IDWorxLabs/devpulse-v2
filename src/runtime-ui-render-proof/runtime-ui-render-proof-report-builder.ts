/**
 * Runtime UI Render Proof — report builder (Phase 26.84).
 */

import {
  RUNTIME_UI_RENDER_PROOF_CORE_QUESTION,
  RUNTIME_UI_RENDER_PROOF_REPORT_TITLE,
  RUNTIME_UI_RENDER_RECONCILIATION_REPORT_TITLE,
  TRUTH_RULES,
} from './runtime-ui-render-proof-registry.js';
import type { RuntimeUiRenderProofReport } from './runtime-ui-render-proof-types.js';

export function buildRuntimeUiRenderProofReportMarkdown(report: RuntimeUiRenderProofReport): string {
  return [
    `# ${RUNTIME_UI_RENDER_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Proof ID: ${report.proofId}`,
    `Workspace: ${report.workspaceId}`,
    '',
    '## Core Question',
    '',
    report.coreQuestion,
    '',
    '## Gates',
    '',
    `- applicationBootsBeforeProbe: **${report.applicationBootsBeforeProbe}**`,
    `- routesReachableBeforeProbe: **${report.routesReachableBeforeProbe}**`,
    '',
    '## UI Source Files',
    '',
    `- uiSourceFilesPresent: ${report.uiSourceFiles.uiSourceFilesPresent}`,
    `- hasIndexHtml: ${report.uiSourceFiles.hasIndexHtml}`,
    `- hasReactApp: ${report.uiSourceFiles.hasReactApp}`,
    `- hasViteConfig: ${report.uiSourceFiles.hasViteConfig}`,
    `- files: ${report.uiSourceFiles.discoveredFiles.join(', ') || 'none'}`,
    '',
    '## UI Route Discovery',
    '',
    '| Path | Source | Expectation | Confidence |',
    '| --- | --- | --- | --- |',
    ...report.discoveredUiRoutes.map(
      (r) => `| ${r.path} | ${r.source} | ${r.expectation} | ${r.confidence} |`,
    ),
    '',
    '## UI Render Probe',
    '',
    `- baseUrl: ${report.probeSession.baseUrl ?? 'none'}`,
    `- probeSkipped: ${report.probeSession.probeSkipped}`,
    '',
    '| Path | Status | Type | JSON | Mount | Bundle | Verdict |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.probeSession.probeResults.map(
      (p) =>
        `| ${p.path} | ${p.statusCode ?? 'n/a'} | ${p.contentType ?? 'n/a'} | ${p.isJsonOnly} | ${p.hasRootMount} | ${p.hasScriptBundle} | ${p.verdict} |`,
    ),
    '',
    '## Classification',
    '',
    `- failureClass: **${report.failureClass}**`,
    `- uiRenders: **${report.uiRenders}**`,
    `- rootRouteJsonOnly: ${report.rootRouteJsonOnly}`,
    `- uiFailureReason: ${report.uiFailureReason}`,
    '',
    '## Recommended Actions',
    '',
    ...report.recommendedNextActions.map((a) => `- ${a}`),
    '',
    `Cache key: \`${report.cacheKey}\``,
  ].join('\n');
}

export function buildRuntimeUiRenderReconciliationReportMarkdown(input: {
  report: RuntimeUiRenderProofReport;
  failureBoundaryBefore: string;
  failureBoundaryAfter: string;
  rootCauseBefore: string;
  rootCauseAfter: string;
}): string {
  const { report } = input;
  return [
    `# ${RUNTIME_UI_RENDER_RECONCILIATION_REPORT_TITLE}`,
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
    `| uiRenders | unknown/stale | **${report.uiRenders}** |`,
    `| failureClass | n/a | **${report.failureClass}** |`,
    '',
    '## Summary',
    '',
    `- ${RUNTIME_UI_RENDER_PROOF_CORE_QUESTION}`,
    `- routesReachable does not imply uiRenders (Rule 3)`,
    `- rootRouteJsonOnly=${report.rootRouteJsonOnly}`,
    '',
    report.uiRenders
      ? 'Failure boundary advances to FOUNDER_FLOW, REPORTING, or NONE.'
      : 'Failure boundary remains UI unless reporting evidence is stale.',
  ].join('\n');
}
