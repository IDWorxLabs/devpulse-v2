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
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';
import { buildPromptSpecificDomainCopy } from '../prompt-faithful-generation/prompt-specific-ui-copy-builder.js';

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
  /** Identity Computation Collapse V1 — carried into the approved identity handoff when known. */
  identityContext?: {
    promptHash?: string | null;
    buildId?: string | null;
    projectId?: string | null;
    buildContextDecision?: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
    buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  },
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
    promptHash: identityContext?.promptHash ?? null,
    buildId: identityContext?.buildId ?? null,
    projectId: identityContext?.projectId ?? null,
    buildContextDecision: identityContext?.buildContextDecision ?? null,
    buildIntentOverride: identityContext?.buildIntentOverride ?? null,
  });

  if (report.repairsApplied.length === 0) {
    contractConsumptionTrace({
      requestId: 'N/A',
      buildId: 'N/A',
      projectId: 'N/A',
      promptHash: shortHashForTrace(buildPlan.extraction.appName),
      stage: 'CBGA_REPAIRED_PLAN',
      functionName: 'applyContractBoundGenerationToBuildPlan',
      sourceFile: 'src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts',
      branchSelected: 'NO_REPAIR_NEEDED',
      inputProductIdentity: contract.productIdentity,
      outputProductIdentity: buildPlan.extraction.appName,
      inputModules: buildPlan.modulePlan.approvedModuleIds,
      outputModules: buildPlan.modulePlan.approvedModuleIds,
      inputRoutes: buildPlan.modulePlan.routes,
      outputRoutes: buildPlan.modulePlan.routes,
      inputNavigation: [],
      outputNavigation: [],
      inputVisibleText: [buildPlan.extraction.appName],
      outputVisibleText: [buildPlan.extraction.appName],
      fallbackSelected: false,
      genericTemplateSelected: false,
      contractConsumed: true,
      cbgaPlanConsumed: false,
      promptBoundedModulePlanConsumed: true,
      universalFeatureContractConsumed: false,
      profileFeatureDefinitionConsumed: false,
    });
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

  const repairedExtraction = {
    ...buildPlan.extraction,
    appName: report.repairedInputs.appTitle,
    requiredModules: report.repairedInputs.moduleIds,
  };

  // Production Generator Contract Consumption Fix V1 — `definition.customDomainCopy` is
  // recomputed here from the REPAIRED extraction (corrected appName + module set), instead of
  // being left as a stale spread of the pre-repair `buildPlan.definition`. Without this, the
  // router generator (`buildFeatureAppRouterTsx`) and per-module description builder
  // (`resolveDomainCopy`) would keep reading `customDomainCopy.headline`/descriptions baked
  // BEFORE CBGA ran, so the repaired product identity would never reach rendered UI.
  const repairedCustomDomainCopy = buildPlan.definition?.customDomainCopy
    ? buildPromptSpecificDomainCopy(repairedExtraction)
    : buildPlan.definition?.customDomainCopy;

  // End-to-End Autonomous Production Convergence V1 — `definition.featureModules` must be
  // reconciled to the CBGA-repaired module set too, not just `modulePlan.approvedModuleIds`.
  // Real workspace materialization consumes the repaired module plan (so the on-disk feature
  // folders are the CBGA-approved entities, e.g. `stock-records`/`reorder-rules`), but the
  // materialization VALIDATOR (`validateUniversalAppMaterialization`) and the faithfulness manifest
  // read `definition.featureModules`. Leaving that stale (the pre-CBGA prompt-extracted list, e.g.
  // `stock`/`csv-export`) made the validator demand modules that were never — and should never be —
  // generated, failing an otherwise-correct build. Aligning the definition with the CBGA plan keeps
  // a single source of truth for "which modules exist". Fully generic; no per-domain logic.
  const repairedDefinition = buildPlan.definition
    ? {
        ...buildPlan.definition,
        featureModules: report.repairedInputs.moduleIds,
        ...(repairedCustomDomainCopy ? { customDomainCopy: repairedCustomDomainCopy } : {}),
      }
    : buildPlan.definition;

  const repairedBuildPlan: ResolvedPromptFaithfulBuildPlan = {
    ...buildPlan,
    modulePlan: repairedModulePlan,
    extraction: repairedExtraction,
    definition: repairedDefinition,
    promptBoundedMaterializationPassed:
      report.repairedInputs.moduleIds.length > 0 || buildPlan.promptBoundedMaterializationPassed,
  };

  contractConsumptionTrace({
    requestId: 'N/A',
    buildId: 'N/A',
    projectId: 'N/A',
    promptHash: shortHashForTrace(buildPlan.extraction.appName),
    stage: 'CBGA_REPAIRED_PLAN',
    functionName: 'applyContractBoundGenerationToBuildPlan',
    sourceFile: 'src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts',
    branchSelected: 'REPAIRS_APPLIED',
    inputProductIdentity: buildPlan.extraction.appName,
    outputProductIdentity: repairedBuildPlan.extraction.appName,
    inputModules: buildPlan.modulePlan.approvedModuleIds,
    outputModules: repairedModulePlan.approvedModuleIds,
    inputRoutes: buildPlan.modulePlan.routes,
    outputRoutes: repairedModulePlan.routes,
    inputNavigation: [],
    outputNavigation: report.repairedInputs.navigationLabels,
    inputVisibleText: [buildPlan.extraction.appName, buildPlan.definition?.customDomainCopy?.headline ?? ''],
    outputVisibleText: [repairedBuildPlan.extraction.appName, repairedDefinition?.customDomainCopy?.headline ?? ''],
    fallbackSelected: false,
    genericTemplateSelected: false,
    contractConsumed: true,
    cbgaPlanConsumed: true,
    promptBoundedModulePlanConsumed: true,
    universalFeatureContractConsumed: false,
    profileFeatureDefinitionConsumed: true,
  });

  return { buildPlan: repairedBuildPlan, report };
}
