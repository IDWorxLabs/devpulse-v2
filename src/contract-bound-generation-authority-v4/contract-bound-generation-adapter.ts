/**
 * Contract-Bound Generation Authority V4 — narrow production adapter.
 *
 * Bridges CBGA's decoupled, generic plans to the real, existing production types
 * (`CanonicalProductContract`, `ResolvedPromptFaithfulBuildPlan`, `PromptBoundedModulePlan`)
 * without redesigning the generator. Per the milestone's integration guidance: "If the current
 * generator cannot consume these plans yet, create a narrow adapter rather than redesigning the
 * whole generator." This is that adapter.
 *
 * Mechanism: `enforcePromptBoundedPreGenerationGuard` (the real, existing pre-generation gate)
 * reuses `buildPlan.modulePlan` directly when it is already present, instead of recomputing it —
 * so patching `modulePlan.approvedModuleIds` / `.routes` (and `extraction.appName` for the title)
 * on the build plan *before* materialization is a safe, minimal, production-honest way to force
 * every downstream module/route/navigation generator to consume the contract-bound plan.
 */

import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import type { FeatureModuleCandidate } from '../prompt-bounded-materialization/prompt-bounded-materialization-types.js';
import { runContractBoundGenerationAuthority } from './contract-bound-generation-authority.js';
import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from './contract-bound-generation-types.js';

/** Structural mapping only — never mutates or weakens the canonical product contract. */
export function toCbgaContractEvidence(contract: CanonicalProductContract): CbgaCanonicalContractEvidence {
  return {
    contractId: contract.contractId,
    productIdentity: contract.productIdentity,
    primaryWorkflows: contract.primaryWorkflows,
    coreEntities: contract.coreEntities,
    coreActions: contract.coreActions,
    navigationExpectations: contract.navigationExpectations,
    majorFeatureGroups: contract.majorFeatureGroups,
    businessConcepts: contract.businessConcepts,
    allConceptNames: contract.allConceptNames,
  };
}

export interface ContractBoundBuildPlanPatch {
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  report: CbgaGenerationReport;
}

/**
 * Runs CBGA against the build plan's currently-proposed module/route/title inputs, and — only when
 * a repair is required — returns a build plan whose `modulePlan` / `extraction.appName` have been
 * replaced with the contract-bound, repaired values. The generator itself is untouched: it keeps
 * reading `buildPlan.modulePlan` / `buildPlan.extraction.appName` exactly as it already does.
 */
export function applyContractBoundGenerationToBuildPlan(
  buildPlan: ResolvedPromptFaithfulBuildPlan,
  contract: CanonicalProductContract,
): ContractBoundBuildPlanPatch {
  const evidence = toCbgaContractEvidence(contract);

  const report = runContractBoundGenerationAuthority({
    contract: evidence,
    proposed: {
      proposedModuleIds: buildPlan.modulePlan.approvedModuleIds,
      proposedRoutes: buildPlan.modulePlan.routes,
      proposedNavigationLabels: [],
      proposedAppTitle: buildPlan.extraction.appName,
    },
  });

  if (report.repairsApplied.length === 0) {
    return { buildPlan, report };
  }

  const originalById = new Map(buildPlan.modulePlan.approvedModules.map((m) => [m.moduleId, m]));
  const repairedCandidates: FeatureModuleCandidate[] = report.repairedInputs.moduleIds.map((moduleId) => {
    const existing = originalById.get(moduleId);
    if (existing) return existing;
    const planEntry = report.modulePlan.find((m) => m.moduleId === moduleId);
    return {
      readOnly: true,
      moduleId,
      normalizedName: moduleId,
      displayName: planEntry?.displayName ?? moduleId,
      origin: 'CAPABILITY_REQUIRED',
      sourceEvidence: ['CONTRACT_BOUND_GENERATION_AUTHORITY_V4'],
      requirementIds: [],
      capabilityIds: [],
      confidence: planEntry?.confidence ?? 60,
      reasonIncluded: planEntry
        ? `Contract-Bound Generation Authority V4: maps to contract concept "${planEntry.sourceContractConcept}".`
        : 'Contract-Bound Generation Authority V4: system-shell module retained after repair.',
      classification: 'FEATURE_MODULE',
      sourceLayer: 'contract-bound-generation-authority-v4',
    };
  });

  const repairedModulePlan = {
    ...buildPlan.modulePlan,
    approvedModules: repairedCandidates,
    approvedModuleIds: report.repairedInputs.moduleIds,
    routes: report.repairedInputs.routes,
    passedPreGenerationGuard: report.repairedInputs.moduleIds.length > 0,
  };

  const repairedBuildPlan: ResolvedPromptFaithfulBuildPlan = {
    ...buildPlan,
    modulePlan: repairedModulePlan,
    extraction: {
      ...buildPlan.extraction,
      appName: report.repairedInputs.appTitle,
    },
    promptBoundedMaterializationPassed:
      report.repairedInputs.moduleIds.length > 0 || buildPlan.promptBoundedMaterializationPassed,
  };

  return { buildPlan: repairedBuildPlan, report };
}
