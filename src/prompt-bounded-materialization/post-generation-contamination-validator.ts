/**
 * Prompt-Bounded Materialization — post-generation contamination validator.
 */

import { CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { listWorkspaceFeatureModuleIds } from '../prompt-faithful-generation/prompt-faithful-materialization-gate.js';
import type {
  BlockedModuleRecord,
  PostGenerationContaminationResult,
  PromptBoundedModulePlan,
} from './prompt-bounded-materialization-types.js';
import { isGenericFallbackModuleTerm } from './module-origin-evidence.js';

/** System-shell modules are never materialized as src/features/* folders — do not treat them as missing product modules. */
function nonFeaturePlannedModules(approvedModuleIds: readonly string[]): Set<string> {
  const approved = new Set(approvedModuleIds);
  const blocked = new Set<string>([...CBGA_SYSTEM_SHELL_MODULE_IDS, 'registry']);
  // Router file lives at src/features/routes.ts — only skip the folder scan when routes is NOT an approved product module.
  if (!approved.has('routes') && !approved.has('delivery-routes')) blocked.add('routes');
  return blocked;
}

export function validatePostGenerationContamination(input: {
  workspaceDir: string;
  plan: PromptBoundedModulePlan;
}): PostGenerationContaminationResult {
  const generated = listWorkspaceFeatureModuleIds(input.workspaceDir, {
    approvedModuleIds: input.plan.approvedModuleIds,
  });
  const approved = new Set(input.plan.approvedModuleIds);
  const skipMissing = nonFeaturePlannedModules(input.plan.approvedModuleIds);
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
    if (skipMissing.has(moduleId)) continue;
    if (!generated.includes(moduleId)) {
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
      (moduleId) => !generated.includes(moduleId) && !skipMissing.has(moduleId),
    ),
    failureMessages,
  };
}
