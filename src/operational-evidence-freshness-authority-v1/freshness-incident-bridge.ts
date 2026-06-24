/**
 * Operational Evidence Freshness Authority V1 — freshness incidents for Unified Failure Escalation.
 */

import type {
  EvidenceFreshnessRecord,
  FreshnessIncident,
  FreshnessIncidentSeverity,
  FreshnessStatus,
} from './operational-evidence-freshness-v1-types.js';

function severityForStatus(status: FreshnessStatus): FreshnessIncidentSeverity {
  switch (status) {
    case 'FRESH':
      return 'LOW';
    case 'AGING':
      return 'LOW';
    case 'STALE':
      return 'MEDIUM';
    case 'EXPIRED':
      return 'HIGH';
  }
}

export function buildFreshnessIncidents(
  records: readonly EvidenceFreshnessRecord[],
): FreshnessIncident[] {
  return records
    .filter((r) => r.status === 'STALE' || r.status === 'EXPIRED' || r.status === 'AGING')
    .map((record) => ({
      readOnly: true as const,
      incidentId: `freshness-${record.evidenceId}`,
      evidenceId: record.evidenceId,
      sourceCapability: record.sourceCapability,
      severity: severityForStatus(record.status),
      status: record.status,
      detail: `${record.sourceCapability} evidence is ${record.status} (${record.ageDays} days, score ${record.freshnessScore}) — Unified Failure Escalation decides escalation path`,
      unifiedFailureEscalationEligible: true as const,
    }));
}
