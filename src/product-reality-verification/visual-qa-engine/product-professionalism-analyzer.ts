/**
 * Visual QA Engine — product professionalism analyzer.
 */

import type { ProductProfessionalismAnalysis, VisualQAInput } from './visual-qa-types.js';
import { PROFESSIONALISM_PASS, clampScore } from './visual-qa-types.js';
import { getCachedProductProfessionalism, setCachedProductProfessionalism } from './visual-qa-cache.js';

export interface ProductProfessionalismSnapshot {
  commandCenterSurfacePresent: boolean;
  statusBarPresent: boolean;
}

let professionalismAnalysisCount = 0;

export function analyzeProductProfessionalism(
  input: VisualQAInput,
  snapshot: ProductProfessionalismSnapshot,
): ProductProfessionalismAnalysis {
  const cacheKey = [
    input.founderUnacceptable,
    input.customerUnacceptable,
    input.investorUnacceptable,
    snapshot.commandCenterSurfacePresent,
  ].join('|');

  const cached = getCachedProductProfessionalism(cacheKey);
  if (cached) return cached;

  professionalismAnalysisCount += 1;
  const professionalismProblems: string[] = [];
  let penalty = 0;

  const founderAcceptable = input.founderUnacceptable !== true;
  const customerAcceptable = input.customerUnacceptable !== true;
  const investorAcceptable = input.investorUnacceptable !== true;

  if (!founderAcceptable) { professionalismProblems.push('founder_unacceptable'); penalty += 20; }
  if (!customerAcceptable) { professionalismProblems.push('customer_unacceptable'); penalty += 18; }
  if (!investorAcceptable) { professionalismProblems.push('investor_unacceptable'); penalty += 22; }

  const surfaceBonus =
    (snapshot.commandCenterSurfacePresent ? 14 : 0)
    + (snapshot.statusBarPresent ? 10 : 0);

  const professionalismScore = clampScore(84 + surfaceBonus - penalty);

  const result: ProductProfessionalismAnalysis = {
    professionalismScore,
    founderAcceptable,
    customerAcceptable,
    investorAcceptable,
    professionalismProblems,
    passToken: PROFESSIONALISM_PASS,
  };

  setCachedProductProfessionalism(cacheKey, result);
  return result;
}

export function getProfessionalismAnalysisCount(): number {
  return professionalismAnalysisCount;
}

export function resetProductProfessionalismAnalyzerForTests(): void {
  professionalismAnalysisCount = 0;
}
