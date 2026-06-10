/**
 * Product Reality Orchestrator — types and models.
 * Read-only final authority. No UI, copy, execution, or state mutation.
 */

export const PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN = 'PRODUCT_REALITY_ORCHESTRATOR_V1_PASS';
export const PRODUCT_REALITY_ORCHESTRATOR_PASS = 'PRODUCT_REALITY_ORCHESTRATOR_PASS';
export const PRODUCT_REALITY_OWNER_MODULE = 'devpulse_v2_product_reality_orchestrator';
export const DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE = 128;
export const MAX_LAUNCH_BLOCKERS = 48;
export const MAX_AUTHORITY_CONFLICTS = 24;
export const MAX_FOUNDER_PRIORITIES = 32;

export const PRODUCT_REALITY_AGGREGATE_PASS = 'PRODUCT_REALITY_AGGREGATE_PASS';
export const PRODUCT_REALITY_AUTHORITY_PASS = 'PRODUCT_REALITY_AUTHORITY_PASS';
export const PRODUCT_REALITY_SCORING_PASS = 'PRODUCT_REALITY_SCORING_PASS';
export const PRODUCT_REALITY_VERDICT_PASS = 'PRODUCT_REALITY_VERDICT_PASS';
export const PRODUCT_REALITY_REPORTING_PASS = 'REPORTING_PASS';
export const PRODUCT_REALITY_ROADMAP_PASS = 'ROADMAP_PASS';
export const CONFLICT_DETECTION_PASS = 'CONFLICT_DETECTION_PASS';
export const BLOCKER_ANALYSIS_PASS = 'BLOCKER_ANALYSIS_PASS';
export const RELEASE_READINESS_PASS = 'RELEASE_READINESS_PASS';
export const FOUNDER_PRIORITY_PASS = 'FOUNDER_PRIORITY_PASS';

export type ProductRealityVerdict =
  | 'PRODUCT_NOT_READY'
  | 'PRODUCT_PARTIALLY_READY'
  | 'PRODUCT_READY'
  | 'PRODUCT_LAUNCH_READY';

export type ReleaseReadiness = 'NOT_READY' | 'PARTIALLY_READY' | 'READY';
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BlockerSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'FUTURE' | 'LAUNCH';

export interface ResponsiveRealityReport {
  overallScore: number;
  mobileScore: number;
  desktopScore: number;
  tabletScore: number;
  responsivePreviewScore: number;
  mobileNavPresent: boolean;
  derivedFrom: 'VISUAL_QA_AND_LIVE_PREVIEW';
}

export interface UpstreamReportBundle {
  visualQa: import('../visual-qa-engine/visual-qa-types.js').VisualQAReport;
  responsiveReality: ResponsiveRealityReport;
  uxHeuristics: import('../ux-heuristic-evaluator/ux-heuristic-types.js').UXHeuristicReport;
  firstImpression: import('../first-impression-judge/first-impression-types.js').FirstImpressionReport;
  livePreview: import('../live-preview-gatekeeper/live-preview-types.js').LivePreviewReport;
  autoPolish: import('../auto-polish-loop/auto-polish-types.js').AutoPolishReport;
  productExperience: import('../product-experience-verification-engine/product-experience-types.js').ProductExperienceReport;
}

export interface ProductRealityAggregate {
  overallExperienceScore: number;
  visualScore: number;
  responsiveScore: number;
  usabilityScore: number;
  firstImpressionScore: number;
  previewScore: number;
  polishScore: number;
  experienceScore: number;
  launchReadinessScore: number;
  trustScore: number;
  continuityScore: number;
  coherenceScore: number;
  criticalIssueCount: number;
  majorIssueCount: number;
  minorIssueCount: number;
  passToken: typeof PRODUCT_REALITY_AGGREGATE_PASS;
}

export interface AuthorityConflict {
  conflictId: string;
  subsystemA: string;
  subsystemB: string;
  conflictSeverity: ConflictSeverity;
  conflictExplanation: string;
  detectionCode: string;
}

export interface ConflictDetectionResult {
  conflicts: AuthorityConflict[];
  passToken: typeof CONFLICT_DETECTION_PASS;
}

export interface LaunchBlocker {
  blockerId: string;
  blockerCode: string;
  blockerReason: string;
  blockerSeverity: BlockerSeverity;
  sourceSubsystem: string;
}

export interface BlockerAnalysisResult {
  blockers: LaunchBlocker[];
  criticalBlockers: LaunchBlocker[];
  passToken: typeof BLOCKER_ANALYSIS_PASS;
}

export interface ReleaseReadinessResult {
  releaseReadiness: ReleaseReadiness;
  readinessScore: number;
  readinessExplanation: string;
  passToken: typeof RELEASE_READINESS_PASS;
}

export interface FounderPriority {
  priorityId: string;
  title: string;
  description: string;
  expectedImpact: number;
  estimatedConfidenceGain: number;
  estimatedProductGain: number;
  sourceSubsystem: string;
  tier: PriorityTier;
}

export interface FounderPriorityResult {
  priorities: FounderPriority[];
  passToken: typeof FOUNDER_PRIORITY_PASS;
}

export interface ProductRealityRoadmap {
  critical: FounderPriority[];
  highPriority: FounderPriority[];
  mediumPriority: FounderPriority[];
  futurePolish: FounderPriority[];
  launchTasks: FounderPriority[];
  passToken: typeof PRODUCT_REALITY_ROADMAP_PASS;
}

export interface ProductRealityAuthority {
  authorityId: string;
  aggregate: ProductRealityAggregate;
  conflicts: AuthorityConflict[];
  blockers: LaunchBlocker[];
  founderPriorities: FounderPriority[];
  roadmap: ProductRealityRoadmap;
  releaseReadiness: ReleaseReadiness;
  overallVerdict: ProductRealityVerdict;
  confidence: number;
  createdAt: number;
  passToken: typeof PRODUCT_REALITY_AUTHORITY_PASS;
}

export interface ProductRealityScore {
  overallScore: number;
  dimensionScores: ProductRealityAggregate;
  passToken: typeof PRODUCT_REALITY_SCORING_PASS;
}

export interface ProductRealityResult {
  productRealityVerdict: ProductRealityVerdict;
  releaseReadiness: ReleaseReadiness;
  overallScore: number;
  confidence: number;
  criticalBlockerCount: number;
  conflictCount: number;
  passToken: typeof PRODUCT_REALITY_VERDICT_PASS;
}

export interface ProductRealityRecord {
  productRealityId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  productRealityVerdict: ProductRealityVerdict;
  releaseReadiness: ReleaseReadiness;
  criticalBlockerCount: number;
  confidence: number;
  generatedAt: number;
}

export interface ProductRealityEvaluation {
  overallScore: number;
  productRealityVerdict: ProductRealityVerdict;
  releaseReadiness: ReleaseReadiness;
  confidence: number;
  realityVerdict: string;
  aggregate: ProductRealityAggregate;
  criticalBlockerCount: number;
  conflictCount: number;
}

export interface ProductRealityHistoryEntry {
  productRealityId: string;
  overallScore: number;
  productRealityVerdict: ProductRealityVerdict;
  recordedAt: number;
}

export interface ProductRealityReport {
  productRealityScore: number;
  productRealityVerdict: ProductRealityVerdict;
  releaseReadiness: ReleaseReadiness;
  aggregate: ProductRealityAggregate;
  authorityConflicts: AuthorityConflict[];
  launchBlockers: LaunchBlocker[];
  founderPriorities: FounderPriority[];
  productRealityRoadmap: ProductRealityRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: ProductRealityEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof PRODUCT_REALITY_REPORTING_PASS;
}

export interface ProductRealityInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  visualWeak?: boolean;
  responsiveWeak?: boolean;
  uxFriction?: boolean;
  firstImpressionWeak?: boolean;
  previewDisconnected?: boolean;
  polishGaps?: boolean;
  experienceFragmented?: boolean;
  workflowBroken?: boolean;
  trustGap?: boolean;
  navigationDeadEnd?: boolean;
  verificationSilo?: boolean;
  governanceBlocked?: boolean;
}

export interface ProductRealityResultBundle {
  record: ProductRealityRecord;
  report: ProductRealityReport;
  authority: ProductRealityAuthority;
  result: ProductRealityResult;
  score: ProductRealityScore;
}

export interface ProductRealityRuntimeReport {
  aggregateBuildCount: number;
  conflictDetectionCount: number;
  blockerAnalysisCount: number;
  releaseReadinessCount: number;
  founderPriorityCount: number;
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

export const PRODUCT_REALITY_QUESTION_SIGNALS = [
  'product reality',
  'launch ready',
  'release readiness',
  'product verdict',
  'is devpulse ready',
  'product coherence',
  'founder priority',
] as const;

export function isProductRealityQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PRODUCT_REALITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveProductRealityVerdict(
  overallScore: number,
  criticalBlockers: number,
  conflicts: number,
  releaseReadiness: ReleaseReadiness,
  blocked?: boolean,
): ProductRealityVerdict {
  if (blocked === true || criticalBlockers > 0 || overallScore < 55) return 'PRODUCT_NOT_READY';
  if (releaseReadiness === 'READY' && overallScore >= 85 && conflicts === 0) return 'PRODUCT_LAUNCH_READY';
  if (overallScore >= 80 && releaseReadiness !== 'NOT_READY') return 'PRODUCT_READY';
  if (overallScore >= 55 || releaseReadiness === 'PARTIALLY_READY') return 'PRODUCT_PARTIALLY_READY';
  return 'PRODUCT_NOT_READY';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
