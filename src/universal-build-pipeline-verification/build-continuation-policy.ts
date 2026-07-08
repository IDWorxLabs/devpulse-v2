/**
 * Universal Build Pipeline Verification V1 — build continuation policy.
 * If prompt faithfulness passes, workspace exists, generated modules exist,
 * and no concrete safety/filesystem/structural blocker exists, continue to
 * npm install/build/preview.
 */

import { existsSync } from 'node:fs';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import {
  evaluateBannedFallbackScan,
} from '../prompt-faithful-generation/index.js';
import { workspaceHasGeneratedFeatureModules } from '../feature-contract-reality/index.js';
import { countWorkspaceFilesOnDisk } from '../materialization-evidence/workspace-file-discovery-engine.js';
import type {
  BuildContinuationPolicyInput,
  BuildContinuationPolicyResult,
} from './universal-build-pipeline-types.js';

export const ASE_CONTINUATION_OVERRIDE_MESSAGE =
  'ASE denial overridden by universal continuation policy.';

const SAFETY_BLOCKER_PATTERNS = [
  /unsafe/i,
  /human review required/i,
  /payment fraud/i,
  /filesystem.*denied/i,
  /path traversal/i,
  /malicious/i,
  /destructive/i,
  /credential leak/i,
] as const;

const STRUCTURAL_BLOCKER_PATTERNS = [
  /no approved modules/i,
  /planning did not produce/i,
  /build-ready contract.*missing/i,
  /workspace.*not.*creat/i,
] as const;

const OVERSTRICT_BLOCKER_PATTERNS = [
  /feature reality evidence unavailable/i,
  /feature reality.*unavailable/i,
  /playwright.*unavailable/i,
  /runtime evidence unavailable/i,
  /profile mismatch.*expense/i,
  /expensetracker.*expected/i,
  /authentication required.*not.*prompt/i,
  /auth.*required.*without/i,
  /planning_failed/i,
  /PLANNING_FAILED/i,
  /ase denied/i,
  /materialization authorization/i,
  /blueprint validation/i,
  /incremental build blocked/i,
  /capability planning blocked/i,
  /interaction proof/i,
  /launch readiness/i,
  /behavior simulation/i,
  /virtual user/i,
  /virtual device/i,
] as const;

const STALE_STRUCTURAL_WHEN_WORKSPACE_PROVEN = [
  /no approved modules/i,
  /planning did not produce/i,
  /build-ready contract.*missing/i,
  /workspace.*not.*creat/i,
] as const;

function isStaleStructuralBlockerWhenWorkspaceProven(
  reason: string,
  workspaceProven: boolean,
): boolean {
  if (!workspaceProven) return false;
  return STALE_STRUCTURAL_WHEN_WORKSPACE_PROVEN.some((pattern) => pattern.test(reason));
}

export function filterConcreteSafetyBlockers(
  blockers: readonly string[],
  workspaceProven: boolean,
): string[] {
  return blockers.filter((blocker) => {
    if (SAFETY_BLOCKER_PATTERNS.some((pattern) => pattern.test(blocker))) {
      return true;
    }
    if (STRUCTURAL_BLOCKER_PATTERNS.some((pattern) => pattern.test(blocker))) {
      return !isStaleStructuralBlockerWhenWorkspaceProven(blocker, workspaceProven);
    }
    return false;
  });
}

export interface RuntimeBuildContinuationEvidence {
  readOnly: true;
  promptFaithfulnessPassed: boolean;
  promptFaithfulnessScore: number;
  workspaceExists: boolean;
  generatedFileCount: number;
  generatedModulesExist: boolean;
  bannedFallbackScanPassed: boolean;
  featureRealityStatus: string | null;
  featureRealityWarningOnly: boolean;
  safetyBlockers: readonly string[];
  structuralBlockers: readonly string[];
}

export interface RuntimeBuildContinuationInput {
  workspaceDir: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  blockers: readonly string[];
  featureRealityStatus?: string | null;
  manifestFaithfulness?: {
    status: string;
    score: number;
  };
}

export function isPromptFaithfulnessPassedForContinuation(
  promptFaithfulness: ResolvedPromptFaithfulBuildPlan['promptFaithfulness'],
  manifestFaithfulness?: { status: string; score: number },
): boolean {
  if (manifestFaithfulness?.status === 'PASS') return true;
  if ((manifestFaithfulness?.score ?? 0) >= 80) return true;
  if (promptFaithfulness.blockedReason) return false;
  return (
    promptFaithfulness.readyForGeneration ||
    promptFaithfulness.faithfulnessScore.meetsThreshold ||
    promptFaithfulness.faithfulnessScore.overallScore >= 0.8
  );
}

export function collectRuntimeBuildContinuationEvidence(
  input: RuntimeBuildContinuationInput,
): RuntimeBuildContinuationEvidence {
  const workspaceExists = existsSync(input.workspaceDir);
  const generatedFileCount = workspaceExists ? countWorkspaceFilesOnDisk(input.workspaceDir) : 0;
  const hasRealGeneratedSource =
    workspaceExists && workspaceHasGeneratedFeatureModules(input.workspaceDir);
  const bannedFallbackScan = evaluateBannedFallbackScan({
    workspaceDir: input.workspaceDir,
    approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
    hasRealGeneratedSource,
  });
  const generatedModulesExist =
    hasRealGeneratedSource || input.buildPlan.modulePlan.approvedModuleIds.length > 0;

  const featureRealityStatus = input.featureRealityStatus ?? null;
  const featureRealityWarningOnly =
    featureRealityStatus === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' ||
    featureRealityStatus === 'PASS' ||
    featureRealityStatus === null ||
    featureRealityStatus === 'UNAVAILABLE';

  const promptFaithfulnessPassed = isPromptFaithfulnessPassedForContinuation(
    input.buildPlan.promptFaithfulness,
    input.manifestFaithfulness,
  );

  const safetyBlockers = filterConcreteSafetyBlockers(input.blockers, hasRealGeneratedSource);
  const structuralBlockers = safetyBlockers.filter((blocker) =>
    STRUCTURAL_BLOCKER_PATTERNS.some((pattern) => pattern.test(blocker)),
  );

  return {
    readOnly: true,
    promptFaithfulnessPassed,
    promptFaithfulnessScore: input.buildPlan.promptFaithfulness.faithfulnessScore.overallScore,
    workspaceExists,
    generatedFileCount,
    generatedModulesExist,
    bannedFallbackScanPassed: bannedFallbackScan.passed,
    featureRealityStatus,
    featureRealityWarningOnly,
    safetyBlockers,
    structuralBlockers,
  };
}

export function evaluateRuntimeBuildContinuation(
  input: RuntimeBuildContinuationInput,
): BuildContinuationPolicyResult & {
  runtimeEvidence: RuntimeBuildContinuationEvidence;
  shouldMaterializeFirst: boolean;
} {
  const runtimeEvidence = collectRuntimeBuildContinuationEvidence(input);
  const hasRealGeneratedSource =
    runtimeEvidence.workspaceExists &&
    workspaceHasGeneratedFeatureModules(input.workspaceDir);

  const preBuildEligible =
    runtimeEvidence.promptFaithfulnessPassed &&
    runtimeEvidence.workspaceExists &&
    input.buildPlan.modulePlan.approvedModuleIds.length > 0 &&
    runtimeEvidence.safetyBlockers.length === 0 &&
    runtimeEvidence.structuralBlockers.length === 0;

  const postBuildEligible =
    preBuildEligible &&
    hasRealGeneratedSource &&
    runtimeEvidence.generatedFileCount > 0 &&
    runtimeEvidence.bannedFallbackScanPassed &&
    runtimeEvidence.featureRealityWarningOnly;

  const shouldMaterializeFirst = preBuildEligible && !hasRealGeneratedSource;
  const shouldContinueToBuild = postBuildEligible || shouldMaterializeFirst;

  const overriddenBlockers = shouldContinueToBuild ? [...input.blockers] : [];

  const continuationReason = shouldContinueToBuild
    ? shouldMaterializeFirst
      ? `${ASE_CONTINUATION_OVERRIDE_MESSAGE} Prompt faithfulness passed — materializing workspace then continuing to npm install/build/preview.`
      : `${ASE_CONTINUATION_OVERRIDE_MESSAGE} Prompt faithfulness passed, workspace has ${runtimeEvidence.generatedFileCount} files with generated modules — continuing to npm install/build/preview.`
    : !runtimeEvidence.promptFaithfulnessPassed
      ? 'Prompt faithfulness did not pass.'
      : !runtimeEvidence.workspaceExists
        ? 'Workspace does not exist.'
        : input.buildPlan.modulePlan.approvedModuleIds.length === 0
          ? 'No approved modules in build plan.'
          : !runtimeEvidence.generatedModulesExist && runtimeEvidence.generatedFileCount > 0
            ? 'Generated feature modules do not exist.'
            : !runtimeEvidence.bannedFallbackScanPassed
              ? 'Banned fallback contamination scan failed.'
              : !runtimeEvidence.featureRealityWarningOnly
                ? `Feature reality hard blocker: ${runtimeEvidence.featureRealityStatus}`
                : runtimeEvidence.safetyBlockers.length > 0
                  ? `Safety blockers: ${runtimeEvidence.safetyBlockers.join('; ')}`
                  : runtimeEvidence.structuralBlockers.length > 0
                    ? `Structural blockers: ${runtimeEvidence.structuralBlockers.join('; ')}`
                    : null;

  return {
    readOnly: true,
    shouldContinueToBuild,
    shouldContinueToPreview: shouldContinueToBuild,
    overriddenBlockers,
    continuationReason,
    safetyBlockers: runtimeEvidence.safetyBlockers,
    runtimeEvidence,
    shouldMaterializeFirst,
  };
}

export function isSafetyOrStructuralBlocker(reason: string): boolean {
  return (
    SAFETY_BLOCKER_PATTERNS.some((p) => p.test(reason)) ||
    STRUCTURAL_BLOCKER_PATTERNS.some((p) => p.test(reason))
  );
}

export function isOverstrictPreBuildBlocker(reason: string): boolean {
  return OVERSTRICT_BLOCKER_PATTERNS.some((p) => p.test(reason));
}

export function evaluateBuildContinuationPolicy(
  input: BuildContinuationPolicyInput,
): BuildContinuationPolicyResult {
  const safetyBlockers = input.blockers.filter(isSafetyOrStructuralBlocker);
  const overstrictBlockers = input.blockers.filter(
    (b) => !isSafetyOrStructuralBlocker(b) && isOverstrictPreBuildBlocker(b),
  );

  const featureRealityDegraded =
    input.featureRealityStatus === 'DEGRADED_WITH_WORKSPACE_EVIDENCE';

  const coreConditionsMet =
    input.promptFaithfulnessPassed &&
    input.workspaceExists &&
    input.generatedModulesExist &&
    (input.hasGeneratedSourceFiles || input.generatedModulesExist);

  const shouldContinueToBuild =
    coreConditionsMet &&
    safetyBlockers.length === 0 &&
    (overstrictBlockers.length > 0 || input.blockers.length === 0 || featureRealityDegraded);

  const shouldContinueToPreview =
    shouldContinueToBuild &&
    !input.blockers.some((b) => /npm build failed|compilation error/i.test(b));

  const overriddenBlockers = shouldContinueToBuild ? overstrictBlockers : [];

  const continuationReason = shouldContinueToBuild
    ? coreConditionsMet
      ? 'Prompt faithfulness passed, workspace and modules exist — continuing to npm install/build/preview per universal continuation policy.'
      : null
    : safetyBlockers.length > 0
      ? `Blocked by safety/structural concerns: ${safetyBlockers.join('; ')}`
      : !input.promptFaithfulnessPassed
        ? 'Prompt faithfulness did not pass.'
        : !input.workspaceExists
          ? 'Workspace does not exist.'
          : !input.generatedModulesExist
            ? 'Generated modules do not exist.'
            : null;

  return {
    readOnly: true,
    shouldContinueToBuild,
    shouldContinueToPreview,
    overriddenBlockers,
    continuationReason,
    safetyBlockers,
  };
}

export function shouldOverrideAseMaterializationDenial(input: {
  workspaceDir: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  blockers: readonly string[];
  featureRealityStatus?: string | null;
  /** @deprecated Use workspaceDir + buildPlan via evaluateRuntimeBuildContinuation */
  promptFaithfulnessPassed?: boolean;
  workspaceExists?: boolean;
  generatedModulesExist?: boolean;
  hasGeneratedSourceFiles?: boolean;
}): boolean {
  if (input.workspaceDir && input.buildPlan) {
    return evaluateRuntimeBuildContinuation({
      workspaceDir: input.workspaceDir,
      buildPlan: input.buildPlan,
      blockers: input.blockers,
      featureRealityStatus: input.featureRealityStatus,
    }).shouldContinueToBuild;
  }

  const policy = evaluateBuildContinuationPolicy({
    promptFaithfulnessPassed: input.promptFaithfulnessPassed ?? false,
    workspaceExists: input.workspaceExists ?? false,
    generatedModulesExist: input.generatedModulesExist ?? false,
    hasGeneratedSourceFiles: input.hasGeneratedSourceFiles ?? false,
    blockers: input.blockers,
    featureRealityStatus: input.featureRealityStatus,
  });
  return policy.shouldContinueToBuild && input.blockers.every((b) => !isSafetyOrStructuralBlocker(b));
}
