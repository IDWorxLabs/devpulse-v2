/**
 * Brain runtime verification report — aggregated runtime health snapshot.
 */

import type { BrainResponseResult } from '../brain-types.js';
import { verifyBrainProcessing } from './brain-api-verification.js';
import { verifyOperatorFeedEvents } from './brain-feed-verification.js';
import type { BrainRuntimeTraceEntry } from './brain-runtime-trace.js';
import { verifyChatPipeline } from './brain-chat-verification.js';

export const BRAIN_RUNTIME_VERIFICATION_PASS_TOKEN =
  'DEVPULSE_V2_COMMAND_CENTER_BRAIN_RUNTIME_VERIFICATION_AND_OPERATOR_FEED_ACTIVATION_V1_PASS';

export interface BrainRuntimeVerificationReport {
  endpointReachable: boolean;
  requestReceived: boolean;
  classificationComplete: boolean;
  systemAwarenessComplete: boolean;
  roadmapAwarenessComplete: boolean;
  memoryLookupComplete: boolean;
  memoryCount: number;
  responseGenerated: boolean;
  responseRendered: boolean;
  feedActivated: boolean;
  notificationActivated: boolean;
  lastFailureReason: string | null;
  timestamp: number;
  trace: BrainRuntimeTraceEntry[];
}

export function buildBrainRuntimeVerificationReportFromResult(
  result: BrainResponseResult,
  options: {
    endpointReachable?: boolean;
    responseRendered?: boolean;
    notificationActivated?: boolean;
    timestamp?: number;
  } = {},
): BrainRuntimeVerificationReport {
  const feed = verifyOperatorFeedEvents(result.operatorFeedEvents);
  const timestamp = options.timestamp ?? Date.now();

  return {
    endpointReachable: options.endpointReachable ?? true,
    requestReceived: Boolean(result.userMessage?.trim()),
    classificationComplete: Boolean(result.classification?.category),
    systemAwarenessComplete: Array.isArray(result.systemsReferenced),
    roadmapAwarenessComplete: Boolean(result.roadmapContext?.currentPhase),
    memoryLookupComplete: Boolean(result.sharedMemoryContext?.lookupPerformed),
    memoryCount: result.sharedMemoryContext?.memoryCount ?? 0,
    responseGenerated: Boolean(result.brainResponse?.trim()),
    responseRendered: options.responseRendered ?? false,
    feedActivated: feed.feedActivated && feed.stagesOrdered,
    notificationActivated: options.notificationActivated ?? false,
    lastFailureReason: feed.lastFailureReason,
    timestamp,
    trace: [],
  };
}

export function buildBrainRuntimeVerificationReport(message: string): BrainRuntimeVerificationReport {
  const chat = verifyChatPipeline({ message, timestamp: Date.now() });
  const result = chat.brainResult;

  if (!result) {
    return {
      endpointReachable: true,
      requestReceived: chat.messageCaptured,
      classificationComplete: false,
      systemAwarenessComplete: false,
      roadmapAwarenessComplete: false,
      memoryLookupComplete: false,
      memoryCount: 0,
      responseGenerated: false,
      responseRendered: false,
      feedActivated: false,
      notificationActivated: false,
      lastFailureReason: chat.lastFailureReason,
      timestamp: Date.now(),
      trace: chat.trace,
    };
  }

  const report = buildBrainRuntimeVerificationReportFromResult(result, { endpointReachable: true });
  return { ...report, trace: chat.trace, lastFailureReason: chat.lastFailureReason ?? report.lastFailureReason };
}

export function runtimeReportKey(report: BrainRuntimeVerificationReport): string {
  return [
    report.endpointReachable,
    report.requestReceived,
    report.classificationComplete,
    report.responseGenerated,
    report.feedActivated,
    report.lastFailureReason ?? 'ok',
  ].join('|');
}

export function assertRuntimeReportHealthy(report: BrainRuntimeVerificationReport): boolean {
  return (
    report.requestReceived &&
    report.classificationComplete &&
    report.systemAwarenessComplete &&
    report.roadmapAwarenessComplete &&
    report.responseGenerated &&
    report.feedActivated &&
    !report.lastFailureReason
  );
}

export function verifyBrainProcessingForReport(message: string): BrainRuntimeVerificationReport {
  const check = verifyBrainProcessing(message);
  if (!check.ok || !check.result) {
    return buildBrainRuntimeVerificationReport(message);
  }
  return buildBrainRuntimeVerificationReportFromResult(check.result);
}
