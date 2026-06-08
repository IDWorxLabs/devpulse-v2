/**
 * Session Replay bridge — Session Replay remains owner; Failure Prediction consumes replay history.
 */

import { getDevPulseV2SessionReplayAuthority } from '../session-replay/session-replay-authority.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../session-replay/types.js';
import { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';
import type { PredictionRecord } from './types.js';

export function analyzeSessionReplayPatterns(): PredictionRecord[] {
  const authority = getDevPulseV2SessionReplayAuthority();
  const records = authority.getSessionReplayRecords();
  if (records.length === 0) {
    authority.reconstructSession();
  }
  const sessions = authority.getSessionReplayRecords();
  const incomplete = sessions.filter((s) => s.status === 'INCOMPLETE' || s.errors.length > 0);
  const errorEvents = sessions.flatMap((s) => s.events.filter((e) => e.errors.length > 0));

  const predictions: PredictionRecord[] = [];
  if (incomplete.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'session_replay',
        title: 'Repeated Incomplete Session Replays',
        description: `${incomplete.length} incomplete session replay(s) indicate elevated reconstruction risk.`,
        riskLevel: 'MEDIUM',
        confidence: scoreConfidence('MEDIUM', incomplete.length),
        supportingEvidenceIds: incomplete.map((s) => s.sessionReplayId),
        warnings: ['Incomplete session history may hide future failure signals.'],
        errors: [],
      }),
    );
  }

  if (errorEvents.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'session_replay',
        title: 'Repeated Session Replay Errors',
        description: `${errorEvents.length} session replay event(s) contain errors.`,
        riskLevel: 'HIGH',
        confidence: scoreConfidence('HIGH', errorEvents.length),
        supportingEvidenceIds: errorEvents.map((e) => e.replayEventId),
        warnings: [],
        errors: [],
      }),
    );
  }

  return predictions;
}

export function getReplayPredictionSummary(): string {
  const predictions = analyzeSessionReplayPatterns();
  if (predictions.length === 0) {
    return 'No elevated session replay risk patterns detected.';
  }
  return `Session replay patterns: ${predictions.length} prediction signal(s).`;
}

export function assertSessionReplayOwnershipUnchanged(): boolean {
  const sessionReplay = getDevPulseV2SessionReplayAuthority();
  return (
    sessionReplay.constructor.name === 'DevPulseV2SessionReplayAuthority' &&
    typeof sessionReplay.getSessionReplayRecords === 'function' &&
    typeof (sessionReplay as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getSessionReplayOwnerForBridge(): string {
  return SESSION_REPLAY_OWNER_MODULE;
}
