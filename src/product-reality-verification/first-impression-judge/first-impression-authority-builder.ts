/**
 * First-Impression Judge — unified authority builder.
 */

import type {
  ActionReadinessAnalysis,
  EmotionalConfidenceAnalysis,
  FirstImpressionAuthority,
  FirstImpressionInput,
  FirstImpressionResult,
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
import { resolveFirstImpressionResult } from './first-impression-types.js';
import { getCachedFirstImpressionAuthority, setCachedFirstImpressionAuthority } from './first-impression-cache.js';

const ANALYZER_WEIGHT = 0.1;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFirstImpressionAuthority(
  requestId: string,
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
  input: FirstImpressionInput,
): FirstImpressionAuthority {
  const cacheKey = [
    requestId,
    context.persona,
    clarity.productClarityScore,
    intelligence.intelligencePerceptionScore,
    trust.trustworthinessScore,
    visual.visualConfidenceScore,
    founder.founderUsefulnessScore,
    premium.premiumFeelScore,
    action.actionReadinessScore,
    identity.productIdentityScore,
    emotional.emotionalConfidenceScore,
    launch.launchReadinessPerceptionScore,
  ].join('|');

  const cached = getCachedFirstImpressionAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallScore = Math.round(
    clarity.productClarityScore * ANALYZER_WEIGHT
      + intelligence.intelligencePerceptionScore * ANALYZER_WEIGHT
      + trust.trustworthinessScore * ANALYZER_WEIGHT
      + visual.visualConfidenceScore * ANALYZER_WEIGHT
      + founder.founderUsefulnessScore * ANALYZER_WEIGHT
      + premium.premiumFeelScore * ANALYZER_WEIGHT
      + action.actionReadinessScore * ANALYZER_WEIGHT
      + identity.productIdentityScore * ANALYZER_WEIGHT
      + emotional.emotionalConfidenceScore * ANALYZER_WEIGHT
      + launch.launchReadinessPerceptionScore * ANALYZER_WEIGHT,
  );

  const criticalFailures =
    (intelligence.intelligenceNotVisible ? 1 : 0)
    + (launch.publicReadinessRisk ? 1 : 0)
    + (clarity.productPurposeUnclear ? 1 : 0)
    + (founder.founderValueNotImmediate && context.persona === 'FOUNDER_FIRST_VISIT' ? 1 : 0);

  const warningCount =
    clarity.clarityProblems.length
    + intelligence.perceptionProblems.length
    + trust.trustProblems.length
    + visual.visualProblems.length
    + founder.founderProblems.length
    + premium.premiumProblems.length
    + action.actionProblems.length
    + identity.identityProblems.length
    + emotional.emotionalProblems.length
    + launch.launchProblems.length
    + context.likelyConfusionRisks.length;

  const firstImpressionResult: FirstImpressionResult = resolveFirstImpressionResult(
    overallScore,
    criticalFailures,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + intelligence.intelligencePerceptionScore + emotional.emotionalConfidenceScore) / 3,
  ));

  const authority: FirstImpressionAuthority = {
    authorityId: `first-impression-authority-${authorityCounter}`,
    overallScore,
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
    firstImpressionResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedFirstImpressionAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFirstImpressionAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
