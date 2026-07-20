/** Contract-to-Module Traceability Authority V1 — pre-materialization gate. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { validateCbgaModulePlanCompleteness } from './contract-to-module-module-plan-validator.js';
import { resolveInfrastructureModuleAncestry } from './contract-to-module-infrastructure-registry.js';

/**
 * System-shell modules (auth/dashboard/settings/persistence) are cross-cutting infrastructure.
 * They must never materialize as product feature folders under src/features/ — doing so causes
 * GPCA COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS when their display names (e.g. "Settings")
 * leak into product navigation as CBGA default-shell labels.
 *
 * Only `persistence` was previously excluded; that asymmetry let short/sparse prompts append
 * `settings`/`dashboard` into definition.featureModules and then materialize them as product
 * modules via the envelope path (which bypassed materializableFeatureModules' INFRASTRUCTURE filter).
 */
const MATERIALIZATION_EXCLUDED_MODULES = new Set<string>(CBGA_SYSTEM_SHELL_MODULE_IDS);

function allowedMaterializationIds(envelope: ApprovedProductionBuildEnvelope): ReadonlySet<string> {
  const approved = new Set(envelope.approvedModulePlan.moduleIds);
  for (const moduleId of envelope.approvedModulePlan.systemShellModuleIds) {
    if (resolveInfrastructureModuleAncestry(moduleId) === 'APPROVED_INFRASTRUCTURE_MODULE') {
      approved.add(moduleId);
    }
  }
  return approved;
}

/** Resolves module ids that may materialize under an approved envelope — contract product modules only (never system-shell infrastructure). */
export function resolveMaterializationModuleIdsFromEnvelope(
  definition: ProfileFeatureDefinition,
  envelope: ApprovedProductionBuildEnvelope,
): string[] {
  const allowed = allowedMaterializationIds(envelope);
  return definition.featureModules.filter(
    (moduleId) => !MATERIALIZATION_EXCLUDED_MODULES.has(moduleId) && allowed.has(moduleId),
  );
}

export function isModuleAllowedForMaterialization(
  moduleId: string,
  envelope: ApprovedProductionBuildEnvelope,
): boolean {
  if (MATERIALIZATION_EXCLUDED_MODULES.has(moduleId)) return false;
  return allowedMaterializationIds(envelope).has(moduleId);
}

export function runPreMaterializationTraceabilityGate(input: {
  envelope: ApprovedProductionBuildEnvelope;
  proposedModuleIds: readonly string[];
}): { allowed: boolean; errors: string[] } {
  const errors = validateCbgaModulePlanCompleteness(input.envelope);
  const allowed = allowedMaterializationIds(input.envelope);
  for (const moduleId of input.proposedModuleIds) {
    if (!allowed.has(moduleId)) errors.push(`unapproved_module:${moduleId}`);
  }
  return { allowed: errors.length === 0, errors };
}

export function filterModulesByApprovedPlan(
  candidateModuleIds: readonly string[],
  envelope: ApprovedProductionBuildEnvelope | null | undefined,
): string[] {
  if (!envelope) {
    return candidateModuleIds.filter((moduleId) => !MATERIALIZATION_EXCLUDED_MODULES.has(moduleId));
  }
  const allowed = allowedMaterializationIds(envelope);
  return candidateModuleIds.filter(
    (moduleId) => !MATERIALIZATION_EXCLUDED_MODULES.has(moduleId) && allowed.has(moduleId),
  );
}
