/**
 * Operational Evidence Freshness Authority V1 — confidence decay model.
 */

import {
  DEFAULT_CONFIDENCE_DECAY,
  DEFAULT_FRESHNESS_THRESHOLDS,
} from './operational-evidence-freshness-v1-bounds.js';
import type {
  ConfidenceDecayModel,
  FreshnessStatus,
} from './operational-evidence-freshness-v1-types.js';

export function buildConfidenceDecayModel(overrides?: {
  thresholds?: Partial<ConfidenceDecayModel['thresholds']>;
  decayByStatus?: Partial<Record<FreshnessStatus, number>>;
}): ConfidenceDecayModel {
  return {
    readOnly: true,
    configurable: true,
    thresholds: {
      agingDays: overrides?.thresholds?.agingDays ?? DEFAULT_FRESHNESS_THRESHOLDS.agingDays,
      staleDays: overrides?.thresholds?.staleDays ?? DEFAULT_FRESHNESS_THRESHOLDS.staleDays,
      expiredDays: overrides?.thresholds?.expiredDays ?? DEFAULT_FRESHNESS_THRESHOLDS.expiredDays,
    },
    decayByStatus: {
      FRESH: overrides?.decayByStatus?.FRESH ?? DEFAULT_CONFIDENCE_DECAY.FRESH,
      AGING: overrides?.decayByStatus?.AGING ?? DEFAULT_CONFIDENCE_DECAY.AGING,
      STALE: overrides?.decayByStatus?.STALE ?? DEFAULT_CONFIDENCE_DECAY.STALE,
      EXPIRED: overrides?.decayByStatus?.EXPIRED ?? DEFAULT_CONFIDENCE_DECAY.EXPIRED,
    },
  };
}

export function applyConfidenceDecay(
  status: FreshnessStatus,
  model: ConfidenceDecayModel,
): number {
  return model.decayByStatus[status];
}
