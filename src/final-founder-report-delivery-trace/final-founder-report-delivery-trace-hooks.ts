/**
 * Phase 27.07 — Final Founder Report Delivery Trace hooks (diagnostic only).
 */

import {
  completeDeliveryTraceBoundary,
  deliveryTraceSource,
  enterDeliveryTraceBoundary,
  failDeliveryTraceBoundary,
  getDeliveryTraceRunSnapshot,
} from './final-founder-report-delivery-trace-recorder.js';
import {
  DELIVERY_TRACE_BOUNDARY_ORDER,
  RUNTIME_STAGE_TO_DELIVERY_BOUNDARY,
  nextDeliveryTraceBoundary,
} from './final-founder-report-delivery-trace-registry.js';
import type { DeliveryTraceBoundaryId } from './final-founder-report-delivery-trace-types.js';

const HANDLER_FILE = 'server/founder-testing-handler.ts';
const STORE_FILE = 'src/founder-test-runtime-monitor/founder-result-store-delivery-repair.ts';

export function traceDeliveryStageEnter(runId: string, stageId: string, line: number): void {
  const boundaryId = RUNTIME_STAGE_TO_DELIVERY_BOUNDARY[stageId];
  if (!boundaryId) return;
  enterDeliveryTraceBoundary({
    runId,
    boundaryId,
    source: deliveryTraceSource(HANDLER_FILE, 'executeFounderTestRunCore', line),
  });
}

export function traceDeliveryStageComplete(
  runId: string,
  stageId: string,
  input: {
    outputExists?: boolean;
    outputSize?: number | null;
    details?: Record<string, unknown>;
  } = {},
): void {
  const boundaryId = RUNTIME_STAGE_TO_DELIVERY_BOUNDARY[stageId];
  if (!boundaryId) return;
  completeDeliveryTraceBoundary({
    runId,
    boundaryId,
    outputExists: input.outputExists,
    outputSize: input.outputSize ?? null,
    details: input.details,
  });
}

export function traceReportGenerationComplete(
  runId: string,
  input: {
    reportObjectExists: boolean;
    reportMarkdownExists: boolean;
    reportMarkdownLength: number;
    launchBlockerBoardExists: boolean;
    serializationSucceeded: boolean;
    serializationError?: string | null;
    outputSize?: number | null;
  },
): void {
  const succeeded =
    input.reportObjectExists &&
    input.reportMarkdownExists &&
    input.reportMarkdownLength > 0 &&
    input.serializationSucceeded;

  enterDeliveryTraceBoundary({
    runId,
    boundaryId: 'REPORT_GENERATION',
    source: deliveryTraceSource(HANDLER_FILE, 'executeFounderTestRunCore', 747),
  });

  if (succeeded) {
    completeDeliveryTraceBoundary({
      runId,
      boundaryId: 'REPORT_GENERATION',
      outputExists: true,
      outputSize: input.outputSize ?? input.reportMarkdownLength,
      nextBoundaryInvoked: 'RESULT_STORE_WRITE',
      details: {
        reportObjectExists: input.reportObjectExists,
        reportMarkdownExists: input.reportMarkdownExists,
        reportMarkdownLength: input.reportMarkdownLength,
        launchBlockerBoardExists: input.launchBlockerBoardExists,
        reportSerializationSucceeded: input.serializationSucceeded,
      },
    });
    return;
  }

  const missingArtifact = !input.reportMarkdownExists || input.reportMarkdownLength <= 0
    ? 'reportMarkdown'
    : !input.reportObjectExists
      ? 'report object'
      : !input.serializationSucceeded
        ? 'report serialization'
        : 'report generation output';

  failDeliveryTraceBoundary({
    runId,
    boundaryId: 'REPORT_GENERATION',
    exception: input.serializationError ?? 'report generation did not produce deliverable markdown',
    missingArtifact,
    outputExists: input.reportMarkdownExists,
    outputSize: input.reportMarkdownLength,
    details: {
      reportObjectExists: input.reportObjectExists,
      reportMarkdownExists: input.reportMarkdownExists,
      reportMarkdownLength: input.reportMarkdownLength,
      launchBlockerBoardExists: input.launchBlockerBoardExists,
      reportSerializationSucceeded: input.serializationSucceeded,
    },
  });
}

export function traceResultStoreWrite(
  runId: string,
  input: {
    storeWriteAttempted: boolean;
    storeWriteSucceeded: boolean;
    storedRunId: string | null;
    storedPayloadBytes: number | null;
    storedReportLength: number | null;
    phase: string;
    duplicateFinalWriteSkipped?: boolean;
    exception?: string | null;
  },
): void {
  enterDeliveryTraceBoundary({
    runId,
    boundaryId: 'RESULT_STORE_WRITE',
    source: deliveryTraceSource(STORE_FILE, 'persistFounderTestResultHandoff', 216),
    details: { storeWriteAttempted: input.storeWriteAttempted, phase: input.phase },
  });

  if (input.storeWriteSucceeded) {
    completeDeliveryTraceBoundary({
      runId,
      boundaryId: 'RESULT_STORE_WRITE',
      outputExists: true,
      outputSize: input.storedPayloadBytes,
      nextBoundaryInvoked: 'RESULT_RETRIEVAL_API',
      details: {
        storeWriteAttempted: input.storeWriteAttempted,
        storeWriteSucceeded: input.storeWriteSucceeded,
        storedRunId: input.storedRunId,
        storedPayloadBytes: input.storedPayloadBytes,
        storedReportLength: input.storedReportLength,
        phase: input.phase,
        duplicateFinalWriteSkipped: input.duplicateFinalWriteSkipped ?? false,
      },
    });
    return;
  }

  failDeliveryTraceBoundary({
    runId,
    boundaryId: 'RESULT_STORE_WRITE',
    exception: input.exception ?? 'result store write failed',
    missingArtifact: input.storedReportLength != null && input.storedReportLength <= 0 ? 'stored reportMarkdown' : 'stored result payload',
    details: {
      storeWriteAttempted: input.storeWriteAttempted,
      storeWriteSucceeded: input.storeWriteSucceeded,
      storedRunId: input.storedRunId,
      phase: input.phase,
    },
  });
}

export function traceResultRetrievalApi(
  runId: string | null,
  input: {
    lookupRunId: string | null;
    lookupSuccess: boolean;
    payloadFound: boolean;
    reportFound: boolean;
    reportMarkdownFound: boolean;
    httpStatus: number;
    exception?: string | null;
    responseSize?: number | null;
  },
): void {
  const traceRunId = runId ?? input.lookupRunId;
  if (!traceRunId) return;

  enterDeliveryTraceBoundary({
    runId: traceRunId,
    boundaryId: 'RESULT_RETRIEVAL_API',
    source: deliveryTraceSource(HANDLER_FILE, 'handleFounderTestResultRequest', 1483),
    details: { lookupRunId: input.lookupRunId, httpStatus: input.httpStatus },
  });

  const succeeded = input.lookupSuccess && input.payloadFound && input.reportMarkdownFound;

  if (succeeded) {
    completeDeliveryTraceBoundary({
      runId: traceRunId,
      boundaryId: 'RESULT_RETRIEVAL_API',
      outputExists: true,
      outputSize: input.responseSize ?? null,
      nextBoundaryInvoked: 'CLIENT_CACHE',
      details: {
        lookupRunId: input.lookupRunId,
        lookupSuccess: input.lookupSuccess,
        payloadFound: input.payloadFound,
        reportFound: input.reportFound,
        reportMarkdownFound: input.reportMarkdownFound,
        httpStatus: input.httpStatus,
      },
    });
    return;
  }

  failDeliveryTraceBoundary({
    runId: traceRunId,
    boundaryId: 'RESULT_RETRIEVAL_API',
    exception: input.exception ?? `result retrieval incomplete (HTTP ${input.httpStatus})`,
    missingArtifact: !input.payloadFound
      ? 'stored payload'
      : !input.reportMarkdownFound
        ? 'reportMarkdown in stored payload'
        : 'retrieval response',
    details: {
      lookupRunId: input.lookupRunId,
      lookupSuccess: input.lookupSuccess,
      payloadFound: input.payloadFound,
      reportFound: input.reportFound,
      reportMarkdownFound: input.reportMarkdownFound,
      httpStatus: input.httpStatus,
    },
  });
}

export function failFirstIncompleteDeliveryBoundary(
  runId: string,
  exception: string,
  source?: { file: string; function: string; line: number },
): void {
  const snapshot = getDeliveryTraceRunSnapshot(runId);
  let target: DeliveryTraceBoundaryId | null = null;

  if (snapshot) {
    for (const boundaryId of DELIVERY_TRACE_BOUNDARY_ORDER) {
      const record = snapshot.boundaries.find((entry) => entry.boundaryId === boundaryId);
      if (!record) continue;
      if (record.entered && !record.completed) {
        target = boundaryId;
        break;
      }
      if (!record.entered && record.boundaryId !== 'FOUNDER_TEST_START') {
        const prevIndex = DELIVERY_TRACE_BOUNDARY_ORDER.indexOf(boundaryId) - 1;
        const prev = prevIndex >= 0 ? snapshot.boundaries.find((entry) => entry.boundaryId === DELIVERY_TRACE_BOUNDARY_ORDER[prevIndex]) : null;
        if (prev?.succeeded) {
          target = boundaryId;
          break;
        }
      }
    }
  }

  target ??= 'FOUNDER_TEST_START';

  if (!snapshot?.boundaries.find((entry) => entry.boundaryId === target)?.entered) {
    enterDeliveryTraceBoundary({ runId, boundaryId: target });
  }

  failDeliveryTraceBoundary({
    runId,
    boundaryId: target,
    exception,
    source: source
      ? deliveryTraceSource(source.file, source.function, source.line)
      : undefined,
  });
}

export function resolveNextBoundaryAfterStage(stageId: string): DeliveryTraceBoundaryId | null {
  const boundaryId = RUNTIME_STAGE_TO_DELIVERY_BOUNDARY[stageId];
  if (!boundaryId) return null;
  return nextDeliveryTraceBoundary(boundaryId);
}
