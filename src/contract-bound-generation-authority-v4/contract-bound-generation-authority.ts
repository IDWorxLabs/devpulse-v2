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

  return {
    readOnly: true,
    contractVersion: CONTRACT_BOUND_GENERATION_AUTHORITY_V4_CONTRACT,
    contractId: input.contract.contractId,
    productIdentity: input.contract.productIdentity,
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
