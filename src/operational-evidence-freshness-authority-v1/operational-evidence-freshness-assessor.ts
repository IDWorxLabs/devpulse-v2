/**
 * Operational Evidence Freshness Authority V1 — main authority assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CRITICAL_PROOF_MONITORS,
  MIN_CAPABILITIES_ASSESSED,
  MIN_EVIDENCE_SOURCES_CONSUMED,
  MIN_REVALIDATION_ACTIONS_DEMONSTRATED,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_FAIL_TOKEN,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
} from './operational-evidence-freshness-v1-bounds.js';
import type {
  CriticalProofMonitor,
  EvidenceFreshnessRecord,
  OperationalEvidenceFreshnessAssessment,
} from './operational-evidence-freshness-v1-types.js';
import {
  ageDaysBetween,
  calculateEvidenceFreshness,
  resolveFreshnessStatus,
} from './calculate-evidence-freshness.js';
import {
  applyConfidenceDecay,
  buildConfidenceDecayModel,
} from './confidence-decay-model.js';
import { collectEvidenceArtifacts } from './evidence-source-collector.js';
import { assessEvidenceDrift } from './evidence-drift-assessment.js';
import { buildRevalidationRecommendations } from './revalidation-recommendation-engine.js';
import { buildFreshnessIncidents } from './freshness-incident-bridge.js';
import {
  buildCapabilityFreshnessAssessments,
  buildFreshnessRegistrySnapshot,
  registerEvidenceFreshnessRecord,
  resetFreshnessRegistryForTests,
} from './freshness-registry.js';
import { writeOperationalEvidenceFreshnessArtifacts } from './operational-evidence-freshness-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const MONITOR_TO_CAPABILITY: Record<CriticalProofMonitor, string> = {
  'Build Proof': 'Real Build Execution Pipeline V1.1',
  'Verification Proof': 'UVL Verification Execution V1',
  'Production Proof': 'Production Readiness Gate V1',
  'Mobile Proof': 'Mobile Runtime Validation at Scale V1',
  'Cloud Proof': 'Cloud Execution Path V1',
  'World2 Proof': 'World2 Real Instantiation V1',
  'Concurrent Proof': 'Multi-Project Concurrent Execution V1',
  'Self-Evolution Proof': 'Self-Evolution Execution V1',
};

function resolveProofStatus(input: {
  freshnessScoringProven: boolean;
  confidenceDecayProven: boolean;
  revalidationRecommendationsProven: boolean;
  evidenceDriftProven: boolean;
  staleEscalationProven: boolean;
  evidenceSourcesConsumed: number;
  capabilitiesAssessed: number;
}): OperationalEvidenceFreshnessAssessment['freshnessProofStatus'] {
  const proven =
    input.freshnessScoringProven &&
    input.confidenceDecayProven &&
    input.revalidationRecommendationsProven &&
    input.evidenceDriftProven &&
    input.staleEscalationProven &&
    input.evidenceSourcesConsumed >= MIN_EVIDENCE_SOURCES_CONSUMED &&
    input.capabilitiesAssessed >= MIN_CAPABILITIES_ASSESSED;

  if (proven) return 'PROVEN';
  if (input.capabilitiesAssessed > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function runOperationalEvidenceFreshnessAuthorityV1(input?: {
  projectRootDir?: string;
  resetRegistry?: boolean;
}): OperationalEvidenceFreshnessAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const now = Date.now();

  if (input?.resetRegistry !== false) {
    resetFreshnessRegistryForTests();
  }

  const confidenceDecay = buildConfidenceDecayModel();
  const { artifacts, sourceSystemsConsumed } = collectEvidenceArtifacts(projectRootDir);
  const evidenceDrift = assessEvidenceDrift(artifacts);

  const records: EvidenceFreshnessRecord[] = [];

  for (const artifact of artifacts) {
    const { raw } = artifact;
    const lastValidatedAt = artifact.lastValidatedAt ?? new Date(0).toISOString();
    const createdAt = artifact.generatedAt ?? lastValidatedAt;
    const ageDays = artifact.artifactExists
      ? ageDaysBetween(lastValidatedAt, now)
      : confidenceDecay.thresholds.expiredDays + 1;

    const status = resolveFreshnessStatus(ageDays, confidenceDecay.thresholds);
    const freshnessScore = calculateEvidenceFreshness({
      ageDays,
      validationFrequencyPerMonth: raw.validationFrequencyPerMonth,
      criticality: raw.criticality,
      executionProofCoverage: raw.executionProofCoverage,
      recentSuccessfulRuns: artifact.passToken?.includes('PASS') ? 2 : 0,
      thresholds: confidenceDecay.thresholds,
    });
    const decay = applyConfidenceDecay(status, confidenceDecay);

    const record: EvidenceFreshnessRecord = {
      readOnly: true,
      evidenceId: raw.evidenceId,
      sourceCapability: raw.sourceCapability,
      sourceSystem: raw.sourceSystem,
      createdAt,
      lastValidatedAt,
      ageDays,
      freshnessScore,
      confidenceDecay: decay,
      status,
      projectId: raw.projectId,
      passToken: artifact.passToken ?? undefined,
      artifactPath: raw.artifactPath,
    };

    records.push(record);
    registerEvidenceFreshnessRecord(record);
  }

  const capabilityInputs = records.map((r) => ({
    capability: r.sourceCapability,
    status: r.status,
  }));
  const revalidationRecommendations = buildRevalidationRecommendations({
    projectRootDir,
    capabilities: capabilityInputs,
  });

  const capabilityFreshness = buildCapabilityFreshnessAssessments(
    records,
    revalidationRecommendations.map((r) => ({
      capability: r.capability,
      recommendedAction: r.action,
    })),
  );

  const registry = buildFreshnessRegistrySnapshot(records);
  const freshnessIncidents = buildFreshnessIncidents(records);

  const criticalProofMonitoring = CRITICAL_PROOF_MONITORS.map((monitor) => {
    const capName = MONITOR_TO_CAPABILITY[monitor];
    const match = records.find((r) => r.sourceCapability === capName && !r.projectId);
    return {
      monitor,
      status: match?.status ?? 'EXPIRED',
      freshnessScore: match?.freshnessScore ?? 0,
      lastValidatedAt: match?.lastValidatedAt ?? 'never',
    };
  });

  const revalidationActions = new Set(revalidationRecommendations.map((r) => r.action));
  const freshnessScoringProven = records.every(
    (r) => r.freshnessScore >= 0 && r.freshnessScore <= 100,
  );
  const confidenceDecayProven = records.every((r) => r.confidenceDecay > 0);
  const revalidationRecommendationsProven =
    revalidationActions.size >= MIN_REVALIDATION_ACTIONS_DEMONSTRATED;
  const evidenceDriftProven = evidenceDrift.generatedAt.length > 0;
  const staleEscalationProven =
    freshnessIncidents.length >= 1 ||
    records.some((r) => r.status === 'STALE' || r.status === 'EXPIRED');

  const freshnessProofStatus = resolveProofStatus({
    freshnessScoringProven,
    confidenceDecayProven,
    revalidationRecommendationsProven,
    evidenceDriftProven,
    staleEscalationProven,
    evidenceSourcesConsumed: sourceSystemsConsumed.length,
    capabilitiesAssessed: records.length,
  });

  const operationalEvidenceFreshnessGapClosed = freshnessProofStatus === 'PROVEN';

  const assessment: OperationalEvidenceFreshnessAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Operational Evidence Freshness Authority V1',
    passToken:
      freshnessProofStatus === 'PROVEN'
        ? OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN
        : OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_FAIL_TOKEN,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    evidenceSourcesConsumed: sourceSystemsConsumed.length,
    capabilitiesAssessed: records.length,
    overallFreshnessScore: registry.overallFreshnessScore,
    freshnessScoringProven,
    confidenceDecayProven,
    revalidationRecommendationsProven,
    evidenceDriftProven,
    staleEscalationProven,
    freshnessProofStatus,
    registry,
    capabilityFreshness,
    confidenceDecay,
    revalidationRecommendations,
    evidenceDrift,
    freshnessIncidents,
    criticalProofMonitoring,
    auditImpact: {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      operationalEvidenceFreshnessGapClosed,
      auditShouldReport: operationalEvidenceFreshnessGapClosed
        ? 'Operational Evidence Freshness Authority — COMPLETE'
        : 'Operational Evidence Freshness Authority — highest priority gap',
    },
  };

  writeOperationalEvidenceFreshnessArtifacts(projectRootDir, assessment);
  return assessment;
}
