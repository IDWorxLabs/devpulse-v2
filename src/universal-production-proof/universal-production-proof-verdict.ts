/**
 * Universal Production Proof V1 — overall verdict rules.
 */

import type {
  UniversalProductionOverallVerdict,
  UniversalProductionProofProfileResult,
  UniversalProductionProofReport,
} from './universal-production-proof-types.js';

export const ALLOWED_UNIVERSAL_PRODUCTION_WARNINGS = [
  'Browser-level Playwright proof is not yet part of this validator.',
  'Score weighting calibration may adjust quality thresholds.',
  'Legacy project migration is not complete for pre-proof projects.',
  'UI badges for production proof are not yet surfaced in the product shell.',
] as const;

export function deriveUniversalProductionOverallVerdict(
  profileResults: UniversalProductionProofProfileResult[],
): {
  verdict: UniversalProductionOverallVerdict;
  allowedWarnings: string[];
  failureReasons: string[];
} {
  const failureReasons: string[] = [];
  const allowedWarnings = [...ALLOWED_UNIVERSAL_PRODUCTION_WARNINGS];

  if (profileResults.length !== 10) {
    failureReasons.push(`Expected 10 supported profiles, got ${profileResults.length}`);
  }

  const failedProfiles = profileResults.filter((result) => result.profileVerdict === 'FAIL');
  const warnedProfiles = profileResults.filter((result) => result.profileVerdict === 'WARN');

  for (const result of failedProfiles) {
    failureReasons.push(`${result.profile}: ${result.failureReasons[0] ?? 'core stage failed'}`);
  }

  const anyCoreFailure = failedProfiles.length > 0 || failureReasons.length > 0;
  if (anyCoreFailure) {
    return {
      verdict: 'NOT_UNIVERSALLY_PRODUCTION_READY',
      allowedWarnings,
      failureReasons,
    };
  }

  const scoreBelowEighty = profileResults.some((result) => result.qualityScore < 80);
  const hasWarnedProfiles = warnedProfiles.length > 0 || scoreBelowEighty;

  if (hasWarnedProfiles) {
    return {
      verdict: 'UNIVERSAL_PRODUCTION_READY_WITH_WARNINGS',
      allowedWarnings,
      failureReasons: [],
    };
  }

  return {
    verdict: 'UNIVERSAL_PRODUCTION_READY',
    allowedWarnings,
    failureReasons: [],
  };
}

export function buildUniversalProductionProofChatSummary(report: UniversalProductionProofReport): string {
  const passed = report.passedProfiles;
  const total = report.profileCount;
  const verdictLabel = report.overallVerdict.replace(/_/g, ' ').toLowerCase();

  if (report.overallVerdict === 'NOT_UNIVERSALLY_PRODUCTION_READY') {
    return [
      'Universal Production Proof failed.',
      `${passed}/${total} supported profiles completed the full proof chain.`,
      `Overall verdict: ${report.overallVerdict}.`,
      report.failureReasons[0] ?? 'One or more core proof stages failed.',
    ].join('\n\n');
  }

  const warningBlock =
    report.overallVerdict === 'UNIVERSAL_PRODUCTION_READY_WITH_WARNINGS'
      ? `Warnings: ${report.allowedWarnings[0]}`
      : null;

  return [
    `Universal Production Proof ${report.overallVerdict === 'UNIVERSAL_PRODUCTION_READY' ? 'passed' : 'passed with warnings'}.`,
    `${passed}/${total} supported profiles generated, built, previewed, persisted, audited, scored, and verified.`,
    `Overall verdict: ${report.overallVerdict}.`,
    warningBlock,
  ]
    .filter(Boolean)
    .join('\n\n');
}
