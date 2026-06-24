/**
 * Unified Failure Escalation Authority V1 — types.
 */

export type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKING';

export type FailureClassificationCategory =
  | 'Requirement Failure'
  | 'Planning Failure'
  | 'Generation Failure'
  | 'Build Failure'
  | 'Preview Failure'
  | 'Verification Failure'
  | 'Product Failure'
  | 'Launch Failure'
  | 'Production Failure'
  | 'Mobile Failure'
  | 'Cloud Failure'
  | 'World2 Failure'
  | 'Concurrency Failure'
  | 'Governance Failure'
  | 'Evolution Failure'
  | 'Architecture Failure';

export type RootCauseType =
  | 'Capability gap'
  | 'Missing ownership'
  | 'Missing validation'
  | 'Implementation defect'
  | 'Architecture defect'
  | 'Evidence defect'
  | 'Regression'
  | 'Unknown';

export type EscalationStrategy =
  | 'RETRY'
  | 'REPAIR'
  | 'RESEARCH'
  | 'WORLD2_EXPERIMENT'
  | 'CAPABILITY_EVOLUTION'
  | 'OPERATOR_REVIEW'
  | 'BLOCK_RELEASE';

export type FailureIncidentStatus =
  | 'OPEN'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'BLOCKED';

export interface FailureIncident {
  readOnly: true;
  incidentId: string;
  sourceSystem: string;
  timestamp: string;
  severity: FailureSeverity;
  classification: FailureClassificationCategory;
  rootCause: RootCauseType;
  affectedCapabilities: readonly string[];
  affectedProjects: readonly string[];
  recommendedAction: EscalationStrategy;
  canonicalOwner: string;
  status: FailureIncidentStatus;
  systemWideImpact: boolean;
  repeatCount: number;
  detail: string;
}

export interface EscalationDecision {
  readOnly: true;
  incidentId: string;
  strategy: EscalationStrategy;
  canonicalOwner: string;
  rationale: string;
  selfEvolutionExecutorOnly: boolean;
  world2ExperimentId: string | null;
  decidedAt: string;
}

export interface RepeatedFailureAnalysis {
  readOnly: true;
  generatedAt: string;
  fingerprint: string;
  failureCount: number;
  firstStrategy: EscalationStrategy;
  secondStrategy: EscalationStrategy;
  thirdStrategy: EscalationStrategy;
  threeFailureRuleEnforced: boolean;
}

export interface SeverityDistribution {
  readOnly: true;
  generatedAt: string;
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
  BLOCKING: number;
}

export interface RootCauseAnalysisSummary {
  readOnly: true;
  generatedAt: string;
  byRootCause: Readonly<Record<RootCauseType, number>>;
  byClassification: Readonly<Record<string, number>>;
}

export interface EscalationEffectivenessAssessment {
  readOnly: true;
  generatedAt: string;
  resolvedRate: number;
  repeatRate: number;
  researchSuccessRate: number;
  repairSuccessRate: number;
  evolutionSuccessRate: number;
  totalIncidents: number;
  escalatedIncidents: number;
  blockedIncidents: number;
}

export interface UnifiedFailureRegistrySnapshot {
  readOnly: true;
  generatedAt: string;
  openIncidents: number;
  resolvedIncidents: number;
  escalatedIncidents: number;
  repeatedIncidents: number;
  blockedIncidents: number;
  totalIncidents: number;
  boundedAt: number;
  incidents: readonly FailureIncident[];
}

export interface World2FailureExperiment {
  readOnly: true;
  experimentId: string;
  worldId: string;
  incidentId: string;
  profile: string;
  createdAt: string;
  status: 'CREATED' | 'EXECUTED' | 'ARCHIVED';
}

export interface AuditImpactRecord {
  readOnly: true;
  generatedAt: string;
  unifiedFailureEscalationGapClosed: boolean;
  singleAuthorityProven: boolean;
  auditShouldReport: string;
}

export interface UnifiedFailureEscalationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Unified Failure Escalation Authority V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  sourceSystemsConsumed: number;
  incidentsProcessed: number;
  threeFailureRuleProven: boolean;
  world2EscalationProven: boolean;
  evolutionEscalationProven: boolean;
  singleAuthorityProven: boolean;
  escalationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  registry: UnifiedFailureRegistrySnapshot;
  severityDistribution: SeverityDistribution;
  rootCauseAnalysis: RootCauseAnalysisSummary;
  escalationDecisions: readonly EscalationDecision[];
  repeatedFailureAnalysis: readonly RepeatedFailureAnalysis[];
  effectivenessAssessment: EscalationEffectivenessAssessment;
  world2FailureExperiments: readonly World2FailureExperiment[];
  auditImpact: AuditImpactRecord;
}
