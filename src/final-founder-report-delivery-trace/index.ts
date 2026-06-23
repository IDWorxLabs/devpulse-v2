/**
 * Phase 27.07 — Final Founder Report Delivery Trace (diagnostic only).
 */

export type {
  DeliveryTraceAnalysis,
  DeliveryTraceBoundaryId,
  DeliveryTraceBoundaryRecord,
  DeliveryTraceReport,
  DeliveryTraceRunSnapshot,
  DeliveryTraceSourceLocation,
} from './final-founder-report-delivery-trace-types.js';

export {
  DELIVERY_TRACE_BOUNDARY_ORDER,
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_CORE_QUESTION,
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_PASS,
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_REPORT_TITLE,
  RUNTIME_STAGE_TO_DELIVERY_BOUNDARY,
  nextDeliveryTraceBoundary,
} from './final-founder-report-delivery-trace-registry.js';

export {
  analyzeDeliveryTraceRun,
  buildDeliveryTraceReport,
} from './final-founder-report-delivery-trace-analyzer.js';

export {
  buildDeliveryTraceValidationMarkdown,
  buildFinalFounderReportDeliveryTraceMarkdown,
} from './final-founder-report-delivery-trace-report-builder.js';

export {
  completeDeliveryTraceBoundary,
  deliveryTraceSource,
  enterDeliveryTraceBoundary,
  failDeliveryTraceBoundary,
  finalizeDeliveryTraceRun,
  getActiveDeliveryTraceRunId,
  getDeliveryTraceRunSnapshot,
  recordClientDeliveryTraceEvent,
  resetFinalFounderReportDeliveryTraceForTests,
  startFinalFounderReportDeliveryTrace,
} from './final-founder-report-delivery-trace-recorder.js';

export {
  failFirstIncompleteDeliveryBoundary,
  traceDeliveryStageComplete,
  traceDeliveryStageEnter,
  traceReportGenerationComplete,
  traceResultRetrievalApi,
  traceResultStoreWrite,
} from './final-founder-report-delivery-trace-hooks.js';

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDeliveryTraceReport } from './final-founder-report-delivery-trace-analyzer.js';
import { buildFinalFounderReportDeliveryTraceMarkdown } from './final-founder-report-delivery-trace-report-builder.js';
import {
  finalizeDeliveryTraceRun,
  getDeliveryTraceRunSnapshot,
} from './final-founder-report-delivery-trace-recorder.js';

export function writeFinalFounderReportDeliveryTraceReport(input: {
  runId?: string | null;
  rootDir?: string;
} = {}): string {
  const snapshot = finalizeDeliveryTraceRun(input.runId) ?? getDeliveryTraceRunSnapshot(input.runId);
  const report = buildDeliveryTraceReport(snapshot);
  const markdown = buildFinalFounderReportDeliveryTraceMarkdown(report);
  const rootDir = input.rootDir ?? process.cwd();
  writeFileSync(join(rootDir, 'architecture', 'FINAL_FOUNDER_REPORT_DELIVERY_TRACE.md'), markdown, 'utf8');
  return markdown;
}

export function getDeliveryTraceSummaryForDebug(runId?: string | null): Record<string, unknown> {
  const snapshot = getDeliveryTraceRunSnapshot(runId);
  const report = buildDeliveryTraceReport(snapshot);
  return {
    readOnly: true,
    runId: report.runId,
    verdict: report.analysis.verdict,
    lastSuccessfulBoundary: report.analysis.lastSuccessfulBoundary,
    firstFailedBoundary: report.analysis.firstFailedBoundary,
    sourceFile: report.analysis.sourceFile,
    sourceFunction: report.analysis.sourceFunction,
    sourceLine: report.analysis.sourceLine,
    exception: report.analysis.exception,
    missingArtifact: report.analysis.missingArtifact,
    boundaries: report.boundaries.map((boundary) => ({
      boundaryId: boundary.boundaryId,
      entered: boundary.entered,
      completed: boundary.completed,
      elapsedMs: boundary.elapsedMs,
      outputExists: boundary.outputExists,
      outputSize: boundary.outputSize,
      nextBoundaryInvoked: boundary.nextBoundaryInvoked,
      succeeded: boundary.succeeded,
      exception: boundary.exception,
      missingArtifact: boundary.missingArtifact,
    })),
  };
}
