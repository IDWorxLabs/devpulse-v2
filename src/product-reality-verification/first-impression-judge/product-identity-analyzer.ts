/**
 * First-Impression Judge — product identity analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, ProductIdentityAnalysis } from './first-impression-types.js';
import { PRODUCT_IDENTITY_PASS, clampScore } from './first-impression-types.js';
import { getCachedProductIdentity, setCachedProductIdentity } from './first-impression-cache.js';

export interface ProductIdentitySnapshot {
  devPulseBrandingPresent: boolean;
  commandCenterIdentityPresent: boolean;
  operatorFeedIdentityPresent: boolean;
}

let productIdentityAnalysisCount = 0;

export function analyzeProductIdentity(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: ProductIdentitySnapshot,
): ProductIdentityAnalysis {
  const cacheKey = [input.productIdentityWeak, input.visionNotCommunicated, input.genericAiToolFeel, context.persona].join('|');
  const cached = getCachedProductIdentity(cacheKey);
  if (cached) return cached;

  productIdentityAnalysisCount += 1;
  const identityProblems: string[] = [];
  let penalty = 0;

  const productIdentityWeak = input.productIdentityWeak === true;
  const visionNotCommunicated = input.visionNotCommunicated === true;
  const genericAiToolFeel = input.genericAiToolFeel === true;

  if (productIdentityWeak) { identityProblems.push('PRODUCT_IDENTITY_WEAK'); penalty += 20; }
  if (visionNotCommunicated) { identityProblems.push('VISION_NOT_COMMUNICATED'); penalty += 22; }
  if (genericAiToolFeel) { identityProblems.push('GENERIC_AI_TOOL_FEEL'); penalty += 18; }

  const bonus =
    (snapshot.devPulseBrandingPresent ? 14 : 0)
    + (snapshot.commandCenterIdentityPresent ? 12 : 0)
    + (snapshot.operatorFeedIdentityPresent ? 10 : 0);

  const productIdentityScore = clampScore(76 + bonus - penalty);

  const result: ProductIdentityAnalysis = {
    productIdentityScore,
    productIdentityWeak,
    visionNotCommunicated,
    genericAiToolFeel,
    identityProblems,
    passToken: PRODUCT_IDENTITY_PASS,
  };
  setCachedProductIdentity(cacheKey, result);
  return result;
}

export function getProductIdentityAnalysisCount(): number {
  return productIdentityAnalysisCount;
}

export function resetProductIdentityAnalyzerForTests(): void {
  productIdentityAnalysisCount = 0;
}
