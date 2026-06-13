/**
 * Requirements-to-Plan Execution Contract — core models.
 */

export type UserIdeaStatus = 'CAPTURED' | 'INSUFFICIENT_INPUT';

export type RequirementType =
  | 'FUNCTIONAL'
  | 'NON_FUNCTIONAL'
  | 'UI_UX'
  | 'DATA'
  | 'AUTH'
  | 'INTEGRATION'
  | 'PLATFORM'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'DEPLOYMENT'
  | 'UNKNOWN';

export type RequirementStatus = 'EXTRACTED' | 'INFERRED' | 'MISSING' | 'BOUNDED';

export type PlanTaskLayer =
  | 'FRONTEND'
  | 'BACKEND'
  | 'DATABASE'
  | 'AUTH'
  | 'API'
  | 'STATE'
  | 'TESTING'
  | 'VERIFICATION'
  | 'DEPLOYMENT'
  | 'DOCUMENTATION';

export type PlanTaskStatus = 'PLANNED' | 'BLOCKED' | 'READY';

export type ContractReadinessState =
  | 'BUILD_READY'
  | 'NEEDS_CLARIFICATION'
  | 'NEEDS_PLANNING'
  | 'BLOCKED';

export type RequirementsToPlanProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export interface UserIdeaContract {
  readOnly: true;
  ideaId: string;
  rawPrompt: string;
  normalizedGoal: string;
  targetUsers: string[];
  problemStatement: string;
  desiredOutcome: string;
  productType: string;
  platformHints: string[];
  knownConstraints: string[];
  unknowns: string[];
  confidence: number;
  status: UserIdeaStatus;
}

export interface RequirementContractEntry {
  readOnly: true;
  requirementId: string;
  sourceIdeaId: string;
  requirementType: RequirementType;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  acceptanceCriteria: string[];
  evidenceSource: string;
  status: RequirementStatus;
}

export interface RequirementContract {
  readOnly: true;
  contractId: string;
  sourceIdeaId: string;
  requirements: RequirementContractEntry[];
}

export interface ClarifyingGap {
  readOnly: true;
  gapId: string;
  category: string;
  critical: boolean;
  question: string;
  whyItMatters: string;
}

export interface ClarifyingGapAnalysis {
  readOnly: true;
  contractReadiness: ContractReadinessState;
  criticalGaps: ClarifyingGap[];
  clarifyingQuestions: string[];
  resolvedCategories: string[];
  missingCategories: string[];
}

export interface PlanTask {
  readOnly: true;
  taskId: string;
  sourceRequirementIds: string[];
  title: string;
  description: string;
  layer: PlanTaskLayer;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  dependencies: string[];
  acceptanceCriteria: string[];
  buildOrder: number;
  status: PlanTaskStatus;
}

export interface PlanContract {
  readOnly: true;
  contractId: string;
  sourceIdeaId: string;
  tasks: PlanTask[];
}

export interface BuildUnit {
  readOnly: true;
  unitId: string;
  sourcePlanTaskIds: string[];
  sourceRequirementIds: string[];
  label: string;
  layer: PlanTaskLayer;
  verificationRequirements: string[];
}

export interface BuildReadyExecutionContract {
  readOnly: true;
  contractId: string;
  ideaId: string;
  requirementIds: string[];
  planTaskIds: string[];
  buildUnits: BuildUnit[];
  executionOrder: string[];
  workspaceRequirements: string[];
  runtimeRequirements: string[];
  verificationRequirements: string[];
  readinessState: ContractReadinessState;
  blockers: string[];
  confidence: number;
}

export interface ContractLinkageAnalysis {
  readOnly: true;
  linkageConnected: boolean;
  firstBrokenLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  ideaToRequirements: boolean;
  requirementsToPlanTasks: boolean;
  planTasksToBuildUnits: boolean;
  buildUnitsToVerification: boolean;
}

export interface RequirementsToPlanContractReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  proofLevel: RequirementsToPlanProofLevel;
  userIdea: UserIdeaContract;
  requirementContract: RequirementContract | null;
  clarifyingGaps: ClarifyingGapAnalysis;
  planContract: PlanContract | null;
  buildReadyContract: BuildReadyExecutionContract | null;
  linkageAnalysis: ContractLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  cacheKey: string;
}

export interface RequirementsToPlanContractAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'CONTRACT_COMPLETE' | 'CONTRACT_FAILED';
  report: RequirementsToPlanContractReport;
}

export interface AssessRequirementsToPlanContractInput {
  rawPrompt: string;
  ideaId?: string;
}

export interface RequirementsToPlanContractHistoryEntry {
  timestamp: string;
  assessmentId: string;
  proofLevel: RequirementsToPlanProofLevel;
  readinessState: ContractReadinessState;
  linkageConnected: boolean;
}

export interface RequirementsToPlanContractHistorySummary {
  totalAssessments: number;
  provenContracts: number;
  partialContracts: number;
  notProvenContracts: number;
}

export interface RequirementsToPlanContractArtifacts {
  requirementsToPlanContractAssessment: RequirementsToPlanContractAssessment;
  requirementsToPlanContractReportMarkdown: string;
}

/** Last contract produced from chat — bounded single-entry store for Phase 26.7 UI hook. */
export interface StoredBuildReadyContract {
  storedAt: string;
  rawPrompt: string;
  report: RequirementsToPlanContractReport;
}
