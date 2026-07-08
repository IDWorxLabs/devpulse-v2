/**
 * Live Preview Interaction Proof V1 — engine.
 *
 * Orchestrates planner -> runner -> normalizer -> report. Enforces the overall time budget.
 * Runs only when previewUrl exists and devServerRunning is true — otherwise returns BLOCKED
 * immediately with a plain reason, without touching Playwright at all.
 */

import type {
  InteractionAttemptRecord,
  LivePreviewInteractionProofEvidence,
  LivePreviewInteractionProofInput,
  LivePreviewInteractionProofReport,
} from './live-preview-interaction-proof-types.js';
import {
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS,
  LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
} from './live-preview-interaction-proof-types.js';
import { derivePrimaryFeatureCandidates, planInteractions } from './live-preview-interaction-proof-planner.js';
import { attemptInteraction, launchDefaultProofPageDriver, type ProofPageDriver } from './live-preview-interaction-proof-runner.js';
import { classifyInteractionProof } from './live-preview-interaction-proof-normalizer.js';
import { buildInteractionProofSummary } from './live-preview-interaction-proof-report.js';

export interface LivePreviewInteractionProofDeps {
  /** Injectable for tests — defaults to the real bounded Playwright driver. */
  launchDriver?: () => Promise<{ ok: true; driver: ProofPageDriver } | { ok: false; blockedReason: string }>;
}

function blockedReport(reason: string): LivePreviewInteractionProofReport {
  const evidence: LivePreviewInteractionProofEvidence = {
    readOnly: true,
    previewUrl: null,
    pageLoaded: false,
    loadErrorDetail: null,
    consoleErrors: [],
    fatalConsoleErrorDetected: false,
    rootUiFound: false,
    primaryFeatureTextFound: null,
    candidateTermsTried: [],
    plannedInteractions: [],
    interactionAttempts: [],
    durationMs: 0,
    blockedReason: reason,
  };
  return {
    readOnly: true,
    contractVersion: LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
    result: 'PREVIEW_INTERACTION_BLOCKED',
    evidence,
    summary: buildInteractionProofSummary(evidence, 'PREVIEW_INTERACTION_BLOCKED'),
  };
}

export async function runLivePreviewInteractionProof(
  input: LivePreviewInteractionProofInput,
  deps: LivePreviewInteractionProofDeps = {},
): Promise<LivePreviewInteractionProofReport> {
  if (!input.previewUrl || !input.devServerRunning) {
    return blockedReport(
      !input.previewUrl
        ? 'No live preview URL is available yet — the interaction proof needs a running preview to test.'
        : 'The preview dev server is not running — the interaction proof needs a live server to test.',
    );
  }

  const maxLoadWaitMs = input.maxLoadWaitMs ?? LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS;
  const maxInteractionAttempts =
    input.maxInteractionAttempts ?? LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS;
  const maxTotalProofTimeMs =
    input.maxTotalProofTimeMs ?? LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS;

  const startedAt = Date.now();
  const deadline = startedAt + maxTotalProofTimeMs;
  const launchDriver = deps.launchDriver ?? launchDefaultProofPageDriver;

  const launched = await launchDriver();
  if (!launched.ok) {
    return blockedReport(launched.blockedReason);
  }

  const driver = launched.driver;
  const candidates = derivePrimaryFeatureCandidates({
    prompt: input.prompt,
    featureContractHints: input.featureContractHints,
    materializationManifestHints: input.materializationManifestHints,
  });
  const plannedInteractions = planInteractions(maxInteractionAttempts);

  try {
    const nav = await driver.goto(input.previewUrl, Math.min(maxLoadWaitMs, Math.max(0, deadline - Date.now())));
    if (!nav.ok) {
      const evidence: LivePreviewInteractionProofEvidence = {
        readOnly: true,
        previewUrl: input.previewUrl,
        pageLoaded: false,
        loadErrorDetail: nav.error ?? 'Unknown navigation error',
        consoleErrors: driver.getConsoleErrors(),
        fatalConsoleErrorDetected: driver.getFatalErrors().length > 0,
        rootUiFound: false,
        primaryFeatureTextFound: null,
        candidateTermsTried: candidates.candidateTerms,
        plannedInteractions,
        interactionAttempts: [],
        durationMs: Date.now() - startedAt,
        blockedReason: null,
      };
      const result = classifyInteractionProof(evidence);
      return {
        readOnly: true,
        contractVersion: LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
        result,
        evidence,
        summary: buildInteractionProofSummary(evidence, result),
      };
    }

    const rootUiCount = await driver.countRootUi();
    const rootUiFound = rootUiCount > 0;

    let primaryFeatureTextFound: string | null = null;
    for (const term of candidates.candidateTerms) {
      if (Date.now() > deadline) break;
      const found = await driver.findVisibleText(term);
      if (found) {
        primaryFeatureTextFound = term;
        break;
      }
    }

    const interactionAttempts: InteractionAttemptRecord[] = [];
    if (rootUiFound) {
      for (const interaction of plannedInteractions) {
        if (interactionAttempts.length >= maxInteractionAttempts) break;
        if (Date.now() > deadline) break;
        const attempt = await attemptInteraction(driver, interaction);
        interactionAttempts.push(attempt);
        // No infinite retries: once a genuine state change is confirmed, we have our proof and stop.
        if (attempt.performed && attempt.stateChanged) break;
      }
    }

    const consoleErrors = driver.getConsoleErrors();
    const fatalConsoleErrorDetected = driver.getFatalErrors().length > 0;

    const evidence: LivePreviewInteractionProofEvidence = {
      readOnly: true,
      previewUrl: input.previewUrl,
      pageLoaded: true,
      loadErrorDetail: null,
      consoleErrors,
      fatalConsoleErrorDetected,
      rootUiFound,
      primaryFeatureTextFound,
      candidateTermsTried: candidates.candidateTerms,
      plannedInteractions,
      interactionAttempts,
      durationMs: Date.now() - startedAt,
      blockedReason: null,
    };

    const result = classifyInteractionProof(evidence);
    return {
      readOnly: true,
      contractVersion: LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
      result,
      evidence,
      summary: buildInteractionProofSummary(evidence, result),
    };
  } finally {
    await driver.close().catch(() => undefined);
  }
}
