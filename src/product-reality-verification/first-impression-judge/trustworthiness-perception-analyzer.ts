/**
 * First-Impression Judge — trustworthiness perception analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, TrustworthinessPerceptionAnalysis } from './first-impression-types.js';
import { TRUSTWORTHINESS_PERCEPTION_PASS, clampScore } from './first-impression-types.js';
import { getCachedTrustworthinessPerception, setCachedTrustworthinessPerception } from './first-impression-cache.js';

export interface TrustworthinessPerceptionSnapshot {
  statusBarPresent: boolean;
  notConnectedStatusPresent: boolean;
  brainHealthPresent: boolean;
}

let trustworthinessAnalysisCount = 0;

export function analyzeTrustworthinessPerception(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: TrustworthinessPerceptionSnapshot,
): TrustworthinessPerceptionAnalysis {
  const cacheKey = [input.trustSignalWeak, input.confidenceUnsupported, input.uncertaintyHidden, context.persona].join('|');
  const cached = getCachedTrustworthinessPerception(cacheKey);
  if (cached) return cached;

  trustworthinessAnalysisCount += 1;
  const trustProblems: string[] = [];
  let penalty = 0;

  const trustSignalWeak = input.trustSignalWeak === true;
  const confidenceUnsupported = input.confidenceUnsupported === true;
  const uncertaintyHidden = input.uncertaintyHidden === true;

  if (trustSignalWeak) { trustProblems.push('TRUST_SIGNAL_WEAK'); penalty += 22; }
  if (confidenceUnsupported) { trustProblems.push('CONFIDENCE_UNSUPPORTED'); penalty += 20; }
  if (uncertaintyHidden) { trustProblems.push('UNCERTAINTY_HIDDEN'); penalty += 18; }

  const bonus =
    (snapshot.statusBarPresent ? 12 : 0)
    + (snapshot.notConnectedStatusPresent ? 10 : 0)
    + (snapshot.brainHealthPresent ? 12 : 0);

  const trustworthinessScore = clampScore(82 + bonus - penalty);

  const result: TrustworthinessPerceptionAnalysis = {
    trustworthinessScore,
    trustSignalWeak,
    confidenceUnsupported,
    uncertaintyHidden,
    trustProblems,
    passToken: TRUSTWORTHINESS_PERCEPTION_PASS,
  };
  setCachedTrustworthinessPerception(cacheKey, result);
  return result;
}

export function getTrustworthinessAnalysisCount(): number {
  return trustworthinessAnalysisCount;
}

export function resetTrustworthinessPerceptionAnalyzerForTests(): void {
  trustworthinessAnalysisCount = 0;
}
