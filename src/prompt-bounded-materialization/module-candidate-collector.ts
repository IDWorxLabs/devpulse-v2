/**
 * Prompt-Bounded Materialization — collect module candidates from all build layers.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFeatureExtraction } from '../prompt-faithful-generation/prompt-faithful-generation-types.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  dedupeModuleIds,
  isValidModuleId,
  normalizeModuleId,
} from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { moduleIdToDisplayName } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { FeatureModuleCandidate } from './prompt-bounded-materialization-types.js';
import { classifyPromptPhrase } from './descriptor-classification-engine.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import { isSimpleUtilityAppPrompt } from '../simple-utility-app/simple-utility-app-registry.js';

const SYSTEM_SHELL_MODULES = ['auth', 'persistence'] as const;

function candidate(
  partial: Omit<FeatureModuleCandidate, 'readOnly' | 'normalizedName' | 'displayName'> & { moduleId: string },
): FeatureModuleCandidate {
  const normalizedName = normalizeModuleId(partial.moduleId);
  return {
    readOnly: true,
    normalizedName,
    displayName: moduleIdToDisplayName(normalizedName),
    ...partial,
    moduleId: normalizedName,
  };
}

export function collectPromptModuleCandidates(extraction: PromptFeatureExtraction): FeatureModuleCandidate[] {
  return extraction.requiredModules
    .filter((moduleId) => isValidModuleId(moduleId))
    .map((moduleId) =>
      candidate({
        moduleId,
        origin: extraction.rawExtractedModules.includes(moduleId) ? 'PROMPT_REQUIRED' : 'PROMPT_DERIVED',
        sourceEvidence: [`Prompt extraction required module: ${moduleId}`],
        requirementIds: [`req:${moduleId}`],
        capabilityIds: [],
        confidence: extraction.explicitModulesProvided ? 0.98 : 0.9,
        reasonIncluded: 'Explicitly required by prompt feature extraction.',
        classification: 'FEATURE_MODULE',
        sourceLayer: 'prompt_feature_extractor',
      }),
    );
}

export function collectProfileModuleCandidates(
  profileDefinition: ProfileFeatureDefinition,
  materializationProfile: string,
): FeatureModuleCandidate[] {
  return profileDefinition.featureModules
    .filter((moduleId) => isValidModuleId(moduleId))
    .map((moduleId) =>
      candidate({
        moduleId,
        origin: 'PROFILE_FALLBACK',
        sourceEvidence: [`Profile map ${materializationProfile}: ${moduleId}`],
        requirementIds: [],
        capabilityIds: [],
        confidence: 0.55,
        reasonIncluded: `Included by profile ${materializationProfile} feature map.`,
        classification: SYSTEM_SHELL_MODULES.includes(moduleId as (typeof SYSTEM_SHELL_MODULES)[number])
          ? 'SERVICE_MODULE'
          : 'FEATURE_MODULE',
        sourceLayer: 'profile_feature_map',
      }),
    );
}

export function collectPimModuleCandidates(
  productIntelligenceModel: ProductIntelligenceModel | null | undefined,
): FeatureModuleCandidate[] {
  if (!productIntelligenceModel) return [];
  return productIntelligenceModel.architecture.moduleIds
    .filter((moduleId) => isValidModuleId(moduleId))
    .map((moduleId) =>
      candidate({
        moduleId,
        origin: 'PIM_DERIVED',
        sourceEvidence: productIntelligenceModel.architecture.evidence.map((e) => e.excerpt),
        requirementIds: productIntelligenceModel.features
          .filter((f) => f.moduleId === moduleId)
          .map((f) => f.featureId),
        capabilityIds: [],
        confidence: 0.82,
        reasonIncluded: 'Derived from Product Intelligence Model architecture.',
        classification: 'FEATURE_MODULE',
        sourceLayer: 'product_intelligence_model',
      }),
    );
}

export function collectCapabilityModuleCandidates(
  capabilityPlanning: CapabilityPlanningPipelineResult | null | undefined,
): FeatureModuleCandidate[] {
  if (!capabilityPlanning) return [];
  const modules: FeatureModuleCandidate[] = [];
  for (const plan of capabilityPlanning.generationPlans) {
    const moduleId = normalizeModuleId(plan.capabilityName);
    if (!isValidModuleId(moduleId)) continue;
    modules.push(
      candidate({
        moduleId,
        origin: 'CAPABILITY_REQUIRED',
        sourceEvidence: [plan.reasonRequired || `Capability plan: ${plan.capabilityName}`],
        capabilityIds: [plan.planId],
        requirementIds: [...plan.sourceRequirementIds],
        confidence: 0.88,
        reasonIncluded: 'Required by resolved capability planning.',
        classification: 'FEATURE_MODULE',
        sourceLayer: 'capability_planning_engine',
      }),
    );
  }
  return modules;
}

export function collectSystemShellCandidates(rawPrompt = ''): FeatureModuleCandidate[] {
  if (isSimpleUtilityAppPrompt(rawPrompt)) {
    return [];
  }
  const modules: string[] = ['persistence'];
  if (promptExplicitlyRequiresAuth(rawPrompt)) {
    modules.unshift('auth');
  }
  return modules.map((moduleId) =>
    candidate({
      moduleId,
      origin: 'SYSTEM_SHELL_REQUIRED',
      sourceEvidence: ['Minimal runtime shell requirement'],
      requirementIds: [],
      capabilityIds: [],
      confidence: 1,
      reasonIncluded: 'Required system shell module for app runtime.',
      classification: 'SERVICE_MODULE',
      sourceLayer: 'app_shell_generation',
    }),
  );
}

export function collectRouteRegistryCandidates(
  profileDefinition: ProfileFeatureDefinition,
): FeatureModuleCandidate[] {
  const modules = dedupeModuleIds(profileDefinition.featureModules);
  return modules.map((moduleId, index) =>
    candidate({
      moduleId,
      origin: 'PROFILE_FALLBACK',
      sourceEvidence: [`Route registry route: ${profileDefinition.routes[index] ?? `/${moduleId}`}`],
      requirementIds: [],
      capabilityIds: [],
      confidence: 0.5,
      reasonIncluded: 'Candidate from route registry generation.',
      classification: 'FEATURE_MODULE',
      sourceLayer: 'route_registry_generation',
    }),
  );
}

export function collectDescriptorOnlyCandidates(rawPrompt: string): FeatureModuleCandidate[] {
  const rejected: FeatureModuleCandidate[] = [];
  for (const line of rawPrompt.split('\n')) {
    const classified = classifyPromptPhrase(line);
    if (classified.createsFeatureFolder) continue;
    const moduleId = normalizeModuleId(classified.label);
    if (!moduleId || !isValidModuleId(moduleId)) continue;
    rejected.push(
      candidate({
        moduleId,
        origin: 'GENERIC_PLACEHOLDER',
        sourceEvidence: [`Descriptor only: ${classified.label}`],
        requirementIds: [],
        capabilityIds: [],
        confidence: 0.2,
        reasonIncluded: `Descriptor phrase "${classified.label}" must not become a feature folder.`,
        classification: classified.category,
        sourceLayer: 'descriptor_classification',
      }),
    );
  }
  return rejected;
}

export function collectAllModuleCandidates(input: {
  rawPrompt: string;
  materializationProfile: string;
  extraction: PromptFeatureExtraction;
  profileDefinition: ProfileFeatureDefinition;
  productIntelligenceModel?: ProductIntelligenceModel | null;
  capabilityPlanning?: CapabilityPlanningPipelineResult | null;
}): FeatureModuleCandidate[] {
  return [
    ...collectSystemShellCandidates(input.rawPrompt),
    ...collectPromptModuleCandidates(input.extraction),
    ...collectPimModuleCandidates(input.productIntelligenceModel),
    ...collectCapabilityModuleCandidates(input.capabilityPlanning),
    ...collectProfileModuleCandidates(input.profileDefinition, input.materializationProfile),
    ...collectRouteRegistryCandidates(input.profileDefinition),
  ];
}
