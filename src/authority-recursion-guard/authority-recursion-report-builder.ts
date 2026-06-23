/**
 * Phase 26.93 — Authority Recursion Guard report builder (V1).
 */

import {
  AUTHORITY_RECURSION_GUARD_CORE_QUESTION,
  GUARDED_AUTHORITIES,
  RECURSION_GUARD_SAFETY_GUARANTEES,
} from './authority-recursion-guard-registry.js';
import type { AuthorityRecursionDetection, AuthorityRecursionGuardReport } from './authority-recursion-guard-types.js';
import type { AuthoritySafeFallbackEvidence } from './authority-recursion-guard-types.js';

export function buildAuthorityRecursionGuardReportMarkdown(report: AuthorityRecursionGuardReport): string {
  const lines: string[] = [
    '# Authority Recursion Guard Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Guard ID: ${report.guardId}`,
    '',
    '## Core Question',
    '',
    AUTHORITY_RECURSION_GUARD_CORE_QUESTION,
    '',
    '## Safety Guarantees',
    '',
    ...RECURSION_GUARD_SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Guarded Authorities',
    '',
    ...GUARDED_AUTHORITIES.map((a) => `- ${a}`),
    '',
    '## Detections',
    '',
    report.detections.length
      ? report.detections.map((d) => `- **${d.ruleId}** @ ${d.authorityName}: ${d.reason}`).join('\n')
      : '- No recursion detections recorded in this assessment',
    '',
    report.passToken ? `Pass token: **${report.passToken}**` : 'Pass token: not issued',
  ];
  return lines.join('\n');
}

export function buildAuthorityRecursionGuardValidationMarkdown(report: AuthorityRecursionGuardReport): string {
  return [
    '# Authority Recursion Guard Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Detections recorded: ${report.detections.length}`,
    `- Pass token: ${report.passToken ?? 'none'}`,
    '',
    report.passToken ? `**${report.passToken}**` : 'Validation did not pass.',
  ].join('\n');
}

export function buildAuthorityRecursionGuardFallbackReportMarkdown(input: {
  detections: readonly AuthorityRecursionDetection[];
  fallbacks: readonly AuthoritySafeFallbackEvidence[];
}): string {
  const lines: string[] = [
    '# Authority Recursion Guard Fallback Report',
    '',
    '## Fallback Policy',
    '',
    '- proofLevel=PARTIAL or UNKNOWN',
    '- launchImpact=TESTING_INFRASTRUCTURE_DEFECT',
    '- skippedHeavyOrchestration=true',
    '- recommendedFix: pass precomputed evidence into guarded path',
    '',
    '## Detections',
    '',
  ];

  for (const detection of input.detections) {
    lines.push(`### ${detection.authorityName}`);
    lines.push('');
    lines.push(`Rule: ${detection.ruleId}`);
    lines.push(`Reason: ${detection.reason}`);
    lines.push(`Caller stack: ${detection.callerStack.join(' → ')}`);
    lines.push('');
  }

  lines.push('## Safe Fallback Evidence');
  lines.push('');
  for (const fallback of input.fallbacks) {
    lines.push(`- ${fallback.authorityName}: ${fallback.verdict} (${fallback.proofLevel}) — ${fallback.reason}`);
  }

  return lines.join('\n');
}
