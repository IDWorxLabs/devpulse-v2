/**
 * Contract-Bound Generation Authority V4 — main entry point.
 *
 * Wires the module/route/navigation/surface plans, the generation gate, and the automatic repair
 * behavior into a single deterministic call: given the approved canonical product contract and the
 * generator's proposed inputs, returns the full contract-bound report plus the repaired inputs the
 * real generator must consume.
 */

import { buildContractModulePlan } from './contract-module-plan.js';
import { buildContractRoutePlan } from './contract-route-plan.js';
import { buildContractNavigationPlan } from './contract-navigation-plan.js';
import { buildContractSurfacePlan } from './contract-surface-plan.js';
import { applyContractBoundRepairs, runContractGenerationGate } from './contract-generation-gate.js';
import type { CbgaGatePlans } from './contract-generation-gate.js';
import { CONTRACT_BOUND_GENERATION_AUTHORITY_V4_CONTRACT } from './contract-bound-generation-types.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaGenerationReport,
  CbgaProposedGeneratorInputs,
} from './contract-bound-generation-types.js';
import { buildApprovedProductIdentity } from './approved-product-identity.js';
import { buildApprovedNavigationPlan } from './approved-navigation-plan.js';
import { buildApprovedModulePlan } from './approved-module-plan.js';
import { buildApprovedMetadataPlan } from './approved-metadata-plan.js';
import { buildApprovedSampleDataPlan } from './approved-sample-data-plan.js';
import { buildApprovedProvenancePlan } from './approved-provenance-plan.js';
import { buildApprovedRepairRealityPlan } from './approved-repair-reality-plan.js';
import { buildApprovedProductionBuildEnvelope } from './approved-production-build-envelope.js';
import { deriveNeutralAppTagline } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';

export function buildContractBoundGenerationPlans(contract: CbgaCanonicalContractEvidence): CbgaGatePlans {
  const modulePlan = buildContractModulePlan(contract);
  const routePlan = buildContractRoutePlan(modulePlan);
  const navigationPlan = buildContractNavigationPlan(routePlan);
  const surfacePlan = buildContractSurfacePlan(contract, modulePlan);
  return { contract, modulePlan, routePlan, navigationPlan, surfacePlan };
}

export function runContractBoundGenerationAuthority(input: {
  contract: CbgaCanonicalContractEvidence;
  proposed: CbgaProposedGeneratorInputs;
  /** Identity Computation Collapse V1 — carried into the approved identity handoff when known. */
  promptHash?: string | null;
  buildId?: string | null;
  projectId?: string | null;
  buildContextDecision?: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
}): CbgaGenerationReport {
  const plans = buildContractBoundGenerationPlans(input.contract);
  const initialGate = runContractGenerationGate(plans, input.proposed);
  const repairedInputs = applyContractBoundRepairs(plans, initialGate, input.proposed);

  const finalGate = runContractGenerationGate(plans, {
    proposedModuleIds: repairedInputs.moduleIds,
    proposedRoutes: repairedInputs.routes,
    proposedNavigationLabels: repairedInputs.navigationLabels,
    proposedAppTitle: repairedInputs.appTitle,
    proposedWelcomeSurfaceText: repairedInputs.welcomeSurfaceText,
    proposedPrimaryWorkflowVisible: input.proposed.proposedPrimaryWorkflowVisible,
    proposedPrimaryWorkflowInteractive: input.proposed.proposedPrimaryWorkflowInteractive,
  });

  const approvedIdentity = buildApprovedProductIdentity({
    contractProductIdentity: input.contract.productIdentity,
    repairedAppTitle: repairedInputs.appTitle,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  const approvedNavigationPlan = buildApprovedNavigationPlan({
    navigationPlan: plans.navigationPlan,
    approvedModuleIds: repairedInputs.moduleIds,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  const approvedModulePlan = buildApprovedModulePlan({
    modulePlan: plans.modulePlan,
    routePlan: plans.routePlan,
    approvedModuleIds: repairedInputs.moduleIds,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  // Metadata Computation Collapse V1 — composed last, from the three handoffs above plus the
  // canonical contract evidence; never an independent derivation of its own.
  const approvedMetadataPlan = buildApprovedMetadataPlan({
    identity: approvedIdentity,
    navigationPlan: approvedNavigationPlan,
    modulePlan: approvedModulePlan,
    contract: input.contract,
    deriveApplicationSubtitle: deriveNeutralAppTagline,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  // Sample Data Computation Collapse V1 — composed last, from the four handoffs above plus the
  // canonical contract evidence; never an independent derivation of sample/demo/preview records.
  const approvedSampleDataPlan = buildApprovedSampleDataPlan({
    identity: approvedIdentity,
    navigationPlan: approvedNavigationPlan,
    modulePlan: approvedModulePlan,
    metadataPlan: approvedMetadataPlan,
    contract: input.contract,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  // Provenance Computation Collapse V1 — composed last, from every prior handoff plus CBGA's
  // repaired inputs; never an independent reconstruction of ancestry.
  const approvedProvenancePlan = buildApprovedProvenancePlan({
    identity: approvedIdentity,
    navigationPlan: approvedNavigationPlan,
    modulePlan: approvedModulePlan,
    metadataPlan: approvedMetadataPlan,
    sampleDataPlan: approvedSampleDataPlan,
    contract: input.contract,
    repairedInputs,
    legacyModulePlan: plans.modulePlan,
    legacyRoutePlan: plans.routePlan,
    legacyNavigationPlan: plans.navigationPlan,
    surfacePlan: plans.surfacePlan,
    finalGateOutcome: finalGate.outcome,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  // Repair Reality Alignment V1 — every CBGA repair is classified exactly once; orchestrator extends
  // this plan immutably after every real post-CBGA repair instead of reporting ambiguous recovery.
  const approvedRepairRealityPlan = buildApprovedRepairRealityPlan({
    contractId: input.contract.contractId,
    cbgaRepairs: repairedInputs.actionsPerformed,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
  });

  const approvedProductionBuildEnvelope = buildApprovedProductionBuildEnvelope({
    approvedProductIdentity: approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
    approvedMetadataPlan,
    approvedSampleDataPlan,
    approvedProvenancePlan,
    approvedRepairRealityPlan,
    canonicalProductContract: input.contract,
    finalGateOutcome: finalGate.outcome,
    repairsAppliedCount: repairedInputs.actionsPerformed.length,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    projectId: input.projectId ?? null,
    buildContextDecision: input.buildContextDecision ?? null,
    buildIntentOverride: input.buildIntentOverride ?? null,
  });

  return {
    readOnly: true,
    contractVersion: CONTRACT_BOUND_GENERATION_AUTHORITY_V4_CONTRACT,
    contractId: input.contract.contractId,
    productIdentity: input.contract.productIdentity,
    approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
    approvedMetadataPlan,
    approvedSampleDataPlan,
    approvedProvenancePlan,
    approvedRepairRealityPlan,
    approvedProductionBuildEnvelope,
    modulePlan: plans.modulePlan,
    routePlan: plans.routePlan,
    navigationPlan: plans.navigationPlan,
    surfacePlan: plans.surfacePlan,
    initialGate,
    repairsApplied: repairedInputs.actionsPerformed,
    repairedInputs,
    finalGate,
    finalGateOutcome: finalGate.outcome,
    generatedAt: new Date().toISOString(),
  };
}
