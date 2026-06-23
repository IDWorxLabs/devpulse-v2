/**
 * Founder Flow Runtime Proof — report builder (Phase 26.86).
 */

import {
  FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION,
  FOUNDER_FLOW_RUNTIME_PROOF_REPORT_TITLE,
  FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT_TITLE,
  TRUTH_RULES,
} from './founder-flow-runtime-proof-registry.js';
import type { FounderFlowRuntimeProofReport } from './founder-flow-runtime-proof-types.js';

export function buildFounderFlowRuntimeProofReportMarkdown(
  report: FounderFlowRuntimeProofReport,
): string {
  return [
    `# ${FOUNDER_FLOW_RUNTIME_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Proof ID: ${report.proofId}`,
    `Workspace: ${report.workspaceId}`,
    '',
    '## Core Question',
    '',
    report.coreQuestion,
    '',
    '## Upstream Gates',
    '',
    `- filesExistOnDisk: ${report.filesExistOnDisk}`,
    `- dependenciesReady: ${report.dependenciesReady}`,
    `- applicationBootsBeforeProbe: ${report.applicationBootsBeforeProbe}`,
    `- routesReachableBeforeProbe: ${report.routesReachableBeforeProbe}`,
    `- uiRendersBeforeProbe: **${report.uiRendersBeforeProbe}**`,
    '',
    '## Flow Probe',
    '',
    `- founderRuntimeOpen: ${report.flowProbe.founderRuntimeOpen}`,
    `- uiLoadedAsApp: ${report.flowProbe.uiLoadedAsApp}`,
    `- flowStartProven: ${report.flowProbe.flowStartProven}`,
    `- interactiveElements: ${report.flowProbe.interactiveScan.interactiveElementCount}`,
    '',
    '## Result Store Check',
    '',
    `- resultStorePresent: ${report.resultStoreCheck.resultStorePresent}`,
    `- reportGenerated: ${report.resultStoreCheck.reportGenerated}`,
    `- finalResultDelivered: **${report.resultStoreCheck.finalResultDelivered}**`,
    `- clientCacheUpdated: ${report.resultStoreCheck.clientCacheUpdated}`,
    `- partialReportOnly: ${report.resultStoreCheck.partialReportOnly}`,
    `- evidencePropagationAligned: ${report.resultStoreCheck.evidencePropagationAligned}`,
    `- detail: ${report.resultStoreCheck.checkDetail}`,
    '',
    '## Classification',
    '',
    `- failureClass: **${report.failureClass}**`,
    `- founderFlowProven: **${report.founderFlowProven}**`,
    `- reason: ${report.founderFlowFailureReason}`,
    '',
    '## Recommended Actions',
    '',
    ...report.recommendedNextActions.map((a) => `- ${a}`),
    '',
    `Cache key: \`${report.cacheKey}\``,
  ].join('\n');
}

export function buildFounderFlowRuntimeReconciliationReportMarkdown(input: {
  report: FounderFlowRuntimeProofReport;
  failureBoundaryBefore: string;
  failureBoundaryAfter: string;
  finalApplicationTruthBefore: string;
  finalApplicationTruthAfter: string;
}): string {
  return [
    `# ${FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT_TITLE}`,
    '',
    `Generated: ${input.report.generatedAt}`,
    '',
    '## Truth Rules',
    '',
    ...TRUTH_RULES.map((r) => `- ${r}`),
    '',
    '## Reconciliation',
    '',
    '| Field | Before | After |',
    '| --- | --- | --- |',
    `| failureBoundary | ${input.failureBoundaryBefore} | **${input.failureBoundaryAfter}** |`,
    `| finalApplicationTruth | ${input.finalApplicationTruthBefore} | **${input.finalApplicationTruthAfter}** |`,
    `| founderFlowProven | false/stale | **${input.report.founderFlowProven}** |`,
    '',
    `- ${FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION}`,
  ].join('\n');
}
