/**
 * Interactive Explanations — types and models.
 */

export const INTERACTIVE_EXPLANATIONS_PASS_TOKEN = 'INTERACTIVE_EXPLANATIONS_V1_PASS';
export const INTERACTIVE_EXPLANATIONS_OWNER_MODULE = 'devpulse_v2_interactive_explanations';
export const DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE = 128;

export type ExplanationCoverageLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type ExplanationState =
  | 'READY'
  | 'PARTIAL'
  | 'INCOMPLETE'
  | 'UNKNOWN';

export interface InteractiveExplanationRecord {
  explanationId: string;
  projectId: string;
  workspaceId: string;
  coverageLevel: ExplanationCoverageLevel;
  state: ExplanationState;
  confidence: number;
  explanationCoverageScore: number;
  workflowCoverageScore: number;
  reasoningCoverageScore: number;
  generatedAt: number;
}

export interface SystemExplanationAnalysis {
  systemCoverageScore: number;
  undocumentedSystems: string[];
  systemWarnings: string[];
}

export interface WorkflowExplanationAnalysis {
  workflowCoverageScore: number;
  undocumentedWorkflows: string[];
  workflowWarnings: string[];
}

export interface ReasoningExplanationAnalysis {
  reasoningCoverageScore: number;
  undocumentedReasoningAreas: string[];
  reasoningWarnings: string[];
}

export interface ReportInterpretationAnalysis {
  reportCoverageScore: number;
  undocumentedReportAreas: string[];
  reportWarnings: string[];
}

export interface NextStepGuidanceAnalysis {
  guidanceCoverageScore: number;
  undocumentedGuidanceAreas: string[];
  guidanceWarnings: string[];
}

export interface UnifiedInteractiveExplanationsAuthority {
  authorityId: string;
  explanationCoverageScore: number;
  workflowCoverageScore: number;
  reasoningCoverageScore: number;
  reportCoverageScore: number;
  guidanceCoverageScore: number;
  coverageLevel: ExplanationCoverageLevel;
  state: ExplanationState;
  confidence: number;
  createdAt: number;
}

export interface InteractiveExplanationsEvaluation {
  explanationCoverageScore: number;
  workflowCoverageScore: number;
  reasoningCoverageScore: number;
  reportCoverageScore: number;
  guidanceCoverageScore: number;
  coverageLevel: ExplanationCoverageLevel;
  state: ExplanationState;
  confidence: number;
  explanationReadiness: number;
}

export interface InteractiveExplanationsHistoryEntry {
  explanationId: string;
  explanationCoverageScore: number;
  state: ExplanationState;
  coverageLevel: ExplanationCoverageLevel;
  recordedAt: number;
}

export interface InteractiveExplanationsReport {
  explanationCoverageScore: number;
  workflowCoverageScore: number;
  reasoningCoverageScore: number;
  reportCoverageScore: number;
  guidanceCoverageScore: number;
  coverageLevel: ExplanationCoverageLevel;
  state: ExplanationState;
  confidence: number;
  systemExplanationCoverage: string[];
  workflowExplanationCoverage: string[];
  reasoningCoverage: string[];
  reportCoverage: string[];
  guidanceCoverage: string[];
  undocumentedSystems: string[];
  undocumentedWorkflows: string[];
  undocumentedReasoningAreas: string[];
  undocumentedReportAreas: string[];
  undocumentedGuidanceAreas: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: InteractiveExplanationsEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface InteractiveExplanationsInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedSystems?: string[];
  missingSystemExplanationGuidance?: boolean;
  missingCapabilityExplanationGuidance?: boolean;
  missingDomainExplanationGuidance?: boolean;
  missingPhaseExplanationGuidance?: boolean;
  missingCheckpointExplanationGuidance?: boolean;
  missingAuthorityChainExplanationGuidance?: boolean;
  undocumentedWorkflows?: string[];
  missingProjectWorkflowExplanation?: boolean;
  missingVerificationWorkflowExplanation?: boolean;
  missingTrustWorkflowExplanation?: boolean;
  missingHardeningWorkflowExplanation?: boolean;
  missingDocumentationWorkflowExplanation?: boolean;
  missingLaunchWorkflowExplanation?: boolean;
  undocumentedReasoningAreas?: string[];
  missingTrustDecisionExplanation?: boolean;
  missingVerificationDecisionExplanation?: boolean;
  missingHardeningDecisionExplanation?: boolean;
  missingDocumentationDecisionExplanation?: boolean;
  missingGovernanceDecisionExplanation?: boolean;
  undocumentedReportAreas?: string[];
  missingTrustReportExplanation?: boolean;
  missingVerificationReportExplanation?: boolean;
  missingHardeningReportExplanation?: boolean;
  missingDocumentationReportExplanation?: boolean;
  missingCheckpointReportExplanation?: boolean;
  undocumentedGuidanceAreas?: string[];
  missingNextPhaseGuidance?: boolean;
  missingNextCheckpointGuidance?: boolean;
  missingNextActionGuidance?: boolean;
  missingRoadmapProgressionGuidance?: boolean;
  missingDependencyProgressionGuidance?: boolean;
  governanceBlocked?: boolean;
}

export interface InteractiveExplanationsResult {
  record: InteractiveExplanationRecord;
  report: InteractiveExplanationsReport;
}

export interface InteractiveExplanationsRuntimeReport {
  systemAnalysisCount: number;
  workflowAnalysisCount: number;
  reasoningAnalysisCount: number;
  reportAnalysisCount: number;
  guidanceAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const INTERACTIVE_EXPLANATIONS_QUESTION_SIGNALS = [
  'interactive explanations',
  'explanations',
  'system explanation',
  'workflow explanation',
  'report explanation',
  'reasoning explanation',
  'next step guidance',
] as const;

export function isInteractiveExplanationsQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return INTERACTIVE_EXPLANATIONS_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveExplanationCoverageLevel(score: number): ExplanationCoverageLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveExplanationState(score: number, blocked?: boolean): ExplanationState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'READY';
  if (score >= 65) return 'PARTIAL';
  if (score >= 35) return 'INCOMPLETE';
  return 'UNKNOWN';
}
