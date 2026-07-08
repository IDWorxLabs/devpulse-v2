/**
 * Prompt-Faithful Generation V1 — faithfulness validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { extractPromptFeatures } from './prompt-feature-extractor.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import {
  BANNED_FALLBACK_MODULES,
  type PromptFaithfulnessVerdict,
} from './prompt-faithful-generation-types.js';
import {
  isRejectedNonModulePhrase,
  moduleIdsInclude,
} from './prompt-module-name-normalizer.js';

export function validatePromptFaithfulness(input: {
  rawPrompt: string;
  selectedProfile: string;
  generatedModules: string[];
  workspaceDir?: string;
  definition?: ProfileFeatureDefinition;
  approvedModuleIds?: readonly string[];
}): PromptFaithfulnessVerdict {
  const extraction = extractPromptFeatures(input.rawPrompt);
  const failureReasons: string[] = [];
  const approvedModules = new Set(input.approvedModuleIds ?? []);
  const bannedDetected = BANNED_FALLBACK_MODULES.filter(
    (banned) =>
      !approvedModules.has(banned) &&
      input.generatedModules.some((moduleId) => moduleId === banned || moduleId.includes(banned)),
  );

  const overExtractedInWorkspace = extraction.rejectedNonModulePhrases.filter((phrase) => {
    const isSanitizedModule = extraction.requiredModules.some(
      (required) => required === phrase || moduleIdsInclude([required], phrase),
    );
    if (isSanitizedModule || approvedModules.has(phrase)) return false;
    return input.generatedModules.some((generated) => generated === phrase);
  });

  const adjectiveModulesInWorkspace = input.generatedModules.filter(
    (moduleId) =>
      moduleId !== 'auth' &&
      !approvedModules.has(moduleId) &&
      isRejectedNonModulePhrase(moduleId),
  );

  const expectedModules = extraction.requiredModules.filter((m) => m !== 'auth');
  const truePromptDerivedModules = [...expectedModules];
  const missingModules = expectedModules.filter(
    (expected) => !input.generatedModules.some((generated) => moduleIdsInclude([generated], expected)),
  );

  const definitionModules = input.definition?.featureModules ?? input.generatedModules;
  const fallbackModulesAppendedByGenerator = BANNED_FALLBACK_MODULES.filter((banned) =>
    definitionModules.some((moduleId) => moduleId === banned),
  );

  if (
    extraction.isCustomDomainPrompt &&
    input.selectedProfile === 'PROJECT_MANAGEMENT_WEB_V1'
  ) {
    failureReasons.push(
      'PROJECT_MANAGEMENT_WEB_V1 selected for a custom-domain prompt — profile faithfulness failure.',
    );
  }

  if (bannedDetected.length && extraction.isCustomDomainPrompt) {
    failureReasons.push(`Banned fallback modules generated: ${bannedDetected.join(', ')}.`);
  }

  if (fallbackModulesAppendedByGenerator.length && extraction.explicitModulesProvided) {
    failureReasons.push(
      `Fallback modules appended to custom definition: ${fallbackModulesAppendedByGenerator.join(', ')}.`,
    );
  }

  if (overExtractedInWorkspace.length) {
    failureReasons.push(`Over-extracted non-module phrases materialized: ${overExtractedInWorkspace.join(', ')}.`);
  }

  if (adjectiveModulesInWorkspace.length) {
    failureReasons.push(`Adjective-style modules materialized: ${adjectiveModulesInWorkspace.join(', ')}.`);
  }

  if (missingModules.length && extraction.explicitModulesProvided) {
    failureReasons.push(`Missing prompt-derived modules: ${missingModules.join(', ')}.`);
  }

  let androidPhonePreviewStatus: 'PASS' | 'FAIL' | 'PENDING' = 'PENDING';
  if (extraction.androidPhonePreviewRequired) {
    androidPhonePreviewStatus = 'FAIL';
    if (input.workspaceDir) {
      const routerPath = join(input.workspaceDir, 'src/features/FeatureAppRouter.tsx');
      const cssPath = join(input.workspaceDir, 'src/features/feature-app-router.css');
      if (existsSync(routerPath) && existsSync(cssPath)) {
        const routerSource = readFileSync(routerPath, 'utf8');
        const cssSource = readFileSync(cssPath, 'utf8');
        const hasPhoneEvidence =
          routerSource.includes('android-phone-preview') ||
          routerSource.includes('data-android-phone-preview') ||
          cssSource.includes('android-phone-preview') ||
          cssSource.includes('max-width: 420px');
        androidPhonePreviewStatus = hasPhoneEvidence ? 'PASS' : 'FAIL';
        if (!hasPhoneEvidence) {
          failureReasons.push('Android phone preview required but not detected in generated preview source.');
        }
      }
    }
  } else {
    androidPhonePreviewStatus = 'PASS';
  }

  let previewTermsOk = true;
  if (input.workspaceDir && extraction.isCustomDomainPrompt) {
    const routerPath = join(input.workspaceDir, 'src/features/FeatureAppRouter.tsx');
    if (existsSync(routerPath)) {
      const source = readFileSync(routerPath, 'utf8').toLowerCase();
      const requiredTerms = ['communication', 'blink', 'gaze', 'speech', 'emergency', 'locked in'];
      const matched = requiredTerms.filter((term) => source.includes(term));
      if (promptMentionsLisaOrAccessibility(input.rawPrompt) && matched.length < 4) {
        previewTermsOk = false;
        failureReasons.push(
          `LISA preview missing required terms (found ${matched.length}/6: ${matched.join(', ')}).`,
        );
      }
    }
  }

  const moduleMatchRatio =
    expectedModules.length > 0
      ? expectedModules.filter((expected) =>
          input.generatedModules.some((generated) => moduleIdsInclude([generated], expected)),
        ).length / expectedModules.length
      : 1;

  let score = Math.round(moduleMatchRatio * 70);
  if (bannedDetected.length === 0) score += 15;
  if (failureReasons.length === 0) score += 15;
  if (!previewTermsOk) score = Math.min(score, 40);
  if (input.selectedProfile === 'GENERIC_CUSTOM_APP_V1' && extraction.isCustomDomainPrompt) {
    score += 5;
  }
  score = Math.min(100, Math.max(0, score));

  const status =
    failureReasons.length > 0 || bannedDetected.length > 0
      ? 'FAIL'
      : missingModules.length > 0
        ? 'WARN'
        : 'PASS';

  return {
    readOnly: true,
    status,
    score,
    promptDerivedAppName: extraction.appName,
    promptDerivedDomain: extraction.domain,
    promptDerivedModules: extraction.requiredModules,
    promptDerivedInteractions: extraction.requiredInteractions,
    rejectedFallbackProfiles: [],
    bannedFallbackModulesDetected: bannedDetected,
    overExtractedNonModulePhrases: [...new Set([...overExtractedInWorkspace, ...extraction.rejectedNonModulePhrases])],
    fallbackModulesAppendedByGenerator: [...fallbackModulesAppendedByGenerator],
    truePromptDerivedModules,
    promptFaithfulnessFailureReasons: failureReasons,
    androidPhonePreviewRequired: extraction.androidPhonePreviewRequired,
    androidPhonePreviewStatus,
    generatedModules: input.generatedModules,
    selectedProfile: input.selectedProfile,
  };
}

export type { PromptFaithfulnessVerdict } from './prompt-faithful-generation-types.js';

export function promptFaithfulnessFailed(verdict: PromptFaithfulnessVerdict): boolean {
  return verdict.status === 'FAIL';
}
