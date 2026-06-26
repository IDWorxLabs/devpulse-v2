/**
 * Live Preview Gate — transition log.
 */

import type { LivePreviewLockState, LivePreviewTransitionRecord, LivePreviewUnlockVerdict } from './live-preview-gate-types.js';
import type { LivePreviewEvidenceSourceId } from './live-preview-gate-types.js';
import { DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY } from './live-preview-gate-types.js';

const transitionLog: LivePreviewTransitionRecord[] = [];
let transitionCounter = 0;

export function resetLivePreviewTransitionLogForTests(): void {
  transitionLog.length = 0;
  transitionCounter = 0;
}

function nextTransitionId(): string {
  transitionCounter += 1;
  return `preview-transition-${transitionCounter}`;
}

export function recordLivePreviewTransition(input: {
  previousState: LivePreviewLockState;
  nextState: LivePreviewLockState;
  trigger: string;
  evidenceSource: LivePreviewEvidenceSourceId | null;
  decision: LivePreviewUnlockVerdict;
  reason: string;
  timestamp?: number;
}): LivePreviewTransitionRecord {
  const record: LivePreviewTransitionRecord = {
    readOnly: true,
    transitionId: nextTransitionId(),
    previousState: input.previousState,
    nextState: input.nextState,
    trigger: input.trigger,
    evidenceSource: input.evidenceSource,
    decision: input.decision,
    timestamp: input.timestamp ?? Date.now(),
    reason: input.reason,
  };
  transitionLog.unshift(record);
  if (transitionLog.length > DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY) {
    transitionLog.length = DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY;
  }
  return record;
}

export function getLivePreviewTransitionLog(): readonly LivePreviewTransitionRecord[] {
  return transitionLog;
}

export function getLatestLivePreviewTransition(): LivePreviewTransitionRecord | null {
  return transitionLog[0] ?? null;
}

export function buildTransitionLogForEvaluation(input: {
  previousState: LivePreviewLockState | null;
  nextState: LivePreviewLockState;
  unlockVerdict: LivePreviewUnlockVerdict;
  primaryBlockingGate: LivePreviewEvidenceSourceId | null;
  reason: string;
  trigger?: string;
}): readonly LivePreviewTransitionRecord[] {
  const previous = input.previousState ?? 'LOCKED_PENDING_GENERATION';
  if (previous === input.nextState) {
    return getLivePreviewTransitionLog();
  }
  recordLivePreviewTransition({
    previousState: previous,
    nextState: input.nextState,
    trigger: input.trigger ?? 'gate_evaluation',
    evidenceSource: input.primaryBlockingGate,
    decision: input.unlockVerdict,
    reason: input.reason,
  });
  return getLivePreviewTransitionLog();
}
