/**
 * Evidence Registry bridge — registry remains owner; attribution consumes and contributes evidence.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceRecord } from '../evidence-registry/types.js';
import type { AttributionRecord } from './types.js';

export interface EvidenceAttributionSignals {
  failCount: number;
  warnCount: number;
  evidenceIds: string[];
  records: EvidenceRecord[];
}

let lastCollectedAttributionEvidenceIds: string[] = [];

export function analyzeEvidenceFromRegistry(): EvidenceAttributionSignals {
  const records = getDevPulseV2EvidenceRegistryAuthority().listEvidence();
  const failRecords = records.filter((r) => r.status === 'FAIL');
  const warnRecords = records.filter((r) => r.status === 'WARN');

  return {
    failCount: failRecords.length,
    warnCount: warnRecords.length,
    evidenceIds: records.map((r) => r.evidenceId),
    records,
  };
}

export function collectAttributionEvidence(records: AttributionRecord[]): EvidenceRecord[] {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  const collected: EvidenceRecord[] = [];

  for (const record of records) {
    const evidence = registry.addEvidence({
      source: 'BROWSER_VERIFICATION',
      label: `Root cause attribution: ${record.title}`,
      summary: `${record.category} — ${record.description} (${record.confidence} confidence)`,
      status: record.confidence === 'HIGH' ? 'WARN' : 'INFO',
      relatedSystemId: 'root_cause_attribution',
      relatedRecordId: record.attributionId,
      tags: ['root_cause_attribution', record.category.toLowerCase(), record.confidence.toLowerCase()],
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
    collected.push(evidence);
    record.supportingEvidenceIds.push(evidence.evidenceId);
  }

  lastCollectedAttributionEvidenceIds = collected.map((e) => e.evidenceId);
  return collected;
}

export function getEvidenceAttributionSummary(): string {
  const signals = analyzeEvidenceFromRegistry();
  if (signals.evidenceIds.length === 0) {
    return 'No evidence records available for attribution.';
  }
  return `Evidence signals: ${signals.evidenceIds.length} record(s), ${signals.failCount} FAIL, ${signals.warnCount} WARN.`;
}

export function getLastCollectedAttributionEvidenceIds(): string[] {
  return [...lastCollectedAttributionEvidenceIds];
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.listEvidence === 'function' &&
    typeof (registry as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}

export function resetAttributionEvidenceBridgeForTests(): void {
  lastCollectedAttributionEvidenceIds = [];
}
