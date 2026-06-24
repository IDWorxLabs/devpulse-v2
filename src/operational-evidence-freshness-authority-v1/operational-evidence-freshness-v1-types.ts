/**
 * Operational Evidence Freshness Authority V1 — types.
 */

import type {
  CRITICAL_PROOF_MONITORS,
  EVIDENCE_SOURCE_SYSTEMS,
} from './operational-evidence-freshness-v1-bounds.js';

export type EvidenceSourceSystem = (typeof EVIDENCE_SOURCE_SYSTEMS)[number];

export type CriticalProofMonitor = (typeof CRITICAL_PROOF_MONITORS)[number];

export type FreshnessStatus = 'FRESH' | 'AGING' | 'STALE' | 'EXPIRED';

export type RevalidationAction =
  | 'No Action'
  | 'FAST Validation'
  | 'STANDARD Validation'
  | 'FULL Validation'
  | 'LAUNCH Validation';

export type FreshnessIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EvidenceFreshnessRecord {
  readOnly: true;
  evidenceId: string;
  sourceCapability: string;
  sourceSystem: EvidenceSourceSystem;
  createdAt: string;
  lastValidatedAt: string;
  ageDays: number;
  freshnessScore: number;
  confidenceDecay: number;
  status: FreshnessStatus;
  projectId?: string;
  passToken?: string;
  artifactPath?: string;
}

export interface CapabilityFreshnessAssessment {
  readOnly: true;
  capability: string;
  sourceSystem: EvidenceSourceSystem;
  proofAgeDays: number;
  lastValidation: string;
  freshnessScore: number;
  confidenceAdjustment: number;
  status: FreshnessStatus;
  recommendedAction: RevalidationAction;
  projectId?: string;
}

export interface ConfidenceDecayModel {
  readOnly: true;
  configurable: true;
  thresholds: {
    agingDays: number;
    staleDays: number;
    expiredDays: number;
  };
  decayByStatus: Record<FreshnessStatus, number>;
}

export interface RevalidationRecommendation {
  readOnly: true;
  capability: string;
  action: RevalidationAction;
  tier: 'FAST' | 'STANDARD' | 'FULL' | 'LAUNCH' | 'NONE';
  rationale: string;
  validatorsToRun: readonly string[];
  estimatedRuntimeSeconds: number;
  governancePlannerUsed: true;
}

export interface EvidenceDriftEntry {
  readOnly: true;
  evidenceId: string;
  sourceCapability: string;
  driftType: 'capability_version_changed' | 'outdated_artifact_reference' | 'pass_token_mismatch' | 'missing_revalidation';
  detail: string;
  severity: FreshnessIncidentSeverity;
}

export interface EvidenceDriftAssessment {
  readOnly: true;
  generatedAt: string;
  driftDetected: boolean;
  entries: readonly EvidenceDriftEntry[];
}

export interface FreshnessIncident {
  readOnly: true;
  incidentId: string;
  evidenceId: string;
  sourceCapability: string;
  severity: FreshnessIncidentSeverity;
  status: FreshnessStatus;
  detail: string;
  unifiedFailureEscalationEligible: true;
}

export interface FreshnessRegistrySnapshot {
  readOnly: true;
  totalRecords: number;
  freshCount: number;
  agingCount: number;
  staleCount: number;
  expiredCount: number;
  overallFreshnessScore: number;
  records: readonly EvidenceFreshnessRecord[];
}

export interface OperationalEvidenceFreshnessAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Operational Evidence Freshness Authority V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  evidenceSourcesConsumed: number;
  capabilitiesAssessed: number;
  overallFreshnessScore: number;
  freshnessScoringProven: boolean;
  confidenceDecayProven: boolean;
  revalidationRecommendationsProven: boolean;
  evidenceDriftProven: boolean;
  staleEscalationProven: boolean;
  freshnessProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  registry: FreshnessRegistrySnapshot;
  capabilityFreshness: readonly CapabilityFreshnessAssessment[];
  confidenceDecay: ConfidenceDecayModel;
  revalidationRecommendations: readonly RevalidationRecommendation[];
  evidenceDrift: EvidenceDriftAssessment;
  freshnessIncidents: readonly FreshnessIncident[];
  criticalProofMonitoring: readonly {
    monitor: CriticalProofMonitor;
    status: FreshnessStatus;
    freshnessScore: number;
    lastValidatedAt: string;
  }[];
  auditImpact: {
    readOnly: true;
    generatedAt: string;
    operationalEvidenceFreshnessGapClosed: boolean;
    auditShouldReport: string;
  };
}
