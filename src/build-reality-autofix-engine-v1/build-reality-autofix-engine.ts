/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — autonomous repair orchestrator.
 */

import {
  BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS,
  BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
} from './build-reality-autofix-types.js';
import type {
  BuildRealityAutofixAttemptRecord,
  BuildRealityAutofixInput,
  BuildRealityAutofixReport,
  BuildRealityAutofixResult,
  BuildRealityAutofixVerdict,
} from './build-reality-autofix-types.js';
import {
  buildEvidenceFromValidationResult,
  classifyBuildRealityFailures,
} from './build-reality-autofix-classifier.js';
import { isUnsafeRepairPlan, planBuildRealityRepair } from './build-reality-autofix-planner.js';
import { applyBuildRealityRepairPatch } from './build-reality-autofix-patcher.js';
import { buildBuildRealityAutofixReport } from './build-reality-autofix-report.js';

export async function runBuildRealityAutofix(
  input: BuildRealityAutofixInput,
): Promise<BuildRealityAutofixResult> {
  const startedAt = performance.now();
  const maxAttempts = Math.min(input.maxAttempts ?? BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS, BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS);
  const validationCommand = input.validationCommand ?? input.validationKind ?? 'custom';

  const initialValidation = await input.runValidation();
  if (initialValidation.passed) {
    const report = buildBuildRealityAutofixReport({
      startedAt,
      initialValidation,
      failureFindings: [],
      attempts: [],
      finalValidation: initialValidation,
      validationCommand,
      verdict: 'AUTOFIX_NOT_NEEDED',
      blockedCommand: null,
    });
    return { readOnly: true, report, repaired: false, finalValidationPassed: true };
  }

  let currentValidation = initialValidation;
  const attempts: BuildRealityAutofixAttemptRecord[] = [];
  let blockedCommand: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const failureFindings = classifyBuildRealityFailures(currentValidation.evidence);
    const plan = planBuildRealityRepair({
      findings: failureFindings,
      evidence: currentValidation.evidence,
    });

    if (plan.blockedCommand) {
      blockedCommand = plan.blockedCommand;
      const report = buildBuildRealityAutofixReport({
        startedAt,
        initialValidation,
        failureFindings,
        attempts,
        finalValidation: currentValidation,
        validationCommand,
        verdict: 'AUTOFIX_BLOCKED',
        blockedCommand,
      });
      return { readOnly: true, report, repaired: false, finalValidationPassed: false };
    }

    if (plan.actions.length === 0) {
      const verdict: BuildRealityAutofixVerdict =
        plan.primaryFailureClass === 'UNKNOWN_FAILURE' ? 'AUTOFIX_UNSAFE' : 'AUTOFIX_EXHAUSTED';
      const report = buildBuildRealityAutofixReport({
        startedAt,
        initialValidation,
        failureFindings,
        attempts,
        finalValidation: currentValidation,
        validationCommand,
        verdict,
        blockedCommand: null,
      });
      return { readOnly: true, report, repaired: attempts.some((item) => item.patch?.applied), finalValidationPassed: false };
    }

    if (isUnsafeRepairPlan(plan)) {
      const report = buildBuildRealityAutofixReport({
        startedAt,
        initialValidation,
        failureFindings,
        attempts,
        finalValidation: currentValidation,
        validationCommand,
        verdict: 'AUTOFIX_UNSAFE',
        blockedCommand: null,
      });
      return { readOnly: true, report, repaired: false, finalValidationPassed: false };
    }

    const patch = applyBuildRealityRepairPatch({
      attempt,
      plan,
      evidence: currentValidation.evidence,
    });

    if (!patch.applied) {
      attempts.push({
        readOnly: true,
        attempt,
        failureClasses: failureFindings.map((finding) => finding.failureClass),
        plan,
        patch,
        validationAfterPatch: null,
        validationPassed: false,
      });
      continue;
    }

    const validationAfterPatch = await input.runValidation();
    attempts.push({
      readOnly: true,
      attempt,
      failureClasses: failureFindings.map((finding) => finding.failureClass),
      plan,
      patch,
      validationAfterPatch,
      validationPassed: validationAfterPatch.passed,
    });

    if (validationAfterPatch.passed) {
      const report = buildBuildRealityAutofixReport({
        startedAt,
        initialValidation,
        failureFindings: classifyBuildRealityFailures(initialValidation.evidence),
        attempts,
        finalValidation: validationAfterPatch,
        validationCommand,
        verdict: 'AUTOFIX_REPAIRED',
        blockedCommand: null,
      });
      return { readOnly: true, report, repaired: true, finalValidationPassed: true };
    }

    currentValidation = validationAfterPatch;
  }

  const report = buildBuildRealityAutofixReport({
    startedAt,
    initialValidation,
    failureFindings: classifyBuildRealityFailures(initialValidation.evidence),
    attempts,
    finalValidation: currentValidation,
    validationCommand,
    verdict: blockedCommand ? 'AUTOFIX_BLOCKED' : 'AUTOFIX_EXHAUSTED',
    blockedCommand,
  });
  return {
    readOnly: true,
    report,
    repaired: attempts.some((item) => item.patch?.applied),
    finalValidationPassed: false,
  };
}

export function buildAutofixEvidenceFromE2eReport(
  e2eReport: NonNullable<BuildRealityAutofixInput['e2eReport']>,
  extra?: {
    typescriptOutput?: string | null;
    playwrightDetail?: string | null;
  },
) {
  return buildEvidenceFromValidationResult({
    e2eReport,
    workspaceDir: e2eReport.evidence.workspacePath,
    rawPrompt: e2eReport.prompt,
    typescriptOutput: extra?.typescriptOutput ?? null,
    playwrightDetail: extra?.playwrightDetail ?? null,
    detail: e2eReport.verdict,
    passed: e2eReport.verdict === 'READY_FOR_FOUNDER_TESTING',
  });
}

export { BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND };
