/**
 * Universal Capability Composition Engine V1 — engineering diagnostics.
 */

import type { UniversalCapabilityCompositionPlan } from './universal-capability-composition-types.js';

export type CompositionDiagnosticCode =
  | 'missing_composition_plan'
  | 'invalid_composition_plan'
  | 'envelope_fingerprint_mismatch'
  | 'missing_capability_requirement'
  | 'unresolved_required_capability'
  | 'missing_native_provider'
  | 'missing_pack_provider'
  | 'provider_not_production_ready'
  | 'provider_version_incompatible'
  | 'provider_behavior_insufficient'
  | 'provider_security_incompatible'
  | 'provider_persistence_incompatible'
  | 'provider_runtime_incompatible'
  | 'provider_configuration_missing'
  | 'provider_configuration_invalid'
  | 'duplicate_provider_assignment'
  | 'unsupported_multi_provider_composition'
  | 'missing_dependency'
  | 'circular_dependency'
  | 'dependency_version_conflict'
  | 'dependency_blocked'
  | 'contribution_collision'
  | 'route_collision'
  | 'runtime_scope_collision'
  | 'persistence_namespace_collision'
  | 'action_collision'
  | 'workflow_collision'
  | 'relationship_collision'
  | 'rule_collision'
  | 'configuration_namespace_collision'
  | 'unapproved_contribution'
  | 'missing_planned_contribution'
  | 'provider_not_executed'
  | 'unapproved_provider_executed'
  | 'post_plan_capability_mutation'
  | 'composition_fingerprint_drift'
  | 'configuration_drift'
  | 'verification_plan_mismatch'
  | 'coverage_plan_mismatch'
  | 'parallel_composition_truth_detected'
  | 'blocked_by_scheduling_pack'
  | 'blocked_by_reporting_pack'
  | 'blocked_by_authentication_pack'
  | 'blocked_by_authorization_pack'
  | 'blocked_by_notification_pack'
  | 'blocked_by_file_management_pack'
  | 'blocked_by_external_integration_pack'
  | 'blocked_by_realtime_pack'
  | 'blocked_by_offline_pack';

export interface CompositionDiagnostic {
  readonly code: CompositionDiagnosticCode;
  readonly detail: string;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
}

const BLOCKED_CAPABILITY_DIAGNOSTICS: Record<string, CompositionDiagnosticCode> = {
  'scheduling.availability': 'blocked_by_scheduling_pack',
  'reporting.metric': 'blocked_by_reporting_pack',
  'authentication.session': 'blocked_by_authentication_pack',
  'authorization.rbac': 'blocked_by_authorization_pack',
  'notification.email': 'blocked_by_notification_pack',
  'file.storage': 'blocked_by_file_management_pack',
  'realtime.sync': 'blocked_by_realtime_pack',
  'offline.sync': 'blocked_by_offline_pack',
  'export.advanced-binary': 'blocked_by_external_integration_pack',
};

export function diagnoseCapabilityComposition(
  plan: UniversalCapabilityCompositionPlan | null | undefined,
): CompositionDiagnostic[] {
  if (!plan) {
    return [{ code: 'missing_composition_plan', detail: 'No composition plan available', severity: 'ERROR' }];
  }

  const diagnostics: CompositionDiagnostic[] = [];

  for (const reqId of plan.blockedRequirements) {
    const req = plan.capabilityRequirements.find((r) => r.requirementId === reqId);
    const code = req ? BLOCKED_CAPABILITY_DIAGNOSTICS[req.capabilityKey] ?? 'unresolved_required_capability' : 'unresolved_required_capability';
    diagnostics.push({ code, detail: reqId, severity: 'ERROR' });
  }

  for (const issue of plan.dependencyGraph.issues) {
    diagnostics.push({
      code: issue.code === 'circular_dependency' ? 'circular_dependency' : 'missing_dependency',
      detail: issue.detail,
      severity: 'ERROR',
    });
  }

  for (const collision of plan.collisionDecisions.filter((c) => !c.resolved)) {
    diagnostics.push({ code: 'contribution_collision', detail: collision.detail, severity: 'ERROR' });
  }

  if (plan.productionReadiness !== 'PRODUCTION_READY' && plan.blockedRequirements.length === 0) {
    diagnostics.push({
      code: 'invalid_composition_plan',
      detail: plan.productionReadiness,
      severity: 'WARNING',
    });
  }

  return diagnostics.sort((a, b) => a.code.localeCompare(b.code));
}

export function detectParallelCompositionTruth(source: string): CompositionDiagnostic[] {
  const patterns = [
    { pattern: /buildCapabilityCompositionPlan\s*\(/, code: 'parallel_composition_truth_detected' as const, detail: 'B7 independent composition plan' },
    { pattern: /rawPrompt.*capability/i, code: 'parallel_composition_truth_detected' as const, detail: 'raw prompt capability authority' },
    { pattern: /shouldMaterializeCapabilityPacks\s*\([^)]*\)\s*&&\s*!(?:plan|composition)/, code: 'parallel_composition_truth_detected' as const, detail: 'independent pack eligibility' },
  ];
  return patterns
    .filter((p) => p.pattern.test(source))
    .map((p) => ({ code: p.code, detail: p.detail, severity: 'ERROR' as const }));
}

export function detectStaticCompositionShell(plan: UniversalCapabilityCompositionPlan): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];
  if (plan.contributionAllowlist.length === 0 && plan.providerAssignments.some((a) => a.outcome === 'SATISFIED')) {
    diagnostics.push({ code: 'missing_planned_contribution', detail: 'empty allowlist with satisfied providers', severity: 'ERROR' });
  }
  if (plan.selectedCapabilityPacks.length > 0 && !plan.materializationOrder.some((id) => plan.selectedCapabilityPacks.some((p) => p.packId === id))) {
    diagnostics.push({ code: 'provider_not_executed', detail: 'selected pack not in materialization order', severity: 'ERROR' });
  }
  return diagnostics;
}
