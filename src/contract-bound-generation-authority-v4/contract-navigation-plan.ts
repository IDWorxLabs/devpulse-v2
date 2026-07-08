/**
 * Contract-Bound Generation Authority V4 — navigation plan.
 *
 * Navigation is created only from the contract-bound route plan. Generic default-shell nav labels
 * (Features/Activity/Alerts/Profile/Settings/Help/Feedback/Legal) are never allowed by default —
 * they only appear when the route/module plan already justifies them.
 */

import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from './contract-bound-generation-types.js';
import type {
  CbgaNavigationPlanItem,
  CbgaProposedNavigationEvaluation,
  CbgaRoutePlanEntry,
} from './contract-bound-generation-types.js';

export function buildContractNavigationPlan(routePlan: readonly CbgaRoutePlanEntry[]): CbgaNavigationPlanItem[] {
  return routePlan.map((route) => ({
    readOnly: true,
    label: route.label,
    path: route.path,
    moduleId: route.moduleId,
    sourceContractConcept: route.sourceContractConcept,
    visibilityReason: `Directly maps to contract concept "${route.sourceContractConcept}" via route "${route.path}".`,
  }));
}

function isDefaultShellLabel(label: string): boolean {
  return CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.some((shell) => shell.toLowerCase() === label.trim().toLowerCase());
}

/**
 * Classify every proposed navigation label against the contract-bound navigation plan. A default
 * shell label (e.g. "Settings") is only allowed when the navigation plan itself already contains
 * a contract-supported item with that label — never purely because a template shell includes it.
 */
export function evaluateProposedNavigation(
  navigationPlan: readonly CbgaNavigationPlanItem[],
  proposedLabels: readonly string[],
): CbgaProposedNavigationEvaluation[] {
  return proposedLabels.map((label) => {
    const matched =
      navigationPlan.find((item) => item.label.toLowerCase() === label.trim().toLowerCase()) ?? null;
    if (matched) {
      return {
        readOnly: true,
        label,
        verdict: 'CONTRACT_SUPPORTED' as const,
        matchedItem: matched,
        reason: `Maps to contract concept "${matched.sourceContractConcept}".`,
      };
    }
    if (isDefaultShellLabel(label)) {
      return {
        readOnly: true,
        label,
        verdict: 'UNSUPPORTED_DEFAULT_SHELL' as const,
        matchedItem: null,
        reason: `"${label}" is a generic default-shell navigation item with no contract justification — blocked.`,
      };
    }
    return {
      readOnly: true,
      label,
      verdict: 'UNSUPPORTED_MISSING_MODULE' as const,
      matchedItem: null,
      reason: `"${label}" does not point to any contract-bound module — blocked before generation.`,
    };
  });
}
