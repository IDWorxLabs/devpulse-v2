/** DevPulse V2 Session Replay — complete session reconstruction types (read-only). */

export type SessionReplayStatus = 'COMPLETE' | 'PARTIAL' | 'INCOMPLETE';

export interface SessionReplayEvent {
  replayEventId: string;
  timestamp: number;
  sourceSystemId: string;
  eventType: string;
  description: string;
  evidenceIds: string[];
  warnings: string[];
  errors: string[];
}

export interface SessionReplayRecord {
  sessionReplayId: string;
  createdAt: number;
  sessionId: string;
  events: SessionReplayEvent[];
  status: SessionReplayStatus;
  warnings: string[];
  errors: string[];
}

export interface SessionReplaySummary {
  sessionCount: number;
  eventCount: number;
  completeCount: number;
  partialCount: number;
  incompleteCount: number;
  warnings: string[];
  errors: string[];
}

export interface SessionReplayReport {
  ownerModule: string;
  replaySessionCount: number;
  eventCount: number;
  completeCount: number;
  partialCount: number;
  incompleteCount: number;
  sourceSystems: string[];
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface SessionReplayAuthorityState {
  ownerModule: string;
  recordCount: number;
  eventCount: number;
  warnings: string[];
  errors: string[];
}

export const SESSION_REPLAY_OWNER_MODULE = 'devpulse_v2_session_replay_authority';
export const SESSION_REPLAY_PASS_TOKEN = 'DEVPULSE_V2_SESSION_REPLAY_FOUNDATION_V1_PASS';
