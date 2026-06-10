/**
 * Founder Friction Detector — types and models.
 * Read-only founder friction detection. No UI, execution, or state mutation.
 */

export const FOUNDER_FRICTION_DETECTOR_PASS_TOKEN = 'FOUNDER_FRICTION_DETECTOR_V1_PASS';
export const FOUNDER_FRICTION_DETECTOR_PASS = 'FOUNDER_FRICTION_DETECTOR_PASS';
export const FOUNDER_FRICTION_OWNER_MODULE = 'devpulse_v2_founder_friction_detector';
export const DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE = 128;
export const MAX_FRICTION_GAPS = 64;

export const FRICTION_CONTEXT_PASS = 'FRICTION_CONTEXT_PASS';
export const CONFUSION_FRICTION_PASS = 'CONFUSION_FRICTION_PASS';
export const WORKFLOW_FRICTION_PASS = 'WORKFLOW_FRICTION_PASS';
export const DECISION_FATIGUE_PASS = 'DECISION_FATIGUE_PASS';
export const CONTEXT_SWITCHING_PASS = 'CONTEXT_SWITCHING_PASS';
export const DISCOVERABILITY_FRICTION_PASS = 'DISCOVERABILITY_FRICTION_PASS';
export const TRUST_BREAKDOWN_PASS = 'TRUST_BREAKDOWN_PASS';
export const CONFIDENCE_BREAKDOWN_PASS = 'CONFIDENCE_BREAKDOWN_PASS';
export const PRODUCTIVITY_FRICTION_PASS = 'PRODUCTIVITY_FRICTION_PASS';
export const VERIFICATION_FRICTION_PASS = 'VERIFICATION_FRICTION_PASS';
export const LAUNCH_FRICTION_PASS = 'LAUNCH_FRICTION_PASS';
export const FRICTION_GAP_ANALYSIS_PASS = 'FRICTION_GAP_ANALYSIS_PASS';
export const FRICTION_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_FRICTION_REPORTING_PASS = 'REPORTING_PASS';

export type FounderFrictionResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type FrictionGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type FrictionContextId =
  | 'CONFUSION_FRICTION'
  | 'WORKFLOW_FRICTION'
  | 'DECISION_FATIGUE'
  | 'CONTEXT_SWITCHING_FRICTION'
  | 'DISCOVERABILITY_FRICTION'
  | 'TRUST_BREAKDOWN_FRICTION'
  | 'CONFIDENCE_BREAKDOWN_FRICTION'
  | 'PRODUCTIVITY_FRICTION'
  | 'VERIFICATION_FRICTION'
  | 'LAUNCH_FRICTION';

export interface FrictionContext {
  contextId: FrictionContextId;
  contextName: string;
  frictionIntent: string;
  expectedNegativeSignal: string;
  requiredEvidence: string[];
  passToken: typeof FRICTION_CONTEXT_PASS;
}

export interface FrictionGap {
  gapId: string;
  title: string;
  description: string;
  severity: FrictionGapSeverity;
  detectionCode: string;
  sourceDetector: string;
  frictionContext?: FrictionContextId;
}

export interface FrictionDetectorResult {
  detectorType: string;
  score: number;
  detectionCodes: string[];
  gaps: FrictionGap[];
  passToken: string;
}

export interface ConfusionFrictionDetection extends FrictionDetectorResult {
  passToken: typeof CONFUSION_FRICTION_PASS;
}

export interface WorkflowFrictionDetection extends FrictionDetectorResult {
  passToken: typeof WORKFLOW_FRICTION_PASS;
}

export interface DecisionFatigueDetection extends FrictionDetectorResult {
  passToken: typeof DECISION_FATIGUE_PASS;
}

export interface ContextSwitchingFrictionDetection extends FrictionDetectorResult {
  passToken: typeof CONTEXT_SWITCHING_PASS;
}

export interface DiscoverabilityFrictionDetection extends FrictionDetectorResult {
  passToken: typeof DISCOVERABILITY_FRICTION_PASS;
}

export interface TrustBreakdownDetection extends FrictionDetectorResult {
  passToken: typeof TRUST_BREAKDOWN_PASS;
}

export interface ConfidenceBreakdownDetection extends FrictionDetectorResult {
  passToken: typeof CONFIDENCE_BREAKDOWN_PASS;
}

export interface ProductivityFrictionDetection extends FrictionDetectorResult {
  passToken: typeof PRODUCTIVITY_FRICTION_PASS;
}

export interface VerificationFrictionDetection extends FrictionDetectorResult {
  passToken: typeof VERIFICATION_FRICTION_PASS;
}

export interface LaunchFrictionDetection extends FrictionDetectorResult {
  passToken: typeof LAUNCH_FRICTION_PASS;
}

export interface FrictionGapAnalysis {
  gaps: FrictionGap[];
  criticalFrictionGaps: FrictionGap[];
  majorFrictionGaps: FrictionGap[];
  minorFrictionGaps: FrictionGap[];
  passToken: typeof FRICTION_GAP_ANALYSIS_PASS;
}

export interface FounderFrictionRoadmap {
  criticalFrictionRemoval: FrictionGap[];
  highPriorityImprovements: FrictionGap[];
  mediumImprovements: FrictionGap[];
  futureOptimization: FrictionGap[];
  passToken: typeof FRICTION_ROADMAP_PASS;
}

export interface FounderFrictionAuthority {
  authorityId: string;
  contexts: FrictionContext[];
  confusionFriction: ConfusionFrictionDetection;
  workflowFriction: WorkflowFrictionDetection;
  decisionFatigue: DecisionFatigueDetection;
  contextSwitching: ContextSwitchingFrictionDetection;
  discoverability: DiscoverabilityFrictionDetection;
  trustBreakdowns: TrustBreakdownDetection;
  confidenceBreakdowns: ConfidenceBreakdownDetection;
  productivityBlockers: ProductivityFrictionDetection;
  verificationFriction: VerificationFrictionDetection;
  launchFriction: LaunchFrictionDetection;
  gapAnalysis: FrictionGapAnalysis;
  roadmap: FounderFrictionRoadmap;
  founderFrictionScore: number;
  founderFrictionResult: FounderFrictionResult;
  confidence: number;
  createdAt: number;
}

export interface FounderFrictionScore {
  overallScore: number;
  confusionFrictionScore: number;
  workflowFrictionScore: number;
  decisionFatigueScore: number;
  contextSwitchingScore: number;
  discoverabilityScore: number;
  trustBreakdownScore: number;
  confidenceBreakdownScore: number;
  productivityFrictionScore: number;
  verificationFrictionScore: number;
  launchFrictionScore: number;
}

export interface FounderFrictionRecord {
  founderFrictionId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderFrictionResult: FounderFrictionResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderFrictionEvaluation {
  overallScore: number;
  founderFrictionResult: FounderFrictionResult;
  confidence: number;
  frictionVerdict: string;
  scores: FounderFrictionScore;
  totalGaps: number;
  criticalGaps: number;
}

export interface FounderFrictionReport {
  founderFrictionScore: number;
  founderFrictionResult: FounderFrictionResult;
  confusionFrictionScore: number;
  workflowFrictionScore: number;
  decisionFatigueScore: number;
  contextSwitchingScore: number;
  discoverabilityScore: number;
  trustBreakdownScore: number;
  confidenceBreakdownScore: number;
  productivityFrictionScore: number;
  verificationFrictionScore: number;
  launchFrictionScore: number;
  detectedFrictionGaps: FrictionGap[];
  criticalFrictionGaps: FrictionGap[];
  majorFrictionGaps: FrictionGap[];
  minorFrictionGaps: FrictionGap[];
  founderFrictionRoadmap: FounderFrictionRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderFrictionEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_FRICTION_REPORTING_PASS;
}

export interface FounderFrictionDetectorInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  confusionHigh?: boolean;
  workflowDeadEnd?: boolean;
  workflowLoop?: boolean;
  decisionFatigueHigh?: boolean;
  contextSwitchingHigh?: boolean;
  hiddenCapabilities?: boolean;
  trustBreakdown?: boolean;
  confidenceBreakdown?: boolean;
  productivityBlocked?: boolean;
  verificationConfusing?: boolean;
  launchBlocked?: boolean;
  excessiveSteps?: boolean;
  navigationConfusion?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderFrictionResultBundle {
  record: FounderFrictionRecord;
  report: FounderFrictionReport;
  authority: FounderFrictionAuthority;
  result: FounderFrictionResult;
  score: FounderFrictionScore;
}

export interface FounderFrictionRuntimeReport {
  contextBuildCount: number;
  confusionDetectCount: number;
  workflowFrictionDetectCount: number;
  decisionFatigueDetectCount: number;
  contextSwitchDetectCount: number;
  discoverabilityDetectCount: number;
  trustBreakdownDetectCount: number;
  confidenceBreakdownDetectCount: number;
  productivityBlockerDetectCount: number;
  verificationFrictionDetectCount: number;
  launchFrictionDetectCount: number;
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

export const FOUNDER_FRICTION_QUESTION_SIGNALS = [
  'founder friction',
  'friction detector',
  'what is blocking',
  'decision fatigue',
  'workflow dead end',
  'launch blocker',
] as const;

export function isFounderFrictionQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_FRICTION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderFrictionResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderFrictionResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
