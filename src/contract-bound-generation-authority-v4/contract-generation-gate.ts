/**
 * Contract-Bound Generation Authority V4 — generation gate + repair behavior.
 *
 * Before materialization, compares the approved canonical product contract, the contract-bound
 * module/route/navigation/surface plans, and the generator's proposed inputs. Blocks generation
 * (by reporting a non-ALLOWED outcome) whenever the proposal drifts from the contract, and can
 * automatically repair — never invent, never hide, never fake — the proposed inputs so they become
 * contract-bound again.
 *
 * Allowed automatic repairs only: remove unsupported fallback modules, rebuild module/route/
 * navigation/surface plans from the contract, replace a generic app identity/landing surface with
 * the contract-supported one. A full rebuild, product-specific special-casing, inventing modules
 * without evidence, hiding unsupported modules, and faking a successful build are never performed.
 */

import { evaluateProposedModules } from './contract-module-plan.js';
import { evaluateProposedRoutes } from './contract-route-plan.js';
import { evaluateProposedNavigation } from './contract-navigation-plan.js';
import { evaluateProposedSurface } from './contract-surface-plan.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaGenerationGateOutcome,
  CbgaGenerationGateResult,
  CbgaModulePlanEntry,
  CbgaNavigationPlanItem,
  CbgaProposedGeneratorInputs,
  CbgaRepairAction,
  CbgaRepairedGeneratorInputs,
  CbgaRoutePlanEntry,
  CbgaSurfacePlan,
} from './contract-bound-generation-types.js';

export interface CbgaGatePlans {
  contract: CbgaCanonicalContractEvidence;
  modulePlan: CbgaModulePlanEntry[];
  routePlan: CbgaRoutePlanEntry[];
  navigationPlan: CbgaNavigationPlanItem[];
  surfacePlan: CbgaSurfacePlan;
}

function findContractConceptsMissing(plans: CbgaGatePlans, moduleIds: readonly string[]): string[] {
  const approvedSet = new Set(moduleIds);
  return plans.modulePlan
    .filter((entry) => entry.generationAllowed && !approvedSet.has(entry.moduleId))
    .map((entry) => entry.sourceContractConcept);
}

/** Runs the gate: compares the contract-bound plans against the generator's proposed inputs. */
export function runContractGenerationGate(
  plans: CbgaGatePlans,
  proposed: CbgaProposedGeneratorInputs,
): CbgaGenerationGateResult {
  const moduleEvaluations = evaluateProposedModules(plans.modulePlan, proposed.proposedModuleIds);
  const routeEvaluations = evaluateProposedRoutes(plans.routePlan, proposed.proposedRoutes, moduleEvaluations);
  const navigationEvaluations = evaluateProposedNavigation(plans.navigationPlan, proposed.proposedNavigationLabels);
  const surfaceEvaluation = evaluateProposedSurface(plans.surfacePlan, plans.contract, proposed);

  const unsupportedModulesRemoved = moduleEvaluations
    .filter((m) => m.verdict === 'GENERIC_UNSUPPORTED' || m.verdict === 'UNSUPPORTED_FALLBACK')
    .map((m) => m.moduleId);
  const unsupportedRoutesRemoved = routeEvaluations
    .filter((r) => r.verdict === 'UNSUPPORTED_NO_MODULE')
    .map((r) => r.path);
  const unsupportedNavigationRemoved = navigationEvaluations
    .filter((n) => n.verdict !== 'CONTRACT_SUPPORTED')
    .map((n) => n.label);

  const genericShellSurfaceBlocked =
    surfaceEvaluation.titleIsGeneric ||
    !surfaceEvaluation.titleMatchesProductIdentity ||
    surfaceEvaluation.welcomeSurfaceIsGenericShell ||
    !surfaceEvaluation.primaryWorkflowVisible ||
    !surfaceEvaluation.primaryWorkflowInteractive;

  const contractConceptsMissing = findContractConceptsMissing(plans, proposed.proposedModuleIds);

  const reasons: string[] = [
    ...moduleEvaluations.filter((m) => m.verdict !== 'CONTRACT_SUPPORTED' && m.verdict !== 'SYSTEM_SHELL_ALLOWED').map((m) => m.reason),
    ...routeEvaluations.filter((r) => r.verdict === 'UNSUPPORTED_NO_MODULE').map((r) => r.reason),
    ...navigationEvaluations.filter((n) => n.verdict !== 'CONTRACT_SUPPORTED').map((n) => n.reason),
    ...surfaceEvaluation.reasons,
  ];

  let outcome: CbgaGenerationGateOutcome;
  if (unsupportedModulesRemoved.length > 0) {
    outcome = 'GENERATION_REQUIRES_MODULE_PLAN_REPAIR';
  } else if (unsupportedRoutesRemoved.length > 0 || unsupportedNavigationRemoved.length > 0) {
    outcome = 'GENERATION_REQUIRES_ROUTE_NAV_REPAIR';
  } else if (genericShellSurfaceBlocked) {
    outcome = 'GENERATION_REQUIRES_SURFACE_PLAN_REPAIR';
  } else if (contractConceptsMissing.length > 0) {
    outcome = 'GENERATION_BLOCKED_CONTRACT_INCONSISTENT';
    reasons.push(
      `Contract concept(s) disappear before generation: ${contractConceptsMissing.join(', ')}.`,
    );
  } else {
    outcome = 'GENERATION_ALLOWED';
  }

  return {
    readOnly: true,
    outcome,
    reasons,
    moduleEvaluations,
    routeEvaluations,
    navigationEvaluations,
    surfaceEvaluation,
    unsupportedModulesRemoved,
    unsupportedRoutesRemoved,
    unsupportedNavigationRemoved,
    genericShellSurfaceBlocked,
    contractConceptsMissing,
  };
}

/** Removes unsupported fallback/generic modules and adds any contract-required modules missing from the proposal. */
export function repairModulePlan(
  plans: CbgaGatePlans,
  gate: CbgaGenerationGateResult,
  proposed: CbgaProposedGeneratorInputs,
): { moduleIds: string[]; actions: CbgaRepairAction[] } {
  const actions: CbgaRepairAction[] = [];
  const kept = gate.moduleEvaluations
    .filter((m) => m.verdict === 'CONTRACT_SUPPORTED' || m.verdict === 'SYSTEM_SHELL_ALLOWED')
    .map((m) => m.moduleId);

  for (const removed of gate.unsupportedModulesRemoved) {
    actions.push({
      readOnly: true,
      actionId: 'REMOVE_UNSUPPORTED_FALLBACK_MODULE',
      detail: `Removed unsupported fallback module "${removed}" — no contract evidence.`,
    });
  }

  const keptSet = new Set(kept);
  const required = plans.modulePlan.filter((entry) => entry.generationAllowed && !keptSet.has(entry.moduleId));
  const moduleIds = [...kept, ...required.map((entry) => entry.moduleId)];

  if (required.length > 0 || gate.unsupportedModulesRemoved.length > 0) {
    actions.push({
      readOnly: true,
      actionId: 'REBUILD_MODULE_PLAN',
      detail: `Rebuilt module plan from contract: ${moduleIds.join(', ') || '(none)'}.`,
    });
  }
  void proposed;
  return { moduleIds, actions };
}

export function repairRoutePlan(
  plans: CbgaGatePlans,
  repairedModuleIds: readonly string[],
): { routes: string[]; actions: CbgaRepairAction[] } {
  const moduleIdSet = new Set(repairedModuleIds);
  const routes = plans.routePlan.filter((r) => moduleIdSet.has(r.moduleId)).map((r) => r.path);
  const finalRoutes = routes.includes('/') ? routes : ['/', ...routes];
  return {
    routes: finalRoutes,
    actions: [
      {
        readOnly: true,
        actionId: 'REBUILD_ROUTE_PLAN',
        detail: `Rebuilt route plan from the contract-bound module plan: ${finalRoutes.join(', ') || '(none)'}.`,
      },
    ],
  };
}

export function repairNavigationPlan(
  plans: CbgaGatePlans,
  repairedModuleIds: readonly string[],
): { labels: string[]; actions: CbgaRepairAction[] } {
  const moduleIdSet = new Set(repairedModuleIds);
  const labels = plans.navigationPlan.filter((n) => moduleIdSet.has(n.moduleId)).map((n) => n.label);
  return {
    labels,
    actions: [
      {
        readOnly: true,
        actionId: 'REBUILD_NAVIGATION_PLAN',
        detail: `Rebuilt navigation plan from the contract-bound route plan: ${labels.join(', ') || '(none)'}.`,
      },
    ],
  };
}

export function replaceGenericAppIdentity(
  plans: CbgaGatePlans,
  currentTitle: string,
  surfaceEvaluation: { titleIsGeneric: boolean; titleMatchesProductIdentity: boolean },
): { appTitle: string; actions: CbgaRepairAction[] } {
  if (!surfaceEvaluation.titleIsGeneric && surfaceEvaluation.titleMatchesProductIdentity) {
    return { appTitle: currentTitle, actions: [] };
  }
  return {
    appTitle: plans.surfacePlan.titleRequirement,
    actions: [
      {
        readOnly: true,
        actionId: 'REPLACE_GENERIC_APP_IDENTITY',
        detail: `Replaced generic/mismatched app title "${currentTitle}" with contract product identity "${plans.surfacePlan.titleRequirement}".`,
      },
    ],
  };
}

export function replaceGenericWelcomeSurface(
  plans: CbgaGatePlans,
  repairedModuleIds: readonly string[],
  welcomeSurfaceIsGenericShell: boolean,
  currentWelcomeText: string | null | undefined,
): { welcomeSurfaceText: string; actions: CbgaRepairAction[] } {
  const rebuilt = `${plans.surfacePlan.titleRequirement} — ${plans.surfacePlan.primaryInteractionRequirement}. ${plans.surfacePlan.emptyStateRequirement}`;
  if (!welcomeSurfaceIsGenericShell && currentWelcomeText) {
    return { welcomeSurfaceText: currentWelcomeText, actions: [] };
  }
  void repairedModuleIds;
  return {
    welcomeSurfaceText: rebuilt,
    actions: [
      {
        readOnly: true,
        actionId: 'REPLACE_GENERIC_WELCOME_SURFACE',
        detail: 'Replaced generic reusable-shell landing surface with a contract-supported primary surface.',
      },
      {
        readOnly: true,
        actionId: 'REBUILD_SURFACE_PLAN',
        detail: 'Rebuilt surface plan from the contract.',
      },
    ],
  };
}

/**
 * Applies every allowed repair and returns the fully contract-bound generator inputs. Always
 * returns a valid patch — when the gate already allowed generation, the "repair" is the identity
 * patch (no changes, no actions).
 */
export function applyContractBoundRepairs(
  plans: CbgaGatePlans,
  gate: CbgaGenerationGateResult,
  proposed: CbgaProposedGeneratorInputs,
): CbgaRepairedGeneratorInputs {
  if (gate.outcome === 'GENERATION_ALLOWED') {
    return {
      readOnly: true,
      moduleIds: [...proposed.proposedModuleIds],
      routes: [...proposed.proposedRoutes],
      navigationLabels: [...proposed.proposedNavigationLabels],
      appTitle: proposed.proposedAppTitle,
      welcomeSurfaceText: proposed.proposedWelcomeSurfaceText ?? '',
      actionsPerformed: [],
    };
  }

  const actionsPerformed: CbgaRepairAction[] = [];

  const moduleRepair = repairModulePlan(plans, gate, proposed);
  actionsPerformed.push(...moduleRepair.actions);

  const routeRepair = repairRoutePlan(plans, moduleRepair.moduleIds);
  actionsPerformed.push(...routeRepair.actions);

  const navRepair = repairNavigationPlan(plans, moduleRepair.moduleIds);
  actionsPerformed.push(...navRepair.actions);

  const identityRepair = replaceGenericAppIdentity(plans, proposed.proposedAppTitle, gate.surfaceEvaluation);
  actionsPerformed.push(...identityRepair.actions);

  const welcomeRepair = replaceGenericWelcomeSurface(
    plans,
    moduleRepair.moduleIds,
    gate.surfaceEvaluation.welcomeSurfaceIsGenericShell,
    proposed.proposedWelcomeSurfaceText,
  );
  actionsPerformed.push(...welcomeRepair.actions);

  return {
    readOnly: true,
    moduleIds: moduleRepair.moduleIds,
    routes: routeRepair.routes,
    navigationLabels: navRepair.labels,
    appTitle: identityRepair.appTitle,
    welcomeSurfaceText: welcomeRepair.welcomeSurfaceText,
    actionsPerformed,
  };
}
