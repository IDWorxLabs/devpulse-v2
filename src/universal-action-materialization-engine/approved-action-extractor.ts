/**
 * Universal Action Materialization Engine V1 — approved action extraction from envelope.
 *
 * Single canonical source: ApprovedProductionBuildEnvelope (no parallel action truth).
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { RawApprovedAction } from './universal-action-types.js';

export interface ApprovedActionExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly moduleId: string;
  readonly contractId: string;
  /** When true, every contract coreAction is materialized (CBGA module plan pattern). */
  readonly includeAllContractActions?: boolean;
}

/** Extracts raw approved actions for a module from envelope canonical contract. */
export function extractApprovedActionsFromEnvelope(input: ApprovedActionExtractionInput): RawApprovedAction[] {
  const { envelope, moduleId, contractId, includeAllContractActions } = input;
  const coreActions = envelope.canonicalProductContract.coreActions;
  const sourceBase = 'canonicalProductContract.coreActions';

  const moduleEntry = envelope.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId) ?? null;
  const moduleTokens = tokenizeModuleContext(moduleId, moduleEntry?.displayName ?? moduleId);

  const actions: RawApprovedAction[] = [];
  const seen = new Set<string>();

  for (const label of coreActions) {
    const normalized = label.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    if (!includeAllContractActions && !actionAppliesToModule(normalized, moduleTokens, moduleId)) continue;
    seen.add(normalized.toLowerCase());
    actions.push({
      label: normalized,
      sourceEnvelopePath: `${sourceBase}[${normalized}]`,
      moduleId,
      contractId,
    });
  }

  for (const navItem of envelope.approvedNavigationPlan.navigationItems) {
    if (navItem.moduleId !== moduleId) continue;
    const navLabel = navItem.label.trim();
    if (!navLabel || seen.has(`nav:${navLabel.toLowerCase()}`)) continue;
    seen.add(`nav:${navLabel.toLowerCase()}`);
    actions.push({
      label: `Open ${navLabel}`,
      sourceEnvelopePath: `approvedNavigationPlan.navigationItems[${navItem.moduleId}]`,
      moduleId,
      contractId,
    });
  }

  return actions;
}

function tokenizeModuleContext(moduleId: string, displayName: string): string[] {
  const tokens = new Set<string>();
  for (const part of moduleId.split('-')) {
    if (part.length > 2) tokens.add(part.toLowerCase());
  }
  for (const part of displayName.toLowerCase().split(/\s+/)) {
    if (part.length > 2) tokens.add(part);
  }
  return [...tokens];
}

/** Generic module relevance — no domain hardcoding. */
function actionAppliesToModule(actionLabel: string, moduleTokens: string[], moduleId: string): boolean {
  const lower = actionLabel.toLowerCase();
  if (moduleTokens.some((token) => lower.includes(token))) return true;
  if (lower.includes(moduleId.replace(/-/g, ' '))) return true;
  if (isGenericExecutableAction(lower)) return true;
  return false;
}

function isGenericExecutableAction(lower: string): boolean {
  const genericVerbs = [
    'create', 'add', 'new', 'update', 'edit', 'delete', 'remove', 'save', 'submit',
    'cancel', 'confirm', 'reset', 'refresh', 'search', 'filter', 'sort', 'export',
    'import', 'approve', 'reject', 'complete', 'archive', 'restore', 'assign',
    'duplicate', 'calculate', 'open', 'close', 'retry', 'undo', 'select', 'enable',
    'disable', 'activate', 'deactivate', 'reorder', 'view', 'read', 'print',
  ];
  return genericVerbs.some((verb) => lower.includes(verb));
}

/** Counts all executable approved actions across envelope (for coverage reports). */
export function countEnvelopeApprovedActions(envelope: ApprovedProductionBuildEnvelope): number {
  return envelope.canonicalProductContract.coreActions.length;
}
