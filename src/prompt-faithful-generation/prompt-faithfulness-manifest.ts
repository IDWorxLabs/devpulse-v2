/**
 * Prompt-Faithful Generation V1 — manifest field helpers.
 */

import type { PromptFaithfulnessManifestFields } from './prompt-faithful-generation-types.js';
import type { PromptProfileGuardResult } from './prompt-faithful-generation-types.js';
import type { PromptFaithfulnessVerdict } from './prompt-faithful-generation-types.js';
import { extractPromptFeatures } from './prompt-feature-extractor.js';
import { validatePromptFaithfulness } from './prompt-faithfulness-validator.js';

export function buildPromptFaithfulnessManifestFields(input: {
  rawPrompt: string;
  selectedProfile: string;
  generatedModules: string[];
  guardResult?: PromptProfileGuardResult;
  workspaceDir?: string;
}): PromptFaithfulnessManifestFields {
  const verdict = validatePromptFaithfulness({
    rawPrompt: input.rawPrompt,
    selectedProfile: input.selectedProfile,
    generatedModules: input.generatedModules,
    workspaceDir: input.workspaceDir,
  });

  const rejected = [
    ...(input.guardResult?.rejectedFallbackProfiles ?? []),
    ...verdict.rejectedFallbackProfiles,
  ];

  return {
    promptFaithfulnessStatus: verdict.status,
    promptFaithfulnessScore: verdict.score,
    promptDerivedAppName: verdict.promptDerivedAppName,
    promptDerivedDomain: verdict.promptDerivedDomain,
    promptDerivedModules: verdict.promptDerivedModules,
    promptDerivedInteractions: verdict.promptDerivedInteractions,
    rejectedFallbackProfiles: [...new Set(rejected)],
    bannedFallbackModulesDetected: verdict.bannedFallbackModulesDetected,
    promptFaithfulnessFailureReasons: [
      ...(input.guardResult?.rejectionReason ? [input.guardResult.rejectionReason] : []),
      ...verdict.promptFaithfulnessFailureReasons,
    ],
    androidPhonePreviewRequired: verdict.androidPhonePreviewRequired,
    androidPhonePreviewStatus: verdict.androidPhonePreviewStatus,
  };
}

export function mergeFaithfulnessIntoManifest<T extends Record<string, unknown>>(
  manifest: T,
  fields: PromptFaithfulnessManifestFields,
): T & PromptFaithfulnessManifestFields {
  return { ...manifest, ...fields };
}

export function derivePendingFaithfulnessFields(rawPrompt: string): PromptFaithfulnessManifestFields {
  const extraction = extractPromptFeatures(rawPrompt);
  return {
    promptFaithfulnessStatus: 'PENDING',
    promptFaithfulnessScore: 0,
    promptDerivedAppName: extraction.appName,
    promptDerivedDomain: extraction.domain,
    promptDerivedModules: extraction.requiredModules,
    promptDerivedInteractions: extraction.requiredInteractions,
    rejectedFallbackProfiles: [],
    bannedFallbackModulesDetected: [],
    promptFaithfulnessFailureReasons: [],
    androidPhonePreviewRequired: extraction.androidPhonePreviewRequired,
    androidPhonePreviewStatus: extraction.androidPhonePreviewRequired ? 'PENDING' : 'PASS',
  };
}

export type { PromptFaithfulnessVerdict } from './prompt-faithful-generation-types.js';
