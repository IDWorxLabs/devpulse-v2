/**
 * Reality Replay bridge — Reality Replay remains owner; Failure Prediction consumes replay history.
 */

import { getDevPulseV2RealityReplayAuthority } from '../reality-replay/reality-replay-authority.js';
import { REPLAY_OWNER_MODULE } from '../reality-replay/types.js';
import { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';
import type { PredictionRecord } from './types.js';
import { BROWSER_VERIFICATION_WARNS_TITLE } from './types.js';

export function analyzeRealityReplayPatterns(): PredictionRecord[] {
  const authority = getDevPulseV2RealityReplayAuthority();
  let sessions = authority.getReplaySessions();
  if (sessions.length === 0) {
    authority.reconstructTimeline();
    sessions = authority.getReplaySessions();
  }

  const browserWarnEvents = sessions.flatMap((s) =>
    s.events.filter(
      (e) =>
        e.sourceSystemId === 'browser_verification_harness' &&
        (e.warnings.length > 0 || e.description.toLowerCase().includes('warn')),
    ),
  );

  const predictions: PredictionRecord[] = [];
  if (browserWarnEvents.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'reality_replay',
        title: BROWSER_VERIFICATION_WARNS_TITLE,
        description: `${browserWarnEvents.length} browser verification WARN pattern(s) detected in replay history.`,
        riskLevel: 'MEDIUM',
        confidence: scoreConfidence('MEDIUM', browserWarnEvents.length),
        supportingEvidenceIds: browserWarnEvents.flatMap((e) => e.evidenceIds),
        warnings: browserWarnEvents.map((e) => e.description),
        errors: [],
      }),
    );
  }

  const failEvents = sessions.flatMap((s) =>
    s.events.filter((e) => e.errors.length > 0 || e.description.toLowerCase().includes('fail')),
  );
  if (failEvents.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'reality_replay',
        title: 'Repeated Replay Failure Signals',
        description: `${failEvents.length} failure signal(s) in reality replay history.`,
        riskLevel: 'HIGH',
        confidence: scoreConfidence('HIGH', failEvents.length),
        supportingEvidenceIds: failEvents.flatMap((e) => e.evidenceIds),
        warnings: [],
        errors: [],
      }),
    );
  }

  return predictions;
}

export function getRealityPredictionSummary(): string {
  const predictions = analyzeRealityReplayPatterns();
  if (predictions.length === 0) {
    return 'No elevated reality replay risk patterns detected.';
  }
  return `Reality replay patterns: ${predictions.length} prediction signal(s).`;
}

export function assertRealityReplayOwnershipUnchanged(): boolean {
  const replay = getDevPulseV2RealityReplayAuthority();
  return (
    replay.constructor.name === 'DevPulseV2RealityReplayAuthority' &&
    typeof replay.getReplaySessions === 'function' &&
    typeof (replay as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getRealityReplayOwnerForBridge(): string {
  return REPLAY_OWNER_MODULE;
}
