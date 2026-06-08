/**
 * Browser Verification Harness bridge — harness remains owner; Reality Replay consumes verification history.
 */

import { getDevPulseV2BrowserVerificationHarness } from '../browser-verification/browser-verification-harness.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import type { BrowserRealityCheck, BrowserVerificationResult } from '../browser-verification/types.js';
import { createReplayEvent } from './reality-replay-engine.js';
import type { ReplayEvent, ReplaySession } from './types.js';
import { replayBrowserHistory } from './reality-replay-engine.js';

function browserCheckToReplayEvent(check: BrowserRealityCheck, result: BrowserVerificationResult): ReplayEvent {
  return createReplayEvent({
    timestamp: result.completedAt ?? result.startedAt,
    sourceSystemId: 'browser_verification_harness',
    eventType: 'BROWSER_CHECK',
    description: `${check.name}: ${check.status} — expected ${check.expected}, actual ${check.actual}`,
    evidenceIds: [...check.evidence],
    warnings: check.status === 'WARN' ? [`Check ${check.name} warned`] : [],
    errors: check.status === 'FAIL' ? [`Check ${check.name} failed`] : [],
  });
}

export function replayBrowserVerificationHistory(): ReplaySession {
  const result = getDevPulseV2BrowserVerificationHarness().getLastResult();
  if (!result) {
    return replayBrowserHistory([]);
  }

  const events = result.checks.map((check) => browserCheckToReplayEvent(check, result));
  if (events.length === 0) {
    events.push(
      createReplayEvent({
        timestamp: result.startedAt,
        sourceSystemId: 'browser_verification_harness',
        eventType: 'BROWSER_VERIFICATION',
        description: `Browser verification ${result.verificationId}: ${result.status}`,
        evidenceIds: [],
        warnings: [...result.warnings],
        errors: [...result.errors],
      }),
    );
  }

  return replayBrowserHistory(events);
}

export function getBrowserReplaySummary(): string {
  const session = replayBrowserVerificationHistory();
  if (session.events.length === 0) {
    return 'No browser verification history available for replay.';
  }
  return `Browser replay: ${session.events.length} check event(s) — status ${session.status}.`;
}

export function assertBrowserHarnessOwnershipUnchanged(): boolean {
  const harness = getDevPulseV2BrowserVerificationHarness();
  return (
    harness.constructor.name === 'DevPulseV2BrowserVerificationHarness' &&
    typeof harness.getLastResult === 'function' &&
    typeof (harness as { reconstructHistory?: unknown }).reconstructHistory === 'undefined'
  );
}

export function getBrowserHarnessOwnerForBridge(): string {
  return HARNESS_OWNER_MODULE;
}
