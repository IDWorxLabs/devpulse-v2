/**
 * Auto-Polish Loop — types and models.
 * Read-only polish evaluation. No UI, CSS, copy mutation, or automatic fixes.
 */

export const AUTO_POLISH_LOOP_PASS_TOKEN = 'AUTO_POLISH_LOOP_V1_PASS';
export const AUTO_POLISH_LOOP_PASS = 'AUTO_POLISH_LOOP_PASS';
export const AUTO_POLISH_LOOP_OWNER_MODULE = 'devpulse_v2_auto_polish_loop';
export const DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE = 128;
export const MAX_POLISH_OPPORTUNITIES = 64;

export const VISUAL_POLISH_PASS = 'VISUAL_POLISH_PASS';
export const UX_POLISH_PASS = 'UX_POLISH_PASS';
export const RESPONSIVE_POLISH_PASS = 'RESPONSIVE_POLISH_PASS';
export const PREVIEW_POLISH_PASS = 'PREVIEW_POLISH_PASS';
export const DISCOVERABILITY_POLISH_PASS = 'DISCOVERABILITY_POLISH_PASS';
export const FOUNDER_USABILITY_POLISH_PASS = 'FOUNDER_USABILITY_POLISH_PASS';
export const TRUST_POLISH_PASS = 'TRUST_POLISH_PASS';
export const INTELLIGENCE_VISIBILITY_POLISH_PASS = 'INTELLIGENCE_VISIBILITY_POLISH_PASS';
export const WORKFLOW_POLISH_PASS = 'WORKFLOW_POLISH_PASS';
export const PRODUCT_COHERENCE_POLISH_PASS = 'PRODUCT_COHERENCE_POLISH_PASS';
export const POLISH_PRIORITY_PASS = 'POLISH_PRIORITY_PASS';
export const POLISH_ROADMAP_PASS = 'POLISH_ROADMAP_PASS';
export const AUTO_POLISH_REPORTING_PASS = 'REPORTING_PASS';

export type AutoPolishResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PolishPriority = 1 | 2 | 3 | 4;

export type PolishCategory =
  | 'VISUAL'
  | 'UX'
  | 'RESPONSIVE'
  | 'PREVIEW'
  | 'DISCOVERABILITY'
  | 'FOUNDER_USABILITY'
  | 'TRUST'
  | 'INTELLIGENCE_VISIBILITY'
  | 'WORKFLOW'
  | 'PRODUCT_COHERENCE';

export interface PolishOpportunity {
  opportunityId: string;
  category: PolishCategory;
  title: string;
  description: string;
  impactLevel: ImpactLevel;
  founderImpact: number;
  userImpact: number;
  effortEstimate: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: number;
  sourceAnalyzer: string;
  recommendedPriority: PolishPriority;
  detectionCode: string;
}

export interface AutoPolishRecord {
  autoPolishId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  autoPolishResult: AutoPolishResult;
  totalOpportunities: number;
  criticalOpportunities: number;
  confidence: number;
  generatedAt: number;
}

export interface CategoryPolishAnalysis {
  polishScore: number;
  opportunities: PolishOpportunity[];
  passToken: string;
}

export interface VisualPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof VISUAL_POLISH_PASS;
}

export interface UXPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof UX_POLISH_PASS;
}

export interface ResponsivePolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof RESPONSIVE_POLISH_PASS;
}

export interface PreviewPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof PREVIEW_POLISH_PASS;
}

export interface DiscoverabilityPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof DISCOVERABILITY_POLISH_PASS;
}

export interface FounderUsabilityPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof FOUNDER_USABILITY_POLISH_PASS;
}

export interface TrustPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof TRUST_POLISH_PASS;
}

export interface IntelligenceVisibilityPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof INTELLIGENCE_VISIBILITY_POLISH_PASS;
}

export interface WorkflowPolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof WORKFLOW_POLISH_PASS;
}

export interface ProductCoherencePolishAnalysis extends CategoryPolishAnalysis {
  passToken: typeof PRODUCT_COHERENCE_POLISH_PASS;
}

export interface PolishPriorityAnalysis {
  priority1: PolishOpportunity[];
  priority2: PolishOpportunity[];
  priority3: PolishOpportunity[];
  priority4: PolishOpportunity[];
  launchBlockers: PolishOpportunity[];
  passToken: typeof POLISH_PRIORITY_PASS;
}

export interface PolishRoadmap {
  criticalBeforeLaunch: PolishOpportunity[];
  highImpactImprovements: PolishOpportunity[];
  qualityImprovements: PolishOpportunity[];
  optionalFutureImprovements: PolishOpportunity[];
  passToken: typeof POLISH_ROADMAP_PASS;
}

export interface AutoPolishAuthority {
  authorityId: string;
  overallScore: number;
  visualPolishScore: number;
  uxPolishScore: number;
  responsivePolishScore: number;
  previewPolishScore: number;
  discoverabilityScore: number;
  founderUsabilityScore: number;
  trustScore: number;
  intelligenceVisibilityScore: number;
  workflowScore: number;
  productCoherenceScore: number;
  totalOpportunities: number;
  criticalOpportunities: number;
  allOpportunities: PolishOpportunity[];
  autoPolishResult: AutoPolishResult;
  confidence: number;
  createdAt: number;
}

export interface AutoPolishEvaluation {
  overallScore: number;
  autoPolishResult: AutoPolishResult;
  confidence: number;
  polishVerdict: string;
  visualPolishScore: number;
  uxPolishScore: number;
  responsivePolishScore: number;
  previewPolishScore: number;
  discoverabilityScore: number;
  founderUsabilityScore: number;
  trustScore: number;
  intelligenceVisibilityScore: number;
  workflowScore: number;
  productCoherenceScore: number;
  totalOpportunities: number;
  criticalOpportunities: number;
}

export interface AutoPolishHistoryEntry {
  autoPolishId: string;
  overallScore: number;
  autoPolishResult: AutoPolishResult;
  recordedAt: number;
}

export interface AutoPolishReport {
  overallScore: number;
  visualPolishScore: number;
  uxPolishScore: number;
  responsivePolishScore: number;
  previewPolishScore: number;
  discoverabilityScore: number;
  founderUsabilityScore: number;
  trustScore: number;
  intelligenceVisibilityScore: number;
  workflowScore: number;
  productCoherenceScore: number;
  autoPolishResult: AutoPolishResult;
  totalOpportunities: number;
  criticalOpportunities: number;
  priority1Opportunities: PolishOpportunity[];
  priority2Opportunities: PolishOpportunity[];
  priority3Opportunities: PolishOpportunity[];
  priority4Opportunities: PolishOpportunity[];
  launchBlockers: PolishOpportunity[];
  polishRoadmap: PolishRoadmap;
  recommendedNextImprovements: string[];
  evaluation: AutoPolishEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof AUTO_POLISH_REPORTING_PASS;
}

export interface AutoPolishInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  visualHierarchyWeak?: boolean;
  spacingInconsistent?: boolean;
  typographyWeak?: boolean;
  visualClutter?: boolean;
  navigationConfusion?: boolean;
  actionClarityWeak?: boolean;
  feedbackWeak?: boolean;
  mobilePolishWeak?: boolean;
  tabletPolishWeak?: boolean;
  desktopPolishWeak?: boolean;
  previewClarityWeak?: boolean;
  previewDiscoverabilityWeak?: boolean;
  chatHidden?: boolean;
  operatorFeedHidden?: boolean;
  world2Hidden?: boolean;
  founderFriction?: boolean;
  trustGap?: boolean;
  intelligenceHidden?: boolean;
  workflowBreak?: boolean;
  productFragmented?: boolean;
  governanceBlocked?: boolean;
}

export interface AutoPolishResultBundle {
  record: AutoPolishRecord;
  report: AutoPolishReport;
  authority: AutoPolishAuthority;
}

export interface AutoPolishRuntimeReport {
  visualPolishAnalysisCount: number;
  uxPolishAnalysisCount: number;
  responsivePolishAnalysisCount: number;
  previewPolishAnalysisCount: number;
  discoverabilityPolishAnalysisCount: number;
  founderUsabilityPolishAnalysisCount: number;
  trustPolishAnalysisCount: number;
  intelligenceVisibilityPolishAnalysisCount: number;
  workflowPolishAnalysisCount: number;
  productCoherencePolishAnalysisCount: number;
  priorityAnalysisCount: number;
  roadmapBuildCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const AUTO_POLISH_QUESTION_SIGNALS = [
  'auto polish',
  'polish roadmap',
  'polish opportunities',
  'production quality',
  'what should be polished',
  'launch blockers',
] as const;

export function isAutoPolishQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return AUTO_POLISH_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveAutoPolishResult(
  overallScore: number,
  criticalOpportunities: number,
  warningCount: number,
  blocked?: boolean,
): AutoPolishResult {
  if (blocked === true) return 'FAIL';
  if (criticalOpportunities > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
