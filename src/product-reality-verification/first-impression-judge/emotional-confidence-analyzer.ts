/**
 * First-Impression Judge — emotional confidence analyzer.
 */

import type { EmotionalConfidenceAnalysis, FirstImpressionInput, FirstVisitContext } from './first-impression-types.js';
import { EMOTIONAL_CONFIDENCE_PASS, clampScore } from './first-impression-types.js';
import { getCachedEmotionalConfidence, setCachedEmotionalConfidence } from './first-impression-cache.js';

export interface EmotionalConfidenceSnapshot {
  welcomeSubtitlePresent: boolean;
  premiumStylingPresent: boolean;
  intelligenceSignalsPresent: boolean;
}

let emotionalConfidenceAnalysisCount = 0;

export function analyzeEmotionalConfidence(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: EmotionalConfidenceSnapshot,
): EmotionalConfidenceAnalysis {
  const cacheKey = [input.emotionalConfidenceLow, input.firstVisitDoubt, context.persona].join('|');
  const cached = getCachedEmotionalConfidence(cacheKey);
  if (cached) return cached;

  emotionalConfidenceAnalysisCount += 1;
  const emotionalProblems: string[] = [];
  let penalty = 0;

  const emotionalConfidenceLow = input.emotionalConfidenceLow === true;
  const firstVisitDoubt = input.firstVisitDoubt === true;

  if (emotionalConfidenceLow) { emotionalProblems.push('EMOTIONAL_CONFIDENCE_LOW'); penalty += 22; }
  if (firstVisitDoubt) { emotionalProblems.push('FIRST_VISIT_DOUBT'); penalty += 20; }

  const bonus =
    (snapshot.welcomeSubtitlePresent ? 14 : 0)
    + (snapshot.premiumStylingPresent ? 12 : 0)
    + (snapshot.intelligenceSignalsPresent ? 12 : 0);

  const emotionalConfidenceScore = clampScore(78 + bonus - penalty);

  const result: EmotionalConfidenceAnalysis = {
    emotionalConfidenceScore,
    emotionalConfidenceLow,
    firstVisitDoubt,
    emotionalProblems,
    passToken: EMOTIONAL_CONFIDENCE_PASS,
  };
  setCachedEmotionalConfidence(cacheKey, result);
  return result;
}

export function getEmotionalConfidenceAnalysisCount(): number {
  return emotionalConfidenceAnalysisCount;
}

export function resetEmotionalConfidenceAnalyzerForTests(): void {
  emotionalConfidenceAnalysisCount = 0;
}
