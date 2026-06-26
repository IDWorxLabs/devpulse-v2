/**
 * Prompt-Faithful Generation V1 — live materialization enforcement.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type {
  PromptFeatureExtraction,
  PromptFaithfulnessVerdict,
} from './prompt-faithful-generation-types.js';
import { BANNED_FALLBACK_MODULES } from './prompt-faithful-generation-types.js';
import { validatePromptFaithfulness } from './prompt-faithfulness-validator.js';

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

export function enforcePromptFaithfulMaterialization(input: {
  rawPrompt: string;
  buildPlan: {
    materializationProfile: MaterializationProfile | string;
    definition: ProfileFeatureDefinition;
    extraction: PromptFeatureExtraction;
  };
  workspaceDir: string;
}): {
  ok: boolean;
  verdict: PromptFaithfulnessVerdict;
  bannedModules: string[];
  failureReason: string | null;
} {
  const generatedModules = listWorkspaceFeatureModuleIds(input.workspaceDir);
  const bannedModules = detectBannedFallbackModulesInWorkspace(input.workspaceDir);
  const verdict = validatePromptFaithfulness({
    rawPrompt: input.rawPrompt,
    selectedProfile: String(input.buildPlan.materializationProfile),
    generatedModules,
    workspaceDir: input.workspaceDir,
    definition: input.buildPlan.definition,
  });

  const failureReasons: string[] = [...verdict.promptFaithfulnessFailureReasons];
  if (bannedModules.length > 0) {
    failureReasons.push(`Banned fallback modules present in workspace: ${bannedModules.join(', ')}`);
  }
  if (
    input.buildPlan.extraction.isCustomDomainPrompt &&
    input.buildPlan.materializationProfile === 'PROJECT_MANAGEMENT_WEB_V1'
  ) {
    failureReasons.push('Custom-domain prompt materialized as PROJECT_MANAGEMENT_WEB_V1');
  }

  const ok = verdict.status !== 'FAIL' && bannedModules.length === 0 && failureReasons.length === 0;

  return {
    ok,
    verdict: {
      ...verdict,
      status: ok ? verdict.status : 'FAIL',
      bannedFallbackModulesDetected: [...new Set([...verdict.bannedFallbackModulesDetected, ...bannedModules])],
      promptFaithfulnessFailureReasons: failureReasons,
    },
    bannedModules,
    failureReason: ok ? null : failureReasons.join('; '),
  };
}
