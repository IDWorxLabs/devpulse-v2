/**
 * Reality Replay engine — read-only historical sequence reconstruction.
 * Does NOT execute, repair, predict failures, or perform root cause analysis.
 */

import { getDevPulseV2VerificationLoopAuthority } from '../verification-loop/verification-loop-authority.js';
import type { VerificationReview } from '../verification-loop/types.js';
import type { ReplayEvent, ReplaySession, ReplayStatus, ReplaySummary } from './types.js';

function createReplayEventId(): string {
  return `replay-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createReplaySessionId(): string {
  return `replay-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sortReplayEventsChronologically(events: ReplayEvent[]): ReplayEvent[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}

export function deriveReplayStatus(
  events: ReplayEvent[],
  sourceCounts: { timeline: number; observation: number; evidence: number; browser: number; validation: number },
): ReplayStatus {
  const sourcesPresent = [
    sourceCounts.timeline > 0,
    sourceCounts.observation > 0,
    sourceCounts.evidence > 0,
    sourceCounts.browser > 0,
    sourceCounts.validation > 0,
  ].filter(Boolean).length;

  if (events.length === 0) return 'INCOMPLETE';
  if (sourcesPresent >= 4 && events.every((e) => e.errors.length === 0)) return 'COMPLETE';
  if (sourcesPresent >= 1) return 'PARTIAL';
  return 'INCOMPLETE';
}

export function buildReplaySession(
  events: ReplayEvent[],
  sourceCounts: { timeline: number; observation: number; evidence: number; browser: number; validation: number },
  warnings: string[] = [],
  errors: string[] = [],
): ReplaySession {
  const sorted = sortReplayEventsChronologically(events);
  return {
    replaySessionId: createReplaySessionId(),
    createdAt: Date.now(),
    events: sorted.map((e) => ({
      ...e,
      evidenceIds: [...e.evidenceIds],
      warnings: [...e.warnings],
      errors: [...e.errors],
    })),
    status: deriveReplayStatus(sorted, sourceCounts),
    warnings: [
      'Reality Replay reconstructs history read-only — no execution, repair, prediction, or root cause analysis.',
      ...warnings,
    ],
    errors: [...errors],
  };
}

export function reconstructTimeline(eventGroups: ReplayEvent[][]): ReplaySession {
  const timeline = eventGroups[0] ?? [];
  const observation = eventGroups[1] ?? [];
  const evidence = eventGroups[2] ?? [];
  const browser = eventGroups[3] ?? [];
  const validation = eventGroups[4] ?? [];

  const allEvents = [...timeline, ...observation, ...evidence, ...browser, ...validation];
  return buildReplaySession(allEvents, {
    timeline: timeline.length,
    observation: observation.length,
    evidence: evidence.length,
    browser: browser.length,
    validation: validation.length,
  });
}

export function replayObservationHistory(events: ReplayEvent[]): ReplaySession {
  return buildReplaySession(events, {
    timeline: 0,
    observation: events.length,
    evidence: 0,
    browser: 0,
    validation: 0,
  });
}

export function replayEvidenceHistory(events: ReplayEvent[]): ReplaySession {
  return buildReplaySession(events, {
    timeline: 0,
    observation: 0,
    evidence: events.length,
    browser: 0,
    validation: 0,
  });
}

export function replayBrowserHistory(events: ReplayEvent[]): ReplaySession {
  return buildReplaySession(events, {
    timeline: 0,
    observation: 0,
    evidence: 0,
    browser: events.length,
    validation: 0,
  });
}

export function replayValidationHistory(events?: ReplayEvent[]): ReplaySession {
  const resolved =
    events ??
    getDevPulseV2VerificationLoopAuthority()
      .listVerifications()
      .map(verificationReviewToReplayEvent);
  return buildReplaySession(resolved, {
    timeline: 0,
    observation: 0,
    evidence: 0,
    browser: 0,
    validation: resolved.length,
  });
}

function verificationReviewToReplayEvent(review: VerificationReview): ReplayEvent {
  return createReplayEvent({
    timestamp: review.createdAt,
    sourceSystemId: 'verification_loop',
    eventType: 'VERIFICATION',
    description: `Verification ${review.verificationId}: ${review.subject} — ${review.status}`,
    evidenceIds: [...review.evidenceIds],
    warnings: [...review.warnings],
    errors: [...review.errors],
  });
}

export function buildValidationReplayEvents(): ReplayEvent[] {
  return getDevPulseV2VerificationLoopAuthority()
    .listVerifications()
    .map(verificationReviewToReplayEvent);
}

export function summarizeReplay(session: ReplaySession): ReplaySummary {
  const sources = new Set(session.events.map((e) => e.sourceSystemId));
  const completeSources: string[] = [];
  const partialSources: string[] = [];

  for (const source of sources) {
    const sourceEvents = session.events.filter((e) => e.sourceSystemId === source);
    if (sourceEvents.every((e) => e.errors.length === 0)) {
      completeSources.push(source);
    } else {
      partialSources.push(source);
    }
  }

  const parts: string[] = [];
  if (session.events.length === 0) {
    parts.push('No historical events reconstructed.');
  } else {
    parts.push(
      `Reconstructed ${session.events.length} event(s) in chronological order — status ${session.status}.`,
    );
  }

  return {
    summaryId: `replay-summary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    replaySessionId: session.replaySessionId,
    eventCount: session.events.length,
    completeSources,
    partialSources,
    status: session.status,
    summary: parts.join(' '),
    publishedAt: Date.now(),
    warnings: [...session.warnings],
    errors: [...session.errors],
  };
}

export function createReplayEvent(
  input: Omit<ReplayEvent, 'replayEventId'> & { replayEventId?: string },
): ReplayEvent {
  return {
    replayEventId: input.replayEventId ?? createReplayEventId(),
    timestamp: input.timestamp,
    sourceSystemId: input.sourceSystemId,
    eventType: input.eventType,
    description: input.description,
    evidenceIds: [...input.evidenceIds],
    warnings: [...input.warnings],
    errors: [...input.errors],
  };
}
