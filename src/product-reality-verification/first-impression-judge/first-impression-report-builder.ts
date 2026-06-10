/**
 * First-Impression Judge — report builder.
 */

import type {
  ActionReadinessAnalysis,
  EmotionalConfidenceAnalysis,
  FirstImpressionEvaluation,
  FirstImpressionRecord,
  FirstImpressionReport,
  FirstVisitContext,
  FounderUsefulnessAnalysis,
  IntelligencePerceptionAnalysis,
  LaunchReadinessPerceptionAnalysis,
  PremiumFeelAnalysis,
  ProductClarityAnalysis,
  ProductIdentityAnalysis,
  TrustworthinessPerceptionAnalysis,
  VisualConfidenceAnalysis,
} from './first-impression-types.js';
import { FIRST_IMPRESSION_REPORTING_PASS } from './first-impression-types.js';
import { getFirstImpressionCacheStats } from './first-impression-cache.js';
import { getFirstImpressionHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFirstImpressionReport(
  record: FirstImpressionRecord,
  evaluation: FirstImpressionEvaluation,
  context: FirstVisitContext,
  clarity: ProductClarityAnalysis,
  intelligence: IntelligencePerceptionAnalysis,
  trust: TrustworthinessPerceptionAnalysis,
  visual: VisualConfidenceAnalysis,
  founder: FounderUsefulnessAnalysis,
  premium: PremiumFeelAnalysis,
  action: ActionReadinessAnalysis,
  identity: ProductIdentityAnalysis,
  emotional: EmotionalConfidenceAnalysis,
  launch: LaunchReadinessPerceptionAnalysis,
): FirstImpressionReport {
  reportCount += 1;
  const cache = getFirstImpressionCacheStats();

  const firstVisitRisks = [
    ...context.likelyConfusionRisks,
    ...clarity.clarityProblems,
    ...action.actionProblems,
    ...launch.launchProblems,
  ];

  const hiddenIntelligenceRisks: string[] = [];
  if (intelligence.intelligenceNotVisible) hiddenIntelligenceRisks.push('Intelligence not visible on first visit');
  if (intelligence.aiFeelsStatic) hiddenIntelligenceRisks.push('AI system feels static despite internal capabilities');
  if (intelligence.smartnessUnproven) hiddenIntelligenceRisks.push('Smartness unproven in first-screen experience');

  const trustRisks: string[] = [];
  if (trust.trustSignalWeak) trustRisks.push('Trust signals weak on first screen');
  if (trust.confidenceUnsupported) trustRisks.push('Confidence claims lack visible evidence');
  if (trust.uncertaintyHidden) trustRisks.push('Uncertainty not honestly communicated');

  const founderFrictionNotes: string[] = [];
  if (founder.founderValueNotImmediate) founderFrictionNotes.push('Founder value not immediately apparent');
  if (founder.founderNextStepUnclear) founderFrictionNotes.push('Founder next step unclear on first visit');
  if (founder.founderProgressHidden) founderFrictionNotes.push('Progress signals hidden from founder view');
  if (context.persona === 'FOUNDER_FIRST_VISIT') {
    founderFrictionNotes.push(`Founder intent: ${context.userIntent}`);
  }

  const recommendedPriorityFixes: string[] = [];
  if (intelligence.intelligenceNotVisible) recommendedPriorityFixes.push('Make intelligence visible in welcome and Operator Feed on first load');
  if (clarity.productPurposeUnclear) recommendedPriorityFixes.push('Clarify product purpose in first-screen copy');
  if (action.primaryActionUnclear) recommendedPriorityFixes.push('Make chat input the obvious primary first action');
  if (launch.publicReadinessRisk) recommendedPriorityFixes.push('Reduce public-readiness risks before external demos');
  if (recommendedPriorityFixes.length === 0 && evaluation.firstImpressionResult !== 'PASS') {
    recommendedPriorityFixes.push('Address highest-severity first-impression warnings');
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue first-impression monitoring on product changes');
  }

  return {
    overallScore: record.overallScore,
    productClarityScore: clarity.productClarityScore,
    intelligencePerceptionScore: intelligence.intelligencePerceptionScore,
    trustworthinessScore: trust.trustworthinessScore,
    visualConfidenceScore: visual.visualConfidenceScore,
    founderUsefulnessScore: founder.founderUsefulnessScore,
    premiumFeelScore: premium.premiumFeelScore,
    actionReadinessScore: action.actionReadinessScore,
    productIdentityScore: identity.productIdentityScore,
    emotionalConfidenceScore: emotional.emotionalConfidenceScore,
    launchReadinessPerceptionScore: launch.launchReadinessPerceptionScore,
    firstImpressionResult: record.firstImpressionResult,
    firstVisitRisks: [...new Set(firstVisitRisks)],
    hiddenIntelligenceRisks: [...new Set(hiddenIntelligenceRisks)],
    trustRisks: [...new Set(trustRisks)],
    founderFrictionNotes: [...new Set(founderFrictionNotes)],
    launchReadinessVerdict: evaluation.launchReadinessVerdict,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFirstImpressionHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FIRST_IMPRESSION_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFirstImpressionReportBuilderForTests(): void {
  reportCount = 0;
}
