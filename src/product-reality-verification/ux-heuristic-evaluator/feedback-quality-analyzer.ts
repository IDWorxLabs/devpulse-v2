/**
 * UX Heuristic Evaluator — feedback quality analyzer.
 */

import type { FeedbackQualityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { FEEDBACK_QUALITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedFeedbackQuality, setCachedFeedbackQuality } from './ux-heuristic-cache.js';

export interface FeedbackQualitySnapshot {
  thinkingIndicatorPresent: boolean;
  operatorFeedPresent: boolean;
  notificationDrawerPresent: boolean;
  chatHistoryPresent: boolean;
}

let feedbackAnalysisCount = 0;

export function analyzeFeedbackQuality(
  input: UXHeuristicInput,
  snapshot: FeedbackQualitySnapshot,
): FeedbackQualityAnalysis {
  const cacheKey = [
    input.missingFeedback,
    input.weakProgressFeedback,
    input.actionResultUnclear,
    snapshot.thinkingIndicatorPresent,
  ].join('|');

  const cached = getCachedFeedbackQuality(cacheKey);
  if (cached) return cached;

  feedbackAnalysisCount += 1;
  const feedbackProblems: string[] = [];
  let penalty = 0;

  const missingFeedback = input.missingFeedback === true;
  const weakProgressFeedback = input.weakProgressFeedback === true;
  const actionResultUnclear = input.actionResultUnclear === true;

  if (missingFeedback) { feedbackProblems.push('MISSING_FEEDBACK'); penalty += 20; }
  if (weakProgressFeedback) { feedbackProblems.push('WEAK_PROGRESS_FEEDBACK'); penalty += 16; }
  if (actionResultUnclear) { feedbackProblems.push('ACTION_RESULT_UNCLEAR'); penalty += 18; }

  const feedbackBonus =
    (snapshot.thinkingIndicatorPresent ? 12 : 0)
    + (snapshot.operatorFeedPresent ? 14 : 0)
    + (snapshot.notificationDrawerPresent ? 8 : 0)
    + (snapshot.chatHistoryPresent ? 10 : 0);

  const feedbackQualityScore = clampScore(82 + feedbackBonus - penalty);

  const result: FeedbackQualityAnalysis = {
    feedbackQualityScore,
    missingFeedback,
    weakProgressFeedback,
    actionResultUnclear,
    feedbackProblems,
    passToken: FEEDBACK_QUALITY_PASS,
  };

  setCachedFeedbackQuality(cacheKey, result);
  return result;
}

export function getFeedbackAnalysisCount(): number {
  return feedbackAnalysisCount;
}

export function resetFeedbackQualityAnalyzerForTests(): void {
  feedbackAnalysisCount = 0;
}
