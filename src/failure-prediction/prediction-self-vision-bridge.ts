/**
 * Self Vision bridge — Self Vision remains owner; Failure Prediction consumes observation history.
 */

import { getDevPulseV2SelfVisionAuthority } from '../self-vision/self-vision-authority.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';
import type { PredictionRecord } from './types.js';
import { REPEATED_MISSING_UI_TITLE } from './types.js';

export function analyzeObservationPatterns(): PredictionRecord[] {
  const sessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  const hiddenObservations = sessions.flatMap((s) =>
    s.observations.filter((o) => o.status === 'HIDDEN' || o.status === 'NOT_CLICKABLE'),
  );

  const predictions: PredictionRecord[] = [];
  if (hiddenObservations.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'self_vision',
        title: REPEATED_MISSING_UI_TITLE,
        description: `${hiddenObservations.length} hidden or non-clickable UI observation(s) indicate elevated UI surfacing risk.`,
        riskLevel: 'HIGH',
        confidence: scoreConfidence('HIGH', hiddenObservations.length),
        supportingEvidenceIds: hiddenObservations.map((o) => o.observationId),
        warnings: hiddenObservations.map((o) => `${o.elementId}: ${o.status}`),
        errors: hiddenObservations.flatMap((o) => o.errors),
      }),
    );
  }

  const unknownObservations = sessions.flatMap((s) =>
    s.observations.filter((o) => o.status === 'UNKNOWN'),
  );
  if (unknownObservations.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'self_vision',
        title: 'Repeated Unknown UI Observations',
        description: `${unknownObservations.length} unknown UI observation(s) reduce visibility confidence.`,
        riskLevel: 'MEDIUM',
        confidence: scoreConfidence('MEDIUM', unknownObservations.length),
        supportingEvidenceIds: unknownObservations.map((o) => o.observationId),
        warnings: [],
        errors: [],
      }),
    );
  }

  return predictions;
}

export function getObservationPredictionSummary(): string {
  const predictions = analyzeObservationPatterns();
  if (predictions.length === 0) {
    return 'No elevated observation risk patterns detected.';
  }
  return `Observation patterns: ${predictions.length} prediction signal(s).`;
}

export function assertSelfVisionOwnershipUnchanged(): boolean {
  const selfVision = getDevPulseV2SelfVisionAuthority();
  return (
    selfVision.constructor.name === 'DevPulseV2SelfVisionAuthority' &&
    typeof selfVision.getObservationSessions === 'function' &&
    typeof (selfVision as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getSelfVisionOwnerForBridge(): string {
  return SELF_VISION_OWNER_MODULE;
}
