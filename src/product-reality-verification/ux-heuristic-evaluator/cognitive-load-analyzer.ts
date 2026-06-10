/**
 * UX Heuristic Evaluator — cognitive load analyzer.
 */

import type { CognitiveLoadAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { COGNITIVE_LOAD_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedCognitiveLoad, setCachedCognitiveLoad } from './ux-heuristic-cache.js';

export interface CognitiveLoadSnapshot {
  diagnosticSectionCount: number;
  panelCount: number;
}

let cognitiveLoadAnalysisCount = 0;

export function analyzeCognitiveLoad(
  input: UXHeuristicInput,
  snapshot: CognitiveLoadSnapshot,
): CognitiveLoadAnalysis {
  const cacheKey = [
    input.cognitiveOverload,
    input.technicalLanguageRisk,
    input.uxNoise,
    snapshot.diagnosticSectionCount,
  ].join('|');

  const cached = getCachedCognitiveLoad(cacheKey);
  if (cached) return cached;

  cognitiveLoadAnalysisCount += 1;
  const cognitiveProblems: string[] = [];
  let penalty = 0;

  const cognitiveOverload = input.cognitiveOverload === true;
  const technicalLanguageRisk = input.technicalLanguageRisk === true;
  const uxNoise = input.uxNoise === true;

  if (cognitiveOverload) { cognitiveProblems.push('COGNITIVE_OVERLOAD'); penalty += 20; }
  if (technicalLanguageRisk) { cognitiveProblems.push('TECHNICAL_LANGUAGE_RISK'); penalty += 16; }
  if (uxNoise) { cognitiveProblems.push('UX_NOISE'); penalty += 14; }

  if (snapshot.diagnosticSectionCount > 6) {
    cognitiveProblems.push('high_diagnostic_cognitive_load');
    penalty += Math.min((snapshot.diagnosticSectionCount - 6) * 2, 12);
  }

  const loadBonus = Math.max(0, 10 - snapshot.panelCount);
  const cognitiveLoadScore = clampScore(86 + loadBonus - penalty);

  const result: CognitiveLoadAnalysis = {
    cognitiveLoadScore,
    cognitiveOverload,
    technicalLanguageRisk,
    uxNoise,
    cognitiveProblems,
    passToken: COGNITIVE_LOAD_PASS,
  };

  setCachedCognitiveLoad(cacheKey, result);
  return result;
}

export function getCognitiveLoadAnalysisCount(): number {
  return cognitiveLoadAnalysisCount;
}

export function resetCognitiveLoadAnalyzerForTests(): void {
  cognitiveLoadAnalysisCount = 0;
}
