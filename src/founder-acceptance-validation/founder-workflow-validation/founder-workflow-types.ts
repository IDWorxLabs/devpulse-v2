/**
 * Founder Workflow Validation — types and models.
 * Read-only founder workflow validation. No UI, execution, or state mutation.
 */

export const FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN = 'FOUNDER_WORKFLOW_VALIDATION_V1_PASS';
export const FOUNDER_WORKFLOW_VALIDATION_PASS = 'FOUNDER_WORKFLOW_VALIDATION_PASS';
export const FOUNDER_WORKFLOW_OWNER_MODULE = 'devpulse_v2_founder_workflow_validation';
export const DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE = 128;
export const MAX_WORKFLOW_GAPS = 64;

export const WORKFLOW_CONTEXT_PASS = 'WORKFLOW_CONTEXT_PASS';
export const WORKFLOW_CLARITY_PASS = 'WORKFLOW_CLARITY_PASS';
export const WORKFLOW_DISCOVERABILITY_PASS = 'WORKFLOW_DISCOVERABILITY_PASS';
export const WORKFLOW_CONTINUITY_PASS = 'WORKFLOW_CONTINUITY_PASS';
export const WORKFLOW_FRICTION_PASS = 'WORKFLOW_FRICTION_PASS';
export const WORKFLOW_RECOVERY_PASS = 'WORKFLOW_RECOVERY_PASS';
export const WORKFLOW_OUTCOME_PASS = 'WORKFLOW_OUTCOME_PASS';
export const WORKFLOW_EFFICIENCY_PASS = 'WORKFLOW_EFFICIENCY_PASS';
export const WORKFLOW_GAP_ANALYSIS_PASS = 'WORKFLOW_GAP_ANALYSIS_PASS';
export const WORKFLOW_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_WORKFLOW_REPORTING_PASS = 'REPORTING_PASS';

export type FounderWorkflowResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type WorkflowGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type WorkflowContextId =
  | 'IDEA_TO_PROJECT'
  | 'PROJECT_TO_BUILD'
  | 'BUILD_TO_VERIFICATION'
  | 'VERIFICATION_TO_FIX'
  | 'FIX_TO_VALIDATION'
  | 'VALIDATION_TO_RELEASE'
  | 'DISCOVERY_TO_ACTION';

export interface WorkflowContext {
  workflowId: WorkflowContextId;
  workflowName: string;
  goal: string;
  expectedOutcome: string;
  requiredCapabilities: string[];
  passToken: typeof WORKFLOW_CONTEXT_PASS;
}

export interface WorkflowGap {
  gapId: string;
  title: string;
  description: string;
  severity: WorkflowGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  workflowContext?: WorkflowContextId;
}

export interface WorkflowValidatorResult {
  validatorType: string;
  score: number;
  detectionCodes: string[];
  gaps: WorkflowGap[];
  passToken: string;
}

export interface WorkflowClarityValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_CLARITY_PASS;
}

export interface WorkflowDiscoverabilityValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_DISCOVERABILITY_PASS;
}

export interface WorkflowContinuityValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_CONTINUITY_PASS;
}

export interface WorkflowFrictionValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_FRICTION_PASS;
}

export interface WorkflowRecoveryValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_RECOVERY_PASS;
}

export interface WorkflowOutcomeValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_OUTCOME_PASS;
}

export interface WorkflowEfficiencyValidation extends WorkflowValidatorResult {
  passToken: typeof WORKFLOW_EFFICIENCY_PASS;
}

export interface WorkflowGapAnalysis {
  gaps: WorkflowGap[];
  criticalWorkflowGaps: WorkflowGap[];
  majorWorkflowGaps: WorkflowGap[];
  minorWorkflowGaps: WorkflowGap[];
  passToken: typeof WORKFLOW_GAP_ANALYSIS_PASS;
}

export interface FounderWorkflowRoadmap {
  criticalWorkflowFixes: WorkflowGap[];
  highPriorityImprovements: WorkflowGap[];
  mediumImprovements: WorkflowGap[];
  futureWorkflowOptimization: WorkflowGap[];
  passToken: typeof WORKFLOW_ROADMAP_PASS;
}

export interface FounderWorkflowAuthority {
  authorityId: string;
  contexts: WorkflowContext[];
  clarity: WorkflowClarityValidation;
  discoverability: WorkflowDiscoverabilityValidation;
  continuity: WorkflowContinuityValidation;
  friction: WorkflowFrictionValidation;
  recovery: WorkflowRecoveryValidation;
  outcome: WorkflowOutcomeValidation;
  efficiency: WorkflowEfficiencyValidation;
  gapAnalysis: WorkflowGapAnalysis;
  roadmap: FounderWorkflowRoadmap;
  founderWorkflowScore: number;
  founderWorkflowResult: FounderWorkflowResult;
  confidence: number;
  createdAt: number;
}

export interface FounderWorkflowScore {
  overallScore: number;
  clarityScore: number;
  discoverabilityScore: number;
  continuityScore: number;
  frictionScore: number;
  recoveryScore: number;
  outcomeScore: number;
  efficiencyScore: number;
}

export interface FounderWorkflowRecord {
  founderWorkflowId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderWorkflowResult: FounderWorkflowResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderWorkflowEvaluation {
  overallScore: number;
  founderWorkflowResult: FounderWorkflowResult;
  confidence: number;
  workflowVerdict: string;
  scores: FounderWorkflowScore;
  totalGaps: number;
  criticalGaps: number;
}

export interface FounderWorkflowReport {
  founderWorkflowScore: number;
  founderWorkflowResult: FounderWorkflowResult;
  clarityScore: number;
  discoverabilityScore: number;
  continuityScore: number;
  frictionScore: number;
  recoveryScore: number;
  outcomeScore: number;
  efficiencyScore: number;
  detectedWorkflowGaps: WorkflowGap[];
  criticalWorkflowGaps: WorkflowGap[];
  majorWorkflowGaps: WorkflowGap[];
  minorWorkflowGaps: WorkflowGap[];
  founderWorkflowRoadmap: FounderWorkflowRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderWorkflowEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_WORKFLOW_REPORTING_PASS;
}

export interface FounderWorkflowValidationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  workflowClarityWeak?: boolean;
  workflowDiscoverabilityWeak?: boolean;
  workflowContinuityBreak?: boolean;
  workflowFrictionHigh?: boolean;
  workflowRecoveryWeak?: boolean;
  workflowOutcomeUnclear?: boolean;
  workflowEfficiencyLow?: boolean;
  workflowDeadEnd?: boolean;
  hiddenCapabilities?: boolean;
  contextLoss?: boolean;
  excessiveSteps?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderWorkflowResultBundle {
  record: FounderWorkflowRecord;
  report: FounderWorkflowReport;
  authority: FounderWorkflowAuthority;
  result: FounderWorkflowResult;
  score: FounderWorkflowScore;
}

export interface FounderWorkflowRuntimeReport {
  contextBuildCount: number;
  clarityValidateCount: number;
  discoverabilityValidateCount: number;
  continuityValidateCount: number;
  frictionValidateCount: number;
  recoveryValidateCount: number;
  outcomeValidateCount: number;
  efficiencyValidateCount: number;
  gapAnalysisCount: number;
  roadmapBuildCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  reportCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const FOUNDER_WORKFLOW_QUESTION_SIGNALS = [
  'founder workflow',
  'workflow validation',
  'operational workflow',
  'workflow friction',
  'workflow continuity',
] as const;

export function isFounderWorkflowQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_WORKFLOW_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderWorkflowResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderWorkflowResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
