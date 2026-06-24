/**
 * Operational Evidence Freshness Authority V1 — freshness scoring.
 */

import {
  DEFAULT_FRESHNESS_THRESHOLDS,
} from './operational-evidence-freshness-v1-bounds.js';
import type { FreshnessStatus } from './operational-evidence-freshness-v1-types.js';
import type { ConfidenceDecayModel } from './operational-evidence-freshness-v1-types.js';

export interface CalculateEvidenceFreshnessInput {
  ageDays: number;
  validationFrequencyPerMonth?: number;
  criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executionProofCoverage?: number;
  recentSuccessfulRuns?: number;
  thresholds?: ConfidenceDecayModel['thresholds'];
}

const CRITICALITY_BONUS: Record<NonNullable<CalculateEvidenceFreshnessInput['criticality']>, number> = {
  LOW: 0,
  MEDIUM: 2,
  HIGH: 5,
  CRITICAL: 8,
};

export function resolveFreshnessStatus(
  ageDays: number,
  thresholds: ConfidenceDecayModel['thresholds'] = DEFAULT_FRESHNESS_THRESHOLDS,
): FreshnessStatus {
  if (ageDays < thresholds.agingDays) return 'FRESH';
  if (ageDays < thresholds.staleDays) return 'AGING';
  if (ageDays < thresholds.expiredDays) return 'STALE';
  return 'EXPIRED';
}

export function calculateEvidenceFreshness(input: CalculateEvidenceFreshnessInput): number {
  const thresholds = input.thresholds ?? DEFAULT_FRESHNESS_THRESHOLDS;
  const ageDays = Math.max(0, input.ageDays);
  const agePenalty = Math.min(50, (ageDays / thresholds.expiredDays) * 50);
  const frequencyBonus = Math.min(10, (input.validationFrequencyPerMonth ?? 1) * 2);
  const criticalityBonus = CRITICALITY_BONUS[input.criticality ?? 'MEDIUM'];
  const coverageBonus = Math.min(15, ((input.executionProofCoverage ?? 80) / 100) * 15);
  const recentRunBonus = Math.min(10, (input.recentSuccessfulRuns ?? 1) * 3);

  const score = 100 - agePenalty + frequencyBonus + criticalityBonus + coverageBonus + recentRunBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function ageDaysBetween(isoTimestamp: string | null, now = Date.now()): number {
  if (!isoTimestamp) return 999;
  const ts = Date.parse(isoTimestamp);
  if (Number.isNaN(ts)) return 999;
  return Math.max(0, Math.floor((now - ts) / (24 * 60 * 60 * 1000)));
}
