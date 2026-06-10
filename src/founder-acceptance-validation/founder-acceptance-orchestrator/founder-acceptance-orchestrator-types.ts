/**
 * Founder Acceptance Orchestrator — types and models.
 * Read-only final founder acceptance verdict. No UI, execution, or state mutation.
 */

export const FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN = 'FOUNDER_ACCEPTANCE_ORCHESTRATOR_V1_PASS';
export const FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS = 'FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS';
export const FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE = 'devpulse_v2_founder_acceptance_orchestrator';
export const DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE = 128;
export const MAX_ACCEPTANCE_GAPS = 64;

export const ACCEPTANCE_AGGREGATION_PASS = 'ACCEPTANCE_AGGREGATION_PASS';
export const AUTHORITY_CONFLICT_PASS = 'AUTHORITY_CONFLICT_PASS';
export const ACCEPTANCE_BLOCKER_PASS = 'ACCEPTANCE_BLOCKER_PASS';
export const FOUNDER_ACCEPTANCE_PASS = 'FOUNDER_ACCEPTANCE_PASS';
export const READINESS_ACCEPTANCE_PASS = 'READINESS_ACCEPTANCE_PASS';
export const FRICTION_ACCEPTANCE_PASS = 'FRICTION_ACCEPTANCE_PASS';
export const ACCEPTANCE_GAP_ANALYSIS_PASS = 'ACCEPTANCE_GAP_ANALYSIS_PASS';
export const FINAL_VERDICT_PASS = 'FINAL_VERDICT_PASS';
export const ACCEPTANCE_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_ACCEPTANCE_REPORTING_PASS = 'REPORTING_PASS';

export type FounderAcceptanceResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type AcceptanceGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FounderAcceptanceVerdict =
  | 'FOUNDER_REJECTS'
  | 'FOUNDER_PARTIALLY_ACCEPTS'
  | 'FOUNDER_ACCEPTS'
  | 'FOUNDER_LAUNCH_ACCEPTS';

export interface AcceptanceGap {
  gapId: string;
  title: string;
  description: string;
  severity: AcceptanceGapSeverity;
  analysisCode: string;
  sourceAnalyzer: string;
}

export interface FounderAcceptanceAggregate {
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  productivityScore: number;
  frictionScore: number;
  readinessScore: number;
  overallAcceptanceScore: number;
  criticalGapCount: number;
  majorGapCount: number;
  minorGapCount: number;
  criticalBlockerCount: number;
  passToken: typeof ACCEPTANCE_AGGREGATION_PASS;
}

export interface AuthorityConflict {
  conflictId: string;
  conflictCode: string;
  conflictReason: string;
  conflictSeverity: ConflictSeverity;
  sourceDetector: string;
}

export interface AuthorityConflictAnalysis {
  conflicts: AuthorityConflict[];
  passToken: typeof AUTHORITY_CONFLICT_PASS;
}

export interface AcceptanceBlocker {
  blockerId: string;
  title: string;
  description: string;
  severity: AcceptanceGapSeverity;
  blockerCode: string;
  sourceAnalyzer: string;
}

export interface AcceptanceBlockerAnalysis {
  blockers: AcceptanceBlocker[];
  criticalAcceptanceBlockers: AcceptanceBlocker[];
  majorAcceptanceBlockers: AcceptanceBlocker[];
  passToken: typeof ACCEPTANCE_BLOCKER_PASS;
}

export interface AcceptanceAnalyzerResult {
  analyzerType: string;
  score: number;
  analysisCodes: string[];
  gaps: AcceptanceGap[];
  passToken: string;
}

export interface FounderAcceptanceAnalysis extends AcceptanceAnalyzerResult {
  passToken: typeof FOUNDER_ACCEPTANCE_PASS;
}

export interface ReadinessAcceptanceAnalysis extends AcceptanceAnalyzerResult {
  passToken: typeof READINESS_ACCEPTANCE_PASS;
}

export interface FrictionAcceptanceImpactAnalysis extends AcceptanceAnalyzerResult {
  passToken: typeof FRICTION_ACCEPTANCE_PASS;
}

export interface AcceptanceGapAnalysis {
  gaps: AcceptanceGap[];
  criticalAcceptanceGaps: AcceptanceGap[];
  majorAcceptanceGaps: AcceptanceGap[];
  minorAcceptanceGaps: AcceptanceGap[];
  passToken: typeof ACCEPTANCE_GAP_ANALYSIS_PASS;
}

export interface FounderAcceptanceRoadmap {
  criticalAcceptanceFixes: AcceptanceGap[];
  highPriorityImprovements: AcceptanceGap[];
  mediumImprovements: AcceptanceGap[];
  futureAcceptanceOptimization: AcceptanceGap[];
  launchAcceptanceTasks: AcceptanceGap[];
  passToken: typeof ACCEPTANCE_ROADMAP_PASS;
}

export interface FinalVerdict {
  verdict: FounderAcceptanceVerdict;
  verdictReason: string;
  passToken: typeof FINAL_VERDICT_PASS;
}

export interface FounderAcceptanceAuthority {
  authorityId: string;
  aggregate: FounderAcceptanceAggregate;
  conflicts: AuthorityConflictAnalysis;
  blockers: AcceptanceBlockerAnalysis;
  founderAcceptance: FounderAcceptanceAnalysis;
  readinessAcceptance: ReadinessAcceptanceAnalysis;
  frictionImpact: FrictionAcceptanceImpactAnalysis;
  gapAnalysis: AcceptanceGapAnalysis;
  roadmap: FounderAcceptanceRoadmap;
  finalVerdict: FinalVerdict;
  founderAcceptanceScore: number;
  founderAcceptanceResult: FounderAcceptanceResult;
  confidence: number;
  createdAt: number;
}

export interface FounderAcceptanceScore {
  overallScore: number;
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  productivityScore: number;
  frictionScore: number;
  readinessScore: number;
}

export interface FounderAcceptanceRecord {
  founderAcceptanceId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderAcceptanceResult: FounderAcceptanceResult;
  founderAcceptanceVerdict: FounderAcceptanceVerdict;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderAcceptanceEvaluation {
  overallScore: number;
  founderAcceptanceResult: FounderAcceptanceResult;
  founderAcceptanceVerdict: FounderAcceptanceVerdict;
  confidence: number;
  acceptanceVerdict: string;
  scores: FounderAcceptanceScore;
  totalGaps: number;
  criticalGaps: number;
  criticalBlockers: number;
  conflictCount: number;
}

export interface FounderAcceptanceReport {
  founderAcceptanceScore: number;
  founderAcceptanceResult: FounderAcceptanceResult;
  founderAcceptanceVerdict: FounderAcceptanceVerdict;
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  productivityScore: number;
  frictionScore: number;
  readinessScore: number;
  detectedAcceptanceGaps: AcceptanceGap[];
  criticalAcceptanceGaps: AcceptanceGap[];
  majorAcceptanceGaps: AcceptanceGap[];
  minorAcceptanceGaps: AcceptanceGap[];
  acceptanceBlockers: AcceptanceBlocker[];
  criticalAcceptanceBlockers: AcceptanceBlocker[];
  authorityConflicts: AuthorityConflict[];
  founderAcceptanceRoadmap: FounderAcceptanceRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderAcceptanceEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_ACCEPTANCE_REPORTING_PASS;
}

export interface FounderAcceptanceOrchestratorInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  workflowWeak?: boolean;
  confidenceWeak?: boolean;
  trustWeak?: boolean;
  productivityWeak?: boolean;
  frictionExcessive?: boolean;
  readinessLow?: boolean;
  launchBlocked?: boolean;
  adoptionBlocked?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderAcceptanceResultBundle {
  record: FounderAcceptanceRecord;
  report: FounderAcceptanceReport;
  authority: FounderAcceptanceAuthority;
  result: FounderAcceptanceResult;
  score: FounderAcceptanceScore;
  verdict: FounderAcceptanceVerdict;
}

export interface FounderAcceptanceRuntimeReport {
  aggregateBuildCount: number;
  conflictDetectCount: number;
  blockerAnalyzeCount: number;
  founderAcceptanceAnalyzeCount: number;
  readinessAcceptanceAnalyzeCount: number;
  frictionImpactAnalyzeCount: number;
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
  upstreamChainReuseCount: number;
  sourceTextCacheHits: number;
}

export const FOUNDER_ACCEPTANCE_QUESTION_SIGNALS = [
  'founder acceptance',
  'acceptance orchestrator',
  'would founder accept',
  'genuinely accept',
  'founder rejects',
] as const;

export function isFounderAcceptanceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_ACCEPTANCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderAcceptanceResult(
  overallScore: number,
  criticalGaps: number,
  criticalBlockers: number,
  blocked?: boolean,
): FounderAcceptanceResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || criticalBlockers > 0 || overallScore < 55) return 'FAIL';
  if (overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function resolveFounderAcceptanceVerdict(
  overallScore: number,
  criticalGaps: number,
  criticalBlockers: number,
  majorGaps: number,
  launchBlockerCount: number,
  readinessStatus: string,
  blocked?: boolean,
): FounderAcceptanceVerdict {
  if (blocked === true || criticalGaps > 0 || criticalBlockers > 0 || overallScore < 55) {
    return 'FOUNDER_REJECTS';
  }
  if (
    overallScore >= 90
    && majorGaps === 0
    && launchBlockerCount === 0
    && readinessStatus === 'FOUNDER_LAUNCH_READY'
  ) {
    return 'FOUNDER_LAUNCH_ACCEPTS';
  }
  if (overallScore >= 80) return 'FOUNDER_ACCEPTS';
  return 'FOUNDER_PARTIALLY_ACCEPTS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
