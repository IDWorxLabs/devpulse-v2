/**
 * Prompt-Faithful Generation V1 — public API.
 */

export { BANNED_FALLBACK_MODULES, KNOWN_FALLBACK_PROFILES } from './prompt-faithful-generation-types.js';
export { PROMPT_FAITHFUL_GENERATION_PASS_TOKEN } from './prompt-faithfulness-trace-events.js';

export type {
  PromptFeatureExtraction,
  PromptFaithfulnessManifestFields,
  PromptFaithfulnessStatus,
  PromptProfileGuardResult,
} from './prompt-faithful-generation-types.js';
export type { PromptFaithfulnessVerdict } from './prompt-faithful-generation-types.js';

export { PROMPT_FAITHFUL_GENERATION_PASS_TOKEN as PASS_TOKEN } from './prompt-faithfulness-trace-events.js';

export { extractPromptFeatures } from './prompt-feature-extractor.js';
export {
  applyPromptProfileSelectionGuard,
  countStrongCustomDomainTerms,
  countWeakGenericTermsInRanking,
  promptContainsNegatedProjectManagement,
  shouldRejectKnownProfileForCustomPrompt,
} from './prompt-profile-selection-guard.js';
export {
  buildCustomProfileFeatureDefinition,
  shouldUseCustomFeatureDefinition,
} from './custom-feature-contract-builder.js';
export { buildPromptSpecificDomainCopy, buildLisaFirstScreenCopy } from './prompt-specific-ui-copy-builder.js';
export {
  dedupeModuleIds,
  isValidModuleId,
  moduleIdsInclude,
  normalizeModuleId,
} from './prompt-module-name-normalizer.js';
export {
  promptFaithfulnessFailed,
  validatePromptFaithfulness,
} from './prompt-faithfulness-validator.js';
export {
  buildPromptFaithfulnessManifestFields,
  derivePendingFaithfulnessFields,
  mergeFaithfulnessIntoManifest,
} from './prompt-faithfulness-manifest.js';
export {
  enforcePromptFaithfulMaterialization,
  detectBannedFallbackModulesInWorkspace,
  listWorkspaceFeatureModuleIds,
} from './prompt-faithful-materialization-gate.js';
export { buildPromptFaithfulnessTraceEvents } from './prompt-faithfulness-trace-events.js';

import { rankBuildProfiles } from '../build-profile-classification/profile-ranking-engine.js';
import { applyPromptProfileSelectionGuard } from './prompt-profile-selection-guard.js';
import { extractPromptFeatures } from './prompt-feature-extractor.js';
import {
  buildCustomProfileFeatureDefinition,
  shouldUseCustomFeatureDefinition,
} from './custom-feature-contract-builder.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type MaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileRankingResult } from '../build-profile-classification/profile-ranking-types.js';
import type { PromptProfileGuardResult } from './prompt-faithful-generation-types.js';

export interface ResolvedPromptFaithfulBuildPlan {
  readOnly: true;
  ranking: ProfileRankingResult;
  guardResult: PromptProfileGuardResult;
  materializationProfile: MaterializationProfile;
  definition: ProfileFeatureDefinition & { customDomainCopy?: Record<string, string>; androidPhonePreviewRequired?: boolean };
  extraction: ReturnType<typeof extractPromptFeatures>;
}

export function resolvePromptFaithfulBuildPlan(
  rawPrompt: string,
  resolvedProfile?: GeneratedAppProfile | null,
): ResolvedPromptFaithfulBuildPlan {
  const ranking = rankBuildProfiles(rawPrompt);
  const guardResult = applyPromptProfileSelectionGuard(rawPrompt, ranking);

  let materializationProfile: MaterializationProfile;
  if (guardResult.guardApplied) {
    materializationProfile = 'GENERIC_CUSTOM_APP_V1';
  } else {
    materializationProfile = resolveMaterializationProfile(
      resolvedProfile ?? guardResult.selectedProfile,
      rawPrompt,
    );
  }

  const extraction = extractPromptFeatures(rawPrompt);
  let definition: ProfileFeatureDefinition & {
    customDomainCopy?: Record<string, string>;
    androidPhonePreviewRequired?: boolean;
  };

  if (shouldUseCustomFeatureDefinition(extraction, materializationProfile)) {
    definition = buildCustomProfileFeatureDefinition(extraction);
  } else {
    definition = getProfileFeatureDefinition(materializationProfile, rawPrompt);
  }

  return {
    readOnly: true,
    ranking,
    guardResult,
    materializationProfile,
    definition,
    extraction,
  };
}
