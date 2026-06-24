/**
 * Operational Evidence Freshness Authority V1 — evidence drift assessment.
 */

import type {
  CollectedEvidenceArtifact,
} from './evidence-source-collector.js';
import type {
  EvidenceDriftAssessment,
  EvidenceDriftEntry,
  FreshnessIncidentSeverity,
} from './operational-evidence-freshness-v1-types.js';

function severityForDrift(
  driftType: EvidenceDriftEntry['driftType'],
): FreshnessIncidentSeverity {
  if (driftType === 'pass_token_mismatch' || driftType === 'missing_revalidation') return 'HIGH';
  if (driftType === 'capability_version_changed') return 'MEDIUM';
  return 'LOW';
}

export function assessEvidenceDrift(
  artifacts: readonly CollectedEvidenceArtifact[],
): EvidenceDriftAssessment {
  const entries: EvidenceDriftEntry[] = [];

  for (const artifact of artifacts) {
    const { raw } = artifact;

    if (!artifact.artifactExists) {
      entries.push({
        readOnly: true,
        evidenceId: raw.evidenceId,
        sourceCapability: raw.sourceCapability,
        driftType: 'missing_revalidation',
        detail: `No assessment artifact at ${raw.artifactPath} — proof requires revalidation`,
        severity: 'HIGH',
      });
      continue;
    }

    if (
      raw.expectedPassToken &&
      artifact.passToken &&
      artifact.passToken !== raw.expectedPassToken
    ) {
      entries.push({
        readOnly: true,
        evidenceId: raw.evidenceId,
        sourceCapability: raw.sourceCapability,
        driftType: 'pass_token_mismatch',
        detail: `Expected ${raw.expectedPassToken} but artifact reports ${artifact.passToken}`,
        severity: severityForDrift('pass_token_mismatch'),
      });
    }

    if (artifact.version && artifact.version !== 'V1' && !artifact.version.startsWith('V')) {
      entries.push({
        readOnly: true,
        evidenceId: raw.evidenceId,
        sourceCapability: raw.sourceCapability,
        driftType: 'capability_version_changed',
        detail: `Capability version ${artifact.version} may invalidate prior proof chain`,
        severity: 'MEDIUM',
      });
    }
  }

  const auditArtifact = artifacts.find((a) => a.raw.evidenceId === 'capability-audit-v3-1');
  const staleRefs = artifacts.filter(
    (a) => a.raw.evidenceId !== 'capability-audit-v3-1' && !a.artifactExists,
  );
  if (auditArtifact?.artifactExists && staleRefs.length > 0) {
    entries.push({
      readOnly: true,
      evidenceId: 'capability-audit-v3-1',
      sourceCapability: 'Capability Audit V3.1',
      driftType: 'outdated_artifact_reference',
      detail: `Audit references ${staleRefs.length} capability artifact(s) missing or outdated on disk`,
      severity: 'LOW',
    });
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    driftDetected: entries.length > 0,
    entries,
  };
}
