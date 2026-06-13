/**
 * Founder Test Automation — foundation types (V1).
 * Read-only interpretation of Founder Test Reality Sweep findings.
 */

import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

export type BlockerPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ExecutionReadinessState =
  | 'NOT_READY'
  | 'HIGH_RISK'
  | 'READY_WITH_ACTIONS'
  | 'READY_FOR_EXECUTION';

export type ReadinessCategory = 'NOT_READY' | 'HIGH_RISK' | 'READY_WITH_ACTIONS' | 'READY_FOR_EXECUTION';

export type RecommendationGroup =
  | 'PRODUCT'
  | 'UX'
  | 'ARCHITECTURE'
  | 'DATA'
  | 'AUTHENTICATION'
  | 'PAYMENTS'
  | 'INTEGRATIONS'
  | 'LAUNCH'
  | 'FOUNDER_EXPERIENCE';

export interface PrioritizedBlocker {
  readOnly: true;
  blockerId: string;
  title: string;
  priority: BlockerPriority;
  category: string;
  launchImpact: number;
  userImpact: number;
  founderImpact: number;
  confidence: number;
  explanation: string;
  sourceAuthority: string;
  evidence: readonly string[];
}

export interface ImprovementRecommendation {
  readOnly: true;
  recommendationId: string;
  group: RecommendationGroup;
  title: string;
  rationale: string;
  expectedImpact: string;
  confidence: number;
  relatedBlockerId: string | null;
  evidence: readonly string[];
}

export interface ImprovementPathStep {
  readOnly: true;
  stepNumber: number;
  action: string;
  rationale: string;
  priority: BlockerPriority;
  relatedBlockerId: string | null;
  evidence: readonly string[];
}

export interface RequiredInformationRequest {
  readOnly: true;
  requestId: string;
  question: string;
  category: RecommendationGroup | 'SCOPE';
  priority: BlockerPriority;
  blockingReason: string;
  evidence: readonly string[];
}

export interface ExecutionReadinessAnalysis {
  readOnly: true;
  readinessScore: number;
  readinessCategory: ReadinessCategory;
  executionReadinessState: ExecutionReadinessState;
  launchReadinessPercent: number;
  requirementCompletenessScore: number | null;
  confidenceScore: number;
  safeToProceed: boolean;
  summary: string;
  confidenceAdjustmentExplanation: ConfidenceAdjustmentExplanation;
  unjustifiedReadinessDropDetected: boolean;
}

export interface UpstreamChainConfidenceContext {
  readOnly: true;
  unifiedIntakeConfidence?: number | null;
  planningGateConfidence?: number | null;
  planningBriefConfidence?: number | null;
  architectureBriefConfidence?: number | null;
  buildPlanConfidence?: number | null;
  unifiedIntakeReadiness?: string | null;
  planningGateReadiness?: string | null;
  planningGateDecision?: import('../planning-gate-authority/planning-gate-types.js').PlanningGateDecision | null;
  planningBriefReadiness?: string | null;
  architectureBriefReadiness?: string | null;
  buildPlanReadiness?: string | null;
}

export interface ConfidenceAdjustmentReason {
  readOnly: true;
  reason: string;
  delta: number;
  evidence: readonly string[];
}

export interface ConfidenceAdjustmentExplanation {
  readOnly: true;
  upstreamConfidence: number;
  downstreamConfidence: number;
  delta: number;
  justified: boolean;
  adjustmentReasons: readonly ConfidenceAdjustmentReason[];
}

export interface FounderTestAutomationAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  sweepId: string;
  founderLaunchVerdict: string;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  recommendations: readonly ImprovementRecommendation[];
  improvementPath: readonly ImprovementPathStep[];
  executionReadiness: ExecutionReadinessAnalysis;
  requiredInformationRequests: readonly RequiredInformationRequest[];
}

export interface FounderTestAutomationHistoryEntry {
  analysisId: string;
  timestamp: string;
  sweepId: string;
  readinessScore: number;
  executionReadinessState: ExecutionReadinessState;
  blockerCount: number;
  recommendationCount: number;
}

export interface FounderTestAutomationReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: FounderTestAutomationAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageReadinessScore: number;
    readyForExecutionCount: number;
  };
}

export interface RunFounderTestAutomationInput {
  founderTestRealitySweepReport?: FounderTestRealitySweepReport | null;
  launchCouncilAssessment?: LaunchCouncilAssessment | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  upstreamChainConfidence?: UpstreamChainConfidenceContext | null;
  skipHistoryRecording?: boolean;
}

export interface FounderTestAutomationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_TEST_AUTOMATION_COMPLETE' | 'FOUNDER_TEST_AUTOMATION_FAILED';
  analysis: FounderTestAutomationAnalysis | null;
  failureReason: string | null;
}
