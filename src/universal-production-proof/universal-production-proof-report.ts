/**
 * Universal Production Proof V1 — report builder.
 */

import type {
  UniversalProductionProofProfileResult,
  UniversalProductionProofReport,
} from './universal-production-proof-types.js';
import {
  buildUniversalProductionProofChatSummary,
  deriveUniversalProductionOverallVerdict,
} from './universal-production-proof-verdict.js';

export function buildUniversalProductionProofReport(input: {
  runId: string;
  profileResults: UniversalProductionProofProfileResult[];
  artifactPath: string;
  reportPath: string;
}): UniversalProductionProofReport {
  const { verdict, allowedWarnings, failureReasons } = deriveUniversalProductionOverallVerdict(
    input.profileResults,
  );
  const passedProfiles = input.profileResults.filter((result) => result.profileVerdict === 'PASS').length;
  const warnedProfiles = input.profileResults.filter((result) => result.profileVerdict === 'WARN').length;
  const failedProfiles = input.profileResults.filter((result) => result.profileVerdict === 'FAIL').length;
  const recordedAt = new Date().toISOString();

  const report: UniversalProductionProofReport = {
    readOnly: true,
    runId: input.runId,
    overallVerdict: verdict,
    profileCount: input.profileResults.length,
    passedProfiles,
    warnedProfiles,
    failedProfiles,
    matrix: input.profileResults.map((result) => result.matrixRow),
    profileResults: input.profileResults,
    allowedWarnings,
    failureReasons,
    artifactPath: input.artifactPath,
    reportPath: input.reportPath,
    chatSummary: '',
    recordedAt,
  };

  report.chatSummary = buildUniversalProductionProofChatSummary(report);
  return report;
}

export function buildUniversalProductionProofMarkdown(report: UniversalProductionProofReport): string {
  const lines = [
    '# Universal Production Proof Report',
    '',
    `**Run ID:** ${report.runId}`,
    `**Overall verdict:** ${report.overallVerdict}`,
    `**Profiles:** ${report.passedProfiles} passed, ${report.warnedProfiles} warned, ${report.failedProfiles} failed / ${report.profileCount} total`,
    `**Recorded at:** ${report.recordedAt}`,
    '',
    '## Matrix',
    '',
    '```',
    report.matrix
      .map(
        (row) =>
          `${row.profile} | ${row.classify} | ${row.generate} | ${row.modular} | ${row.build} | ${row.preview} | ${row.blueprint} | ${row.prodVal} | ${row.history} | ${row.persist} | ${row.score} | ${row.featureReality} | ${row.workspaceAudit} | ${row.exportReady} | ${row.chat} | ${row.trace} | ${row.verdict}`,
      )
      .join('\n'),
    '```',
    '',
    '## Chat Summary',
    '',
    report.chatSummary,
    '',
  ];

  if (report.failureReasons.length > 0) {
    lines.push('## Failure Reasons', '', ...report.failureReasons.map((reason) => `- ${reason}`), '');
  }

  if (report.allowedWarnings.length > 0) {
    lines.push('## Allowed Warnings', '', ...report.allowedWarnings.map((warning) => `- ${warning}`), '');
  }

  return `${lines.join('\n')}\n`;
}
