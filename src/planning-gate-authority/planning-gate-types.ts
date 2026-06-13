/**
 * Planning Gate Authority — foundation types (V1).
 * Read-only mandatory checkpoint before planning — no planning execution.
 */

import type { FounderTestAutomationAnalysis } from '../founder-test-automation/founder-test-automation-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { UnifiedIntakeAnalysis, ProjectVaultIntakeSnapshot } from '../unified-intake-intelligence/unified-intake-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

export type PlanningReadinessCategory =
  | 'NOT_READY'
  | 'NEEDS_CLARIFICATION'
  | 'READY_WITH_GAPS'
  | 'READY_FOR_PLANNING';

export type PlanningGateDecision =
  | 'REJECT_PLANNING'
  | 'REQUEST_CLARIFICATION'
  | 'ALLOW_LIMITED_PLANNING'
  | 'ALLOW_FULL_PLANNING';

export type PlanningRiskType =
  | 'MISSING_REQUIREMENTS'
  | 'CONFLICTING_EVIDENCE'
  | 'PLATFORM_AMBIGUITY'
  | 'WORKFLOW_AMBIGUITY'
  | 'ROLE_AMBIGUITY'
  | 'INTEGRATION_AMBIGUITY';

export type PlanningRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type PlanningGateQuestionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface EvidenceCoverageDimension {
  readOnly: true;
  dimension:
    | 'REQUIREMENTS'
    | 'WORKFLOWS'
    | 'SCREENS'
    | 'ROLES'
    | 'INTEGRATIONS'
    | 'BUSINESS_LOGIC';
  score: number;
  covered: boolean;
  evidence: readonly string[];
}

export interface EvidenceSufficiencyResult {
  readOnly: true;
  evidenceSufficiencyScore: number;
  dimensions: readonly EvidenceCoverageDimension[];
  activeSourceCount: number;
}

export interface PlanningRiskItem {
  readOnly: true;
  riskId: string;
  riskType: PlanningRiskType;
  severity: PlanningRiskSeverity;
  description: string;
  evidence: readonly string[];
}

export interface PlanningRiskAnalysis {
  readOnly: true;
  risks: readonly PlanningRiskItem[];
  overallRiskLevel: PlanningRiskSeverity;
  riskCount: number;
}

export interface PlanningReadinessResult {
  readOnly: true;
  planningReadinessScore: number;
  planningReadinessCategory: PlanningReadinessCategory;
}

export interface PlanningGateQuestion {
  readOnly: true;
  questionId: string;
  question: string;
  priority: PlanningGateQuestionPriority;
  category: string;
  evidence: readonly string[];
}

export interface PlanningGateExplanation {
  readOnly: true;
  evidenceUsed: readonly string[];
  risksFound: readonly string[];
  missingInformation: readonly string[];
  confidence: number;
  summary: string;
}

export interface PlanningGateAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  evidenceSufficiency: EvidenceSufficiencyResult;
  planningRiskAnalysis: PlanningRiskAnalysis;
  planningReadiness: PlanningReadinessResult;
  planningGateDecision: PlanningGateDecision;
  planningGateExplanation: PlanningGateExplanation;
  planningGateQuestions: readonly PlanningGateQuestion[];
  safeToPlan: boolean;
}

export interface PlanningGateHistoryEntry {
  analysisId: string;
  timestamp: string;
  planningReadinessScore: number;
  planningGateDecision: PlanningGateDecision;
  safeToPlan: boolean;
  riskCount: number;
}

export interface PlanningGateAuthorityReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: PlanningGateAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageReadinessScore: number;
    allowFullPlanningCount: number;
    safeToPlanCount: number;
  };
}

export interface AssessPlanningGateInput {
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  founderTestAutomationAnalysis?: FounderTestAutomationAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  projectVaultContext?: ProjectVaultIntakeSnapshot | null;
  skipHistoryRecording?: boolean;
}

export interface PlanningGateAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PLANNING_GATE_AUTHORITY_COMPLETE' | 'PLANNING_GATE_AUTHORITY_FAILED';
  analysis: PlanningGateAnalysis | null;
  failureReason: string | null;
}

export interface PlanningGateEvidenceSnapshot {
  readOnly: true;
  sources: readonly string[];
  screens: readonly string[];
  workflows: readonly string[];
  userRoles: readonly string[];
  integrations: readonly string[];
  businessRules: readonly string[];
  platforms: readonly string[];
  intakeConfidence: number;
  intakeReadinessScore: number;
  completenessScore: number | null;
  conflictCount: number;
  gapCount: number;
}
