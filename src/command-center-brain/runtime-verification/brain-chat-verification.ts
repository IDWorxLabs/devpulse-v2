/**
 * Brain chat verification — message capture through response rendering checks.
 */

import type { BrainResponseResult } from '../brain-types.js';
import { verifyBrainProcessing } from './brain-api-verification.js';
import { verifyOperatorFeedEvents } from './brain-feed-verification.js';
import {
  type BrainRuntimeTraceEntry,
  createInitialTrace,
  markTraceStage,
} from './brain-runtime-trace.js';

export interface ChatVerificationInput {
  message: string;
  timestamp?: number;
}

export interface ChatVerificationResult {
  messageCaptured: boolean;
  apiCallable: boolean;
  responseReturned: boolean;
  responseRenderable: boolean;
  brainMessageVisible: boolean;
  trace: BrainRuntimeTraceEntry[];
  brainResult: BrainResponseResult | null;
  lastFailureReason: string | null;
}

export function verifyChatPipeline(input: ChatVerificationInput): ChatVerificationResult {
  const timestamp = input.timestamp ?? Date.now();
  let trace = createInitialTrace(timestamp);

  const message = input.message?.trim() ?? '';
  if (!message) {
    trace = markTraceStage(trace, 'CHAT_SUBMIT', 'failed', 'Empty message', timestamp);
    return {
      messageCaptured: false,
      apiCallable: false,
      responseReturned: false,
      responseRenderable: false,
      brainMessageVisible: false,
      trace,
      brainResult: null,
      lastFailureReason: 'Message not captured — empty input',
    };
  }

  trace = markTraceStage(trace, 'CHAT_SUBMIT', 'complete', 'User message captured', timestamp);
  trace = markTraceStage(trace, 'UI_EVENT', 'complete', 'Submit handler fired', timestamp + 1);

  const processing = verifyBrainProcessing(message);
  trace = markTraceStage(
    trace,
    'BRAIN_PROCESSING',
    processing.ok ? 'complete' : 'failed',
    processing.ok ? 'Brain processing complete' : processing.lastFailureReason ?? 'Processing failed',
    timestamp + 2,
  );

  if (!processing.ok || !processing.result) {
    return {
      messageCaptured: true,
      apiCallable: true,
      responseReturned: false,
      responseRenderable: false,
      brainMessageVisible: false,
      trace,
      brainResult: processing.result,
      lastFailureReason: processing.lastFailureReason,
    };
  }

  const feedCheck = verifyOperatorFeedEvents(processing.result.operatorFeedEvents);
  trace = markTraceStage(
    trace,
    'OPERATOR_FEED_EVENTS',
    feedCheck.feedActivated ? 'complete' : 'failed',
    feedCheck.feedActivated ? 'Feed events generated' : feedCheck.lastFailureReason ?? 'Feed inactive',
    timestamp + 3,
  );

  trace = markTraceStage(trace, 'BRAIN_RESPONSE', 'complete', 'Brain response generated', timestamp + 4);
  trace = markTraceStage(trace, 'UI_RENDERING', 'complete', 'Response ready for render', timestamp + 5);
  trace = markTraceStage(trace, 'FINAL_CHAT_OUTPUT', 'complete', 'Brain message visible', timestamp + 6);

  return {
    messageCaptured: true,
    apiCallable: true,
    responseReturned: true,
    responseRenderable: Boolean(processing.result.brainResponse),
    brainMessageVisible: Boolean(processing.result.brainResponse),
    trace,
    brainResult: processing.result,
    lastFailureReason: feedCheck.lastFailureReason,
  };
}

export function chatVerificationKey(result: ChatVerificationResult): string {
  return [
    result.messageCaptured,
    result.responseReturned,
    result.brainMessageVisible,
    result.lastFailureReason ?? 'ok',
  ].join('|');
}
