/**
 * Self Evolution Governance — types and models.
 * Governance only — no execution, no self-modification.
 */

export const SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN = 'SELF_EVOLUTION_GOVERNANCE_V1_PASS';
export const SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE = 'devpulse_v2_self_evolution_governance';
export const DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE = 128;

export type SelfEvolutionGovernanceDecision =
  | 'APPROVED'
  | 'FOUNDER_REVIEW_REQUIRED'
  | 'TRUST_REVIEW_REQUIRED'
  | 'ROLLBACK_REVIEW_REQUIRED'
  | 'SELF_MODIFICATION_BLOCKED'
  | 'BLOCKED';

export type GovernanceRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GovernanceReadinessState = 'READY' | 'REQUIRES_REVIEW' | 'BLOCKED';

export type SelfModificationState = 'SELF_MODIFICATION_ALLOWED' | 'SELF_MODIFICATION_BLOCKED';

export interface SelfEvolutionGovernanceRecord {
  governanceId: string;
  decision: SelfEvolutionGovernanceDecision;
  trustScore: number;
  riskScore: number;
  readinessScore: number;
  createdAt: number;
}

export interface SelfEvolutionGovernanceInput {
  projectId?: string;
  evolutionRequest: string;
  capabilityDomain?: string;
  trustImpact?: boolean;
  world2Impact?: boolean;
  riskScore?: number;
  verificationDecision?: string;
  rollbackCheckpoints?: string[];
  rollbackTriggers?: string[];
  recoveryPath?: string[];
  hasProgressMonitoring?: boolean;
  hasStallHandling?: boolean;
  hasBottleneckRecovery?: boolean;
  hasEscalationPath?: boolean;
  signals?: string[];
}

export interface GovernanceBoundaryValidation {
  compliant: boolean;
  violations: string[];
  constitutionalCompliance: boolean;
  ownershipCompliance: boolean;
  world2Compliance: boolean;
}

export interface GovernanceRiskEvaluation {
  riskLevel: GovernanceRiskLevel;
  riskScore: number;
  factors: string[];
}

export interface GovernanceTrustEvaluation {
  trustScore: number;
  trustFindings: string[];
  verificationSatisfied: boolean;
  rolloutSatisfied: boolean;
  rollbackSatisfied: boolean;
}

export interface GovernanceApprovalEvaluation {
  requirement: SelfEvolutionGovernanceDecision | 'APPROVED';
  reasons: string[];
}

export interface GovernanceRollbackValidation {
  valid: boolean;
  missingRollback: boolean;
  unsafeRollback: boolean;
  findings: string[];
}

export interface GovernanceSelfModificationValidation {
  state: SelfModificationState;
  codeModificationBlocked: boolean;
  deploymentBlocked: boolean;
  executionBlocked: boolean;
  selfEditBlocked: boolean;
  findings: string[];
}

export interface GovernanceStallValidation {
  progressMonitoringPresent: boolean;
  stallHandlingPresent: boolean;
  bottleneckRecoveryPresent: boolean;
  escalationPathPresent: boolean;
  complete: boolean;
}

export interface GovernanceReadinessEvaluation {
  state: GovernanceReadinessState;
  readinessScore: number;
  canProceed: boolean;
  reasons: string[];
}

export interface SelfEvolutionGovernanceReport {
  reportId: string;
  governanceId: string;
  decision: SelfEvolutionGovernanceDecision;
  boundaries: GovernanceBoundaryValidation;
  risk: GovernanceRiskEvaluation;
  trust: GovernanceTrustEvaluation;
  approval: GovernanceApprovalEvaluation;
  rollback: GovernanceRollbackValidation;
  selfModification: GovernanceSelfModificationValidation;
  stallGovernance: GovernanceStallValidation;
  readiness: GovernanceReadinessEvaluation;
  phase21SafetyLaw: {
    researchAllowed: true;
    planningAllowed: true;
    buildPlanningAllowed: true;
    verificationAllowed: true;
    codeModificationAllowed: false;
    deploymentAllowed: false;
    selfEditingAllowed: false;
    productionChangesAllowed: false;
  };
  recommendedAction: string;
  generatedAt: number;
}

export interface GovernanceHistoryEntry {
  historyId: string;
  governanceId: string;
  decision: SelfEvolutionGovernanceDecision;
  readiness: GovernanceReadinessState;
  recordedAt: number;
}

export interface SelfEvolutionGovernanceRuntimeReport {
  boundaryValidations: number;
  riskReviews: number;
  trustReviews: number;
  approvalReviews: number;
  rollbackReviews: number;
  readinessEvaluations: number;
  governanceCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export interface SelfEvolutionGovernanceResult {
  record: SelfEvolutionGovernanceRecord;
  report: SelfEvolutionGovernanceReport;
}

export const GOVERNANCE_QUESTION_SIGNALS = [
  'self evolution governance',
  'governance decision',
  'founder review',
  'self modification',
  'stall governance',
] as const;

export function isSelfEvolutionGovernanceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return GOVERNANCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
