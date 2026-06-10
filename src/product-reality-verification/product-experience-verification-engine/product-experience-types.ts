/**
 * Product Experience Verification Engine — types and models.
 * Read-only product experience authority. No UI, copy, execution, or state mutation.
 */

export const PRODUCT_EXPERIENCE_ENGINE_PASS_TOKEN = 'PRODUCT_EXPERIENCE_ENGINE_V1_PASS';
export const PRODUCT_EXPERIENCE_ENGINE_PASS = 'PRODUCT_EXPERIENCE_ENGINE_PASS';
export const PRODUCT_EXPERIENCE_OWNER_MODULE = 'devpulse_v2_product_experience_verification_engine';
export const DEFAULT_MAX_PRODUCT_EXPERIENCE_HISTORY_SIZE = 128;
export const MAX_EXPERIENCE_GAPS = 64;

export const EXPERIENCE_CONTEXT_PASS = 'EXPERIENCE_CONTEXT_PASS';
export const PRODUCT_COHERENCE_PASS = 'PRODUCT_COHERENCE_PASS';
export const EXPERIENCE_CONTINUITY_PASS = 'EXPERIENCE_CONTINUITY_PASS';
export const INTELLIGENCE_CONTINUITY_PASS = 'INTELLIGENCE_CONTINUITY_PASS';
export const WORKFLOW_CONTINUITY_PASS = 'WORKFLOW_CONTINUITY_PASS';
export const NAVIGATION_CONTINUITY_PASS = 'NAVIGATION_CONTINUITY_PASS';
export const VERIFICATION_CONTINUITY_PASS = 'VERIFICATION_CONTINUITY_PASS';
export const FOUNDER_EXPERIENCE_PASS = 'FOUNDER_EXPERIENCE_PASS';
export const TRUST_CONTINUITY_PASS = 'TRUST_CONTINUITY_PASS';
export const PRODUCT_IDENTITY_CONTINUITY_PASS = 'PRODUCT_IDENTITY_CONTINUITY_PASS';
export const LAUNCH_READINESS_CONTINUITY_PASS = 'LAUNCH_READINESS_CONTINUITY_PASS';
export const EXPERIENCE_GAP_ANALYSIS_PASS = 'EXPERIENCE_GAP_ANALYSIS_PASS';
export const EXPERIENCE_ROADMAP_PASS = 'ROADMAP_PASS';
export const PRODUCT_EXPERIENCE_REPORTING_PASS = 'REPORTING_PASS';

export type ProductExperienceResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type ExperienceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LaunchReadinessLevel = 'FOUNDER_ALPHA' | 'FOUNDER_BETA' | 'PUBLIC_BETA' | 'PRODUCTION';

export type ExperienceContextType =
  | 'FOUNDER_DAILY_USE'
  | 'FIRST_TIME_USER'
  | 'VERIFICATION_WORKFLOW'
  | 'PROJECT_BUILD_WORKFLOW'
  | 'PRODUCT_REVIEW_WORKFLOW'
  | 'MOBILE_USAGE_WORKFLOW'
  | 'DESKTOP_USAGE_WORKFLOW';

export interface ExperienceContext {
  contextType: ExperienceContextType;
  expectedGoals: string[];
  expectedActions: string[];
  expectedTransitions: string[];
  expectedTrustSignals: string[];
  expectedIntelligenceVisibility: string[];
  expectedSuccessOutcomes: string[];
  passToken: typeof EXPERIENCE_CONTEXT_PASS;
}

export interface ExperienceGap {
  gapId: string;
  title: string;
  description: string;
  severity: ExperienceSeverity;
  detectionCode: string;
  sourceVerifier: string;
  connectedSystems: string[];
}

export interface VerifierContinuityResult {
  continuityScore: number;
  detectionCodes: string[];
  gaps: ExperienceGap[];
  passToken: string;
}

export interface ProductCoherenceVerification extends VerifierContinuityResult {
  passToken: typeof PRODUCT_COHERENCE_PASS;
}

export interface ExperienceContinuityVerification extends VerifierContinuityResult {
  passToken: typeof EXPERIENCE_CONTINUITY_PASS;
}

export interface IntelligenceContinuityVerification extends VerifierContinuityResult {
  passToken: typeof INTELLIGENCE_CONTINUITY_PASS;
}

export interface WorkflowContinuityVerification extends VerifierContinuityResult {
  passToken: typeof WORKFLOW_CONTINUITY_PASS;
}

export interface NavigationContinuityVerification extends VerifierContinuityResult {
  passToken: typeof NAVIGATION_CONTINUITY_PASS;
}

export interface VerificationContinuityVerification extends VerifierContinuityResult {
  passToken: typeof VERIFICATION_CONTINUITY_PASS;
}

export interface FounderExperienceVerification extends VerifierContinuityResult {
  passToken: typeof FOUNDER_EXPERIENCE_PASS;
}

export interface TrustContinuityVerification extends VerifierContinuityResult {
  passToken: typeof TRUST_CONTINUITY_PASS;
}

export interface ProductIdentityContinuityVerification extends VerifierContinuityResult {
  passToken: typeof PRODUCT_IDENTITY_CONTINUITY_PASS;
}

export interface LaunchReadinessContinuityVerification extends VerifierContinuityResult {
  passToken: typeof LAUNCH_READINESS_CONTINUITY_PASS;
  readinessLevel: LaunchReadinessLevel;
}

export interface ExperienceGapAnalysis {
  gaps: ExperienceGap[];
  criticalGaps: ExperienceGap[];
  crossSystemDisconnections: string[];
  passToken: typeof EXPERIENCE_GAP_ANALYSIS_PASS;
}

export interface ProductExperienceRoadmap {
  criticalExperienceFixes: ExperienceGap[];
  highImpactImprovements: ExperienceGap[];
  productCoherenceImprovements: ExperienceGap[];
  launchReadinessImprovements: ExperienceGap[];
  futureEnhancements: ExperienceGap[];
  passToken: typeof EXPERIENCE_ROADMAP_PASS;
}

export interface ProductExperienceAuthority {
  authorityId: string;
  overallScore: number;
  productCoherenceScore: number;
  experienceContinuityScore: number;
  intelligenceContinuityScore: number;
  workflowContinuityScore: number;
  navigationContinuityScore: number;
  verificationContinuityScore: number;
  founderExperienceScore: number;
  trustContinuityScore: number;
  productIdentityScore: number;
  launchReadinessScore: number;
  readinessLevel: LaunchReadinessLevel;
  totalGaps: number;
  criticalGaps: number;
  allGaps: ExperienceGap[];
  productExperienceResult: ProductExperienceResult;
  confidence: number;
  createdAt: number;
}

export interface ProductExperienceRecord {
  productExperienceId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  productExperienceResult: ProductExperienceResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface ProductExperienceEvaluation {
  overallScore: number;
  productExperienceResult: ProductExperienceResult;
  confidence: number;
  experienceVerdict: string;
  productCoherenceScore: number;
  experienceContinuityScore: number;
  intelligenceContinuityScore: number;
  workflowContinuityScore: number;
  navigationContinuityScore: number;
  verificationContinuityScore: number;
  founderExperienceScore: number;
  trustContinuityScore: number;
  productIdentityScore: number;
  launchReadinessScore: number;
  readinessLevel: LaunchReadinessLevel;
  totalGaps: number;
  criticalGaps: number;
}

export interface ProductExperienceHistoryEntry {
  productExperienceId: string;
  overallScore: number;
  productExperienceResult: ProductExperienceResult;
  recordedAt: number;
}

export interface ProductExperienceReport {
  overallProductExperienceScore: number;
  productCoherenceScore: number;
  experienceContinuityScore: number;
  intelligenceContinuityScore: number;
  workflowContinuityScore: number;
  navigationContinuityScore: number;
  verificationContinuityScore: number;
  founderExperienceScore: number;
  trustContinuityScore: number;
  productIdentityScore: number;
  launchReadinessScore: number;
  readinessLevel: LaunchReadinessLevel;
  productExperienceResult: ProductExperienceResult;
  detectedExperienceGaps: ExperienceGap[];
  criticalExperienceRisks: string[];
  founderRisks: string[];
  trustRisks: string[];
  launchRisks: string[];
  productExperienceRoadmap: ProductExperienceRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: ProductExperienceEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof PRODUCT_EXPERIENCE_REPORTING_PASS;
}

export interface ProductExperienceInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  productFragmented?: boolean;
  disconnectedExperience?: boolean;
  duplicatedConcepts?: boolean;
  experienceBreak?: boolean;
  contextLoss?: boolean;
  journeyFragmentation?: boolean;
  intelligenceFragmentation?: boolean;
  intelligenceVisibilityGaps?: boolean;
  workflowBreak?: boolean;
  workflowDeadEnd?: boolean;
  workflowLoopConfusion?: boolean;
  navigationFragmentation?: boolean;
  navigationContextLoss?: boolean;
  verificationSilo?: boolean;
  verificationDisconnection?: boolean;
  founderExperienceBreak?: boolean;
  founderClarityGap?: boolean;
  founderConfidenceRisk?: boolean;
  trustFragmentation?: boolean;
  trustGap?: boolean;
  productIdentityDrift?: boolean;
  genericToolFeel?: boolean;
  launchContinuityRisk?: boolean;
  readinessMismatch?: boolean;
  governanceBlocked?: boolean;
}

export interface ProductExperienceResultBundle {
  record: ProductExperienceRecord;
  report: ProductExperienceReport;
  authority: ProductExperienceAuthority;
}

export interface ProductExperienceRuntimeReport {
  contextBuildCount: number;
  productCoherenceVerifyCount: number;
  experienceContinuityVerifyCount: number;
  intelligenceContinuityVerifyCount: number;
  workflowContinuityVerifyCount: number;
  navigationContinuityVerifyCount: number;
  verificationContinuityVerifyCount: number;
  founderExperienceVerifyCount: number;
  trustContinuityVerifyCount: number;
  productIdentityVerifyCount: number;
  launchReadinessVerifyCount: number;
  gapAnalysisCount: number;
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

export const PRODUCT_EXPERIENCE_QUESTION_SIGNALS = [
  'product experience',
  'coherent product',
  'experience continuity',
  'product coherence',
  'launch readiness experience',
  'founder experience',
  'one product',
] as const;

export function isProductExperienceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PRODUCT_EXPERIENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveProductExperienceResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): ProductExperienceResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function severityToRank(severity: ExperienceSeverity): number {
  switch (severity) {
    case 'CRITICAL': return 1;
    case 'HIGH': return 2;
    case 'MEDIUM': return 3;
    default: return 4;
  }
}
