/**
 * First-Impression Judge — intelligence perception analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, IntelligencePerceptionAnalysis } from './first-impression-types.js';
import { INTELLIGENCE_PERCEPTION_PASS, clampScore } from './first-impression-types.js';
import { getCachedIntelligencePerception, setCachedIntelligencePerception } from './first-impression-cache.js';

export interface IntelligencePerceptionSnapshot {
  operatorFeedPresent: boolean;
  brainConnectedCopyPresent: boolean;
  feedStreamPresent: boolean;
  welcomeIntelligenceHintPresent: boolean;
}

let intelligencePerceptionAnalysisCount = 0;

export function analyzeIntelligencePerception(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: IntelligencePerceptionSnapshot,
): IntelligencePerceptionAnalysis {
  const cacheKey = [input.intelligenceNotVisible, input.aiFeelsStatic, input.smartnessUnproven, context.persona].join('|');
  const cached = getCachedIntelligencePerception(cacheKey);
  if (cached) return cached;

  intelligencePerceptionAnalysisCount += 1;
  const perceptionProblems: string[] = [];
  let penalty = 0;

  const intelligenceNotVisible = input.intelligenceNotVisible === true;
  const aiFeelsStatic = input.aiFeelsStatic === true;
  const smartnessUnproven = input.smartnessUnproven === true;

  if (intelligenceNotVisible) { perceptionProblems.push('INTELLIGENCE_NOT_VISIBLE'); penalty += 24; }
  if (aiFeelsStatic) { perceptionProblems.push('AI_FEELS_STATIC'); penalty += 20; }
  if (smartnessUnproven) { perceptionProblems.push('SMARTNESS_UNPROVEN'); penalty += 18; }

  const bonus =
    (snapshot.operatorFeedPresent ? 16 : 0)
    + (snapshot.brainConnectedCopyPresent ? 14 : 0)
    + (snapshot.feedStreamPresent ? 10 : 0)
    + (snapshot.welcomeIntelligenceHintPresent ? 10 : 0);

  const intelligencePerceptionScore = clampScore(76 + bonus - penalty);

  const result: IntelligencePerceptionAnalysis = {
    intelligencePerceptionScore,
    intelligenceNotVisible,
    aiFeelsStatic,
    smartnessUnproven,
    perceptionProblems,
    passToken: INTELLIGENCE_PERCEPTION_PASS,
  };
  setCachedIntelligencePerception(cacheKey, result);
  return result;
}

export function getIntelligencePerceptionAnalysisCount(): number {
  return intelligencePerceptionAnalysisCount;
}

export function resetIntelligencePerceptionAnalyzerForTests(): void {
  intelligencePerceptionAnalysisCount = 0;
}
