/**
 * First-Impression Judge — types and models.
 * Read-only product perception evaluation. No UI or copy modification.
 */

export const FIRST_IMPRESSION_JUDGE_PASS_TOKEN = 'FIRST_IMPRESSION_JUDGE_V1_PASS';
export const FIRST_IMPRESSION_JUDGE_PASS = 'FIRST_IMPRESSION_JUDGE_PASS';
export const FIRST_IMPRESSION_JUDGE_OWNER_MODULE = 'devpulse_v2_first_impression_judge';
export const DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE = 128;

export const FIRST_VISIT_CONTEXT_PASS = 'FIRST_VISIT_CONTEXT_PASS';
export const PRODUCT_CLARITY_PASS = 'PRODUCT_CLARITY_PASS';
export const INTELLIGENCE_PERCEPTION_PASS = 'INTELLIGENCE_PERCEPTION_PASS';
export const TRUSTWORTHINESS_PERCEPTION_PASS = 'TRUSTWORTHINESS_PERCEPTION_PASS';
export const VISUAL_CONFIDENCE_PASS = 'VISUAL_CONFIDENCE_PASS';
export const FOUNDER_USEFULNESS_PASS = 'FOUNDER_USEFULNESS_PASS';
export const PREMIUM_FEEL_PASS = 'PREMIUM_FEEL_PASS';
export const ACTION_READINESS_PASS = 'ACTION_READINESS_PASS';
export const PRODUCT_IDENTITY_PASS = 'PRODUCT_IDENTITY_PASS';
export const EMOTIONAL_CONFIDENCE_PASS = 'EMOTIONAL_CONFIDENCE_PASS';
export const LAUNCH_READINESS_PERCEPTION_PASS = 'LAUNCH_READINESS_PERCEPTION_PASS';
export const FIRST_IMPRESSION_REPORTING_PASS = 'REPORTING_PASS';

export type FirstImpressionResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type FirstVisitPersona =
  | 'FOUNDER_FIRST_VISIT'
  | 'CUSTOMER_FIRST_VISIT'
  | 'INVESTOR_FIRST_VISIT'
  | 'TECHNICAL_REVIEWER_FIRST_VISIT'
  | 'NON_TECHNICAL_USER_FIRST_VISIT';

export interface FirstVisitContext {
  persona: FirstVisitPersona;
  userIntent: string;
  expectedClarity: string;
  expectedTrustSignals: string;
  expectedProductPromise: string;
  expectedFirstAction: string;
  likelyConfusionRisks: string[];
  passToken: typeof FIRST_VISIT_CONTEXT_PASS;
}

export interface FirstImpressionRecord {
  firstImpressionId: string;
  projectId: string;
  workspaceId: string;
  persona: FirstVisitPersona;
  overallScore: number;
  firstImpressionResult: FirstImpressionResult;
  confidence: number;
  generatedAt: number;
}

export interface ProductClarityAnalysis {
  productClarityScore: number;
  productPurposeUnclear: boolean;
  startingPointUnclear: boolean;
  stateConfusion: boolean;
  clarityProblems: string[];
  passToken: typeof PRODUCT_CLARITY_PASS;
}

export interface IntelligencePerceptionAnalysis {
  intelligencePerceptionScore: number;
  intelligenceNotVisible: boolean;
  aiFeelsStatic: boolean;
  smartnessUnproven: boolean;
  perceptionProblems: string[];
  passToken: typeof INTELLIGENCE_PERCEPTION_PASS;
}

export interface TrustworthinessPerceptionAnalysis {
  trustworthinessScore: number;
  trustSignalWeak: boolean;
  confidenceUnsupported: boolean;
  uncertaintyHidden: boolean;
  trustProblems: string[];
  passToken: typeof TRUSTWORTHINESS_PERCEPTION_PASS;
}

export interface VisualConfidenceAnalysis {
  visualConfidenceScore: number;
  visualConfidenceLow: boolean;
  productFeelsUnfinished: boolean;
  visualProblems: string[];
  passToken: typeof VISUAL_CONFIDENCE_PASS;
}

export interface FounderUsefulnessAnalysis {
  founderUsefulnessScore: number;
  founderValueNotImmediate: boolean;
  founderNextStepUnclear: boolean;
  founderProgressHidden: boolean;
  founderProblems: string[];
  passToken: typeof FOUNDER_USEFULNESS_PASS;
}

export interface PremiumFeelAnalysis {
  premiumFeelScore: number;
  premiumFeelWeak: boolean;
  productFeelsGeneric: boolean;
  premiumProblems: string[];
  passToken: typeof PREMIUM_FEEL_PASS;
}

export interface ActionReadinessAnalysis {
  actionReadinessScore: number;
  primaryActionUnclear: boolean;
  actionReadinessLow: boolean;
  actionProblems: string[];
  passToken: typeof ACTION_READINESS_PASS;
}

export interface ProductIdentityAnalysis {
  productIdentityScore: number;
  productIdentityWeak: boolean;
  visionNotCommunicated: boolean;
  genericAiToolFeel: boolean;
  identityProblems: string[];
  passToken: typeof PRODUCT_IDENTITY_PASS;
}

export interface EmotionalConfidenceAnalysis {
  emotionalConfidenceScore: number;
  emotionalConfidenceLow: boolean;
  firstVisitDoubt: boolean;
  emotionalProblems: string[];
  passToken: typeof EMOTIONAL_CONFIDENCE_PASS;
}

export interface LaunchReadinessPerceptionAnalysis {
  launchReadinessPerceptionScore: number;
  launchReadinessPerceptionLow: boolean;
  publicReadinessRisk: boolean;
  perceivedStage: 'internal_alpha' | 'founder_alpha' | 'beta' | 'production_ready';
  launchProblems: string[];
  passToken: typeof LAUNCH_READINESS_PERCEPTION_PASS;
}

export interface FirstImpressionAuthority {
  authorityId: string;
  overallScore: number;
  productClarityScore: number;
  intelligencePerceptionScore: number;
  trustworthinessScore: number;
  visualConfidenceScore: number;
  founderUsefulnessScore: number;
  premiumFeelScore: number;
  actionReadinessScore: number;
  productIdentityScore: number;
  emotionalConfidenceScore: number;
  launchReadinessPerceptionScore: number;
  firstImpressionResult: FirstImpressionResult;
  confidence: number;
  createdAt: number;
}

export interface FirstImpressionEvaluation {
  overallScore: number;
  firstImpressionResult: FirstImpressionResult;
  confidence: number;
  launchReadinessVerdict: string;
  productClarityScore: number;
  intelligencePerceptionScore: number;
  trustworthinessScore: number;
  visualConfidenceScore: number;
  founderUsefulnessScore: number;
  premiumFeelScore: number;
  actionReadinessScore: number;
  productIdentityScore: number;
  emotionalConfidenceScore: number;
  launchReadinessPerceptionScore: number;
}

export interface FirstImpressionHistoryEntry {
  firstImpressionId: string;
  overallScore: number;
  firstImpressionResult: FirstImpressionResult;
  recordedAt: number;
}

export interface FirstImpressionReport {
  overallScore: number;
  productClarityScore: number;
  intelligencePerceptionScore: number;
  trustworthinessScore: number;
  visualConfidenceScore: number;
  founderUsefulnessScore: number;
  premiumFeelScore: number;
  actionReadinessScore: number;
  productIdentityScore: number;
  emotionalConfidenceScore: number;
  launchReadinessPerceptionScore: number;
  firstImpressionResult: FirstImpressionResult;
  firstVisitRisks: string[];
  hiddenIntelligenceRisks: string[];
  trustRisks: string[];
  founderFrictionNotes: string[];
  launchReadinessVerdict: string;
  recommendedPriorityFixes: string[];
  evaluation: FirstImpressionEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FIRST_IMPRESSION_REPORTING_PASS;
}

export interface FirstImpressionInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  persona?: FirstVisitPersona;
  productPurposeUnclear?: boolean;
  startingPointUnclear?: boolean;
  stateConfusion?: boolean;
  intelligenceNotVisible?: boolean;
  aiFeelsStatic?: boolean;
  smartnessUnproven?: boolean;
  trustSignalWeak?: boolean;
  confidenceUnsupported?: boolean;
  uncertaintyHidden?: boolean;
  visualConfidenceLow?: boolean;
  productFeelsUnfinished?: boolean;
  founderValueNotImmediate?: boolean;
  founderNextStepUnclear?: boolean;
  founderProgressHidden?: boolean;
  premiumFeelWeak?: boolean;
  productFeelsGeneric?: boolean;
  primaryActionUnclear?: boolean;
  actionReadinessLow?: boolean;
  productIdentityWeak?: boolean;
  visionNotCommunicated?: boolean;
  genericAiToolFeel?: boolean;
  emotionalConfidenceLow?: boolean;
  firstVisitDoubt?: boolean;
  launchReadinessPerceptionLow?: boolean;
  publicReadinessRisk?: boolean;
  governanceBlocked?: boolean;
}

export interface FirstImpressionResultBundle {
  record: FirstImpressionRecord;
  report: FirstImpressionReport;
  context: FirstVisitContext;
}

export interface FirstImpressionRuntimeReport {
  contextBuildCount: number;
  productClarityAnalysisCount: number;
  intelligencePerceptionAnalysisCount: number;
  trustworthinessAnalysisCount: number;
  visualConfidenceAnalysisCount: number;
  founderUsefulnessAnalysisCount: number;
  premiumFeelAnalysisCount: number;
  actionReadinessAnalysisCount: number;
  productIdentityAnalysisCount: number;
  emotionalConfidenceAnalysisCount: number;
  launchReadinessAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const FIRST_IMPRESSION_QUESTION_SIGNALS = [
  'first impression',
  'first visit',
  'launch readiness',
  'product perception',
  'premium feel',
  'trustworthiness',
  'intelligence perception',
] as const;

export function isFirstImpressionQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FIRST_IMPRESSION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFirstImpressionResult(
  overallScore: number,
  criticalFailures: number,
  warningCount: number,
  blocked?: boolean,
): FirstImpressionResult {
  if (blocked === true) return 'FAIL';
  if (criticalFailures > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
