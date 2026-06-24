/**
 * Operational Evidence Freshness Authority V1 — freshness registry.
 */

import { MAX_FRESHNESS_REGISTRY_SIZE } from './operational-evidence-freshness-v1-bounds.js';
import type {
  CapabilityFreshnessAssessment,
  EvidenceFreshnessRecord,
  FreshnessRegistrySnapshot,
} from './operational-evidence-freshness-v1-types.js';

const registryRecords: EvidenceFreshnessRecord[] = [];

export function resetFreshnessRegistryForTests(): void {
  registryRecords.length = 0;
}

export function registerEvidenceFreshnessRecord(record: EvidenceFreshnessRecord): void {
  const existing = registryRecords.findIndex((r) => r.evidenceId === record.evidenceId);
  if (existing >= 0) {
    registryRecords[existing] = record;
  } else {
    registryRecords.push(record);
  }
  while (registryRecords.length > MAX_FRESHNESS_REGISTRY_SIZE) {
    registryRecords.shift();
  }
}

export function buildFreshnessRegistrySnapshot(
  records: readonly EvidenceFreshnessRecord[],
): FreshnessRegistrySnapshot {
  const freshCount = records.filter((r) => r.status === 'FRESH').length;
  const agingCount = records.filter((r) => r.status === 'AGING').length;
  const staleCount = records.filter((r) => r.status === 'STALE').length;
  const expiredCount = records.filter((r) => r.status === 'EXPIRED').length;
  const overallFreshnessScore =
    records.length === 0
      ? 0
      : Math.round(records.reduce((s, r) => s + r.freshnessScore, 0) / records.length);

  return {
    readOnly: true,
    totalRecords: records.length,
    freshCount,
    agingCount,
    staleCount,
    expiredCount,
    overallFreshnessScore,
    records,
  };
}

export function buildCapabilityFreshnessAssessments(
  records: readonly EvidenceFreshnessRecord[],
  recommendations: readonly { capability: string; recommendedAction: CapabilityFreshnessAssessment['recommendedAction'] }[],
): CapabilityFreshnessAssessment[] {
  const recByCap = new Map(recommendations.map((r) => [r.capability, r.recommendedAction]));

  return records.map((record) => ({
    readOnly: true,
    capability: record.sourceCapability,
    sourceSystem: record.sourceSystem,
    proofAgeDays: record.ageDays,
    lastValidation: record.lastValidatedAt,
    freshnessScore: record.freshnessScore,
    confidenceAdjustment: record.confidenceDecay,
    status: record.status,
    recommendedAction:
      recByCap.get(record.sourceCapability) ??
      (record.status === 'FRESH' ? 'No Action' : 'STANDARD Validation'),
    projectId: record.projectId,
  }));
}
