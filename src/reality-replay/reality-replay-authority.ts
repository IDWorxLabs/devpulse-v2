/**
 * DevPulse V2 Reality Replay Authority — historical sequence reconstruction.
 * Does NOT execute, repair, predict failures, perform root cause analysis, or generate code.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestReplaySummary,
  publishReplaySummary,
  resetReplayBrainBridgeForTests,
} from './replay-brain-bridge.js';
import {
  getBrowserReplaySummary,
  replayBrowserVerificationHistory,
} from './replay-browser-bridge.js';
import {
  getEvidenceReplaySummary,
  reconstructEvidenceHistory,
} from './replay-evidence-bridge.js';
import {
  getObservationReplaySummary,
  replayObservationSessions,
} from './replay-self-vision-bridge.js';
import {
  getTimelineReplaySummary,
  reconstructTimelineEvents,
} from './replay-timeline-bridge.js';
import {
  buildValidationReplayEvents,
  createReplayEvent,
  reconstructTimeline,
  replayEvidenceHistory,
  replayValidationHistory as buildValidationReplaySession,
  summarizeReplay,
} from './reality-replay-engine.js';
import { formatRealityReplayReport } from './reality-replay-report.js';
import type {
  RealityReplayAuthorityState,
  ReplayEvent,
  ReplaySession,
  ReplaySummary,
} from './types.js';
import { REPLAY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RealityReplayAuthority | null = null;

export class DevPulseV2RealityReplayAuthority {
  private readonly sessions: ReplaySession[] = [];
  private authorityWarnings: string[] = [
    'Reality Replay reconstructs history only — no execution, repair, prediction, or root cause analysis.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = REPLAY_OWNER_MODULE;
  static readonly ownerDomain = 'reality_replay' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('reality_replay');
    return owner.ownerModule === REPLAY_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const replay = getDevPulseV2Owner('reality_replay');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      replay.ownerModule === REPLAY_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2RealityReplayAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRepairs(): boolean {
    const authority = new DevPulseV2RealityReplayAuthority();
    return (
      typeof (authority as { repair?: unknown }).repair === 'undefined' &&
      typeof (authority as { fix?: unknown }).fix === 'undefined' &&
      typeof (authority as { remediate?: unknown }).remediate === 'undefined'
    );
  }

  static assertDoesNotPerformRootCauseAnalysis(): boolean {
    const authority = new DevPulseV2RealityReplayAuthority();
    return (
      typeof (authority as { rootCause?: unknown }).rootCause === 'undefined' &&
      typeof (authority as { diagnose?: unknown }).diagnose === 'undefined' &&
      typeof (authority as { analyzeCause?: unknown }).analyzeCause === 'undefined'
    );
  }

  static assertDoesNotPerformPrediction(): boolean {
    const authority = new DevPulseV2RealityReplayAuthority();
    return (
      typeof (authority as { predict?: unknown }).predict === 'undefined' &&
      typeof (authority as { forecast?: unknown }).forecast === 'undefined' &&
      typeof (authority as { predictFailure?: unknown }).predictFailure === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2RealityReplayAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceTimelineLedger(): boolean {
    return getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE;
  }

  static assertDoesNotReplaceSelfVision(): boolean {
    return getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE;
  }

  static assertDoesNotReplaceBrowserHarness(): boolean {
    return getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  createReplaySession(events: ReplayEvent[]): ReplaySession {
    const session: ReplaySession = {
      replaySessionId: `replay-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      events: events.map((e) => ({
        ...e,
        evidenceIds: [...e.evidenceIds],
        warnings: [...e.warnings],
        errors: [...e.errors],
      })),
      status: events.length > 0 ? 'PARTIAL' : 'INCOMPLETE',
      warnings: ['Manual replay session created — read-only reconstruction.'],
      errors: [],
    };
    this.sessions.push(session);
    return {
      ...session,
      events: [...session.events],
      warnings: [...session.warnings],
      errors: [...session.errors],
    };
  }

  createReplayEvent(input: Omit<ReplayEvent, 'replayEventId'>): ReplayEvent {
    return createReplayEvent(input);
  }

  reconstructTimeline(): ReplaySession {
    const session = reconstructTimeline([
      reconstructTimelineEvents(),
      replayObservationSessions().events,
      reconstructEvidenceHistory(),
      replayBrowserVerificationHistory().events,
      buildValidationReplayEvents(),
    ]);
    this.sessions.push(session);
    return {
      ...session,
      events: session.events.map((e) => ({
        ...e,
        evidenceIds: [...e.evidenceIds],
        warnings: [...e.warnings],
        errors: [...e.errors],
      })),
      warnings: [...session.warnings],
      errors: [...session.errors],
    };
  }

  replayObservationHistory(): ReplaySession {
    const session = replayObservationSessions();
    this.sessions.push(session);
    return { ...session, events: [...session.events], warnings: [...session.warnings], errors: [...session.errors] };
  }

  replayEvidenceHistory(): ReplaySession {
    const session = replayEvidenceHistory(reconstructEvidenceHistory());
    this.sessions.push(session);
    return { ...session, events: [...session.events], warnings: [...session.warnings], errors: [...session.errors] };
  }

  replayBrowserHistory(): ReplaySession {
    const session = replayBrowserVerificationHistory();
    this.sessions.push(session);
    return { ...session, events: [...session.events], warnings: [...session.warnings], errors: [...session.errors] };
  }

  replayValidationHistory(): ReplaySession {
    const session = buildValidationReplaySession();
    this.sessions.push(session);
    return { ...session, events: [...session.events], warnings: [...session.warnings], errors: [...session.errors] };
  }

  summarizeReplay(session: ReplaySession): ReplaySummary {
    return summarizeReplay(session);
  }

  publishReplaySummary(summary: ReplaySummary): ReplaySummary {
    return publishReplaySummary(summary);
  }

  getLatestReplaySummary(): ReplaySummary | null {
    return getLatestReplaySummary();
  }

  getObservationReplaySummary(): string {
    return getObservationReplaySummary();
  }

  getTimelineReplaySummary(): string {
    return getTimelineReplaySummary();
  }

  getEvidenceReplaySummary(): string {
    return getEvidenceReplaySummary();
  }

  getBrowserReplaySummary(): string {
    return getBrowserReplaySummary();
  }

  getReplaySessions(): ReplaySession[] {
    return this.sessions.map((s) => ({
      ...s,
      events: s.events.map((e) => ({
        ...e,
        evidenceIds: [...e.evidenceIds],
        warnings: [...e.warnings],
        errors: [...e.errors],
      })),
      warnings: [...s.warnings],
      errors: [...s.errors],
    }));
  }

  getAuthorityState(): RealityReplayAuthorityState {
    const eventCount = this.sessions.reduce((n, s) => n + s.events.length, 0);
    return {
      ownerModule: REPLAY_OWNER_MODULE,
      sessionCount: this.sessions.length,
      eventCount,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  formatReport(): string {
    return formatRealityReplayReport(this.getReplaySessions(), this.getLatestReplaySummary());
  }
}

export function createDevPulseV2RealityReplayAuthority(): DevPulseV2RealityReplayAuthority {
  singleton = new DevPulseV2RealityReplayAuthority();
  return singleton;
}

export function getDevPulseV2RealityReplayAuthority(): DevPulseV2RealityReplayAuthority {
  if (!singleton) {
    singleton = new DevPulseV2RealityReplayAuthority();
  }
  return singleton;
}

export function resetDevPulseV2RealityReplayAuthorityForTests(): DevPulseV2RealityReplayAuthority {
  resetReplayBrainBridgeForTests();
  singleton = new DevPulseV2RealityReplayAuthority();
  return singleton;
}
