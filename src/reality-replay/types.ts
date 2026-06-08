/** DevPulse V2 Reality Replay — historical reconstruction types (read-only). */

export type ReplayStatus = 'COMPLETE' | 'PARTIAL' | 'INCOMPLETE';

export interface ReplayEvent {
  replayEventId: string;
  timestamp: number;
  sourceSystemId: string;
  eventType: string;
  description: string;
  evidenceIds: string[];
  warnings: string[];
  errors: string[];
}

export interface ReplaySession {
  replaySessionId: string;
  createdAt: number;
  events: ReplayEvent[];
  status: ReplayStatus;
  warnings: string[];
  errors: string[];
}

export interface ReplaySummary {
  summaryId: string;
  replaySessionId: string;
  eventCount: number;
  completeSources: string[];
  partialSources: string[];
  status: ReplayStatus;
  summary: string;
  publishedAt: number;
  warnings: string[];
  errors: string[];
}

export interface RealityReplayReport {
  ownerModule: string;
  replaySessionCount: number;
  eventCount: number;
  completeCount: number;
  partialCount: number;
  incompleteCount: number;
  replaySources: string[];
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface RealityReplayAuthorityState {
  ownerModule: string;
  sessionCount: number;
  eventCount: number;
  warnings: string[];
  errors: string[];
}

export const REPLAY_OWNER_MODULE = 'devpulse_v2_reality_replay_authority';
export const REPLAY_PASS_TOKEN = 'DEVPULSE_V2_REALITY_REPLAY_FOUNDATION_V1_PASS';
