/**
 * DevPulse V2 Session Replay Authority — complete session reconstruction layer.
 * Does NOT execute, repair, predict failures, perform root cause analysis, or generate code.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REPLAY_OWNER_MODULE } from '../reality-replay/types.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestSessionReplaySummary,
  publishSessionReplaySummary,
  resetSessionReplayBrainBridgeForTests,
} from './session-brain-bridge.js';
import {
  getAiDevSessionSummary,
  reconstructAiDevRequests,
} from './session-aidev-bridge.js';
import {
  getEvidenceSessionSummary,
  reconstructEvidenceSessions,
} from './session-evidence-bridge.js';
import {
  getReplaySessionSummary,
  reconstructReplaySessions,
} from './session-reality-replay-bridge.js';
import {
  getObservationSessionSummary,
  reconstructObservationSessions,
} from './session-self-vision-bridge.js';
import {
  getTimelineSessionSummary,
  reconstructTimelineSessions,
} from './session-timeline-bridge.js';
import {
  buildSessionReplayRecord,
  createSessionReplayEvent,
  reconstructAiDevSession as buildAiDevSessionRecord,
  reconstructObservationSession as buildObservationSessionRecord,
  reconstructPlanningSession as buildPlanningSessionRecord,
  reconstructSession as mergeSessionRecords,
  reconstructUserSession as buildUserSessionRecord,
  summarizeSessionReplay,
} from './session-replay-engine.js';
import { formatSessionReplayReport } from './session-replay-report.js';
import type {
  SessionReplayAuthorityState,
  SessionReplayEvent,
  SessionReplayRecord,
  SessionReplaySummary,
} from './types.js';
import { SESSION_REPLAY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2SessionReplayAuthority | null = null;

export class DevPulseV2SessionReplayAuthority {
  private readonly records: SessionReplayRecord[] = [];
  private authorityWarnings: string[] = [
    'Session Replay reconstructs sessions only — no execution, repair, prediction, or root cause analysis.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = SESSION_REPLAY_OWNER_MODULE;
  static readonly ownerDomain = 'session_replay' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('session_replay');
    return owner.ownerModule === SESSION_REPLAY_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const sessionReplay = getDevPulseV2Owner('session_replay');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      sessionReplay.ownerModule === SESSION_REPLAY_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2SessionReplayAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRepairs(): boolean {
    const authority = new DevPulseV2SessionReplayAuthority();
    return (
      typeof (authority as { repair?: unknown }).repair === 'undefined' &&
      typeof (authority as { fix?: unknown }).fix === 'undefined' &&
      typeof (authority as { remediate?: unknown }).remediate === 'undefined'
    );
  }

  static assertDoesNotPerformRootCauseAnalysis(): boolean {
    const authority = new DevPulseV2SessionReplayAuthority();
    return (
      typeof (authority as { rootCause?: unknown }).rootCause === 'undefined' &&
      typeof (authority as { diagnose?: unknown }).diagnose === 'undefined' &&
      typeof (authority as { analyzeCause?: unknown }).analyzeCause === 'undefined'
    );
  }

  static assertDoesNotPerformPrediction(): boolean {
    const authority = new DevPulseV2SessionReplayAuthority();
    return (
      typeof (authority as { predict?: unknown }).predict === 'undefined' &&
      typeof (authority as { forecast?: unknown }).forecast === 'undefined' &&
      typeof (authority as { predictFailure?: unknown }).predictFailure === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2SessionReplayAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceRealityReplay(): boolean {
    return getDevPulseV2Owner('reality_replay').ownerModule === REPLAY_OWNER_MODULE;
  }

  static assertDoesNotReplaceTimelineLedger(): boolean {
    return getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE;
  }

  static assertDoesNotReplaceSelfVision(): boolean {
    return getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  createSessionReplayRecord(events: SessionReplayEvent[], sessionId = 'manual-session'): SessionReplayRecord {
    const record = buildSessionReplayRecord(sessionId, events);
    this.records.push(record);
    return {
      ...record,
      events: [...record.events],
      warnings: [...record.warnings],
      errors: [...record.errors],
    };
  }

  createSessionReplayEvent(input: Omit<SessionReplayEvent, 'replayEventId'>): SessionReplayEvent {
    return createSessionReplayEvent(input);
  }

  reconstructSession(): SessionReplayRecord {
    const parts = [
      buildUserSessionRecord(),
      ...reconstructAiDevRequests(),
      buildPlanningSessionRecord(),
      ...reconstructObservationSessions(),
      ...reconstructReplaySessions(),
      ...reconstructTimelineSessions(),
      ...reconstructEvidenceSessions(),
    ];
    const record = mergeSessionRecords(parts);
    this.records.push(record);
    return {
      ...record,
      events: [...record.events],
      warnings: [...record.warnings],
      errors: [...record.errors],
    };
  }

  reconstructUserSession(): SessionReplayRecord {
    const record = buildUserSessionRecord();
    this.records.push(record);
    return { ...record, events: [...record.events], warnings: [...record.warnings], errors: [...record.errors] };
  }

  reconstructAiDevSession(): SessionReplayRecord {
    const requests = reconstructAiDevRequests();
    const events = requests.flatMap((r) => r.events);
    const record = buildAiDevSessionRecord(events);
    this.records.push(record);
    return { ...record, events: [...record.events], warnings: [...record.warnings], errors: [...record.errors] };
  }

  reconstructPlanningSession(): SessionReplayRecord {
    const record = buildPlanningSessionRecord();
    this.records.push(record);
    return { ...record, events: [...record.events], warnings: [...record.warnings], errors: [...record.errors] };
  }

  reconstructObservationSession(): SessionReplayRecord {
    const sessions = reconstructObservationSessions();
    const events = sessions.flatMap((s) => s.events);
    const record = buildObservationSessionRecord(events);
    this.records.push(record);
    return { ...record, events: [...record.events], warnings: [...record.warnings], errors: [...record.errors] };
  }

  summarizeSessionReplay(records?: SessionReplayRecord[]): SessionReplaySummary {
    return summarizeSessionReplay(records ?? this.getSessionReplayRecords());
  }

  publishSessionReplaySummary(summary: SessionReplaySummary): SessionReplaySummary {
    return publishSessionReplaySummary(summary);
  }

  getLatestSessionReplaySummary(): SessionReplaySummary | null {
    return getLatestSessionReplaySummary();
  }

  getReplaySessionSummary(): string {
    return getReplaySessionSummary();
  }

  getAiDevSessionSummary(): string {
    return getAiDevSessionSummary();
  }

  getTimelineSessionSummary(): string {
    return getTimelineSessionSummary();
  }

  getEvidenceSessionSummary(): string {
    return getEvidenceSessionSummary();
  }

  getObservationSessionSummary(): string {
    return getObservationSessionSummary();
  }

  getSessionReplayRecords(): SessionReplayRecord[] {
    return this.records.map((r) => ({
      ...r,
      events: r.events.map((e) => ({
        ...e,
        evidenceIds: [...e.evidenceIds],
        warnings: [...e.warnings],
        errors: [...e.errors],
      })),
      warnings: [...r.warnings],
      errors: [...r.errors],
    }));
  }

  getAuthorityState(): SessionReplayAuthorityState {
    const eventCount = this.records.reduce((n, r) => n + r.events.length, 0);
    return {
      ownerModule: SESSION_REPLAY_OWNER_MODULE,
      recordCount: this.records.length,
      eventCount,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  formatReport(): string {
    return formatSessionReplayReport(
      this.getSessionReplayRecords(),
      this.getLatestSessionReplaySummary(),
    );
  }
}

export function createDevPulseV2SessionReplayAuthority(): DevPulseV2SessionReplayAuthority {
  singleton = new DevPulseV2SessionReplayAuthority();
  return singleton;
}

export function getDevPulseV2SessionReplayAuthority(): DevPulseV2SessionReplayAuthority {
  if (!singleton) {
    singleton = new DevPulseV2SessionReplayAuthority();
  }
  return singleton;
}

export function resetDevPulseV2SessionReplayAuthorityForTests(): DevPulseV2SessionReplayAuthority {
  resetSessionReplayBrainBridgeForTests();
  singleton = new DevPulseV2SessionReplayAuthority();
  return singleton;
}
