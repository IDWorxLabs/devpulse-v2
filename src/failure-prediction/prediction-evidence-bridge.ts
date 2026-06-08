/**
 * Evidence Registry bridge — registry remains owner; Failure Prediction contributes prediction evidence.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceRecord } from '../evidence-registry/types.js';
import type { PredictionRecord } from './types.js';

let lastCollectedEvidenceIds: string[] = [];

export function collectPredictionEvidence(records: PredictionRecord[]): EvidenceRecord[] {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  const collected: EvidenceRecord[] = [];

  for (const record of records) {
    const evidence = registry.addEvidence({
      source: 'BROWSER_VERIFICATION',
      label: `Failure prediction: ${record.title}`,
      summary: `${record.riskLevel} risk — ${record.description}`,
      status: record.riskLevel === 'HIGH' || record.riskLevel === 'CRITICAL' ? 'WARN' : 'INFO',
      relatedSystemId: 'failure_prediction',
      relatedRecordId: record.predictionId,
      tags: ['failure_prediction', record.riskLevel.toLowerCase(), record.confidence.toLowerCase()],
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
    collected.push(evidence);
    record.supportingEvidenceIds.push(evidence.evidenceId);
  }

  lastCollectedEvidenceIds = collected.map((e) => e.evidenceId);
  return collected;
}

export function getPredictionEvidenceSummary(): string {
  if (lastCollectedEvidenceIds.length === 0) {
    return 'No prediction evidence collected yet.';
  }
  return `Prediction evidence: ${lastCollectedEvidenceIds.length} record(s) contributed to Evidence Registry.`;
}

export function getLastCollectedPredictionEvidenceIds(): string[] {
  return [...lastCollectedEvidenceIds];
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.addEvidence === 'function' &&
    typeof (registry as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}

export function resetPredictionEvidenceBridgeForTests(): void {
  lastCollectedEvidenceIds = [];
}
