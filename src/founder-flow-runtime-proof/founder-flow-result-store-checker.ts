/**
 * Founder flow result store checker — final delivery vs partial report (Phase 26.86).
 */

import {
  resolveStoredFounderTestReportMarkdown,
} from '../founder-test-runtime-monitor/founder-test-complete-report-handoff.js';
import {
  listFounderTestRunResultIds,
  peekFounderTestRunResult,
} from '../founder-test-runtime-monitor/founder-test-run-result-store.js';
import { resolveFinalReportMarkdownPriority } from '../founder-test-runtime-monitor/final-report-access-cache.js';
import { FOUNDER_FLOW_RESULT_ENDPOINTS } from './founder-flow-runtime-proof-registry.js';
import type { FounderFlowResultStoreCheck } from './founder-flow-runtime-proof-types.js';
import type { RuntimeFounderFlowEvidence } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import { assessFounderTestResultStoreDelivery } from '../founder-test-runtime-monitor/founder-result-store-delivery-repair.js';

function isPartialReportPayload(payload: Record<string, unknown>): boolean {
  if (payload.finalReportPreparing === true) return true;
  if (payload.finalReportReady === false) return true;
  const report = payload.report as { reportMarkdown?: string } | undefined;
  const markdown =
    resolveStoredFounderTestReportMarkdown({
      readOnly: true,
      runId: String(payload.runId ?? ''),
      ok: true,
      completedAt: new Date().toISOString(),
      payload,
      errorMessage: null,
    }) ?? '';
  return markdown.includes('Report Handoff Diagnostic') || markdown.includes('still running');
}

export function checkFounderFlowResultDelivery(input: {
  finalReportsByRunId?: Readonly<Record<string, string>>;
  bridgeFounderFlow?: RuntimeFounderFlowEvidence | null;
}): FounderFlowResultStoreCheck {
  const runIds = listFounderTestRunResultIds();
  const latestStored = peekFounderTestRunResult(null);
  const latestRunId = latestStored?.runId ?? runIds[0] ?? null;
  const delivery = assessFounderTestResultStoreDelivery({
    requestedRunId: latestRunId,
    runtimeRunId: latestStored?.payload?.runtime
      ? (latestStored.payload.runtime as { runId?: string }).runId ?? null
      : null,
  });

  const resultStorePresent = delivery.resultStoreEntryExists || runIds.length > 0 || latestStored !== null;

  let reportGenerated = false;
  let finalResultDelivered = false;
  let partialReportOnly = false;
  let finalReportMarkdownPresent = false;

  if (latestStored) {
    const markdown = resolveStoredFounderTestReportMarkdown(latestStored);
    partialReportOnly = isPartialReportPayload(latestStored.payload);
    reportGenerated =
      latestStored.payload.finalReportReady === true ||
      Boolean(markdown) ||
      latestStored.payload.reportGenerationObserved === true;
    finalReportMarkdownPresent = Boolean(markdown?.trim());
    finalResultDelivered =
      delivery.finalReportDelivered ||
      (latestStored.ok === true &&
        latestStored.payload.finalReportReady === true &&
        latestStored.payload.finalReportPreparing !== true &&
        finalReportMarkdownPresent &&
        !partialReportOnly);
  }

  const cache = input.finalReportsByRunId ?? {};
  const cacheResolved = resolveFinalReportMarkdownPriority({
    runId: latestRunId,
    finalReportsByRunId: cache,
  });
  const clientCacheUpdated =
    cacheResolved.source === 'local-cache' &&
    cacheResolved.markdown !== null &&
    !cacheResolved.markdown.includes('Report Handoff Diagnostic');

  if (!finalResultDelivered && clientCacheUpdated && cacheResolved.markdown) {
    finalReportMarkdownPresent = true;
    finalResultDelivered = true;
    reportGenerated = true;
    partialReportOnly = false;
  }

  const bridgeClaimsDelivery = input.bridgeFounderFlow?.finalReportDelivered === true;
  const evidencePropagationAligned =
    input.bridgeFounderFlow == null
      ? true
      : finalResultDelivered === bridgeClaimsDelivery;

  let checkDetail = 'No founder test run result in store.';
  if (latestStored) {
    checkDetail = `runId=${latestStored.runId}, finalReportReady=${String(latestStored.payload.finalReportReady)}, partial=${partialReportOnly}`;
  } else if (clientCacheUpdated) {
    checkDetail = `client cache hit for runId=${latestRunId ?? 'n/a'}`;
  }

  return {
    readOnly: true,
    resultStorePresent,
    resultStoreRunIds: runIds,
    latestRunId,
    reportGenerated,
    finalResultDelivered,
    clientCacheUpdated,
    resultEndpointRegistered: FOUNDER_FLOW_RESULT_ENDPOINTS.length > 0,
    resultEndpointPath: FOUNDER_FLOW_RESULT_ENDPOINTS[0] ?? null,
    finalReportMarkdownPresent,
    partialReportOnly,
    evidencePropagationAligned,
    checkDetail,
  };
}
