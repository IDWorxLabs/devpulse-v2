/**
 * UX Heuristic Evaluator — trust clarity analyzer.
 */

import type { TrustClarityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { TRUST_CLARITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedTrustClarity, setCachedTrustClarity } from './ux-heuristic-cache.js';

export interface TrustClaritySnapshot {
  welcomeTrustCopyPresent: boolean;
  statusConnectedIndicators: boolean;
  brainHealthEndpointPresent: boolean;
}

let trustClarityAnalysisCount = 0;

export function analyzeTrustClarity(
  input: UXHeuristicInput,
  snapshot: TrustClaritySnapshot,
): TrustClarityAnalysis {
  const cacheKey = [
    input.trustGap,
    input.unsupportedConfidence,
    input.completionClarityRisk,
    snapshot.welcomeTrustCopyPresent,
  ].join('|');

  const cached = getCachedTrustClarity(cacheKey);
  if (cached) return cached;

  trustClarityAnalysisCount += 1;
  const trustProblems: string[] = [];
  let penalty = 0;

  const trustGap = input.trustGap === true;
  const unsupportedConfidence = input.unsupportedConfidence === true;
  const completionClarityRisk = input.completionClarityRisk === true;

  if (trustGap) { trustProblems.push('TRUST_GAP'); penalty += 20; }
  if (unsupportedConfidence) { trustProblems.push('UNSUPPORTED_CONFIDENCE'); penalty += 18; }
  if (completionClarityRisk) { trustProblems.push('COMPLETION_CLARITY_RISK'); penalty += 16; }

  const trustBonus =
    (snapshot.welcomeTrustCopyPresent ? 12 : 0)
    + (snapshot.statusConnectedIndicators ? 10 : 0)
    + (snapshot.brainHealthEndpointPresent ? 10 : 0);

  const trustClarityScore = clampScore(84 + trustBonus - penalty);

  const result: TrustClarityAnalysis = {
    trustClarityScore,
    trustGap,
    unsupportedConfidence,
    completionClarityRisk,
    trustProblems,
    passToken: TRUST_CLARITY_PASS,
  };

  setCachedTrustClarity(cacheKey, result);
  return result;
}

export function getTrustClarityAnalysisCount(): number {
  return trustClarityAnalysisCount;
}

export function resetTrustClarityAnalyzerForTests(): void {
  trustClarityAnalysisCount = 0;
}
