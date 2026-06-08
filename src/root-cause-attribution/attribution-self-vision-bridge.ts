/**
 * Self Vision bridge — Self Vision remains owner; attribution consumes observations.
 */

import { getDevPulseV2SelfVisionAuthority } from '../self-vision/self-vision-authority.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';

export interface ObservationAttributionSignals {
  hiddenCount: number;
  notClickableCount: number;
  unknownCount: number;
  observationIds: string[];
}

export function analyzeObservationHistory(): ObservationAttributionSignals {
  const sessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  const observations = sessions.flatMap((s) => s.observations);

  const hidden = observations.filter((o) => o.status === 'HIDDEN');
  const notClickable = observations.filter((o) => o.status === 'NOT_CLICKABLE');
  const unknown = observations.filter((o) => o.status === 'UNKNOWN');

  return {
    hiddenCount: hidden.length,
    notClickableCount: notClickable.length,
    unknownCount: unknown.length,
    observationIds: observations.map((o) => o.observationId),
  };
}

export function getObservationAttributionSummary(): string {
  const signals = analyzeObservationHistory();
  const total = signals.hiddenCount + signals.notClickableCount + signals.unknownCount;
  if (total === 0 && signals.observationIds.length === 0) {
    return 'No Self Vision observation history available for attribution.';
  }
  return `Observation signals: ${signals.hiddenCount} hidden, ${signals.notClickableCount} not clickable, ${signals.unknownCount} unknown.`;
}

export function assertSelfVisionOwnershipUnchanged(): boolean {
  const selfVision = getDevPulseV2SelfVisionAuthority();
  return (
    selfVision.constructor.name === 'DevPulseV2SelfVisionAuthority' &&
    typeof selfVision.getObservationSessions === 'function' &&
    typeof (selfVision as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getSelfVisionOwnerForBridge(): string {
  return SELF_VISION_OWNER_MODULE;
}
