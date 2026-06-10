/**
 * Founder Productivity Validation — types and models.
 * Read-only founder productivity validation. No UI, execution, or state mutation.
 */

export const FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN = 'FOUNDER_PRODUCTIVITY_VALIDATION_V1_PASS';
export const FOUNDER_PRODUCTIVITY_VALIDATION_PASS = 'FOUNDER_PRODUCTIVITY_VALIDATION_PASS';
export const FOUNDER_PRODUCTIVITY_OWNER_MODULE = 'devpulse_v2_founder_productivity_validation';
export const DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE = 128;
export const MAX_PRODUCTIVITY_GAPS = 64;

export const PRODUCTIVITY_CONTEXT_PASS = 'PRODUCTIVITY_CONTEXT_PASS';
export const WORKFLOW_ACCELERATION_PASS = 'WORKFLOW_ACCELERATION_PASS';
export const MANUAL_WORK_REDUCTION_PASS = 'MANUAL_WORK_REDUCTION_PASS';
export const DECISION_REDUCTION_PASS = 'DECISION_REDUCTION_PASS';
export const CONTEXT_SWITCHING_PASS = 'CONTEXT_SWITCHING_PASS';
export const EXECUTION_EFFICIENCY_PASS = 'EXECUTION_EFFICIENCY_PASS';
export const THROUGHPUT_PASS = 'THROUGHPUT_PASS';
export const WORKFLOW_OVERHEAD_PASS = 'WORKFLOW_OVERHEAD_PASS';
export const PRODUCTIVITY_GAP_ANALYSIS_PASS = 'PRODUCTIVITY_GAP_ANALYSIS_PASS';
export const PRODUCTIVITY_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_PRODUCTIVITY_REPORTING_PASS = 'REPORTING_PASS';

export type FounderProductivityResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type ProductivityGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type ProductivityContextId =
  | 'IDEA_TO_EXECUTION_PRODUCTIVITY'
  | 'PROJECT_MANAGEMENT_PRODUCTIVITY'
  | 'BUILD_PRODUCTIVITY'
  | 'VERIFICATION_PRODUCTIVITY'
  | 'DECISION_PRODUCTIVITY'
  | 'AUTOMATION_PRODUCTIVITY'
  | 'DELIVERY_PRODUCTIVITY';

export interface ProductivityContext {
  contextId: ProductivityContextId;
  contextName: string;
  productivityIntent: string;
  expectedFounderBenefit: string;
  requiredEvidence: string[];
  passToken: typeof PRODUCTIVITY_CONTEXT_PASS;
}

export interface ProductivityGap {
  gapId: string;
  title: string;
  description: string;
  severity: ProductivityGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  productivityContext?: ProductivityContextId;
}

export interface ProductivityValidatorResult {
  validatorType: string;
  score: number;
  detectionCodes: string[];
  gaps: ProductivityGap[];
  passToken: string;
}

export interface WorkflowAccelerationValidation extends ProductivityValidatorResult {
  passToken: typeof WORKFLOW_ACCELERATION_PASS;
}

export interface ManualWorkReductionValidation extends ProductivityValidatorResult {
  passToken: typeof MANUAL_WORK_REDUCTION_PASS;
}

export interface DecisionReductionValidation extends ProductivityValidatorResult {
  passToken: typeof DECISION_REDUCTION_PASS;
}

export interface ContextSwitchingValidation extends ProductivityValidatorResult {
  passToken: typeof CONTEXT_SWITCHING_PASS;
}

export interface ExecutionEfficiencyValidation extends ProductivityValidatorResult {
  passToken: typeof EXECUTION_EFFICIENCY_PASS;
}

export interface ThroughputValidation extends ProductivityValidatorResult {
  passToken: typeof THROUGHPUT_PASS;
}

export interface WorkflowOverheadValidation extends ProductivityValidatorResult {
  passToken: typeof WORKFLOW_OVERHEAD_PASS;
}

export interface ProductivityGapAnalysis {
  gaps: ProductivityGap[];
  criticalProductivityGaps: ProductivityGap[];
  majorProductivityGaps: ProductivityGap[];
  minorProductivityGaps: ProductivityGap[];
  passToken: typeof PRODUCTIVITY_GAP_ANALYSIS_PASS;
}

export interface FounderProductivityRoadmap {
  criticalProductivityFixes: ProductivityGap[];
  highPriorityProductivityImprovements: ProductivityGap[];
  mediumImprovements: ProductivityGap[];
  futureProductivityOptimization: ProductivityGap[];
  passToken: typeof PRODUCTIVITY_ROADMAP_PASS;
}

export interface FounderProductivityAuthority {
  authorityId: string;
  contexts: ProductivityContext[];
  workflowAcceleration: WorkflowAccelerationValidation;
  manualWorkReduction: ManualWorkReductionValidation;
  decisionReduction: DecisionReductionValidation;
  contextSwitching: ContextSwitchingValidation;
  executionEfficiency: ExecutionEfficiencyValidation;
  throughput: ThroughputValidation;
  workflowOverhead: WorkflowOverheadValidation;
  gapAnalysis: ProductivityGapAnalysis;
  roadmap: FounderProductivityRoadmap;
  founderProductivityScore: number;
  founderProductivityResult: FounderProductivityResult;
  confidence: number;
  createdAt: number;
}

export interface FounderProductivityScore {
  overallScore: number;
  workflowAccelerationScore: number;
  manualWorkReductionScore: number;
  decisionReductionScore: number;
  contextSwitchingScore: number;
  executionEfficiencyScore: number;
  throughputScore: number;
  workflowOverheadScore: number;
}

export interface FounderProductivityRecord {
  founderProductivityId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderProductivityResult: FounderProductivityResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderProductivityEvaluation {
  overallScore: number;
  founderProductivityResult: FounderProductivityResult;
  confidence: number;
  productivityVerdict: string;
  scores: FounderProductivityScore;
  totalGaps: number;
  criticalGaps: number;
}

export interface FounderProductivityReport {
  founderProductivityScore: number;
  founderProductivityResult: FounderProductivityResult;
  workflowAccelerationScore: number;
  manualWorkReductionScore: number;
  decisionReductionScore: number;
  contextSwitchingScore: number;
  executionEfficiencyScore: number;
  throughputScore: number;
  workflowOverheadScore: number;
  detectedProductivityGaps: ProductivityGap[];
  criticalProductivityGaps: ProductivityGap[];
  majorProductivityGaps: ProductivityGap[];
  minorProductivityGaps: ProductivityGap[];
  founderProductivityRoadmap: FounderProductivityRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderProductivityEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_PRODUCTIVITY_REPORTING_PASS;
}

export interface FounderProductivityValidationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  workflowSlow?: boolean;
  manualWorkHigh?: boolean;
  decisionFatigue?: boolean;
  contextSwitchingHigh?: boolean;
  executionInefficient?: boolean;
  throughputLow?: boolean;
  workflowOverheadHigh?: boolean;
  excessiveSteps?: boolean;
  repetitiveWork?: boolean;
  coordinationBurden?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderProductivityResultBundle {
  record: FounderProductivityRecord;
  report: FounderProductivityReport;
  authority: FounderProductivityAuthority;
  result: FounderProductivityResult;
  score: FounderProductivityScore;
}

export interface FounderProductivityRuntimeReport {
  contextBuildCount: number;
  accelerationValidateCount: number;
  manualWorkValidateCount: number;
  decisionValidateCount: number;
  contextSwitchValidateCount: number;
  executionValidateCount: number;
  throughputValidateCount: number;
  overheadValidateCount: number;
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

export const FOUNDER_PRODUCTIVITY_QUESTION_SIGNALS = [
  'founder productivity',
  'productivity validation',
  'workflow acceleration',
  'manual work reduction',
  'throughput productivity',
  'execution efficiency',
] as const;

export function isFounderProductivityQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_PRODUCTIVITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderProductivityResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderProductivityResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
