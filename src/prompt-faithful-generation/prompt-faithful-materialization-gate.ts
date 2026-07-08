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

export function listWorkspaceFeatureModuleIds(workspaceDir: string): string[] {
  const featuresDir = join(workspaceDir, 'src/features');
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !['registry', 'routes'].includes(name));
}

export function detectBannedFallbackModulesInWorkspace(workspaceDir: string): string[] {
  const modules = listWorkspaceFeatureModuleIds(workspaceDir);
  return BANNED_FALLBACK_MODULES.filter((banned) =>
    modules.some((moduleId) => moduleId === banned || moduleId.includes(banned)),
  );
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
}): {
  passed: boolean;
  staleOnly: boolean;
  detected: string[];
  contaminating: string[];
} {
  const detected = detectBannedFallbackModulesInWorkspace(input.workspaceDir);
  if (detected.length === 0) {
    return { passed: true, staleOnly: false, detected, contaminating: [] };
  }

  const approved = new Set(input.approvedModuleIds);
  const unapprovedBanned = detected.filter((id) => !approved.has(id));
  const contaminating = unapprovedBanned;
  const workspaceModules = listWorkspaceFeatureModuleIds(input.workspaceDir);
  const approvedPresent = input.approvedModuleIds.some((id) => workspaceModules.includes(id));
  const staleOnly =
    unapprovedBanned.length === 0 &&
    detected.length > 0 &&
    input.hasRealGeneratedSource &&
    approvedPresent;

  return {
    passed: unapprovedBanned.length === 0,
    staleOnly,
    detected,
    contaminating,
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
  const generatedModules = listWorkspaceFeatureModuleIds(input.workspaceDir);
  const approvedModuleIds = new Set(
    input.buildPlan.modulePlan?.approvedModuleIds ?? input.buildPlan.definition.featureModules,
  );
  const bannedModules = detectBannedFallbackModulesInWorkspace(input.workspaceDir).filter(
    (moduleId) => !approvedModuleIds.has(moduleId),
  );
  const overExtractedModules = detectOverExtractedModulesInWorkspace(
    input.workspaceDir,
    input.buildPlan.extraction,
    input.buildPlan.modulePlan?.approvedModuleIds ?? input.buildPlan.definition.featureModules,
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
    failureReasons.push(`Banned fallback modules present in workspace: ${bannedModules.join(', ')}`);
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
