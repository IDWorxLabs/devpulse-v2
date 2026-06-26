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
  sanitizeModuleIds,
  suppressFallbackModulesWhenCustomExists,
  isRejectedNonModulePhrase,
  classifyModulePhrase,
  WEAK_MODULE_PHRASES,
  ADJECTIVE_STYLE_MODULE_PHRASES,
} from './prompt-module-name-normalizer.js';
export { LISA_REQUIRED_MODULES } from './prompt-feature-extractor.js';
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
  type MaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileRankingResult } from '../build-profile-classification/profile-ranking-types.js';
import type { PromptProfileGuardResult } from './prompt-faithful-generation-types.js';
import {
  runIntentUnderstandingEngine,
  type IntentUnderstandingResult,
  type ProductIntelligenceModel,
} from '../intent-understanding-engine/index.js';
import {
  runPromptFaithfulnessEngineV2,
  type PromptFaithfulnessV2Result,
} from '../prompt-faithfulness-engine-v2/index.js';
import {
  assessMissingCapabilityEvolutionReadiness,
  type MissingCapabilityEvolutionReadinessResult,
} from '../missing-capability-evolution-engine/index.js';
import {
  isCapabilityPlanningReadyForGeneration,
  runCapabilityPlanningPipeline,
  type CapabilityPlanningPipelineResult,
} from '../capability-planning-engine/index.js';
import {
  assessIncrementalBuildReadiness,
  type IncrementalBuildReadinessResult,
} from '../incremental-autonomous-builder/index.js';
import {
  assessBehaviorSimulationReadiness,
  type BehaviorSimulationReadinessResult,
} from '../behavior-simulation-engine/index.js';
import {
  assessVirtualUserReadiness,
  type VirtualUserReadinessResult,
} from '../virtual-user-engine/index.js';
import {
  assessVirtualDeviceReadiness,
  type VirtualDeviceReadinessResult,
} from '../virtual-device-laboratory/index.js';
import {
  assessInteractionProofReadiness,
  type InteractionProofReadinessResult,
} from '../interaction-proof-engine/index.js';
import {
  assessAutonomousDebuggingReadiness,
  type AutonomousDebuggingReadinessResult,
} from '../autonomous-debugging-engine/index.js';
import {
  assessContinuousImprovementReadiness,
  type ContinuousImprovementReadinessResult,
} from '../continuous-product-improvement-engine/index.js';

export interface ResolvedPromptFaithfulBuildPlan {
  readOnly: true;
  ranking: ProfileRankingResult;
  guardResult: PromptProfileGuardResult;
  materializationProfile: MaterializationProfile;
  definition: ProfileFeatureDefinition & { customDomainCopy?: Record<string, string>; androidPhonePreviewRequired?: boolean };
  extraction: ReturnType<typeof extractPromptFeatures>;
  productIntelligenceModel: ProductIntelligenceModel;
  intentUnderstanding: IntentUnderstandingResult;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  missingCapabilityEvolution: MissingCapabilityEvolutionReadinessResult;
  incrementalBuild: IncrementalBuildReadinessResult;
  behaviorSimulation: BehaviorSimulationReadinessResult;
  virtualUserSimulation: VirtualUserReadinessResult;
  virtualDeviceLaboratory: VirtualDeviceReadinessResult;
  interactionProof: InteractionProofReadinessResult;
  autonomousDebugging: AutonomousDebuggingReadinessResult;
  continuousProductImprovement: ContinuousImprovementReadinessResult;
  readyForGeneration: boolean;
}

export function resolvePromptFaithfulBuildPlan(
  rawPrompt: string,
  resolvedProfile?: GeneratedAppProfile | null,
): ResolvedPromptFaithfulBuildPlan {
  const intentUnderstanding = runIntentUnderstandingEngine({ rawPrompt });
  const productIntelligenceModel = intentUnderstanding.productIntelligenceModel;
  const promptFaithfulness = runPromptFaithfulnessEngineV2(rawPrompt, {
    generatedModules: productIntelligenceModel.architecture.moduleIds,
  });
  const capabilityPlanningInitial = runCapabilityPlanningPipeline({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
  });
  const missingCapabilityEvolution = assessMissingCapabilityEvolutionReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning: capabilityPlanningInitial,
    promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
  });
  const capabilityPlanning =
    missingCapabilityEvolution.pipelineResult?.capabilityPlanningRerunPass === true ||
    missingCapabilityEvolution.ready
      ? runCapabilityPlanningPipeline({
          rawPrompt,
          productIntelligenceModel,
          promptFaithfulness,
          promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
        })
      : capabilityPlanningInitial;
  const incrementalBuild = assessIncrementalBuildReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
  });
  const behaviorSimulation = assessBehaviorSimulationReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuildPlan: incrementalBuild.buildPlan,
    incrementalBuildReady: incrementalBuild.ready,
    incrementalBlockedReason: incrementalBuild.blockedReason,
  });
  const virtualUserSimulation = assessVirtualUserReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuildPlan: incrementalBuild.buildPlan,
    incrementalBuildReady: incrementalBuild.ready,
    behaviorSimulationReady: behaviorSimulation.ready,
    behaviorScenarioCount: behaviorSimulation.scenarioCount,
    incrementalBlockedReason: incrementalBuild.blockedReason,
    behaviorBlockedReason: behaviorSimulation.blockedReason,
  });
  const virtualDeviceLaboratory = assessVirtualDeviceReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuildPlan: incrementalBuild.buildPlan,
    incrementalBuildReady: incrementalBuild.ready,
    behaviorSimulationReady: behaviorSimulation.ready,
    virtualUserSimulationReady: virtualUserSimulation.ready,
    virtualUserCount: virtualUserSimulation.userCount,
    incrementalBlockedReason: incrementalBuild.blockedReason,
    behaviorBlockedReason: behaviorSimulation.blockedReason,
    virtualUserBlockedReason: virtualUserSimulation.blockedReason,
  });
  const interactionProof = assessInteractionProofReadiness({
    rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuildPlan: incrementalBuild.buildPlan,
    incrementalBuildReady: incrementalBuild.ready,
    behaviorSimulationReady: behaviorSimulation.ready,
    virtualUserSimulationReady: virtualUserSimulation.ready,
    virtualDeviceLaboratoryReady: virtualDeviceLaboratory.ready,
    deviceProfileCount: virtualDeviceLaboratory.profileCount,
    incrementalBlockedReason: incrementalBuild.blockedReason,
    behaviorBlockedReason: behaviorSimulation.blockedReason,
    virtualUserBlockedReason: virtualUserSimulation.blockedReason,
    virtualDeviceBlockedReason: virtualDeviceLaboratory.blockedReason,
  });

  const autonomousDebugging = assessAutonomousDebuggingReadiness({
    interactionProofReady: interactionProof.ready,
    interactionProofBlockedReason: interactionProof.blockedReason,
    pendingFailureCount: 0,
  });

  const continuousProductImprovement = assessContinuousImprovementReadiness({
    autonomousDebuggingReady: autonomousDebugging.ready,
    autonomousDebuggingBlockedReason: autonomousDebugging.blockedReason,
    pendingSignalCount: 0,
  });

  const ranking = rankBuildProfiles(rawPrompt);
  const guardResult = applyPromptProfileSelectionGuard(rawPrompt, ranking);

  const materializationProfile: MaterializationProfile =
    productIntelligenceModel.architecture.suggestedProfile ??
    (guardResult.guardApplied ? 'GENERIC_CUSTOM_APP_V1' : guardResult.selectedProfile);

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

  if (productIntelligenceModel.architecture.moduleIds.length) {
    definition = {
      ...definition,
      featureModules: [...productIntelligenceModel.architecture.moduleIds],
      routes: [...productIntelligenceModel.architecture.routes],
    };
  }

  if (productIntelligenceModel.platform.primaryTarget === 'PHONE_FIRST') {
    definition = { ...definition, androidPhonePreviewRequired: true };
  }

  const readyForGeneration =
    intentUnderstanding.readyForGeneration &&
    promptFaithfulness.readyForGeneration &&
    missingCapabilityEvolution.ready &&
    isCapabilityPlanningReadyForGeneration(capabilityPlanning) &&
    incrementalBuild.ready &&
    behaviorSimulation.ready &&
    virtualUserSimulation.ready &&
    virtualDeviceLaboratory.ready &&
    interactionProof.ready &&
    autonomousDebugging.ready &&
    continuousProductImprovement.ready;

  void resolvedProfile;

  return {
    readOnly: true,
    ranking,
    guardResult,
    materializationProfile,
    definition,
    extraction,
    productIntelligenceModel,
    intentUnderstanding,
    promptFaithfulness,
    capabilityPlanning,
    missingCapabilityEvolution,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousProductImprovement,
    readyForGeneration,
  };
}
