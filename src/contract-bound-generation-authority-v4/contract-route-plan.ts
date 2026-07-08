/**
 * Contract-Bound Generation Authority V4 — route plan.
 *
 * Routes are created only from the contract-bound module plan — never invented independently.
 * The first generation-allowed module becomes the home route ('/'); every other module gets a
 * '/{moduleId}' route.
 */

import { CBGA_SYSTEM_SHELL_MODULE_IDS } from './contract-bound-generation-types.js';
import type {
  CbgaModulePlanEntry,
  CbgaProposedModuleEvaluation,
  CbgaProposedRouteEvaluation,
  CbgaRoutePlanEntry,
} from './contract-bound-generation-types.js';

export function buildContractRoutePlan(modulePlan: readonly CbgaModulePlanEntry[]): CbgaRoutePlanEntry[] {
  const allowed = modulePlan.filter((m) => m.generationAllowed);
  return allowed.map((entry, index) => ({
    readOnly: true,
    routeId: `route-${entry.moduleId}`,
    path: index === 0 ? '/' : `/${entry.moduleId}`,
    label: entry.displayName,
    moduleId: entry.moduleId,
    sourceContractConcept: entry.sourceContractConcept,
    requiredScreenPurpose: `View and manage ${entry.displayName} — the screen must support the required workflows/actions for this contract concept.`,
  }));
}

function moduleIdFromPath(path: string): string {
  return path.replace(/^\/+/, '').trim();
}

/**
 * Classify every proposed route against the contract-bound route plan. A route is only supported
 * when it maps to a route-plan entry, or when it belongs to a system-shell module (e.g. '/settings').
 */
export function evaluateProposedRoutes(
  routePlan: readonly CbgaRoutePlanEntry[],
  proposedRoutes: readonly string[],
  moduleEvaluations: readonly CbgaProposedModuleEvaluation[],
): CbgaProposedRouteEvaluation[] {
  return proposedRoutes.map((path) => {
    const matched = routePlan.find((r) => r.path === path) ?? null;
    if (matched) {
      return {
        readOnly: true,
        path,
        verdict: 'CONTRACT_SUPPORTED' as const,
        matchedRoute: matched,
        reason: `Maps to contract concept "${matched.sourceContractConcept}" via module "${matched.moduleId}".`,
      };
    }
    const impliedModuleId = path === '/' ? '' : moduleIdFromPath(path);
    const impliedModuleAllowed =
      impliedModuleId &&
      (CBGA_SYSTEM_SHELL_MODULE_IDS.includes(impliedModuleId) ||
        moduleEvaluations.some((m) => m.moduleId === impliedModuleId && m.verdict === 'SYSTEM_SHELL_ALLOWED'));
    if (path === '/' || impliedModuleAllowed) {
      return {
        readOnly: true,
        path,
        verdict: 'SYSTEM_SHELL_ALLOWED' as const,
        matchedRoute: null,
        reason: path === '/' ? 'Root/home route is always structurally required.' : 'System-shell route, not a product feature claim.',
      };
    }
    return {
      readOnly: true,
      path,
      verdict: 'UNSUPPORTED_NO_MODULE' as const,
      matchedRoute: null,
      reason: `Route "${path}" has no corresponding contract-bound module — blocked before generation.`,
    };
  });
}
