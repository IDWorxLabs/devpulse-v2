/**
 * Prompt-Faithful Generation V1 — live materialization enforcement.
 */

import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type {
  PromptFeatureExtraction,
  PromptFaithfulnessVerdict,
} from './prompt-faithful-generation-types.js';
import { BANNED_FALLBACK_MODULES } from './prompt-faithful-generation-types.js';
import { validatePromptFaithfulness } from './prompt-faithfulness-validator.js';
import { validatePostGenerationContamination } from '../prompt-bounded-materialization/index.js';
import { isRejectedNonModulePhrase } from './prompt-module-name-normalizer.js';
import {
  classifyWorkspaceBannedFallbackContamination,
  moduleIdMatchesBannedTerm,
} from './fallback-module-classification.js';

export function listWorkspaceFeatureModuleIds(
  workspaceDir: string,
  options?: { approvedModuleIds?: readonly string[] },
): string[] {
  const approved = new Set(options?.approvedModuleIds ?? []);
  const featuresDir = join(workspaceDir, 'src/features');
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      if (name === 'registry') return false;
      // `src/features/routes.ts` is router infrastructure — product entity modules use delivery-routes.
      if (name === 'routes' && !approved.has('routes') && !approved.has('delivery-routes')) return false;
      return true;
    });
}

/**
 * Filename scan of banned-term *matches* (legacy API). Prefer
 * `detectForbiddenBannedFallbackModulesInWorkspace` for enforcement — compounds with
 * contract ancestry must not be treated as contaminating fallbacks.
 */
export function detectBannedFallbackModulesInWorkspace(workspaceDir: string): string[] {
  const modules = listWorkspaceFeatureModuleIds(workspaceDir);
  return BANNED_FALLBACK_MODULES.filter((banned) =>
    modules.some((moduleId) => moduleIdMatchesBannedTerm(moduleId, banned)),
  );
}

export function detectForbiddenBannedFallbackModulesInWorkspace(input: {
  workspaceDir: string;
  approvedModuleIds?: readonly string[];
  promptRequiredModules?: readonly string[];
  contractCapabilityIds?: readonly string[];
  rawPrompt?: string;
  currentProjectId?: string | null;
  currentBuildId?: string | null;
  ancestryProjectId?: string | null;
  ancestryBuildId?: string | null;
}): {
  matchedBannedTerms: string[];
  forbiddenModuleIds: string[];
  allowedCompoundModuleIds: string[];
  passed: boolean;
} {
  const modules = listWorkspaceFeatureModuleIds(input.workspaceDir, {
    approvedModuleIds: input.approvedModuleIds,
  });
  const result = classifyWorkspaceBannedFallbackContamination({
    workspaceModuleIds: modules,
    approvedModuleIds: input.approvedModuleIds,
    promptRequiredModules: input.promptRequiredModules,
    contractCapabilityIds: input.contractCapabilityIds,
    rawPrompt: input.rawPrompt,
    currentProjectId: input.currentProjectId,
    currentBuildId: input.currentBuildId,
    ancestryProjectId: input.ancestryProjectId,
    ancestryBuildId: input.ancestryBuildId,
  });
  return {
    matchedBannedTerms: result.forbiddenBannedTerms,
    forbiddenModuleIds: result.forbiddenModuleIds,
    allowedCompoundModuleIds: result.allowedCompoundModuleIds,
    passed: result.passed,
  };
}

const WORKSPACE_MODULE_KEEP_IDS = new Set(['auth', 'persistence']);

export function detectStaleWorkspaceModules(
  workspaceDir: string,
  approvedModuleIds: readonly string[],
): string[] {
  const approved = new Set(approvedModuleIds);
  return listWorkspaceFeatureModuleIds(workspaceDir).filter(
    (moduleId) => !approved.has(moduleId) && !WORKSPACE_MODULE_KEEP_IDS.has(moduleId),
  );
}

export function removeWorkspaceFeatureModules(
  workspaceDir: string,
  moduleIds: readonly string[],
): string[] {
  const removed: string[] = [];
  for (const moduleId of moduleIds) {
    const moduleDir = join(workspaceDir, 'src/features', moduleId);
    if (existsSync(moduleDir)) {
      rmSync(moduleDir, { recursive: true, force: true });
      removed.push(moduleId);
    }
  }
  return removed;
}

export function sanitizeWorkspaceForBuildPlan(
  workspaceDir: string,
  approvedModuleIds: readonly string[],
): string[] {
  return removeWorkspaceFeatureModules(
    workspaceDir,
    detectStaleWorkspaceModules(workspaceDir, approvedModuleIds),
  );
}

export function evaluateBannedFallbackScan(input: {
  workspaceDir: string;
  approvedModuleIds: readonly string[];
  hasRealGeneratedSource: boolean;
  rawPrompt?: string;
  promptRequiredModules?: readonly string[];
}): {
  passed: boolean;
  staleOnly: boolean;
  detected: string[];
  contaminating: string[];
} {
  const scan = detectForbiddenBannedFallbackModulesInWorkspace({
    workspaceDir: input.workspaceDir,
    approvedModuleIds: input.approvedModuleIds,
    promptRequiredModules: input.promptRequiredModules,
    rawPrompt: input.rawPrompt,
  });
  const detected = detectBannedFallbackModulesInWorkspace(input.workspaceDir);
  if (scan.passed) {
    const workspaceModules = listWorkspaceFeatureModuleIds(input.workspaceDir);
    const approvedPresent = input.approvedModuleIds.some((id) => workspaceModules.includes(id));
    const staleOnly =
      detected.length > 0 &&
      scan.allowedCompoundModuleIds.length > 0 &&
      input.hasRealGeneratedSource &&
      approvedPresent;
    return { passed: true, staleOnly, detected, contaminating: [] };
  }

  return {
    passed: false,
    staleOnly: false,
    detected,
    contaminating: scan.forbiddenModuleIds,
  };
}

export function detectOverExtractedModulesInWorkspace(
  workspaceDir: string,
  extraction: PromptFeatureExtraction,
  approvedModuleIds: readonly string[] = [],
): string[] {
  const approved = new Set(approvedModuleIds);
  const modules = listWorkspaceFeatureModuleIds(workspaceDir);
  return modules.filter((moduleId) => {
    if (moduleId === 'auth') return false;
    if (approved.has(moduleId)) return false;
    if (extraction.requiredModules.includes(moduleId)) return false;
    return extraction.rejectedNonModulePhrases.includes(moduleId) || isRejectedNonModulePhrase(moduleId);
  });
}

export function enforcePromptFaithfulMaterialization(input: {
  rawPrompt: string;
  buildPlan: {
    materializationProfile: MaterializationProfile | string;
    definition: ProfileFeatureDefinition;
    extraction: PromptFeatureExtraction;
    modulePlan?: import('../prompt-bounded-materialization/prompt-bounded-materialization-types.js').PromptBoundedModulePlan;
  };
  workspaceDir: string;
}): {
  ok: boolean;
  verdict: PromptFaithfulnessVerdict;
  bannedModules: string[];
  overExtractedModules: string[];
  failureReason: string | null;
} {
  const approvedModuleIds =
    input.buildPlan.modulePlan?.approvedModuleIds ?? input.buildPlan.definition.featureModules;
  const generatedModules = listWorkspaceFeatureModuleIds(input.workspaceDir, {
    approvedModuleIds,
  });
  const forbiddenScan = detectForbiddenBannedFallbackModulesInWorkspace({
    workspaceDir: input.workspaceDir,
    approvedModuleIds,
    promptRequiredModules: input.buildPlan.extraction.requiredModules,
    // contractCapabilityIds must come from UFC/CBGA capability nodes only —
    // never from the approval set (approval alone is not ancestry).
    rawPrompt: input.rawPrompt,
  });
  const bannedModules = forbiddenScan.matchedBannedTerms;
  const overExtractedModules = detectOverExtractedModulesInWorkspace(
    input.workspaceDir,
    input.buildPlan.extraction,
    approvedModuleIds,
  );
  const verdict = validatePromptFaithfulness({
    rawPrompt: input.rawPrompt,
    selectedProfile: String(input.buildPlan.materializationProfile),
    generatedModules,
    workspaceDir: input.workspaceDir,
    definition: input.buildPlan.definition,
    approvedModuleIds: [...approvedModuleIds],
  });

  const postContamination = input.buildPlan.modulePlan
    ? validatePostGenerationContamination({
        workspaceDir: input.workspaceDir,
        plan: input.buildPlan.modulePlan,
      })
    : null;

  const failureReasons: string[] = [...verdict.promptFaithfulnessFailureReasons];
  if (bannedModules.length > 0) {
    const detail =
      forbiddenScan.forbiddenModuleIds.length > 0
        ? `${bannedModules.join(', ')} (modules: ${forbiddenScan.forbiddenModuleIds.join(', ')})`
        : bannedModules.join(', ');
    failureReasons.push(`Banned fallback modules present in workspace: ${detail}`);
  }
  if (overExtractedModules.length > 0) {
    failureReasons.push(`Over-extracted non-module phrases in workspace: ${overExtractedModules.join(', ')}`);
  }
  if (verdict.fallbackModulesAppendedByGenerator.length > 0 && input.buildPlan.extraction.explicitModulesProvided) {
    failureReasons.push(
      `Generator appended fallback modules: ${verdict.fallbackModulesAppendedByGenerator.join(', ')}`,
    );
  }
  if (
    input.buildPlan.extraction.isCustomDomainPrompt &&
    input.buildPlan.materializationProfile === 'PROJECT_MANAGEMENT_WEB_V1'
  ) {
    failureReasons.push('Custom-domain prompt materialized as PROJECT_MANAGEMENT_WEB_V1');
  }

  if (postContamination && !postContamination.passed) {
    failureReasons.push(...postContamination.failureMessages);
  }

  const ok =
    verdict.status !== 'FAIL' &&
    bannedModules.length === 0 &&
    failureReasons.length === 0 &&
    (postContamination?.passed ?? true);

  return {
    ok,
    verdict: {
      ...verdict,
      status: ok ? verdict.status : 'FAIL',
      bannedFallbackModulesDetected: [...new Set([...verdict.bannedFallbackModulesDetected, ...bannedModules])],
      overExtractedNonModulePhrases: [...new Set([...verdict.overExtractedNonModulePhrases, ...overExtractedModules])],
      promptFaithfulnessFailureReasons: failureReasons,
    },
    bannedModules,
    overExtractedModules,
    failureReason: ok ? null : failureReasons.join('; '),
  };
}
