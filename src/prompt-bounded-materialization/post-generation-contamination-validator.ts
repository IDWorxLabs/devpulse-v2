/**
 * Prompt-Bounded Materialization — post-generation contamination validator.
 */

import { listWorkspaceFeatureModuleIds } from '../prompt-faithful-generation/prompt-faithful-materialization-gate.js';
import type {
  BlockedModuleRecord,
  PostGenerationContaminationResult,
  PromptBoundedModulePlan,
} from './prompt-bounded-materialization-types.js';
import { isGenericFallbackModuleTerm } from './module-origin-evidence.js';

export function validatePostGenerationContamination(input: {
  workspaceDir: string;
  plan: PromptBoundedModulePlan;
}): PostGenerationContaminationResult {
  const generated = listWorkspaceFeatureModuleIds(input.workspaceDir);
  const approved = new Set(input.plan.approvedModuleIds);
  const unjustifiedModules: BlockedModuleRecord[] = [];
  const failureMessages: string[] = [];

  for (const moduleId of generated) {
    if (approved.has(moduleId)) continue;
    const blockedPlan = input.plan.blockedModules.find((b) => b.moduleId === moduleId);
    unjustifiedModules.push({
      readOnly: true,
      moduleId,
      origin: blockedPlan?.origin ?? 'PROFILE_FALLBACK',
      reason: blockedPlan?.reason ?? 'Module not present in resolved module plan.',
      sourceEvidence: blockedPlan?.sourceEvidence ?? [],
    });
    failureMessages.push(
      `Unjustified generated module: ${moduleId}. Origin: ${blockedPlan?.origin ?? 'PROFILE_FALLBACK'}. No prompt/capability/system evidence found.`,
    );
  }

  for (const moduleId of input.plan.approvedModuleIds) {
    if (moduleId === 'auth' || moduleId === 'persistence') continue;
    if (!generated.includes(moduleId) && !['registry', 'routes'].includes(moduleId)) {
      failureMessages.push(`Planned module missing from workspace: ${moduleId}`);
    }
  }

  for (const moduleId of generated) {
    if (isGenericFallbackModuleTerm(moduleId) && !approved.has(moduleId)) {
      failureMessages.push(
        `Unjustified generated module: ${moduleId}. Origin: PROFILE_FALLBACK. No prompt/capability/system evidence found.`,
      );
    }
  }

  return {
    readOnly: true,
    passed: unjustifiedModules.length === 0 && failureMessages.length === 0,
    unjustifiedModules,
    missingPlannedModules: input.plan.approvedModuleIds.filter(
      (moduleId) => !generated.includes(moduleId) && moduleId !== 'auth' && moduleId !== 'persistence',
    ),
    failureMessages,
  };
}
