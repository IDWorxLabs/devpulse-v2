/**
 * Phase 27.07 — Final Founder Report Delivery Trace analyzer (diagnostic only).
 */

import { DELIVERY_TRACE_BOUNDARY_ORDER } from './final-founder-report-delivery-trace-registry.js';
import type {
  DeliveryTraceAnalysis,
  DeliveryTraceBoundaryId,
  DeliveryTraceBoundaryRecord,
  DeliveryTraceReport,
  DeliveryTraceRunSnapshot,
} from './final-founder-report-delivery-trace-types.js';
import { FINAL_FOUNDER_REPORT_DELIVERY_TRACE_PASS } from './final-founder-report-delivery-trace-registry.js';

function boundaryById(
  boundaries: readonly DeliveryTraceBoundaryRecord[],
  boundaryId: DeliveryTraceBoundaryId,
): DeliveryTraceBoundaryRecord | undefined {
  return boundaries.find((entry) => entry.boundaryId === boundaryId);
}

export function analyzeDeliveryTraceRun(
  snapshot: DeliveryTraceRunSnapshot | null,
): DeliveryTraceAnalysis {
  if (!snapshot) {
    return {
      readOnly: true,
      runId: null,
      lastSuccessfulBoundary: null,
      firstFailedBoundary: null,
      verdict: 'The final Founder Test report stops at UNKNOWN because no delivery trace snapshot exists.',
      sourceFile: null,
      sourceFunction: null,
      sourceLine: null,
      exception: null,
      missingArtifact: null,
    };
  }

  let lastSuccessfulBoundary: DeliveryTraceBoundaryId | null = null;
  let firstFailedBoundary: DeliveryTraceBoundaryId | null = null;

  for (const boundaryId of DELIVERY_TRACE_BOUNDARY_ORDER) {
    const record = boundaryById(snapshot.boundaries, boundaryId);
    if (!record) continue;
    if (record.succeeded && record.completed) {
      lastSuccessfulBoundary = boundaryId;
      continue;
    }
    if (record.completed && !record.succeeded) {
      firstFailedBoundary = boundaryId;
      break;
    }
    if (record.entered && !record.completed) {
      firstFailedBoundary = boundaryId;
      break;
    }
    if (!record.entered && lastSuccessfulBoundary != null) {
      firstFailedBoundary = boundaryId;
      break;
    }
  }

  const failedRecord = firstFailedBoundary
    ? boundaryById(snapshot.boundaries, firstFailedBoundary)
    : null;

  const reasonParts: string[] = [];
  if (failedRecord?.missingArtifact) reasonParts.push(`missing artifact: ${failedRecord.missingArtifact}`);
  if (failedRecord?.exception) reasonParts.push(failedRecord.exception);
  if (!failedRecord && lastSuccessfulBoundary && lastSuccessfulBoundary !== 'FOUNDER_REPORT_RENDER') {
    const nextIndex = DELIVERY_TRACE_BOUNDARY_ORDER.indexOf(lastSuccessfulBoundary) + 1;
    firstFailedBoundary = DELIVERY_TRACE_BOUNDARY_ORDER[nextIndex] ?? null;
    reasonParts.push('next boundary never invoked');
  }
  if (!failedRecord && !lastSuccessfulBoundary) {
    reasonParts.push('execution never entered the traced chain');
  }

  const stopBoundary = firstFailedBoundary ?? lastSuccessfulBoundary ?? 'UNKNOWN';
  const verdict =
    firstFailedBoundary == null && lastSuccessfulBoundary === 'FOUNDER_REPORT_RENDER'
      ? 'The final Founder Test report reached FOUNDER_REPORT_RENDER successfully.'
      : `The final Founder Test report stops at ${stopBoundary} because ${reasonParts.join('; ') || 'the boundary did not complete'}.`;

  return {
    readOnly: true,
    runId: snapshot.runId,
    lastSuccessfulBoundary,
    firstFailedBoundary,
    verdict,
    sourceFile: failedRecord?.source?.file ?? null,
    sourceFunction: failedRecord?.source?.function ?? null,
    sourceLine: failedRecord?.source?.line ?? null,
    exception: failedRecord?.exception ?? null,
    missingArtifact: failedRecord?.missingArtifact ?? null,
  };
}

export function buildDeliveryTraceReport(snapshot: DeliveryTraceRunSnapshot | null): DeliveryTraceReport {
  const analysis = analyzeDeliveryTraceRun(snapshot);
  const chainComplete =
    analysis.lastSuccessfulBoundary === 'FOUNDER_REPORT_RENDER' && analysis.firstFailedBoundary == null;
  return {
    readOnly: true,
    diagnosticOnly: true,
    generatedAt: new Date().toISOString(),
    runId: snapshot?.runId ?? null,
    analysis,
    boundaries: snapshot?.boundaries ?? [],
    passToken: chainComplete ? FINAL_FOUNDER_REPORT_DELIVERY_TRACE_PASS : null,
  };
}
