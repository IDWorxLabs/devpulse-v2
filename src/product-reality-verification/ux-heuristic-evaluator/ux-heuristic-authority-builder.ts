/**
 * UX Heuristic Evaluator — unified authority builder.
 */

import type {
  ActionClarityAnalysis,
  CognitiveLoadAnalysis,
  ErrorPreventionAnalysis,
  FeatureDiscoverabilityAnalysis,
  FeedbackQualityAnalysis,
  FounderUsabilityAnalysis,
  IntelligenceVisibilityAnalysis,
  NavigationClarityAnalysis,
  SystemStatusVisibilityAnalysis,
  TrustClarityAnalysis,
  UXHeuristicAuthority,
  UXHeuristicInput,
  UXHeuristicResult,
  UserControlAnalysis,
  WorkflowContinuityAnalysis,
} from './ux-heuristic-types.js';
import { resolveUXHeuristicResult } from './ux-heuristic-types.js';
import { getCachedUXHeuristicAuthority, setCachedUXHeuristicAuthority } from './ux-heuristic-cache.js';

const ANALYZER_WEIGHT = 1 / 12;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUXHeuristicAuthority(
  requestId: string,
  navigation: NavigationClarityAnalysis,
  discoverability: FeatureDiscoverabilityAnalysis,
  action: ActionClarityAnalysis,
  feedback: FeedbackQualityAnalysis,
  status: SystemStatusVisibilityAnalysis,
  errorPrevention: ErrorPreventionAnalysis,
  userControl: UserControlAnalysis,
  cognitive: CognitiveLoadAnalysis,
  trust: TrustClarityAnalysis,
  workflow: WorkflowContinuityAnalysis,
  intelligence: IntelligenceVisibilityAnalysis,
  founder: FounderUsabilityAnalysis,
  input: UXHeuristicInput,
): UXHeuristicAuthority {
  const cacheKey = [
    requestId,
    navigation.navigationClarityScore,
    discoverability.featureDiscoverabilityScore,
    action.actionClarityScore,
    feedback.feedbackQualityScore,
    status.systemStatusVisibilityScore,
    errorPrevention.errorPreventionScore,
    userControl.userControlScore,
    cognitive.cognitiveLoadScore,
    trust.trustClarityScore,
    workflow.workflowContinuityScore,
    intelligence.intelligenceVisibilityScore,
    founder.founderUsabilityScore,
  ].join('|');

  const cached = getCachedUXHeuristicAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallScore = Math.round(
    navigation.navigationClarityScore * ANALYZER_WEIGHT
      + discoverability.featureDiscoverabilityScore * ANALYZER_WEIGHT
      + action.actionClarityScore * ANALYZER_WEIGHT
      + feedback.feedbackQualityScore * ANALYZER_WEIGHT
      + status.systemStatusVisibilityScore * ANALYZER_WEIGHT
      + errorPrevention.errorPreventionScore * ANALYZER_WEIGHT
      + userControl.userControlScore * ANALYZER_WEIGHT
      + cognitive.cognitiveLoadScore * ANALYZER_WEIGHT
      + trust.trustClarityScore * ANALYZER_WEIGHT
      + workflow.workflowContinuityScore * ANALYZER_WEIGHT
      + intelligence.intelligenceVisibilityScore * ANALYZER_WEIGHT
      + founder.founderUsabilityScore * ANALYZER_WEIGHT,
  );

  const criticalFailures =
    (intelligence.intelligenceHidden ? 1 : 0)
    + (founder.founderTrustRisk ? 1 : 0)
    + (errorPrevention.destructiveActionRisk ? 1 : 0)
    + (navigation.navigationConfusion ? 1 : 0);

  const warningCount =
    navigation.navigationProblems.length
    + discoverability.discoverabilityProblems.length
    + action.actionProblems.length
    + feedback.feedbackProblems.length
    + status.statusProblems.length
    + errorPrevention.errorPreventionProblems.length
    + userControl.controlProblems.length
    + cognitive.cognitiveProblems.length
    + trust.trustProblems.length
    + workflow.workflowProblems.length
    + intelligence.intelligenceProblems.length
    + founder.founderProblems.length;

  const uxHeuristicResult: UXHeuristicResult = resolveUXHeuristicResult(
    overallScore,
    criticalFailures,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + intelligence.intelligenceVisibilityScore + founder.founderUsabilityScore) / 3,
  ));

  const authority: UXHeuristicAuthority = {
    authorityId: `ux-heuristic-authority-${authorityCounter}`,
    overallScore,
    navigationClarityScore: navigation.navigationClarityScore,
    featureDiscoverabilityScore: discoverability.featureDiscoverabilityScore,
    actionClarityScore: action.actionClarityScore,
    feedbackQualityScore: feedback.feedbackQualityScore,
    systemStatusVisibilityScore: status.systemStatusVisibilityScore,
    errorPreventionScore: errorPrevention.errorPreventionScore,
    userControlScore: userControl.userControlScore,
    cognitiveLoadScore: cognitive.cognitiveLoadScore,
    trustClarityScore: trust.trustClarityScore,
    workflowContinuityScore: workflow.workflowContinuityScore,
    intelligenceVisibilityScore: intelligence.intelligenceVisibilityScore,
    founderUsabilityScore: founder.founderUsabilityScore,
    uxHeuristicResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedUXHeuristicAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetUXHeuristicAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
