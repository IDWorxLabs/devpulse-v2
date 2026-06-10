/**
 * First-Impression Judge — product clarity analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, ProductClarityAnalysis } from './first-impression-types.js';
import { PRODUCT_CLARITY_PASS, clampScore } from './first-impression-types.js';
import { getCachedProductClarity, setCachedProductClarity } from './first-impression-cache.js';

export interface ProductClaritySnapshot {
  welcomeCopyPresent: boolean;
  commandCenterTitlePresent: boolean;
  chatInputPresent: boolean;
  statusBarPresent: boolean;
}

let productClarityAnalysisCount = 0;

export function analyzeProductClarity(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: ProductClaritySnapshot,
): ProductClarityAnalysis {
  const cacheKey = [input.productPurposeUnclear, input.startingPointUnclear, input.stateConfusion, context.persona].join('|');
  const cached = getCachedProductClarity(cacheKey);
  if (cached) return cached;

  productClarityAnalysisCount += 1;
  const clarityProblems: string[] = [];
  let penalty = 0;

  const productPurposeUnclear = input.productPurposeUnclear === true;
  const startingPointUnclear = input.startingPointUnclear === true;
  const stateConfusion = input.stateConfusion === true;

  if (productPurposeUnclear) { clarityProblems.push('PRODUCT_PURPOSE_UNCLEAR'); penalty += 22; }
  if (startingPointUnclear) { clarityProblems.push('STARTING_POINT_UNCLEAR'); penalty += 20; }
  if (stateConfusion) { clarityProblems.push('STATE_CONFUSION'); penalty += 18; }

  const bonus =
    (snapshot.welcomeCopyPresent ? 12 : 0)
    + (snapshot.commandCenterTitlePresent ? 10 : 0)
    + (snapshot.chatInputPresent ? 14 : 0)
    + (snapshot.statusBarPresent ? 8 : 0);

  const productClarityScore = clampScore(84 + bonus - penalty);

  const result: ProductClarityAnalysis = {
    productClarityScore,
    productPurposeUnclear,
    startingPointUnclear,
    stateConfusion,
    clarityProblems,
    passToken: PRODUCT_CLARITY_PASS,
  };
  setCachedProductClarity(cacheKey, result);
  return result;
}

export function getProductClarityAnalysisCount(): number {
  return productClarityAnalysisCount;
}

export function resetProductClarityAnalyzerForTests(): void {
  productClarityAnalysisCount = 0;
}
