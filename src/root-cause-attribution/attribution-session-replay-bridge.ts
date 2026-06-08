/**
 * Session Replay bridge — Session Replay remains owner; attribution consumes replay history.
 */

import { getDevPulseV2SessionReplayAuthority } from '../session-replay/session-replay-authority.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../session-replay/types.js';
import type { SessionReplayEvent } from '../session-replay/types.js';

export interface ReplayAttributionSignals {
  events: SessionReplayEvent[];
  errorEventCount: number;
  browserWarnCount: number;
  evidenceIds: string[];
}

export function analyzeSessionReplayHistory(): ReplayAttributionSignals {
  const authority = getDevPulseV2SessionReplayAuthority();
  if (authority.getSessionReplayRecords().length === 0) {
    authority.reconstructSession();
  }

  const events = authority.getSessionReplayRecords().flatMap((r) => r.events);
  const errorEvents = events.filter((e) => e.errors.length > 0);
  const browserWarnEvents = events.filter(
    (e) =>
      e.sourceSystemId === 'browser_verification_harness' &&
      (e.warnings.length > 0 || e.description.toLowerCase().includes('warn')),
  );

  return {
    events,
    errorEventCount: errorEvents.length,
    browserWarnCount: browserWarnEvents.length,
    evidenceIds: events.flatMap((e) => e.evidenceIds),
  };
}

export function getReplayAttributionSummary(): string {
  const signals = analyzeSessionReplayHistory();
  if (signals.events.length === 0) {
    return 'No session replay history available for attribution.';
  }
  return `Session replay signals: ${signals.events.length} event(s), ${signals.browserWarnCount} browser WARN(s).`;
}

export function assertSessionReplayOwnershipUnchanged(): boolean {
  const sessionReplay = getDevPulseV2SessionReplayAuthority();
  return (
    sessionReplay.constructor.name === 'DevPulseV2SessionReplayAuthority' &&
    typeof sessionReplay.getSessionReplayRecords === 'function' &&
    typeof (sessionReplay as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getSessionReplayOwnerForBridge(): string {
  return SESSION_REPLAY_OWNER_MODULE;
}
