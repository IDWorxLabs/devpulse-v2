/**
 * Founder Readiness Authority — types and models.
 * Read-only founder readiness evaluation. No UI, execution, or state mutation.
 */

export const FOUNDER_READINESS_AUTHORITY_PASS_TOKEN = 'FOUNDER_READINESS_AUTHORITY_V1_PASS';
export const FOUNDER_READINESS_AUTHORITY_PASS = 'FOUNDER_READINESS_AUTHORITY_PASS';
export const FOUNDER_READINESS_OWNER_MODULE = 'devpulse_v2_founder_readiness_authority';
export const DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE = 128;
export const MAX_READINESS_GAPS = 64;

export const READINESS_CONTEXT_PASS = 'READINESS_CONTEXT_PASS';
export const WORKFLOW_READINESS_PASS = 'WORKFLOW_READINESS_PASS';
export const CONFIDENCE_READINESS_PASS = 'CONFIDENCE_READINESS_PASS';
export const TRUST_READINESS_PASS = 'TRUST_READINESS_PASS';
export const PRODUCTIVITY_READINESS_PASS = 'PRODUCTIVITY_READINESS_PASS';
export const FRICTION_READINESS_PASS = 'FRICTION_READINESS_PASS';
export const READINESS_BLOCKERS_PASS = 'READINESS_BLOCKERS_PASS';
export const READINESS_GAP_ANALYSIS_PASS = 'READINESS_GAP_ANALYSIS_PASS';
export const READINESS_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_READINESS_REPORTING_PASS = 'REPORTING_PASS';

export type FounderReadinessResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type ReadinessGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type FounderReadinessStatus =
  | 'FOUNDER_NOT_READY'
  | 'FOUNDER_PARTIALLY_READY'
  | 'FOUNDER_READY'
  | 'FOUNDER_LAUNCH_READY';

export type ReadinessContextId =
  | 'WORKFLOW_READINESS'
  | 'CONFIDENCE_READINESS'
  | 'TRUST_READINESS'
  | 'PRODUCTIVITY_READINESS'
  | 'FRICTION_READINESS'
  | 'OPERATIONAL_READINESS'
  | 'LAUNCH_READINESS';

export interface ReadinessContext {
  contextId: ReadinessContextId;
  contextName: string;
  readinessIntent: string;
  requiredAuthorities: string[];
  expectedOutcome: string;
  passToken: typeof READINESS_CONTEXT_PASS;
}

export interface ReadinessGap {
  gapId: string;
  title: string;
  description: string;
  severity: ReadinessGapSeverity;
  analysisCode: string;
  sourceAnalyzer: string;
  readinessContext?: ReadinessContextId;
}

export interface ReadinessAnalyzerResult {
  analyzerType: string;
  score: number;
  analysisCodes: string[];
  gaps: ReadinessGap[];
  passToken: string;
}

export interface WorkflowReadinessAnalysis extends ReadinessAnalyzerResult {
  passToken: typeof WORKFLOW_READINESS_PASS;
}

export interface ConfidenceReadinessAnalysis extends ReadinessAnalyzerResult {
  passToken: typeof CONFIDENCE_READINESS_PASS;
}

export interface TrustReadinessAnalysis extends ReadinessAnalyzerResult {
  passToken: typeof TRUST_READINESS_PASS;
}

export interface ProductivityReadinessAnalysis extends ReadinessAnalyzerResult {
  passToken: typeof PRODUCTIVITY_READINESS_PASS;
}

export interface FrictionReadinessAnalysis extends ReadinessAnalyzerResult {
  passToken: typeof FRICTION_READINESS_PASS;
}

export interface ReadinessBlocker {
  blockerId: string;
  title: string;
  description: string;
  severity: ReadinessGapSeverity;
  blockerCode: string;
  sourceAnalyzer: string;
}

export interface ReadinessBlockerAnalysis {
  blockers: ReadinessBlocker[];
  criticalReadinessBlockers: ReadinessBlocker[];
  majorReadinessBlockers: ReadinessBlocker[];
  passToken: typeof READINESS_BLOCKERS_PASS;
}

export interface ReadinessGapAnalysis {
  gaps: ReadinessGap[];
  criticalReadinessGaps: ReadinessGap[];
  majorReadinessGaps: ReadinessGap[];
  minorReadinessGaps: ReadinessGap[];
  passToken: typeof READINESS_GAP_ANALYSIS_PASS;
}

export interface FounderReadinessRoadmap {
  criticalReadinessFixes: ReadinessGap[];
  highPriorityImprovements: ReadinessGap[];
  mediumImprovements: ReadinessGap[];
  futureReadinessOptimization: ReadinessGap[];
  launchPreparation: ReadinessGap[];
  passToken: typeof READINESS_ROADMAP_PASS;
}

export interface FounderReadinessAuthority {
  authorityId: string;
  workflowReadiness: WorkflowReadinessAnalysis;
  confidenceReadiness: ConfidenceReadinessAnalysis;
  trustReadiness: TrustReadinessAnalysis;
  productivityReadiness: ProductivityReadinessAnalysis;
  frictionReadiness: FrictionReadinessAnalysis;
  readinessBlockers: ReadinessBlockerAnalysis;
  gapAnalysis: ReadinessGapAnalysis;
  roadmap: FounderReadinessRoadmap;
  founderReadinessScore: number;
  founderReadinessResult: FounderReadinessResult;
  founderReadinessStatus: FounderReadinessStatus;
  confidence: number;
  createdAt: number;
}

export interface FounderReadinessScore {
  overallScore: number;
  workflowReadinessScore: number;
  confidenceReadinessScore: number;
  trustReadinessScore: number;
  productivityReadinessScore: number;
  frictionReadinessScore: number;
}

export interface FounderReadinessRecord {
  founderReadinessId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderReadinessResult: FounderReadinessResult;
  founderReadinessStatus: FounderReadinessStatus;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderReadinessEvaluation {
  overallScore: number;
  founderReadinessResult: FounderReadinessResult;
  founderReadinessStatus: FounderReadinessStatus;
  confidence: number;
  readinessVerdict: string;
  scores: FounderReadinessScore;
  totalGaps: number;
  criticalGaps: number;
  criticalBlockers: number;
}

export interface FounderReadinessReport {
  founderReadinessScore: number;
  founderReadinessResult: FounderReadinessResult;
  founderReadinessStatus: FounderReadinessStatus;
  workflowReadinessScore: number;
  confidenceReadinessScore: number;
  trustReadinessScore: number;
  productivityReadinessScore: number;
  frictionReadinessScore: number;
  detectedReadinessGaps: ReadinessGap[];
  criticalReadinessGaps: ReadinessGap[];
  majorReadinessGaps: ReadinessGap[];
  minorReadinessGaps: ReadinessGap[];
  readinessBlockers: ReadinessBlocker[];
  criticalReadinessBlockers: ReadinessBlocker[];
  founderReadinessRoadmap: FounderReadinessRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderReadinessEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_READINESS_REPORTING_PASS;
}

export interface FounderReadinessAuthorityInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  workflowNotReady?: boolean;
  confidenceNotReady?: boolean;
  trustNotReady?: boolean;
  productivityNotReady?: boolean;
  frictionBlocking?: boolean;
  launchNotReady?: boolean;
  operationalGaps?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderReadinessResultBundle {
  record: FounderReadinessRecord;
  report: FounderReadinessReport;
  authority: FounderReadinessAuthority;
  result: FounderReadinessResult;
  score: FounderReadinessScore;
  status: FounderReadinessStatus;
}

export interface FounderReadinessRuntimeReport {
  contextBuildCount: number;
  workflowReadinessAnalyzeCount: number;
  confidenceReadinessAnalyzeCount: number;
  trustReadinessAnalyzeCount: number;
  productivityReadinessAnalyzeCount: number;
  frictionReadinessAnalyzeCount: number;
  blockerAnalyzeCount: number;
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

export const FOUNDER_READINESS_QUESTION_SIGNALS = [
  'founder readiness',
  'readiness authority',
  'launch ready',
  'founder ready',
  'operate devpulse',
] as const;

export function isFounderReadinessQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_READINESS_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderReadinessResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderReadinessResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function resolveFounderReadinessStatus(
  overallScore: number,
  criticalGaps: number,
  majorGaps: number,
  launchBlockerCount: number,
  blocked?: boolean,
): FounderReadinessStatus {
  if (blocked === true || criticalGaps > 0 || overallScore < 55) return 'FOUNDER_NOT_READY';
  if (overallScore >= 90 && majorGaps === 0 && launchBlockerCount === 0) return 'FOUNDER_LAUNCH_READY';
  if (overallScore >= 80) return 'FOUNDER_READY';
  return 'FOUNDER_PARTIALLY_READY';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
