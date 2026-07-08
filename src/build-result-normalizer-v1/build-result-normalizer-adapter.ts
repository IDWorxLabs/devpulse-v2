/**
 * Build Result Normalizer V1 — adapter from the real one-prompt-live-preview build result.
 * Keeps the normalizer's core logic free of the (large, evolving) build result type surface.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { NormalizedBuildResult } from './build-result-normalizer-types.js';
import { normalizeBuildResult } from './build-result-normalizer.js';
import type {
  LivePreviewInteractionProofReport,
  MaterializationManifestHints,
} from '../live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { BuildExecutionReport } from '../build-execution-stabilizer-v1/build-execution-types.js';
import { evaluateProductFaithfulness } from '../product-faithfulness-v1/product-faithfulness-engine.js';
import type { ProductFaithfulnessInput, ProductFaithfulnessReport } from '../product-faithfulness-v1/product-faithfulness-types.js';
import { runGenerationFaithfulnessAudit } from '../product-faithfulness-v2/index.js';
import type { GenerationFaithfulnessReport, GenerationStageName } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { GenerationStageRawEvidence } from '../product-faithfulness-v2/generation-faithfulness-auditor.js';

/** Derives generic, app-agnostic interaction-proof hints from the materialization manifest. */
export function deriveMaterializationManifestHints(
  manifest: OnePromptLivePreviewBuildResult['materializationManifest'],
): MaterializationManifestHints | null {
  if (!manifest) return null;
  return {
    featureModuleNames: (manifest.featureModuleDetails ?? []).map((m) => m.name).filter(Boolean),
    promptTerms: (manifest.featureModuleDetails ?? []).flatMap((m) => m.promptTerms ?? []),
    routes: manifest.routes ?? [],
  };
}

/**
 * Builds the Product Faithfulness evidence bundle from real, already-computed build evidence
 * only — the original prompt, the materialization manifest, and the live preview interaction
 * proof. No evidence is invented; fields with no real source are simply omitted.
 */
export function deriveProductFaithfulnessInput(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
): ProductFaithfulnessInput {
  const manifest = build.materializationManifest;
  const featureModuleDetails = manifest?.featureModuleDetails ?? [];

  return {
    prompt: build.prompt ?? '',
    architectureSummary: manifest?.promptSummary ? [manifest.promptSummary, manifest.expectedAppType ?? ''] : null,
    featureContract: featureModuleDetails.map((m) => ({ featureName: m.name })),
    materializationManifestHints: manifest
      ? {
          featureModuleNames: featureModuleDetails.map((m) => m.name).filter(Boolean),
          promptTerms: featureModuleDetails.flatMap((m) => m.promptTerms ?? []),
          routes: manifest.routes ?? [],
        }
      : null,
    generatedRoutes: manifest?.routes ?? [],
    generatedFeatureModules: manifest?.featureModules ?? [],
    generatedComponents: featureModuleDetails.map((m) => m.componentPath).filter(Boolean),
    navigationLabels: featureModuleDetails.map((m) => m.name).filter(Boolean),
    generatedProfile: manifest?.selectedProfile ? String(manifest.selectedProfile) : null,
    visibleHeadings: [],
    domText: livePreviewInteractionProof?.evidence.primaryFeatureTextFound ?? null,
    interactionProofEvidence: livePreviewInteractionProof
      ? {
          primaryFeatureTextFound: livePreviewInteractionProof.evidence.primaryFeatureTextFound,
          candidateTermsTried: livePreviewInteractionProof.evidence.candidateTermsTried,
          whatWorked: livePreviewInteractionProof.summary.whatWorked,
          whatFailed: livePreviewInteractionProof.summary.whatFailed,
        }
      : null,
    workspaceManifestSummary: manifest ? [manifest.expectedAppType ?? '', manifest.promptSummary ?? ''].filter(Boolean) : null,
  };
}

/**
 * Evaluates Product Faithfulness for a real build result. Returns null only when there is no
 * prompt to evaluate against (should not happen for a real build) — every other missing evidence
 * source degrades gracefully inside the engine itself.
 */
export function evaluateProductFaithfulnessForBuild(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
): ProductFaithfulnessReport | null {
  if (!build.prompt) return null;
  return evaluateProductFaithfulness(deriveProductFaithfulnessInput(build, livePreviewInteractionProof));
}

/**
 * Builds Milestone 2's per-stage raw evidence from the same real, already-computed build
 * evidence Milestone 1 uses — just structured per generation stage instead of one bundle. No
 * evidence is invented; a stage with no real source simply gets an empty evidence input, which
 * degrades gracefully inside the auditor (an empty stage is never audited).
 */
export function deriveGenerationFaithfulnessStages(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
): GenerationStageRawEvidence[] {
  const manifest = build.materializationManifest;
  const featureModuleDetails = manifest?.featureModuleDetails ?? [];

  const stages: Array<{ stage: GenerationStageName; input: ProductFaithfulnessInput }> = [
    {
      stage: 'ARCHITECTURE',
      input: {
        prompt: '',
        architectureSummary: manifest?.promptSummary ? [manifest.promptSummary, manifest.expectedAppType ?? ''] : null,
      },
    },
    {
      stage: 'FEATURE_CONTRACT',
      input: { prompt: '', featureContract: featureModuleDetails.map((m) => ({ featureName: m.name })) },
    },
    {
      stage: 'GENERATED_MODULES',
      input: { prompt: '', generatedFeatureModules: manifest?.featureModules ?? [] },
    },
    {
      stage: 'ROUTES',
      input: { prompt: '', generatedRoutes: manifest?.routes ?? [] },
    },
    {
      stage: 'NAVIGATION',
      input: { prompt: '', navigationLabels: featureModuleDetails.map((m) => m.name).filter(Boolean) },
    },
    {
      stage: 'MANIFEST',
      input: {
        prompt: '',
        workspaceManifestSummary: manifest ? [manifest.expectedAppType ?? '', manifest.promptSummary ?? ''].filter(Boolean) : null,
      },
    },
    {
      stage: 'PREVIEW_DOM',
      input: {
        prompt: '',
        domText: livePreviewInteractionProof?.evidence.primaryFeatureTextFound ?? null,
        interactionProofEvidence: livePreviewInteractionProof
          ? {
              primaryFeatureTextFound: livePreviewInteractionProof.evidence.primaryFeatureTextFound,
              candidateTermsTried: livePreviewInteractionProof.evidence.candidateTermsTried,
              whatWorked: livePreviewInteractionProof.summary.whatWorked,
              whatFailed: livePreviewInteractionProof.summary.whatFailed,
            }
          : null,
      },
    },
  ];

  return stages;
}

/**
 * Evaluates Product Faithfulness Milestone 2 for a real build result: builds the canonical
 * contract from the original prompt, audits every evidenced generation stage against it, attempts
 * minimal repair, and returns the extended report. Returns null only when there is no prompt.
 */
export function evaluateGenerationFaithfulnessForBuild(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
): GenerationFaithfulnessReport | null {
  if (!build.prompt) return null;
  return runGenerationFaithfulnessAudit({ prompt: build.prompt }, deriveGenerationFaithfulnessStages(build, livePreviewInteractionProof));
}

export function normalizeOnePromptBuildResult(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
  buildExecutionReport?: BuildExecutionReport | null,
  productFaithfulnessReport?: ProductFaithfulnessReport | null,
  generationFaithfulnessReport?: GenerationFaithfulnessReport | null,
): NormalizedBuildResult {
  const manifest = build.materializationManifest;
  const autofixAttempts = build.buildAutofixLoop?.attempts?.map((attempt) => ({
    attempt: attempt.attempt,
    failureClass: attempt.failureClass,
    repairApplied: attempt.repairApplied,
    buildRerunOk: attempt.buildRerunOk,
  }));

  return normalizeBuildResult({
    status: build.status,
    npmInstallOk: build.npmInstallOk,
    npmBuildOk: build.npmBuildOk,
    devServerRunning: build.devServerRunning,
    previewUrl: build.previewUrl,
    diagnosticPreviewUrl: build.diagnosticPreviewUrl,
    limitedPreviewUrl: build.limitedPreviewUrl,
    livePreviewAvailable: build.livePreviewAvailable,
    failureReason: build.failureReason,
    buildAutofixAttempts: build.buildAutofixAttempts,
    previewRecoveryAttempts: build.previewRecoveryAttempts,
    buildAutofixLoopAttempts: autofixAttempts,
    visiblePreviewValidationStatus: manifest?.visiblePreviewValidationStatus ?? null,
    visiblePreviewValidationFailureReasons: manifest?.visiblePreviewValidationFailureReasons ?? [],
    livePreviewInteractionProof: livePreviewInteractionProof ?? null,
    workspaceStabilizerReport: build.workspaceStabilizerReport ?? null,
    buildExecutionReport: buildExecutionReport ?? build.executionReport ?? null,
    productFaithfulnessReport: productFaithfulnessReport ?? null,
    generationFaithfulnessReport: generationFaithfulnessReport ?? null,
  });
}
