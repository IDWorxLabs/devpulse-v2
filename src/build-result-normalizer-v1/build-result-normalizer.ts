/**
 * Build Result Normalizer V1 — implementation.
 *
 * Rule that drives Product Stabilization Phase 1: if npm install passed, npm build passed, the
 * dev server is running, and a preview URL is reachable, the founder-facing UI must NOT show a
 * scary full failure — that is treated as BUILT_SUCCESSFULLY or BUILT_WITH_WARNINGS. Internal
 * validation / launch-readiness / preview-authority gates that haven't cleared are reported as
 * warnings, visible in Advanced Diagnostics, never as the headline result.
 *
 * Note: internal "visible preview validation" signals (workspace reality audit, preview-authority
 * iframe consistency, etc.) were found — by direct testing against the real build pipeline — to
 * flag false positives for API-driven builds simply because no browser has embedded the preview
 * in an iframe yet (a structural artifact of when that check runs, not evidence the app is
 * broken). Because of that, this normalizer treats "build output ready + preview reachable" as
 * sufficient for a non-scary result, and never repeats that internal jargon to the user — it is
 * reflected only in the `validationNeedsWork` / `launchNotReady` stage flags for Advanced
 * Diagnostics.
 */

import type {
  NormalizedBuildExecutionSummary,
  NormalizedBuildPlainEnglishSummary,
  NormalizedBuildRealityStages,
  NormalizedBuildResult,
  NormalizedBuildResultKind,
  NormalizedGenerationFaithfulnessSummary,
  NormalizedLivePreviewProofSummary,
  NormalizedProductFaithfulnessSummary,
  NormalizedWorkspaceMaterializationSummary,
} from './build-result-normalizer-types.js';
import { BUILD_RESULT_NORMALIZER_V1_CONTRACT } from './build-result-normalizer-types.js';
import type { LivePreviewInteractionProofReport } from '../live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { WorkspaceMaterializationReport } from '../workspace-materialization-stabilizer-v1/workspace-materialization-types.js';
import type { BuildExecutionReport } from '../build-execution-stabilizer-v1/build-execution-types.js';
import type { ProductFaithfulnessReport } from '../product-faithfulness-v1/product-faithfulness-types.js';
import type { GenerationFaithfulnessReport } from '../product-faithfulness-v2/generation-faithfulness-types.js';

export interface BuildResultNormalizerAutofixAttemptInput {
  attempt: number;
  failureClass?: string | null;
  repairApplied: boolean;
  buildRerunOk: boolean;
}

/** Minimal, defensive input shape — only the concrete signals needed to classify the result. */
export interface BuildResultNormalizerInput {
  status: 'IDLE' | 'BUILDING' | 'READY' | 'FAILED' | string;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  devServerRunning: boolean;
  previewUrl: string | null;
  diagnosticPreviewUrl?: string | null;
  limitedPreviewUrl?: string | null;
  livePreviewAvailable?: boolean;
  failureReason?: string | null;
  buildAutofixAttempts?: number;
  previewRecoveryAttempts?: number;
  buildAutofixLoopAttempts?: BuildResultNormalizerAutofixAttemptInput[];
  /** Internal validators (workspace reality audit, preview authority, quality score, etc.) found issues — informational only, never a failure trigger by itself. */
  visiblePreviewValidationStatus?: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED' | null;
  visiblePreviewValidationFailureReasons?: string[];
  /** Phase 2: live preview interaction proof report, when it has been run for this build. */
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null;
  /** Phase 3: workspace materialization stabilizer report, when it has run for this build. */
  workspaceStabilizerReport?: WorkspaceMaterializationReport | null;
  /** Phase 4: build execution stabilizer report, when it has run for this build. */
  buildExecutionReport?: BuildExecutionReport | null;
  /** Product Faithfulness Milestone 1: whether the generated app is the requested product, when evaluated. */
  productFaithfulnessReport?: ProductFaithfulnessReport | null;
  /** Product Faithfulness Milestone 2: whether product identity survived generation, when evaluated. */
  generationFaithfulnessReport?: GenerationFaithfulnessReport | null;
}

function humanizeFailureClass(failureClass: string | null | undefined): string {
  if (!failureClass) return 'a build issue';
  return failureClass.toLowerCase().replace(/_/g, ' ');
}

export function normalizeBuildResult(input: BuildResultNormalizerInput): NormalizedBuildResult {
  const dependenciesReady = input.npmInstallOk === true;
  const buildReady = input.npmBuildOk === true;
  const buildOutputReady = dependenciesReady && buildReady;
  const previewUrl =
    input.previewUrl || input.diagnosticPreviewUrl || input.limitedPreviewUrl || null;
  const previewReady = input.devServerRunning === true && Boolean(previewUrl);
  const rawFailed = input.status === 'FAILED';
  const internalChecksFlaggedIssues = input.visiblePreviewValidationStatus === 'FAIL';

  const workspaceReport = input.workspaceStabilizerReport ?? null;
  const workspaceStatus = workspaceReport?.status ?? null;
  // Not having a report at all (older builds) is treated as ready — this stage is additive, not a regression trigger.
  const workspaceReady =
    workspaceStatus === null || workspaceStatus === 'WORKSPACE_COMPLETE' || workspaceStatus === 'WORKSPACE_REPAIRED';
  const workspaceFoundAProblem = workspaceStatus === 'WORKSPACE_INCOMPLETE';

  const autofixAttempts = input.buildAutofixLoopAttempts ?? [];
  const hasRepairAttempts =
    (input.buildAutofixAttempts ?? autofixAttempts.length) > 0 ||
    (input.previewRecoveryAttempts ?? 0) > 0;

  const proof = input.livePreviewInteractionProof ?? null;
  const interactionProofChecked = proof !== null && proof.result !== 'PREVIEW_INTERACTION_BLOCKED';
  const interactionProofPassed = interactionProofChecked ? proof!.result === 'PREVIEW_INTERACTION_PASS' : null;
  // Real evidence the app doesn't work — not fake success, but also not the scary "build failed" path,
  // because the build and preview genuinely did work. Proof BLOCKED (e.g. missing local browser tooling)
  // is an infra limitation, not evidence of app breakage, so it never downgrades the result.
  const interactionProofFoundAProblem =
    proof !== null &&
    (proof.result === 'PREVIEW_INTERACTION_FAIL' || proof.result === 'PREVIEW_INTERACTION_PARTIAL');

  const executionReport = input.buildExecutionReport ?? null;
  // No report at all (older builds, or a build that failed before execution stabilization ever ran)
  // is treated as healthy — this stage is additive, not a regression trigger.
  const executionHealthy =
    executionReport === null ||
    executionReport.overallState === 'COMPLETED' ||
    executionReport.overallState === 'RECOVERED';
  const executionFailedOrBlocked =
    executionReport !== null &&
    (executionReport.overallState === 'FAILED' || executionReport.overallState === 'BLOCKED');
  // Preview-startup recovery can exhaust while Vite still serves a working app. Do not convert
  // that into a product warning when the preview is actually reachable. Unrecovered failures in
  // earlier stages (npm install/build) still downgrade to BUILT_WITH_WARNINGS.
  const previewOnlyExecutionFailure =
    executionFailedOrBlocked &&
    (() => {
      const recoveryStages = (executionReport?.recoveryAttempts ?? []).map((attempt) => String(attempt.stage ?? ''));
      if (recoveryStages.length > 0) {
        return recoveryStages.every((stage) => /PREVIEW/i.test(stage));
      }
      const label = String(executionReport?.summary?.currentStageLabel ?? '');
      return /preview/i.test(label);
    })();
  const executionUnrecoveredFailure =
    executionFailedOrBlocked && !(previewReady && previewOnlyExecutionFailure);

  const faithfulnessReport = input.productFaithfulnessReport ?? null;
  const faithfulnessIsMismatch = faithfulnessReport?.verdict === 'PRODUCT_MISMATCH';
  const faithfulnessIsLow = faithfulnessReport?.verdict === 'LOW_FAITHFULNESS';

  const genReport = input.generationFaithfulnessReport ?? null;
  const genVerdict = genReport?.verdict ?? null;
  const genRepairsApplied = (genReport?.repairsPerformed ?? []).some((r) => r.applied);

  // The one rule that matters: working build output + reachable preview is never a scary failure.
  let result: NormalizedBuildResultKind;
  if (!buildOutputReady || !previewReady) {
    result = hasRepairAttempts ? 'FAILED_WITH_REPAIR_AVAILABLE' : 'FAILED_BLOCKED';
  } else if (interactionProofFoundAProblem || workspaceFoundAProblem) {
    result = 'BUILT_WITH_WARNINGS';
  } else if (rawFailed) {
    result = 'BUILT_WITH_WARNINGS';
  } else if (executionUnrecoveredFailure) {
    result = 'BUILT_WITH_WARNINGS';
  } else {
    result = 'BUILT_SUCCESSFULLY';
  }

  // Product Faithfulness Milestone 1: the app running is not the same question as the app being
  // the correct app. A build can pass every technical gate and still not be what was requested —
  // that can never be reported as BUILT_SUCCESSFULLY (or silently folded into "warnings").
  if (result === 'BUILT_SUCCESSFULLY' || result === 'BUILT_WITH_WARNINGS') {
    if (faithfulnessIsMismatch) {
      result = 'BUILT_WITH_PRODUCT_MISMATCH';
    } else if (faithfulnessIsLow) {
      result = 'BUILT_WITH_LOW_FAITHFULNESS';
    }
  }

  // Product Faithfulness Milestone 2: these are product-level outcomes, not compiler outcomes —
  // they only ever apply on top of a technically working build/preview, and they supersede the
  // Milestone 1 verdict because they reflect whether product identity survived generation itself
  // (a more specific, more current signal than the finished-app-only comparison above).
  if (buildOutputReady && previewReady && genReport) {
    if (genVerdict === 'INCONSISTENT') {
      result = 'FAILED_CONTRACT_INCONSISTENCY';
    } else if (genVerdict === 'SUBSTITUTED') {
      result = 'FAILED_PRODUCT_DRIFT';
    } else if (genRepairsApplied) {
      result = 'BUILT_AFTER_FAITHFULNESS_REPAIR';
    }
  }

  const stages: NormalizedBuildRealityStages = {
    readOnly: true,
    workspaceReady,
    dependenciesReady,
    buildReady,
    buildOutputReady,
    previewReady,
    validationNeedsWork:
      buildOutputReady &&
      previewReady &&
      (rawFailed || internalChecksFlaggedIssues || interactionProofFoundAProblem || workspaceFoundAProblem),
    launchNotReady: rawFailed,
    interactionProofChecked,
    interactionProofPassed,
    executionHealthy,
  };

  const whatWorked: string[] = [];
  const whatFailed: string[] = [];
  const whatAiDevEngineTried: string[] = [];

  if (workspaceStatus === 'WORKSPACE_REPAIRED' && workspaceReport) {
    whatWorked.push('AiDevEngine found and repaired workspace issues before the build started.');
  }
  if (input.npmInstallOk) whatWorked.push('Installed all dependencies successfully.');
  if (input.npmBuildOk) whatWorked.push('The generated app compiled without errors.');
  if (previewReady) whatWorked.push('A live preview server is running and reachable.');

  if (!buildOutputReady) {
    if (workspaceStatus === 'WORKSPACE_BLOCKED' || workspaceStatus === 'WORKSPACE_CORRUPTED') {
      whatFailed.push(workspaceReport!.summary.headline);
    } else if (input.failureReason) {
      whatFailed.push(input.failureReason);
    } else if (!input.npmInstallOk) {
      whatFailed.push('Installing dependencies failed.');
    } else {
      whatFailed.push('The generated app did not compile.');
    }
  } else if (!previewReady) {
    whatFailed.push(input.failureReason || 'The live preview server did not start or is not reachable.');
  } else if (result === 'FAILED_CONTRACT_INCONSISTENCY' || result === 'FAILED_PRODUCT_DRIFT') {
    whatWorked.push('The app builds, runs, and is available in the live preview.');
    if (genReport) whatFailed.push(genReport.summary.reason);
  } else if (result === 'BUILT_AFTER_FAITHFULNESS_REPAIR') {
    whatWorked.push('The app builds, runs, and is available in the live preview.');
    if (genReport) {
      if (genReport.recoveredConcepts.length > 0) {
        whatWorked.push(
          `AiDevEngine detected product drift during generation and repaired it — recovered: ${genReport.recoveredConcepts.join(', ')}.`,
        );
      }
      if (genReport.remainingMissingConcepts.length > 0) {
        whatFailed.push(`Still missing after repair: ${genReport.remainingMissingConcepts.join(', ')}.`);
      }
    }
  } else if (result === 'BUILT_WITH_PRODUCT_MISMATCH' || result === 'BUILT_WITH_LOW_FAITHFULNESS') {
    whatWorked.push('The app builds, runs, and is available in the live preview.');
    if (faithfulnessReport) {
      whatFailed.push(faithfulnessReport.summary.reason);
    }
    if (workspaceFoundAProblem && workspaceReport) {
      whatFailed.push(workspaceReport.summary.headline);
    }
    if (interactionProofFoundAProblem && proof) {
      whatFailed.push(proof.summary.headline);
    }
  } else if (result === 'BUILT_WITH_WARNINGS') {
    whatWorked.push('The app builds, runs, and is available in the live preview.');
    if (workspaceFoundAProblem && workspaceReport) {
      whatFailed.push(workspaceReport.summary.headline);
    }
    if (interactionProofFoundAProblem && proof) {
      whatFailed.push(proof.summary.headline);
    } else if (internalChecksFlaggedIssues) {
      whatFailed.push(
        'Some deeper automated quality checks have not confirmed everything yet — see Advanced Diagnostics for details. This does not mean the app is broken.',
      );
    }
  } else if (result === 'BUILT_SUCCESSFULLY' && interactionProofPassed && proof) {
    whatWorked.push(proof.summary.headline);
  }

  if (workspaceReport && workspaceReport.summary.repaired.length > 0) {
    whatAiDevEngineTried.push(
      `Repaired the generated workspace before the build started: ${workspaceReport.summary.repaired.join(', ')}.`,
    );
  }

  autofixAttempts.forEach((attempt) => {
    whatAiDevEngineTried.push(
      `Repair attempt ${attempt.attempt} for ${humanizeFailureClass(attempt.failureClass)}: ` +
        `${attempt.repairApplied ? 'applied a fix' : 'no automatic fix available'}` +
        `${attempt.buildRerunOk ? ', and the rebuild passed afterward.' : ', rebuild still failing.'}`,
    );
  });
  if (input.previewRecoveryAttempts) {
    whatAiDevEngineTried.push(
      `Attempted to recover the live preview ${input.previewRecoveryAttempts} time(s).`,
    );
  }

  if (genReport) {
    for (const action of genReport.repairsPerformed) {
      if (action.applied) whatAiDevEngineTried.push(action.detail);
    }
  }

  if (executionReport) {
    for (const attempt of executionReport.recoveryAttempts) {
      whatAiDevEngineTried.push(
        `Detected a pause during ${attempt.stage.toLowerCase().replace(/_/g, ' ')} and attempted one automatic recovery — ${
          attempt.succeeded ? 'it worked.' : 'it did not resolve the issue.'
        }`,
      );
    }
    if (executionUnrecoveredFailure && !whatFailed.some((f) => f.toLowerCase().includes('execution'))) {
      whatFailed.push(executionReport.summary.headline);
    }
  }

  let headline: string;
  let whatToDoNext: string;
  switch (result) {
    case 'BUILT_SUCCESSFULLY':
      headline = 'Your app built successfully and is running in the live preview.';
      whatToDoNext =
        'Open the live preview and try it out. If something looks off, describe the change you want and build again.';
      break;
    case 'BUILT_WITH_WARNINGS':
      headline = 'Your app is built and running — some background checks are still catching up.';
      whatToDoNext =
        'The app in the live preview is real and working. Deeper automated quality checks flagged items you can review in Advanced Diagnostics, but they do not block using or testing the app.';
      break;
    case 'BUILT_WITH_PRODUCT_MISMATCH':
      headline = 'The app runs, but it does not look like the product you asked for.';
      whatToDoNext =
        'The app in the live preview works technically, but AiDevEngine compared it against your prompt and found it represents a different product. Review the Product Faithfulness panel, then describe your idea again or build once more.';
      break;
    case 'BUILT_WITH_LOW_FAITHFULNESS':
      headline = 'The app runs, but only partly resembles the product you asked for.';
      whatToDoNext =
        'The app in the live preview works technically, but several requested concepts are missing or unexpected. Review the Product Faithfulness panel to see what to fix, then build again.';
      break;
    case 'BUILT_AFTER_FAITHFULNESS_REPAIR':
      headline = 'Your app built successfully — AiDevEngine caught and repaired product drift during generation.';
      whatToDoNext =
        'Some requested concepts drifted out of a generation stage and were automatically recovered before the build finished. Open the live preview to confirm it looks right, then keep going.';
      break;
    case 'FAILED_PRODUCT_DRIFT':
      headline = 'The app runs, but generation drifted away from the product you asked for.';
      whatToDoNext =
        'AiDevEngine compared every generation stage against your original request and found the product identity was lost partway through, and automatic repair could not fully recover it. Review the Product Faithfulness panel, then build again.';
      break;
    case 'FAILED_CONTRACT_INCONSISTENCY':
      headline = 'AiDevEngine could not keep generation consistent with the product you asked for.';
      whatToDoNext =
        'The generated app no longer represents your original request closely enough, even after an automatic repair attempt. Try describing your idea again with more detail, then build once more.';
      break;
    case 'FAILED_WITH_REPAIR_AVAILABLE':
      headline = 'The build hit a problem, and AiDevEngine already tried to repair it.';
      whatToDoNext =
        'Click Retry to let AiDevEngine try again, or describe your idea with more detail and build again.';
      break;
    case 'FAILED_BLOCKED':
    default:
      headline = 'AiDevEngine could not produce a working app from this prompt.';
      whatToDoNext =
        'Try simplifying your prompt or describing the app differently, then build again.';
      break;
  }

  const summary: NormalizedBuildPlainEnglishSummary = {
    readOnly: true,
    whatWorked,
    whatFailed,
    whatAiDevEngineTried,
    whatToDoNext,
    headline,
  };

  const livePreviewProof: NormalizedLivePreviewProofSummary | null = proof
    ? {
        readOnly: true,
        result: proof.result,
        headline: proof.summary.headline,
        whatWorked: proof.summary.whatWorked,
        whatFailed: proof.summary.whatFailed,
        suggestedRepair: proof.summary.suggestedRepair,
      }
    : null;

  const workspaceMaterialization: NormalizedWorkspaceMaterializationSummary | null = workspaceReport
    ? {
        readOnly: true,
        status: workspaceReport.status,
        headline: workspaceReport.summary.headline,
        repaired: workspaceReport.summary.repaired,
        stillMissing: workspaceReport.summary.stillMissing,
      }
    : null;

  const productFaithfulness: NormalizedProductFaithfulnessSummary | null = faithfulnessReport
    ? {
        readOnly: true,
        score: faithfulnessReport.score,
        verdict: faithfulnessReport.verdict,
        headline: faithfulnessReport.summary.headline,
        reason: faithfulnessReport.summary.reason,
        topMatched: faithfulnessReport.summary.topMatched,
        topMissing: faithfulnessReport.summary.topMissing,
        topUnexpected: faithfulnessReport.summary.topUnexpected,
      }
    : null;

  const generationFaithfulness: NormalizedGenerationFaithfulnessSummary | null = genReport
    ? {
        readOnly: true,
        productIdentity: genReport.contract.productIdentity,
        conceptRetentionPercent: genReport.conceptRetentionPercent,
        conceptDriftPercent: genReport.conceptDriftPercent,
        verdict: genReport.verdict,
        repairsPerformed: genReport.repairsPerformed.map((r) => r.detail),
        recoveredConcepts: genReport.recoveredConcepts,
        remainingMissingConcepts: genReport.remainingMissingConcepts,
        unexpectedDominantConcepts: genReport.unexpectedDominantConcepts,
        headline: genReport.summary.headline,
        reason: genReport.summary.reason,
      }
    : null;

  const buildExecution: NormalizedBuildExecutionSummary | null = executionReport
    ? {
        readOnly: true,
        state: executionReport.overallState,
        currentStageLabel: executionReport.summary.currentStageLabel,
        elapsedLabel: executionReport.summary.elapsedLabel,
        heartbeatLabel: executionReport.summary.heartbeatLabel,
        recoveryLabel: executionReport.summary.recoveryLabel,
        nextStepLabel: executionReport.summary.nextStepLabel,
        headline: executionReport.summary.headline,
      }
    : null;

  return {
    readOnly: true,
    contractVersion: BUILD_RESULT_NORMALIZER_V1_CONTRACT,
    result,
    stages,
    summary,
    showLivePreview: input.devServerRunning === true && Boolean(input.previewUrl),
    previewUrl,
    livePreviewProof,
    workspaceMaterialization,
    buildExecution,
    productFaithfulness,
    generationFaithfulness,
  };
}
