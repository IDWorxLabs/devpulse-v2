/**
 * First-Impression Judge — premium feel analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, PremiumFeelAnalysis } from './first-impression-types.js';
import { PREMIUM_FEEL_PASS, clampScore } from './first-impression-types.js';
import { getCachedPremiumFeel, setCachedPremiumFeel } from './first-impression-cache.js';

export interface PremiumFeelSnapshot {
  interFontPresent: boolean;
  accentThemePresent: boolean;
  cardStylingPresent: boolean;
}

let premiumFeelAnalysisCount = 0;

export function analyzePremiumFeel(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: PremiumFeelSnapshot,
): PremiumFeelAnalysis {
  const cacheKey = [input.premiumFeelWeak, input.productFeelsGeneric, context.persona].join('|');
  const cached = getCachedPremiumFeel(cacheKey);
  if (cached) return cached;

  premiumFeelAnalysisCount += 1;
  const premiumProblems: string[] = [];
  let penalty = 0;

  const premiumFeelWeak = input.premiumFeelWeak === true;
  const productFeelsGeneric = input.productFeelsGeneric === true;

  if (premiumFeelWeak) { premiumProblems.push('PREMIUM_FEEL_WEAK'); penalty += 22; }
  if (productFeelsGeneric) { premiumProblems.push('PRODUCT_FEELS_GENERIC'); penalty += 20; }

  const bonus =
    (snapshot.interFontPresent ? 12 : 0)
    + (snapshot.accentThemePresent ? 14 : 0)
    + (snapshot.cardStylingPresent ? 10 : 0);

  const premiumFeelScore = clampScore(78 + bonus - penalty);

  const result: PremiumFeelAnalysis = {
    premiumFeelScore,
    premiumFeelWeak,
    productFeelsGeneric,
    premiumProblems,
    passToken: PREMIUM_FEEL_PASS,
  };
  setCachedPremiumFeel(cacheKey, result);
  return result;
}

export function getPremiumFeelAnalysisCount(): number {
  return premiumFeelAnalysisCount;
}

export function resetPremiumFeelAnalyzerForTests(): void {
  premiumFeelAnalysisCount = 0;
}
