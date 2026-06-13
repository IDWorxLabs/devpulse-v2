/**
 * Cross-System Orchestration Proof — foundation types (V1).
 * Read-only chain coherence validation — no code generation or building.
 */

import type { ArchitectureBrief } from '../architecture-brief-generator/architecture-brief-types.js';
import type { BuildPlan } from '../build-plan-generator/build-plan-types.js';
import type { FounderTestAutomationAnalysis } from '../founder-test-automation/founder-test-automation-types.js';
import type { PlanningBrief } from '../planning-brief-generator/planning-brief-types.js';
import type { PlanningGateAnalysis } from '../planning-gate-authority/planning-gate-types.js';
import type { UnifiedIntakeAnalysis } from '../unified-intake-intelligence/unified-intake-types.js';

export type OrchestrationProofCategory =
  | 'BROKEN_CHAIN'
  | 'PARTIAL_CHAIN'
  | 'CONSISTENT_CHAIN'
  | 'FULLY_PROVEN_CHAIN';

export type DriftType =
  | 'WORKFLOW_DRIFT'
  | 'ROLE_DRIFT'
  | 'INTEGRATION_DRIFT'
  | 'PLATFORM_DRIFT'
  | 'SCREEN_DRIFT';

export type PropagationIssueType =
  | 'LOSS_OF_INFORMATION'
  | 'CONFIDENCE_COLLAPSE'
  | 'READINESS_INFLATION'
  | 'READINESS_ESCALATION'
  | 'EVIDENCE_INVENTED'
  | 'EVIDENCE_LOST';

export type AuthorityId =
  | 'UNIFIED_INTAKE_INTELLIGENCE'
  | 'PLANNING_GATE_AUTHORITY'
  | 'PLANNING_BRIEF_GENERATOR'
  | 'ARCHITECTURE_BRIEF_GENERATOR'
  | 'BUILD_PLAN_GENERATOR'
  | 'FOUNDER_TEST_AUTOMATION';

export interface AuthorityProjectSnapshot {
  readOnly: true;
  authorityId: AuthorityId;
  reached: boolean;
  productType: string | null;
  platforms: readonly string[];
  workflows: readonly string[];
  screens: readonly string[];
  roles: readonly string[];
  integrations: readonly string[];
  businessRules: readonly string[];
  confidence: number | null;
  readiness: string | null;
  evidenceSources: readonly string[];
}

export interface InformationLossItem {
  readOnly: true;
  lossId: string;
  field: 'workflows' | 'screens' | 'roles' | 'integrations' | 'businessRules' | 'platforms' | 'productType';
  upstreamAuthority: AuthorityId;
  downstreamAuthority: AuthorityId;
  lostItems: readonly string[];
  upstreamCount: number;
  downstreamCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface DriftFinding {
  readOnly: true;
  driftId: string;
  driftType: DriftType;
  upstreamAuthority: AuthorityId;
  downstreamAuthority: AuthorityId;
  unexpectedItems: readonly string[];
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface EvidencePropagationAnalysis {
  readOnly: true;
  preservedCount: number;
  expandedCount: number;
  inventedCount: number;
  lostCount: number;
  preservedSources: readonly string[];
  inventedSources: readonly string[];
  lostSources: readonly string[];
  issues: readonly PropagationIssueItem[];
}

export interface PropagationIssueItem {
  readOnly: true;
  issueId: string;
  issueType: PropagationIssueType;
  authorityId: AuthorityId;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface ConfidencePropagationStep {
  readOnly: true;
  authorityId: AuthorityId;
  confidence: number;
  deltaFromPrevious: number | null;
}

export interface ConfidencePropagationAnalysis {
  readOnly: true;
  steps: readonly ConfidencePropagationStep[];
  collapseDetected: boolean;
  collapseAuthority: AuthorityId | null;
  maxDrop: number;
  issues: readonly PropagationIssueItem[];
}

export interface ReadinessPropagationStep {
  readOnly: true;
  authorityId: AuthorityId;
  readiness: string;
  readinessLevel: number;
}

export interface ReadinessPropagationAnalysis {
  readOnly: true;
  steps: readonly ReadinessPropagationStep[];
  inflationDetected: boolean;
  inflationAuthority: AuthorityId | null;
  issues: readonly PropagationIssueItem[];
}

export interface OrchestrationFailureItem {
  readOnly: true;
  failureId: string;
  failingAuthority: AuthorityId;
  issueType: PropagationIssueType | DriftType;
  lostEvidence: readonly string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  launchImpact: string;
  recommendedRepair: string;
  evidence: readonly string[];
}

export interface SystemOrchestrationProof {
  readOnly: true;
  authoritiesEvaluated: readonly AuthorityId[];
  authoritiesConsistent: readonly AuthorityId[];
  authoritiesInconsistent: readonly AuthorityId[];
  informationLosses: readonly InformationLossItem[];
  driftFindings: readonly DriftFinding[];
  confidenceFindings: readonly PropagationIssueItem[];
  readinessFindings: readonly PropagationIssueItem[];
}

export interface ChainConsistencyResult {
  readOnly: true;
  scenarioType: string;
  scenarioName: string;
  proofScore: number;
  proofCategory: OrchestrationProofCategory;
  authoritiesReached: number;
  informationLossCount: number;
  driftCount: number;
  failureCount: number;
  strongestAuthority: AuthorityId | null;
  weakestAuthority: AuthorityId | null;
}

export interface OrchestrationProofAnalysis {
  readOnly: true;
  proofId: string;
  analyzedAt: string;
  orchestrationProofScore: number;
  orchestrationProofCategory: OrchestrationProofCategory;
  systemOrchestrationProof: SystemOrchestrationProof;
  evidencePropagation: EvidencePropagationAnalysis;
  confidencePropagation: ConfidencePropagationAnalysis;
  readinessPropagation: ReadinessPropagationAnalysis;
  orchestrationFailures: readonly OrchestrationFailureItem[];
  chainConsistencyResults: readonly ChainConsistencyResult[];
  authoritySnapshots: readonly AuthorityProjectSnapshot[];
  repairRecommendations: readonly string[];
  strongestAuthorities: readonly AuthorityId[];
  failingAuthorities: readonly AuthorityId[];
}

export interface OrchestrationProofHistoryEntry {
  proofId: string;
  timestamp: string;
  orchestrationProofScore: number;
  orchestrationProofCategory: OrchestrationProofCategory;
  failureCount: number;
  scenarioCount: number;
}

export interface OrchestrationProofReport {
  readOnly: true;
  generatedAt: string;
  totalProofs: number;
  latestAnalysis: OrchestrationProofAnalysis | null;
  historySummary: {
    totalProofs: number;
    averageProofScore: number;
    fullyProvenCount: number;
    brokenChainCount: number;
  };
}

export interface ProveOrchestrationInput {
  scenarioType?: string;
  scenarioName?: string;
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  planningGateAnalysis?: PlanningGateAnalysis | null;
  planningBrief?: PlanningBrief | null;
  architectureBrief?: ArchitectureBrief | null;
  buildPlan?: BuildPlan | null;
  founderTestAnalysis?: FounderTestAutomationAnalysis | null;
  skipHistoryRecording?: boolean;
}

export interface OrchestrationProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'ORCHESTRATION_PROOF_COMPLETE' | 'ORCHESTRATION_PROOF_FAILED';
  analysis: OrchestrationProofAnalysis | null;
  failureReason: string | null;
}

export interface RunOrchestrationProofInput {
  scenarioTypes?: readonly string[];
  skipHistoryRecording?: boolean;
  progressLogger?: (message: string) => void;
}

export interface OrchestrationProofRun {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'ORCHESTRATION_PROOF_COMPLETE' | 'ORCHESTRATION_PROOF_FAILED';
  analysis: OrchestrationProofAnalysis | null;
  failureReason: string | null;
}
