/**
 * Execution Proof Contradiction Detector — stale authority vs chain truth (Phase 26.78).
 */

import type { ConnectedExecutionChainTruth } from './connected-execution-chain-truth.js';
import type { FounderTestAuthorityResult } from './founder-test-integration-types.js';

export const EXECUTION_PROOF_CONTRADICTION = 'EXECUTION_PROOF_CONTRADICTION' as const;

export interface ExecutionProofContradiction {
  readOnly: true;
  kind: typeof EXECUTION_PROOF_CONTRADICTION;
  authorityName: string;
  authorityId: string;
  stage: 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'VERIFY' | 'LAUNCH';
  staleValue: 'NOT_PROVEN' | 'BLOCKED' | 'MISSING';
  truthValue: 'PROVEN';
  sourceLocation: string;
  detail: string;
}

const STALE_BUILD_PATTERNS = [
  /executionconnected\s*=\s*false/i,
  /build\s+blocked/i,
  /build\s*=\s*not[_\s-]?proven/i,
  /builder execution is not connected/i,
  /autonomous builder execution is not connected/i,
  /bottleneck remains build/i,
  /primary bottleneck:\s*build/i,
];

const STALE_RUNTIME_PATTERNS = [
  /runtime\s*=\s*not[_\s-]?proven/i,
  /no proven running application runtime/i,
];

const STALE_PREVIEW_PATTERNS = [
  /preview\s*=\s*not[_\s-]?proven/i,
  /cannot prove that built output reaches a running preview/i,
];

const STALE_VERIFY_PATTERNS = [
  /verification\s*=\s*not[_\s-]?proven/i,
  /validator inventory/i,
  /verification remains verification_/i,
];

const STALE_LAUNCH_PATTERNS = [
  /launch\s*=\s*not[_\s-]?proven/i,
  /launch readiness unavailable/i,
];

function textMatchesPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function collectAuthorityTexts(result: FounderTestAuthorityResult): string[] {
  return [
    ...result.blockers,
    ...result.warnings,
    ...result.recommendations,
    ...result.missingCapabilities,
  ];
}

function detectStageContradictions(
  result: FounderTestAuthorityResult,
  truth: ConnectedExecutionChainTruth,
  stage: ExecutionProofContradiction['stage'],
  truthProven: boolean,
  patterns: RegExp[],
  sourceLocation: string,
): ExecutionProofContradiction[] {
  if (!truthProven) return [];

  const contradictions: ExecutionProofContradiction[] = [];
  const texts = collectAuthorityTexts(result);

  for (const text of texts) {
    if (!textMatchesPatterns(text, patterns)) continue;
    contradictions.push({
      readOnly: true,
      kind: EXECUTION_PROOF_CONTRADICTION,
      authorityName: result.displayName,
      authorityId: result.authorityId,
      stage,
      staleValue: textMatchesPatterns(text, [/blocked/i]) ? 'BLOCKED' : 'NOT_PROVEN',
      truthValue: 'PROVEN',
      sourceLocation,
      detail: text,
    });
    break;
  }

  return contradictions;
}

export interface ExecutionProofSynchronizationReport {
  readOnly: true;
  truthSource: ConnectedExecutionChainTruth;
  authoritiesConsumingTruthSource: string[];
  contradictionCount: number;
  staleAuthorities: string[];
  contradictions: ExecutionProofContradiction[];
}

const TRUTH_CONSUMING_AUTHORITIES = [
  'FOUNDER_REALITY',
  'REQUIREMENT_REALITY',
  'LIVE_PREVIEW_REALITY',
  'VERIFICATION_REALITY',
  'EXECUTION_PROOF_EVOLUTION',
] as const;

export function detectExecutionProofContradictions(
  truth: ConnectedExecutionChainTruth,
  authorityResults: FounderTestAuthorityResult[],
): ExecutionProofSynchronizationReport {
  const contradictions: ExecutionProofContradiction[] = [];

  for (const result of authorityResults) {
    const loc = `${result.sourceModule}/${result.authorityId}`;
    contradictions.push(
      ...detectStageContradictions(result, truth, 'BUILD', truth.buildProven, STALE_BUILD_PATTERNS, loc),
      ...detectStageContradictions(result, truth, 'RUNTIME', truth.runtimeProven, STALE_RUNTIME_PATTERNS, loc),
      ...detectStageContradictions(result, truth, 'PREVIEW', truth.previewProven, STALE_PREVIEW_PATTERNS, loc),
      ...detectStageContradictions(result, truth, 'VERIFY', truth.verificationProven, STALE_VERIFY_PATTERNS, loc),
      ...detectStageContradictions(result, truth, 'LAUNCH', truth.launchProven, STALE_LAUNCH_PATTERNS, loc),
    );
  }

  const staleAuthorities = [...new Set(contradictions.map((c) => c.authorityName))];

  return {
    readOnly: true,
    truthSource: truth,
    authoritiesConsumingTruthSource: [...TRUTH_CONSUMING_AUTHORITIES],
    contradictionCount: contradictions.length,
    staleAuthorities,
    contradictions,
  };
}
