/**
 * Autonomous Engineering Executive V1 — continuation policy.
 * After WORKSPACE_READY the default direction is forward.
 */

import { existsSync } from 'node:fs';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import {
  evaluateBannedFallbackScan,
} from '../prompt-faithful-generation/index.js';
import { workspaceHasGeneratedFeatureModules } from '../feature-contract-reality/index.js';
import { countWorkspaceFilesOnDisk } from '../materialization-evidence/workspace-file-discovery-engine.js';
import {
  filterConcreteSafetyBlockers,
  isPromptFaithfulnessPassedForContinuation,
} from '../universal-build-pipeline-verification/build-continuation-policy.js';

export interface AeeContinuationPolicyInput {
  workspaceDir: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  blockers: readonly string[];
  featureRealityStatus?: string | null;
  manifestFaithfulness?: { status: string; score: number };
}

export interface AeeContinuationPolicyResult {
  readOnly: true;
  shouldContinueToBuild: boolean;
  shouldMaterializeFirst: boolean;
  shouldContinueToPreview: boolean;
  promptFaithfulnessPassed: boolean;
  workspaceExists: boolean;
  generatedFileCount: number;
  generatedModulesExist: boolean;
  bannedFallbackScanPassed: boolean;
  featureRealityWarningOnly: boolean;
  safetyBlockers: readonly string[];
  structuralBlockers: readonly string[];
  overriddenBlockers: readonly string[];
  continuationReason: string | null;
}

export function workspaceProvenFaithfulnessOverride(input: AeeContinuationPolicyInput): boolean {
  const workspaceExists = existsSync(input.workspaceDir);
  const generatedFileCount = workspaceExists ? countWorkspaceFilesOnDisk(input.workspaceDir) : 0;
  const hasRealGeneratedSource =
    workspaceExists && workspaceHasGeneratedFeatureModules(input.workspaceDir);
  return (
    hasRealGeneratedSource &&
    generatedFileCount >= 20 &&
    input.buildPlan.modulePlan.approvedModuleIds.length > 0 &&
    !input.buildPlan.promptFaithfulness.blockedReason
  );
}

export function evaluateAeeContinuationPolicy(
  input: AeeContinuationPolicyInput,
): AeeContinuationPolicyResult {
  const workspaceExists = existsSync(input.workspaceDir);
  const generatedFileCount = workspaceExists ? countWorkspaceFilesOnDisk(input.workspaceDir) : 0;
  const hasRealGeneratedSource =
    workspaceExists && workspaceHasGeneratedFeatureModules(input.workspaceDir);
  const bannedFallbackScan = evaluateBannedFallbackScan({
    workspaceDir: input.workspaceDir,
    approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
    hasRealGeneratedSource,
  });

  const featureRealityStatus = input.featureRealityStatus ?? null;
  const featureRealityWarningOnly =
    featureRealityStatus === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' ||
    featureRealityStatus === 'PASS' ||
    featureRealityStatus === null ||
    featureRealityStatus === 'UNAVAILABLE';

  const promptFaithfulnessPassed =
    isPromptFaithfulnessPassedForContinuation(
      input.buildPlan.promptFaithfulness,
      input.manifestFaithfulness,
    ) || workspaceProvenFaithfulnessOverride(input);

  const safetyBlockers = filterConcreteSafetyBlockers(input.blockers, hasRealGeneratedSource);
  const structuralBlockers = safetyBlockers.filter((blocker) =>
    /no approved modules|planning did not produce|build-ready contract.*missing|workspace.*not.*creat/i.test(
      blocker,
    ),
  );

  const generatedModulesExist =
    hasRealGeneratedSource || input.buildPlan.modulePlan.approvedModuleIds.length > 0;
  const bannedFallbackScanPassed = bannedFallbackScan.passed;

  const preBuildEligible =
    promptFaithfulnessPassed &&
    workspaceExists &&
    input.buildPlan.modulePlan.approvedModuleIds.length > 0 &&
    safetyBlockers.length === 0 &&
    structuralBlockers.length === 0;

  const postBuildEligible =
    preBuildEligible &&
    hasRealGeneratedSource &&
    generatedFileCount > 0 &&
    bannedFallbackScanPassed &&
    featureRealityWarningOnly;

  const shouldMaterializeFirst = preBuildEligible && !hasRealGeneratedSource;
  const shouldContinueToBuild = postBuildEligible || shouldMaterializeFirst;
  const shouldContinueToPreview = shouldContinueToBuild;

  const overriddenBlockers = shouldContinueToBuild ? [...input.blockers] : [];

  const continuationReason = shouldContinueToBuild
    ? shouldMaterializeFirst
      ? 'AEE continuation: prompt faithfulness passed — materializing workspace then continuing to npm install/build/preview.'
      : `AEE continuation: prompt faithfulness passed, workspace has ${generatedFileCount} files with generated modules — continuing to npm install/build/preview.`
    : !promptFaithfulnessPassed
      ? 'Prompt faithfulness did not pass.'
      : !workspaceExists
        ? 'Workspace does not exist.'
        : input.buildPlan.modulePlan.approvedModuleIds.length === 0
          ? 'No approved modules in build plan.'
          : !generatedModulesExist && generatedFileCount > 0
            ? 'Generated feature modules do not exist.'
            : !bannedFallbackScanPassed
              ? 'Banned fallback contamination scan failed.'
              : !featureRealityWarningOnly
                ? `Feature reality hard blocker: ${featureRealityStatus}`
                : safetyBlockers.length > 0
                  ? `Safety blockers: ${safetyBlockers.join('; ')}`
                  : structuralBlockers.length > 0
                    ? `Structural blockers: ${structuralBlockers.join('; ')}`
                    : null;

  return {
    readOnly: true,
    shouldContinueToBuild,
    shouldMaterializeFirst,
    shouldContinueToPreview,
    promptFaithfulnessPassed,
    workspaceExists,
    generatedFileCount,
    generatedModulesExist,
    bannedFallbackScanPassed,
    featureRealityWarningOnly,
    safetyBlockers,
    structuralBlockers,
    overriddenBlockers,
    continuationReason,
  };
}

export function shouldAeeOverrideAseDenial(input: AeeContinuationPolicyInput): boolean {
  return evaluateAeeContinuationPolicy(input).shouldContinueToBuild;
}
