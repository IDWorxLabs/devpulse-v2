/**
 * UX Heuristic Evaluator — founder usability analyzer.
 */

import type { FounderUsabilityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { FOUNDER_USABILITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedFounderUsability, setCachedFounderUsability } from './ux-heuristic-cache.js';

export interface FounderUsabilitySnapshot {
  chatFirstLayout: boolean;
  statusBarPresent: boolean;
  founderRealityPresent: boolean;
  mobileUsabilityPresent: boolean;
}

let founderUsabilityAnalysisCount = 0;

export function analyzeFounderUsability(
  input: UXHeuristicInput,
  snapshot: FounderUsabilitySnapshot,
): FounderUsabilityAnalysis {
  const cacheKey = [
    input.founderUsabilityRisk,
    input.founderConfusionRisk,
    input.founderTrustRisk,
    snapshot.chatFirstLayout,
  ].join('|');

  const cached = getCachedFounderUsability(cacheKey);
  if (cached) return cached;

  founderUsabilityAnalysisCount += 1;
  const founderProblems: string[] = [];
  let penalty = 0;

  const founderUsabilityRisk = input.founderUsabilityRisk === true;
  const founderConfusionRisk = input.founderConfusionRisk === true;
  const founderTrustRisk = input.founderTrustRisk === true;

  if (founderUsabilityRisk) { founderProblems.push('FOUNDER_USABILITY_RISK'); penalty += 20; }
  if (founderConfusionRisk) { founderProblems.push('FOUNDER_CONFUSION_RISK'); penalty += 18; }
  if (founderTrustRisk) { founderProblems.push('FOUNDER_TRUST_RISK'); penalty += 22; }

  const founderBonus =
    (snapshot.chatFirstLayout ? 14 : 0)
    + (snapshot.statusBarPresent ? 12 : 0)
    + (snapshot.founderRealityPresent ? 10 : 0)
    + (snapshot.mobileUsabilityPresent ? 8 : 0);

  const founderUsabilityScore = clampScore(80 + founderBonus - penalty);

  const result: FounderUsabilityAnalysis = {
    founderUsabilityScore,
    founderUsabilityRisk,
    founderConfusionRisk,
    founderTrustRisk,
    founderProblems,
    passToken: FOUNDER_USABILITY_PASS,
  };

  setCachedFounderUsability(cacheKey, result);
  return result;
}

export function getFounderUsabilityAnalysisCount(): number {
  return founderUsabilityAnalysisCount;
}

export function resetFounderUsabilityAnalyzerForTests(): void {
  founderUsabilityAnalysisCount = 0;
}
