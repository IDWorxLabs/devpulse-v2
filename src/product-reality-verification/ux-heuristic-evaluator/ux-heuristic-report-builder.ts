/**
 * UX Heuristic Evaluator — report builder.
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
  UXHeuristicEvaluation,
  UXHeuristicRecord,
  UXHeuristicReport,
  UserControlAnalysis,
  WorkflowContinuityAnalysis,
} from './ux-heuristic-types.js';
import { UX_HEURISTIC_REPORTING_PASS } from './ux-heuristic-types.js';
import { getUXHeuristicCacheStats } from './ux-heuristic-cache.js';
import { getUXHeuristicHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateUXHeuristicReport(
  record: UXHeuristicRecord,
  evaluation: UXHeuristicEvaluation,
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
): UXHeuristicReport {
  reportCount += 1;
  const cache = getUXHeuristicCacheStats();

  const detectedUxProblems = [
    ...navigation.navigationProblems,
    ...discoverability.discoverabilityProblems,
    ...action.actionProblems,
    ...feedback.feedbackProblems,
    ...status.statusProblems,
    ...errorPrevention.errorPreventionProblems,
    ...userControl.controlProblems,
    ...cognitive.cognitiveProblems,
    ...trust.trustProblems,
    ...workflow.workflowProblems,
    ...intelligence.intelligenceProblems,
    ...founder.founderProblems,
  ];

  const founderFrictionRisks: string[] = [];
  if (founder.founderUsabilityRisk) founderFrictionRisks.push('Founder may struggle with daily product use');
  if (founder.founderConfusionRisk) founderFrictionRisks.push('Founder confusion risk without architecture knowledge');
  if (navigation.navigationConfusion) founderFrictionRisks.push('Navigation confusion increases founder friction');
  if (discoverability.hiddenFeatures.length > 0) {
    founderFrictionRisks.push(`Hidden features: ${discoverability.hiddenFeatures.join(', ')}`);
  }

  const trustRisks: string[] = [];
  if (trust.trustGap) trustRisks.push('Trust gap — system actions not clearly explained');
  if (trust.unsupportedConfidence) trustRisks.push('Unsupported confidence claims visible to user');
  if (founder.founderTrustRisk) trustRisks.push('Founder trust risk on reports and status');

  const hiddenIntelligenceRisks: string[] = [];
  if (intelligence.intelligenceHidden) hiddenIntelligenceRisks.push('Intelligence exists but is not visibly communicated');
  if (intelligence.reasoningNotVisible) hiddenIntelligenceRisks.push('Reasoning not visible to founder');
  if (intelligence.smartSystemFeelsStatic) hiddenIntelligenceRisks.push('Smart system feels static despite internal intelligence');

  const recommendedPriorityFixes: string[] = [];
  if (intelligence.intelligenceHidden) recommendedPriorityFixes.push('Make DevPulse intelligence visibly communicated in Operator Feed and chat');
  if (founder.founderTrustRisk) recommendedPriorityFixes.push('Strengthen founder trust through clearer completion and evidence signals');
  if (navigation.navigationConfusion) recommendedPriorityFixes.push('Clarify navigation and location context');
  if (discoverability.featureDiscoverabilityRisk) recommendedPriorityFixes.push('Improve feature discoverability for Chat, Feed, UVL, and Vault');
  if (recommendedPriorityFixes.length === 0 && evaluation.uxHeuristicResult !== 'PASS') {
    recommendedPriorityFixes.push('Address highest-severity UX heuristic warnings');
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue UX heuristic monitoring on product changes');
  }

  const founderAcceptanceNotes: string[] = [];
  if (evaluation.founderAcceptanceReadiness >= 85) {
    founderAcceptanceNotes.push('Founder acceptance readiness is strong for daily use');
  } else if (evaluation.founderAcceptanceReadiness >= 65) {
    founderAcceptanceNotes.push('Founder acceptance possible with noted friction risks');
  } else {
    founderAcceptanceNotes.push('Founder acceptance blocked until UX friction is reduced');
  }
  if (intelligence.intelligenceVisibilityScore >= 80) {
    founderAcceptanceNotes.push('Intelligence visibility supports founder confidence');
  } else {
    founderAcceptanceNotes.push('Intelligence visibility must improve for founder trust');
  }

  return {
    overallScore: record.overallScore,
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
    uxHeuristicResult: record.uxHeuristicResult,
    detectedUxProblems: [...new Set(detectedUxProblems)],
    founderFrictionRisks: [...new Set(founderFrictionRisks)],
    trustRisks: [...new Set(trustRisks)],
    hiddenIntelligenceRisks: [...new Set(hiddenIntelligenceRisks)],
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    founderAcceptanceNotes: [...new Set(founderAcceptanceNotes)],
    evaluation,
    historySize: getUXHeuristicHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: UX_HEURISTIC_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetUXHeuristicReportBuilderForTests(): void {
  reportCount = 0;
}
