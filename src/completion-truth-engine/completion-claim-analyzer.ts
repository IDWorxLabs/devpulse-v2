/**
 * Completion Truth Engine — completion claim analyzer.
 */

import type {
  CompletionClaimAnalysis,
  CompletionClaimType,
  RawCompletionClaimInput,
} from './completion-truth-types.js';
import { getCachedClaimAnalysis, setCachedClaimAnalysis } from './completion-truth-cache.js';

let claimAnalysisCount = 0;

const CLAIM_TYPES: CompletionClaimType[] = [
  'build_completed',
  'verification_completed',
  'project_completed',
  'feature_completed',
  'fix_completed',
];

function resolveClaimType(raw: string): CompletionClaimType {
  const normalized = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (CLAIM_TYPES.includes(normalized as CompletionClaimType)) return normalized as CompletionClaimType;
  if (normalized.includes('build')) return 'build_completed';
  if (normalized.includes('verif')) return 'verification_completed';
  if (normalized.includes('project')) return 'project_completed';
  if (normalized.includes('feature')) return 'feature_completed';
  if (normalized.includes('fix')) return 'fix_completed';
  return 'build_completed';
}

export function analyzeCompletionClaim(input: RawCompletionClaimInput): CompletionClaimAnalysis {
  const claimType = resolveClaimType(String(input.claimType));
  const blockers = input.blockersRemaining ?? 0;
  const reported = input.reportedComplete === true;

  let claimStrength = Math.max(0, Math.min(100, Math.round(input.strength ?? (reported ? 60 : 20))));
  let claimCoverage = Math.max(0, Math.min(100, Math.round(input.coverage ?? (reported ? 55 : 15))));
  let claimReliability = Math.max(0, Math.min(100, Math.round(input.reliability ?? claimStrength * 0.8)));

  if (blockers > 0) {
    claimStrength = Math.max(0, claimStrength - blockers * 10);
    claimCoverage = Math.max(0, claimCoverage - blockers * 8);
  }

  return { claimType, claimStrength, claimCoverage, claimReliability };
}

export function analyzeCompletionClaims(inputs: RawCompletionClaimInput[]): CompletionClaimAnalysis[] {
  const cacheKey = inputs.map((i) => `${i.claimType}:${i.strength ?? 0}:${i.reportedComplete}`).join('|');
  const cached = getCachedClaimAnalysis(cacheKey);
  if (cached) return cached;

  claimAnalysisCount += 1;
  const result = inputs.map(analyzeCompletionClaim);
  setCachedClaimAnalysis(cacheKey, result);
  return result;
}

export function getClaimAnalysisCount(): number {
  return claimAnalysisCount;
}

export function resetCompletionClaimAnalyzerForTests(): void {
  claimAnalysisCount = 0;
}
