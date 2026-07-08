/**
 * Prompt-Bounded Materialization — pre-generation guard.
 */

import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import {
  buildDefinitionFromModulePlan,
  resolvePromptBoundedModulePlan,
} from './prompt-bounded-module-resolver.js';
import type {
  PromptBoundedMaterializationGuardResult,
  PromptBoundedModulePlan,
} from './prompt-bounded-materialization-types.js';

export function enforcePromptBoundedPreGenerationGuard(input: {
  rawPrompt: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  modulePlan?: PromptBoundedModulePlan | null;
}): PromptBoundedMaterializationGuardResult {
  const plan =
    input.modulePlan ??
    input.buildPlan.modulePlan ??
    resolvePromptBoundedModulePlan({
      rawPrompt: input.rawPrompt,
      materializationProfile: String(input.buildPlan.materializationProfile),
      extraction: input.buildPlan.extraction,
      profileDefinition: input.buildPlan.definition,
      productIntelligenceModel: input.buildPlan.productIntelligenceModel,
      capabilityPlanning: input.buildPlan.capabilityPlanning,
      guardApplied: input.buildPlan.guardResult.guardApplied,
    });

  const warnings: string[] = [];
  if (plan.blockedModules.length > 0) {
    warnings.push(`${plan.blockedModules.length} module candidate(s) blocked before generation.`);
  }

  const blockedReason =
    plan.contaminationReasons[0] ??
    (plan.blockedModules.length
      ? plan.blockedModules.map((b) => `${b.moduleId}: ${b.reason}`).join('; ')
      : null);

  const allowed = plan.approvedModuleIds.length > 0;

  return {
    readOnly: true,
    allowed,
    plan,
    blockedReason: allowed ? null : blockedReason,
    warnings,
  };
}

export function applyPromptBoundedPlanToBuildPlan(
  buildPlan: ResolvedPromptFaithfulBuildPlan,
  plan: PromptBoundedModulePlan,
): ResolvedPromptFaithfulBuildPlan {
  return {
    ...buildPlan,
    definition: buildDefinitionFromModulePlan(buildPlan.definition, plan),
  };
}
