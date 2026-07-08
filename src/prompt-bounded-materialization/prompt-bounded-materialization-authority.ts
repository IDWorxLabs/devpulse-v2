/**
 * Prompt-Bounded Materialization — authority and Era 3 evidence handoff.
 */

import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { validatePostGenerationContamination } from './post-generation-contamination-validator.js';
import {
  applyPromptBoundedPlanToBuildPlan,
  enforcePromptBoundedPreGenerationGuard,
} from './pre-generation-materialization-guard.js';
import {
  buildDefinitionFromModulePlan,
  resolvePromptBoundedModulePlan,
} from './prompt-bounded-module-resolver.js';
import type {
  PromptBoundedMaterializationGuardResult,
  PromptBoundedModulePlan,
  PromptBoundedModulePlanInput,
} from './prompt-bounded-materialization-types.js';
import { PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN } from './prompt-bounded-materialization-types.js';
import { resetPromptBoundedModuleResolverForTests } from './prompt-bounded-module-resolver.js';

let lastModulePlan: PromptBoundedModulePlan | null = null;
let lastGuardResult: PromptBoundedMaterializationGuardResult | null = null;

export function resetPromptBoundedMaterializationForTests(): void {
  lastModulePlan = null;
  lastGuardResult = null;
  resetPromptBoundedModuleResolverForTests();
}

/**
 * Fresh Build Artifact Isolation V4 — production-safe counterpart to
 * `resetPromptBoundedMaterializationForTests`. Clears the last-computed module plan/guard result
 * (a process-wide singleton not keyed by project, and therefore a stale-evidence leak risk for the
 * FALLBACK_MODULE_EVIDENCE purge category) without touching the plan id counter, so real plan ids
 * stay unique across the process lifetime. Safe to call before every build — the values are
 * recomputed immediately afterward by `resolvePromptBoundedMaterialization`/
 * `guardPromptBoundedMaterialization`.
 */
export function resetLastPromptBoundedMaterializationEvidenceForFreshBuild(): void {
  lastModulePlan = null;
  lastGuardResult = null;
}

export function getLastPromptBoundedModulePlan(): PromptBoundedModulePlan | null {
  return lastModulePlan;
}

export function getLastPromptBoundedMaterializationGuardResult(): PromptBoundedMaterializationGuardResult | null {
  return lastGuardResult;
}

export function getPromptBoundedMaterializationPassToken(): string {
  return PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN;
}

export function resolvePromptBoundedMaterialization(input: PromptBoundedModulePlanInput): {
  plan: PromptBoundedModulePlan;
  definition: PromptBoundedModulePlanInput['profileDefinition'];
} {
  const plan = resolvePromptBoundedModulePlan(input);
  lastModulePlan = plan;
  return {
    plan,
    definition: buildDefinitionFromModulePlan(input.profileDefinition, plan),
  };
}

export function guardPromptBoundedMaterialization(input: {
  rawPrompt: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
}): PromptBoundedMaterializationGuardResult {
  const result = enforcePromptBoundedPreGenerationGuard(input);
  lastGuardResult = result;
  lastModulePlan = result.plan;
  return result;
}

export function guardAndApplyPromptBoundedMaterialization(input: {
  rawPrompt: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
}): {
  guard: PromptBoundedMaterializationGuardResult;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
} {
  const guard = guardPromptBoundedMaterialization(input);
  if (!guard.allowed) {
    return { guard, buildPlan: input.buildPlan };
  }
  return {
    guard,
    buildPlan: applyPromptBoundedPlanToBuildPlan(input.buildPlan, guard.plan),
  };
}

export function buildPromptBoundedMaterializationEvidence(plan: PromptBoundedModulePlan): {
  readOnly: true;
  approvedModuleCount: number;
  blockedModuleCount: number;
  contaminationDetected: boolean;
  contaminationReasons: readonly string[];
  metadataConstraintCount: number;
  approvedOrigins: readonly string[];
} {
  return {
    readOnly: true,
    approvedModuleCount: plan.approvedModuleIds.length,
    blockedModuleCount: plan.blockedModules.length,
    contaminationDetected: plan.contaminationDetected,
    contaminationReasons: plan.contaminationReasons,
    metadataConstraintCount: plan.metadataConstraints.length,
    approvedOrigins: [...new Set(plan.approvedModules.map((m) => m.origin))],
  };
}

export function validateWorkspacePromptBoundedMaterialization(input: {
  workspaceDir: string;
  plan: PromptBoundedModulePlan;
}) {
  return validatePostGenerationContamination(input);
}

export function registerPromptBoundedMaterializationWithEra3Pipeline(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
