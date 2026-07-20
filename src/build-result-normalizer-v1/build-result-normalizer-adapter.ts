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
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import { runContractToModuleTraceabilityEvaluation } from '../contract-to-module-traceability/contract-to-module-traceability-authority.js';
import { resolveUniversalFeatureNamesForCurrentBuild } from '../contract-to-module-traceability/feature-contract-surface-resolver.js';
import { buildCanonicalProductFaithfulnessFindings } from '../production-surface-integration/product-faithfulness-surface.js';
import { requireApprovedProductionBuildEnvelopeForContext } from '../contract-bound-generation-authority-v4/index.js';
import {
  assertFaithfulnessMetricInvariants,
  normalizeCapabilityIdentity,
  retentionPercentFromMissing,
  suppressLexicalFragmentsOfCapabilities,
} from '../product-faithfulness-v2/verification-accuracy.js';

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
  const approvedModuleIds =
    build.approvedProductionBuildEnvelope?.approvedModulePlan.moduleIds ?? [];
  const approvedNavigationEntries =
    build.approvedProductionBuildEnvelope?.approvedNavigationPlan.productEntries ?? [];
  const featureNames =
    featureModuleDetails.length > 0
      ? featureModuleDetails.map((module) => module.name).filter(Boolean)
      : [...approvedModuleIds];
  const navigationLabels =
    featureModuleDetails.length > 0
      ? featureModuleDetails.map((module) => module.name).filter(Boolean)
      : [...new Set([...approvedNavigationEntries, ...approvedModuleIds])];

  return {
    prompt: build.prompt ?? '',
    architectureSummary: manifest?.promptSummary ? [manifest.promptSummary, manifest.expectedAppType ?? ''] : null,
    featureContract: featureNames.map((featureName) => ({ featureName })),
    materializationManifestHints: manifest
      ? {
          featureModuleNames: featureNames,
          promptTerms: featureModuleDetails.flatMap((m) => m.promptTerms ?? []),
          routes: manifest.routes ?? [],
        }
      : null,
    generatedRoutes: manifest?.routes ?? [],
    generatedFeatureModules: manifest?.featureModules ?? [],
    generatedComponents: featureModuleDetails.map((m) => m.componentPath).filter(Boolean),
    navigationLabels,
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
  const approvedModuleIds =
    build.approvedProductionBuildEnvelope?.approvedModulePlan.moduleIds ?? [];
  const approvedNavigationEntries =
    build.approvedProductionBuildEnvelope?.approvedNavigationPlan.productEntries ?? [];
  const featureNames =
    featureModuleDetails.length > 0
      ? featureModuleDetails.map((module) => module.name).filter(Boolean)
      : [...approvedModuleIds];
  const navigationLabels =
    featureModuleDetails.length > 0
      ? featureModuleDetails.map((module) => module.name).filter(Boolean)
      : [...new Set([...approvedNavigationEntries, ...approvedModuleIds])];
  const previewVerifiedModuleIds =
    manifest?.previewVerified === true ? (manifest.featureModules ?? []) : [];

  const stages: Array<{ stage: GenerationStageName; input: ProductFaithfulnessInput }> = [
    {
      stage: 'ARCHITECTURE',
      input: {
        prompt: '',
        architectureSummary: manifest?.promptSummary ? [manifest.promptSummary, manifest.expectedAppType ?? ''] : null,
        generatedFeatureModules: [...approvedModuleIds],
      },
    },
    {
      stage: 'FEATURE_CONTRACT',
      input: { prompt: '', featureContract: featureNames.map((featureName) => ({ featureName })) },
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
      input: { prompt: '', navigationLabels },
    },
    {
      stage: 'MANIFEST',
      input: {
        prompt: '',
        workspaceManifestSummary: manifest ? [manifest.expectedAppType ?? '', manifest.promptSummary ?? ''].filter(Boolean) : null,
        generatedFeatureModules: manifest?.featureModules ?? [],
      },
    },
    {
      stage: 'PREVIEW_DOM',
      input: {
        prompt: '',
        domText: livePreviewInteractionProof?.evidence.primaryFeatureTextFound ?? null,
        generatedFeatureModules: previewVerifiedModuleIds,
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
 * Evaluates Product Faithfulness Milestone 2 for a real build result. When an approved production
 * envelope is present, missing concepts are reported once from Contract-to-Module Traceability —
 * never as duplicated stage-by-stage downstream reports.
 */
export function evaluateGenerationFaithfulnessForBuild(
  build: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof?: LivePreviewInteractionProofReport | null,
): GenerationFaithfulnessReport | null {
  if (!build.prompt) return null;

  const envelope = build.approvedProductionBuildEnvelope;
  if (envelope) {
    const scopedEnvelope = requireApprovedProductionBuildEnvelopeForContext(
      envelope,
      {
        buildId: build.buildId,
        projectId: build.projectId,
        promptHash: build.runtimeEvidenceScope?.promptHash ?? envelope.promptHash ?? '',
      },
      'evaluateGenerationFaithfulnessForBuild',
    );
    const contract = buildCanonicalProductContract({ prompt: build.prompt });
    const surfaces = resolveUniversalFeatureNamesForCurrentBuild({
      contract,
      envelope: scopedEnvelope,
      workspacePath: build.workspacePath,
      proposedModuleIds: scopedEnvelope.approvedModulePlan.moduleIds,
    });
    const manifestFeatureNames =
      build.materializationManifest?.featureModuleDetails
        ?.map((module) => module.name)
        .filter(Boolean) ?? [];
    const universalFeatureNames = [
      ...new Set([...surfaces.universalFeatureNames, ...manifestFeatureNames]),
    ];
    const traceabilityReport = runContractToModuleTraceabilityEvaluation({
      contract,
      envelope: scopedEnvelope,
      workspaceFiles: surfaces.workspaceFiles,
      proposedModuleIds: scopedEnvelope.approvedModulePlan.moduleIds,
      universalFeatureNames,
    });
    const canonicalFindings = buildCanonicalProductFaithfulnessFindings(traceabilityReport);
    const remainingMissingConcepts = canonicalFindings.map((finding) => finding.concept);
    const baseReport = runGenerationFaithfulnessAudit(
      { prompt: build.prompt },
      deriveGenerationFaithfulnessStages(build, livePreviewInteractionProof),
    );
    const metrics = retentionPercentFromMissing(
      contract.allConceptNames.length,
      remainingMissingConcepts.length,
    );
    const unexpectedDominantConcepts = suppressLexicalFragmentsOfCapabilities(
      baseReport.unexpectedDominantConcepts,
      contract.allConceptNames,
    );
    const firstBrokenByConcept = new Map(
      canonicalFindings.map((finding) => [
        normalizeCapabilityIdentity(finding.concept),
        finding.firstBrokenBoundary,
      ] as const),
    );
    const provenDownstreamConcepts = [
      ...scopedEnvelope.approvedModulePlan.moduleIds,
      ...scopedEnvelope.approvedModulePlan.moduleEntries.map((entry) => entry.displayName),
      ...universalFeatureNames,
    ];
    assertFaithfulnessMetricInvariants({
      requestedConcepts: contract.allConceptNames,
      matchedConcepts: contract.allConceptNames.filter(
        (concept) =>
          !remainingMissingConcepts.some(
            (missing) =>
              normalizeCapabilityIdentity(missing) === normalizeCapabilityIdentity(concept),
          ),
      ),
      missingConcepts: remainingMissingConcepts,
      unexpectedConcepts: unexpectedDominantConcepts,
      conceptRetentionPercent: metrics.conceptRetentionPercent,
      conceptDriftPercent: metrics.conceptDriftPercent,
      firstBrokenByConcept,
      provenDownstreamConcepts:
        remainingMissingConcepts.length === 0 ? provenDownstreamConcepts : [],
    });
    return {
      ...baseReport,
      contract: {
        ...baseReport.contract,
        productIdentity: scopedEnvelope.approvedProductIdentity.displayName,
      },
      repairsPerformed: [],
      recoveredConcepts: [],
      remainingMissingConcepts,
      unexpectedDominantConcepts,
      conceptRetentionPercent: metrics.conceptRetentionPercent,
      conceptDriftPercent: metrics.conceptDriftPercent,
      audit: {
        ...baseReport.audit,
        conceptRetentionRatio: metrics.conceptRetentionRatio,
        conceptDriftRatio: metrics.conceptDriftRatio,
        remainingMissingConcepts,
        unexpectedDominantConcepts,
      },
      summary: {
        ...baseReport.summary,
        headline:
          remainingMissingConcepts.length === 0
            ? baseReport.summary.headline
            : 'Canonical traceability root-cause report',
        reason:
          remainingMissingConcepts.length === 0
            ? `${metrics.conceptRetentionPercent}% of the canonical product concepts were retained through generation.`
            : canonicalFindings
                .map(
                  (finding) =>
                    `${finding.concept}: first broken at ${finding.firstBrokenBoundary}. ${finding.requiredAction}`,
                )
                .join(' '),
      },
    };
  }

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
