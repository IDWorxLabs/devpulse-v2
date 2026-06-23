/**
 * Phase 27.04 — Launch verdict governance normalization report builder (V1).
 */

import type { V5LaunchVerdictGovernanceSourceNormalizationReport } from './v5-launch-verdict-governance-source-normalization-types.js';

export function buildLaunchVerdictGovernanceNormalizationMarkdown(
  report: V5LaunchVerdictGovernanceSourceNormalizationReport,
): string {
  return [
    '# V5 Launch Verdict Governance Source Normalization',
    '',
    `Normalization ID: ${report.normalizationId}`,
    `Generated: ${report.generatedAt}`,
    `Normalization applied: ${report.normalizationApplied ? 'yes' : 'no'}`,
    `Source path: ${report.sourcePath}`,
    `Producer authority: ${report.producerAuthority}`,
    `Missing fields before normalization: ${report.missingFieldsBeforeNormalization.join(', ') || 'none'}`,
    `Failure class: ${report.shapeDetection.failureClass}`,
    `Pass token: ${report.passToken ?? 'none'}`,
  ].join('\n');
}

export function buildLaunchVerdictGovernanceNormalizationValidationMarkdown(input: {
  passToken: string | null;
  checks: readonly { name: string; passed: boolean; detail: string }[];
}): string {
  return [
    '# V5 Launch Verdict Governance Source Normalization Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    input.passToken ? `**${input.passToken}**` : '',
  ].join('\n');
}
