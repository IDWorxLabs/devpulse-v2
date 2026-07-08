/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — structured report builder.
 */

import type {
  BuildRealityAutofixAttemptRecord,
  BuildRealityAutofixFailureFinding,
  BuildRealityAutofixReport,
  BuildRealityAutofixValidationResult,
  BuildRealityAutofixVerdict,
} from './build-reality-autofix-types.js';
import {
  BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS,
} from './build-reality-autofix-types.js';
import { selectPrimaryFailureClass } from './build-reality-autofix-classifier.js';

export function buildBuildRealityAutofixReport(input: {
  startedAt: number;
  initialValidation: BuildRealityAutofixValidationResult;
  failureFindings: BuildRealityAutofixFailureFinding[];
  attempts: BuildRealityAutofixAttemptRecord[];
  finalValidation: BuildRealityAutofixValidationResult;
  validationCommand: string;
  verdict: BuildRealityAutofixVerdict;
  blockedCommand: string | null;
}): BuildRealityAutofixReport {
  const filesTouched = [
    ...new Set(
      input.attempts.flatMap((attempt) => attempt.patch?.filesTouched ?? []),
    ),
  ];
  const primaryFailureClass =
    input.failureFindings.length > 0 ? selectPrimaryFailureClass(input.failureFindings) : null;
  const primaryRootCause =
    input.failureFindings.find((finding) => finding.failureClass === primaryFailureClass)?.detail ??
    null;
  const passToken =
    input.verdict === 'AUTOFIX_NOT_NEEDED' || input.verdict === 'AUTOFIX_REPAIRED'
      ? BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS
      : null;

  return {
    readOnly: true,
    initialValidationPassed: input.initialValidation.passed,
    initialValidationDetail: input.initialValidation.detail,
    failureFindings: input.failureFindings,
    primaryFailureClass,
    primaryRootCause,
    attempts: input.attempts,
    filesTouched,
    validationCommand: input.validationCommand,
    finalValidationPassed: input.finalValidation.passed,
    finalValidationDetail: input.finalValidation.detail,
    verdict: input.verdict,
    blockedCommand: input.blockedCommand,
    passToken,
    durationMs: Math.round(performance.now() - input.startedAt),
    generatedAt: new Date().toISOString(),
  };
}

export function formatBuildRealityAutofixReportMarkdown(report: BuildRealityAutofixReport): string {
  const lines = [
    '# BUILD_REALITY_AUTOFIX_ENGINE_V1 Report',
    '',
    `- Initial validation: ${report.initialValidationPassed ? 'PASS' : 'FAIL'} — ${report.initialValidationDetail}`,
    `- Final validation: ${report.finalValidationPassed ? 'PASS' : 'FAIL'} — ${report.finalValidationDetail}`,
    `- Verdict: ${report.verdict}`,
    `- Primary failure class: ${report.primaryFailureClass ?? 'none'}`,
    `- Primary root cause: ${report.primaryRootCause ?? 'none'}`,
    `- Validation command: ${report.validationCommand}`,
    `- Files touched: ${report.filesTouched.length > 0 ? report.filesTouched.join(', ') : 'none'}`,
    `- Blocked command: ${report.blockedCommand ?? 'none'}`,
    '',
    '## Failure classes',
    ...(report.failureFindings.length
      ? report.failureFindings.map((finding) => `- ${finding.failureClass}: ${finding.detail}`)
      : ['- none']),
    '',
    '## Attempts',
    ...(report.attempts.length
      ? report.attempts.map(
          (attempt) =>
            `- #${attempt.attempt}: ${attempt.plan.primaryFailureClass} — patch=${attempt.patch?.applied ? 'yes' : 'no'} — validation=${attempt.validationPassed ? 'PASS' : 'FAIL'} — ${attempt.patch?.detail ?? attempt.plan.primaryRootCause}`,
        )
      : ['- none']),
  ];
  return lines.join('\n');
}
