/**
 * Engineering Intelligence Runtime V1 — feature gap repair planner.
 */

import { createHash } from 'node:crypto';
import type {
  EngineeringFeatureContract,
  FeatureGapRepairPlan,
  PromptToFeatureFidelityResult,
} from './engineering-intelligence-types.js';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';

let planCounter = 0;

export function resetFeatureGapRepairPlannerForTests(): void {
  planCounter = 0;
}

function nextPlanId(rawPrompt: string): string {
  planCounter += 1;
  const hash = createHash('sha256').update(rawPrompt.trim()).digest('hex').slice(0, 8);
  return `ei-repair-plan-${hash}-${planCounter}`;
}

export function planFeatureGapRepair(input: {
  rawPrompt: string;
  contract: EngineeringFeatureContract;
  fidelity: PromptToFeatureFidelityResult;
  existingModuleIds: readonly string[];
}): FeatureGapRepairPlan | null {
  if (input.fidelity.passed) return null;

  const missingModules = dedupeModuleIds([
    ...input.fidelity.missingModules,
    ...input.contract.requiredModules.filter((moduleId) => !input.existingModuleIds.includes(moduleId)),
  ]);

  if (missingModules.length === 0 && !input.fidelity.genericCollapseDetected) return null;

  const modulesToGenerate =
    missingModules.length > 0
      ? missingModules
      : input.contract.requiredModules.filter((m) => !['dashboard', 'settings'].includes(m));

  if (modulesToGenerate.length === 0) return null;

  return {
    readOnly: true,
    planId: nextPlanId(input.rawPrompt),
    missingModules: modulesToGenerate,
    missingCapabilities: input.fidelity.missingCapabilities,
    updateRegistry: true,
    updateRoutes: true,
    updateAppWiring: true,
    rerunNpmBuild: true,
    reasoning: `Repair plan for ${modulesToGenerate.length} missing product module(s): ${modulesToGenerate.join(', ')}.`,
  };
}
