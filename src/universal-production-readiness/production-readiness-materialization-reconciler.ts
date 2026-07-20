/**
 * Universal Production Readiness Verification V1 — materialization reconciliation.
 */

import { reconcilePlannedVsActual } from '../universal-capability-composition-engine/capability-composition-reconciliation.js';
import type {
  ProductionReadinessInput,
  ProductionReadinessReconciliationItem,
  ReconciliationItemStatus,
} from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function buildProductionReconciliation(input: ProductionReadinessInput): ProductionReadinessReconciliationItem[] {
  const items: ProductionReadinessReconciliationItem[] = [];
  const plan = input.compositionPlan;
  if (!plan) return items;

  const reconciliation = reconcilePlannedVsActual({
    plan,
    workspaceFiles: input.workspaceFiles,
    executedProviderIds: plan.materializationOrder,
  });

  for (const entry of reconciliation) {
    let status: ReconciliationItemStatus = 'FULLY_RECONCILED';
    if (entry.classification === 'MISSING_CONTRIBUTION') status = 'PLANNED_NOT_MATERIALIZED';
    else if (entry.classification === 'UNDECLARED_CONTRIBUTION') status = 'UNDECLARED_CONTRIBUTION';
    else if (entry.classification === 'PROVIDER_NOT_EXECUTED') status = 'PLANNED_NOT_MATERIALIZED';
    else if (entry.classification === 'PROVIDER_EXECUTED_UNAPPROVED') status = 'UNDECLARED_CONTRIBUTION';
    else if (entry.classification === 'MATCHED') status = 'FULLY_RECONCILED';

    items.push({
      itemId: `reconcile-${entry.classification}-${entry.detail}`,
      requirementId: null,
      providerId: entry.providerId ?? null,
      capabilityKey: null,
      status,
      detail: entry.detail,
    });
  }

  for (const req of plan.capabilityRequirements) {
    const assignment = plan.providerAssignments.find((a) => a.requirementId === req.requirementId);
    if (plan.blockedRequirements.includes(req.requirementId)) {
      items.push({
        itemId: `blocked-${req.requirementId}`,
        requirementId: req.requirementId,
        providerId: assignment?.providerId ?? null,
        capabilityKey: req.capabilityKey,
        status: 'BLOCKED_REQUIREMENT',
        detail: req.capabilityKey,
      });
    }
  }

  return items.sort((a, b) => a.itemId.localeCompare(b.itemId));
}

export function evaluateMaterializationReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const plan = input.compositionPlan;

  if (!plan) {
    findings.push(createReadinessFinding({
      code: 'composition_plan_missing',
      severity: 'BLOCKER',
      dimension: 'MATERIALIZATION_READINESS',
      detail: 'no composition plan',
    }));
    return dimensionResult('MATERIALIZATION_READINESS', findings);
  }

  const reconciliation = buildProductionReconciliation(input);
  for (const item of reconciliation) {
    if (item.status === 'PLANNED_NOT_MATERIALIZED') {
      findings.push(createReadinessFinding({
        code: 'contribution_missing',
        severity: 'BLOCKER',
        dimension: 'MATERIALIZATION_READINESS',
        detail: item.detail,
        providerIds: item.providerId ? [item.providerId] : [],
        requirementIds: item.requirementId ? [item.requirementId] : [],
      }));
    } else if (item.status === 'UNDECLARED_CONTRIBUTION') {
      findings.push(createReadinessFinding({
        code: 'undeclared_contribution',
        severity: 'BLOCKER',
        dimension: 'MATERIALIZATION_READINESS',
        detail: item.detail,
        providerIds: item.providerId ? [item.providerId] : [],
      }));
    }
  }

  // Static-behavior-shell detection targets RUNTIME SOURCE only. Generated diagnostic reports
  // (`*.json`) legitimately contain these words in explanatory prose (e.g. a rule report stating
  // it operates over the real record collection "never a placeholder literal"), and stylesheets
  // use the `::placeholder` pseudo-element — neither is a runtime shell. Scanning them produced a
  // false `static_behavior_shell`. Restrict to `.ts/.tsx/.js/.jsx` feature source and strip the
  // legitimate JSX `placeholder=` input attribute and CSS `::placeholder` before matching.
  const placeholderPatterns = [/\bTODO\b/i, /\bplaceholder\b/i, /fake login/i, /coming soon/i];
  const isRuntimeSource = (relativePath: string) => /\.(tsx?|jsx?)$/.test(relativePath);
  for (const file of input.workspaceFiles) {
    if (!file.relativePath.startsWith('src/features/') || !isRuntimeSource(file.relativePath)) {
      continue;
    }
    const scannable = file.content.replace(/placeholder\s*=/gi, '').replace(/::placeholder/gi, '');
    for (const pattern of placeholderPatterns) {
      if (pattern.test(scannable)) {
        findings.push(createReadinessFinding({
          code: 'static_behavior_shell',
          severity: 'REQUIRED_GAP',
          dimension: 'MATERIALIZATION_READINESS',
          detail: file.relativePath,
          affectedArtifacts: [file.relativePath],
        }));
        break;
      }
    }
  }

  return dimensionResult('MATERIALIZATION_READINESS', findings);
}
