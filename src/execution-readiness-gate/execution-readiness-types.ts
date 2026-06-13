/**
 * Execution Readiness Gate — foundation types (V1).
 * Read-only final checkpoint before execution planning — no execution or building.
 */

import type { ArchitectureBrief } from '../architecture-brief-generator/architecture-brief-types.js';
import type { BuildPlan } from '../build-plan-generator/build-plan-types.js';
import type { OrchestrationProofAnalysis } from '../cross-system-orchestration-proof/orchestration-proof-types.js';
import type { FounderTestAutomationAnalysis } from '../founder-test-automation/founder-test-automation-types.js';
import type { FounderSimulationResult } from '../founder-simulation-engine/founder-simulation-types.js';
import type { PlanningBrief } from '../planning-brief-generator/planning-brief-types.js';
import type { PlanningGateAnalysis } from '../planning-gate-authority/planning-gate-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { UnifiedIntakeAnalysis } from '../unified-intake-intelligence/unified-intake-types.js';

export type ExecutionReadinessCategory =
  | 'NOT_READY'
  | 'NEEDS_WORK'
  | 'EXECUTION_CANDIDATE'
  | 'EXECUTION_READY';

export type ExecutionGateDecision =
  | 'REJECT_EXECUTION'
  | 'REQUEST_REMEDIATION'
  | 'ALLOW_EXECUTION_PREPARATION'
  | 'ALLOW_EXECUTION';

export type ExecutionBlockerPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ExecutionRiskType =
  | 'UNRESOLVED_CRITICAL_GAP'
  | 'UNRESOLVED_HIGH_BLOCKER'
  | 'PLANNING_INCONSISTENCY'
  | 'ARCHITECTURE_INCONSISTENCY'
  | 'BUILD_PLAN_INCONSISTENCY'
  | 'ORCHESTRATION_FAILURE'
  | 'CONFIDENCE_INSTABILITY'
  | 'READINESS_ESCALATION'
  | 'PLANNING_GATE_REJECTION'
  | 'SIMULATION_UNHEALTHY';

export type ExecutionRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExecutionAuthorityReadinessSignal {
  readOnly: true;
  authorityId: string;
  reached: boolean;
  readiness: string | null;
  confidence: number | null;
  evidence: readonly string[];
}

export interface ExecutionEvidenceSnapshot {
  readOnly: true;
  sources: readonly string[];
  readinessSignals: readonly ExecutionAuthorityReadinessSignal[];
  planningGateDecision: string | null;
  planningGateAligned: boolean;
  orchestrationProofScore: number | null;
  orchestrationProofCategory: string | null;
  founderSimulationVerdict: string | null;
  founderSimulationReadinessScore: number | null;
  clarificationRequestCount: number;
  knownGapCount: number;
  readinessEscalationCount: number;
  averageConfidence: number;
  averageReadinessScore: number;
  informationLossCount: number;
  orchestrationFailureCount: number;
}

export interface ExecutionRiskItem {
  readOnly: true;
  riskId: string;
  riskType: ExecutionRiskType;
  severity: ExecutionRiskSeverity;
  description: string;
  sourceAuthority: string;
  evidence: readonly string[];
}

export interface ExecutionRiskAnalysis {
  readOnly: true;
  risks: readonly ExecutionRiskItem[];
  overallRiskLevel: ExecutionRiskSeverity;
  riskCount: number;
  criticalRiskCount: number;
}

export interface ExecutionBlockerItem {
  readOnly: true;
  blockerId: string;
  title: string;
  priority: ExecutionBlockerPriority;
  category: string;
  resolved: boolean;
  sourceAuthority: string;
  explanation: string;
  evidence: readonly string[];
}

export interface ExecutionBlockerSummary {
  readOnly: true;
  blockers: readonly ExecutionBlockerItem[];
  criticalCount: number;
  highCount: number;
  unresolvedCount: number;
  unresolvedCriticalCount: number;
}

export interface ExecutionReadinessScoreResult {
  readOnly: true;
  executionReadinessScore: number;
  executionReadinessCategory: ExecutionReadinessCategory;
}

export interface ExecutionGateExplanation {
  readOnly: true;
  evidenceUsed: readonly string[];
  blockersSummary: readonly string[];
  risksFound: readonly string[];
  proofFindings: readonly string[];
  readinessReasoning: string;
  confidence: number;
  summary: string;
}

export interface ExecutionRecommendation {
  readOnly: true;
  recommendationId: string;
  title: string;
  rationale: string;
  priority: ExecutionBlockerPriority;
  relatedRiskType: ExecutionRiskType | null;
  evidence: readonly string[];
}

export interface ExecutionPermissionResult {
  readOnly: true;
  permitted: boolean;
  cappedDecision: ExecutionGateDecision;
  permissionReason: string;
  planningGateAligned: boolean;
  orchestrationProofSufficient: boolean;
  noCriticalBlockers: boolean;
  noReadinessEscalation: boolean;
  founderSimulationHealthy: boolean;
}

export interface ExecutionReadinessAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  evidenceSnapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
  readinessScore: ExecutionReadinessScoreResult;
  executionGateDecision: ExecutionGateDecision;
  executionGateExplanation: ExecutionGateExplanation;
  executionPermission: ExecutionPermissionResult;
  executionRecommendations: readonly ExecutionRecommendation[];
  safeToProceed: boolean;
  nextActions: readonly string[];
}

export interface ExecutionReadinessHistoryEntry {
  analysisId: string;
  timestamp: string;
  executionReadinessScore: number;
  executionGateDecision: ExecutionGateDecision;
  safeToProceed: boolean;
  criticalBlockerCount: number;
  riskCount: number;
}

export interface ExecutionReadinessGateReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: ExecutionReadinessAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageReadinessScore: number;
    allowExecutionCount: number;
    safeToProceedCount: number;
  };
}

export interface AssessExecutionReadinessInput {
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  planningGateAnalysis?: PlanningGateAnalysis | null;
  planningBrief?: PlanningBrief | null;
  architectureBrief?: ArchitectureBrief | null;
  buildPlan?: BuildPlan | null;
  founderTestAnalysis?: FounderTestAutomationAnalysis | null;
  founderSimulationResult?: FounderSimulationResult | null;
  orchestrationProofAnalysis?: OrchestrationProofAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  skipHistoryRecording?: boolean;
}

export interface ExecutionReadinessAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EXECUTION_READINESS_GATE_COMPLETE' | 'EXECUTION_READINESS_GATE_FAILED';
  analysis: ExecutionReadinessAnalysis | null;
  failureReason: string | null;
}
