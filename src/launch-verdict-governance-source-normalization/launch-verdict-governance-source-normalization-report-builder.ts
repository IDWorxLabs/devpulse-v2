/**
 * Phase 27.06 — Launch verdict governance source normalization report builder (V1).
 */

import type { LaunchVerdictGovernanceSourceNormalizationReport } from './launch-verdict-governance-source-normalization-types.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER,
  LAUNCH_VERDICT_GOVERNANCE_PROPAGATION_CHAIN,
} from './launch-verdict-governance-source-normalization-registry.js';

export function buildLaunchVerdictGovernanceSourceNormalizationMarkdown(
  report: LaunchVerdictGovernanceSourceNormalizationReport,
): string {
  return [
    '# Launch Verdict Governance Source Normalization',
    '',
    `Normalization ID: ${report.normalizationId}`,
    `Generated: ${report.generatedAt}`,
    `Normalization applied: ${report.normalizationApplied ? 'yes' : 'no'}`,
    `Upstream producer: ${report.upstreamProducer}`,
    `Crash upstream producer: ${LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER}`,
    `Source path: ${report.sourcePath}`,
    `Missing fields before normalization: ${report.missingFieldsBeforeNormalization.join(', ') || 'none'}`,
    `Pass token: ${report.passToken ?? 'none'}`,
    '',
    '## Propagation chain',
    '',
    ...LAUNCH_VERDICT_GOVERNANCE_PROPAGATION_CHAIN.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Root cause',
    '',
    report.degradedPathDetection.skippedAuthorityInitialization
      ? `${report.upstreamProducer} assembled partial launchVerdictGovernance objects without calling assessLaunchVerdictGovernance(), omitting requiredEvidenceMissing and blockingAuthorities arrays.`
      : 'Governance source shape satisfied.',
  ].join('\n');
}

export function buildLaunchVerdictGovernanceSourceNormalizationValidationMarkdown(input: {
  passToken: string | null;
  checks: readonly { name: string; passed: boolean; detail: string }[];
}): string {
  return [
    '# Launch Verdict Governance Source Normalization Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    `Identified crash upstream producer: **${LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER}**`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    input.passToken ? `**${input.passToken}**` : '',
  ].join('\n');
}
