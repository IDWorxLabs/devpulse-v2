import { baseDescriptor, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const COMPOSITION_RECONCILIATION_STRATEGY = baseDescriptor({
  strategyId: 'composition-materialization-reconciliation-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['composition_fingerprint_mismatch', 'contribution_missing'],
  supportedRepairCategories: ['MATERIALIZATION_MISMATCH', 'PROVIDER_ASSIGNMENT_MISMATCH'],
  requiredSourceAuthorities: ['B10_RECONCILIATION'],
  requiredExistingGenerators: ['B10'],
  mutationAllowlist: ['src/autonomous-engineering-intelligence/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/autonomous-engineering-intelligence/**'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['composition-materialization-reconciliation-repair.v1'],
});

export function executeCompositionMaterializationReconciliationRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const path = 'src/autonomous-engineering-intelligence/composition-adapter-repair.json';
  if (ctx.workspaceFiles.some((f) => f.relativePath === path)) {
    return { applied: false, mutation: null, error: 'already_exists' };
  }
  const plan = ctx.input.compositionPlan;
  const payload = {
    strategy: COMPOSITION_RECONCILIATION_STRATEGY.strategyId,
    compositionPlanFingerprint: plan?.planFingerprint ?? '',
    selectedProviders: plan?.nativeCapabilityProviders.map((p) => p.providerId) ?? [],
    selectedPacks: plan?.selectedCapabilityPacks.map((p) => p.packId) ?? [],
    note: 'B10 provider assignment preserved — adapter wiring only',
  };
  ctx.workspaceFiles.push({ relativePath: path, content: `${JSON.stringify(payload, null, 2)}\n` });
  return {
    applied: true,
    mutation: {
      mutationId: 'mut-b10-adapter',
      strategyId: COMPOSITION_RECONCILIATION_STRATEGY.strategyId,
      targetPath: path,
      targetAuthority: 'B10',
      mutationType: 'CONNECT_EXISTING_ADAPTER',
      expectedBeforeFingerprint: '',
      expectedAfterFingerprint: 'created',
      contributionIds: [],
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: [],
      reason: 'B10-to-materialization adapter repair',
      rollbackData: '',
      provenance: ['composition-materialization-reconciliation-repair.v1'],
    },
    error: null,
  };
}
