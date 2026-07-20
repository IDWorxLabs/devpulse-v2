/**
 * Universal Behavioral Verification Engine V1 — engineering report.
 */

import type {
  BehaviorVerificationPlan,
  BehaviorVerificationResultEntry,
  UniversalBehaviorDescriptor,
  UniversalBehaviorVerificationReport,
} from './universal-behavior-types.js';
import type { BehaviorCoverageSummary } from './behavior-coverage.js';
import { buildBehaviorTraceabilityChains } from './behavior-traceability.js';
import { computeBehaviorCoverage } from './behavior-coverage.js';
import { diagnoseSilentBehaviorSkips } from './behavior-diagnostics.js';
import { detectStaticBehaviorShells } from './behavior-runtime-validator.js';

export function buildBehaviorVerificationReport(input: {
  reportId: string;
  descriptors: readonly UniversalBehaviorDescriptor[];
  results: readonly BehaviorVerificationResultEntry[];
  plan: BehaviorVerificationPlan;
  workspaceSources: string;
}): UniversalBehaviorVerificationReport {
  const coverage = computeBehaviorCoverage(input.descriptors, input.results);
  const silentSkipCount = diagnoseSilentBehaviorSkips(input.results).length;
  const staticShellCount = detectStaticBehaviorShells(input.workspaceSources).length;

  return {
    reportId: input.reportId,
    generatedAt: new Date().toISOString(),
    totalBehaviors: coverage.totalApprovedBehaviors,
    verifiedCount: coverage.verifiedBehaviors,
    partiallyVerifiedCount: coverage.partiallyVerified,
    blockedCount: coverage.blocked,
    failedCount: coverage.failed,
    invalidCount: coverage.invalid,
    unsupportedCount: coverage.unsupported,
    notRequiredCount: coverage.notRequired,
    notExecutedCount: coverage.notExecuted,
    coveragePercent: coverage.coveragePercent,
    silentSkipCount,
    staticShellCount,
    results: input.results,
    traceabilityChains: buildBehaviorTraceabilityChains(input.descriptors, input.results),
  };
}

export function renderBehaviorVerificationReportMarkdown(report: UniversalBehaviorVerificationReport): string {
  const lines = [
    '# Universal Behavioral Verification Report',
    '',
    `- Report ID: ${report.reportId}`,
    `- Generated: ${report.generatedAt}`,
    `- Total behaviors: ${report.totalBehaviors}`,
    `- Verified: ${report.verifiedCount}`,
    `- Partially verified: ${report.partiallyVerifiedCount}`,
    `- Blocked: ${report.blockedCount}`,
    `- Failed: ${report.failedCount}`,
    `- Coverage: ${report.coveragePercent}%`,
    `- Silent skips: ${report.silentSkipCount}`,
    `- Static shells: ${report.staticShellCount}`,
    '',
  ];
  return lines.join('\n');
}

export function summarizeCoverage(coverage: BehaviorCoverageSummary): string {
  return `verified=${coverage.verifiedBehaviors} partial=${coverage.partiallyVerified} coverage=${coverage.coveragePercent}%`;
}
